import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { FraudReportService } from './fraud-report.service';
import { CreateFraudReportDto } from './dto/create-fraud-report.dto';
import { UpdateFraudReportStatusDto } from './dto/update-status.dto';
import { SupabaseStorageService } from '../common/supabase-storage.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB/anh

/**
 * Endpoint public (khong dang nhap) cho luong bao cao hang gia CU-03.
 * Anh nhan vao bo nho (memoryStorage) roi upload thang len Supabase Storage
 * (khong ghi ra dia cua server) - bat buoc vi hau het hosting cho backend
 * dung filesystem tam thoi, ghi dia se mat du lieu moi lan redeploy.
 */
@Controller('api/v1/fraud-reports')
export class FraudReportController {
  constructor(
    private readonly fraudReportService: FraudReportService,
    private readonly storage: SupabaseStorageService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // chong spam bao cao (muc 5.2 SRS)
  @UseInterceptors(
    FilesInterceptor('images', 4, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          cb(new BadRequestException('Chi chap nhan anh JPEG/PNG/WEBP'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async create(@UploadedFiles() files: Express.Multer.File[], @Body() dto: CreateFraudReportDto) {
    const imageUrls = await Promise.all(
      (files || []).map((f) => this.storage.uploadImage(f.buffer, f.originalname, f.mimetype)),
    );
    return this.fraudReportService.create({ ...dto, imageUrls });
  }

  // Danh sach cho Web Admin (EN-07) - can dang nhap, tu dong loc theo doanh nghiep
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any, @Query('page') page?: string, @Query('status') status?: string) {
    return this.fraudReportService.listForEnterprise(
      req.user.enterpriseId,
      page ? parseInt(page, 10) : 1,
      status,
    );
  }

  // Duyet/tu choi bao cao
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateFraudReportStatusDto) {
    return this.fraudReportService.updateStatus(id, dto.status);
  }
}
