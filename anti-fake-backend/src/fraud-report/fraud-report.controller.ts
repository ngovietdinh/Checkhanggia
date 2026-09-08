import { BadRequestException, Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { FraudReportService } from './fraud-report.service';
import { CreateFraudReportDto } from './dto/create-fraud-report.dto';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB/anh

/**
 * Endpoint public (khong dang nhap) cho luong bao cao hang gia CU-03.
 * MVP nay luu anh xuong dia cuc bo (thu muc uploads/, phuc vu qua static
 * assets - xem main.ts). Production nen chuyen sang object storage (S3/GCS)
 * nhu mo ta trong luong 5.2 SRS - TODO giai doan sau, khong lam gian doan
 * MVP hien tai.
 */
@Controller('api/v1/fraud-reports')
export class FraudReportController {
  constructor(private readonly fraudReportService: FraudReportService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // chong spam bao cao (muc 5.2 SRS)
  @UseInterceptors(
    FilesInterceptor('images', 4, {
      storage: diskStorage({
        destination: './uploads/fraud-reports',
        filename: (_req, file, cb) => {
          const unique = randomUUID();
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
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
    const imageUrls = (files || []).map((f) => `/uploads/fraud-reports/${f.filename}`);
    return this.fraudReportService.create({ ...dto, imageUrls });
  }
}
