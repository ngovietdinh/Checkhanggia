import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EnterpriseAuthGuard } from '../common/enterprise-auth.guard';
import { CodegenService } from './codegen.service';
import { GenerateBatchDto } from './dto/generate-batch.dto';
import { AggregateCodesDto } from './dto/aggregate-codes.dto';

/**
 * Code-Gen Service (muc 3.1): tach rieng khoi Verify Service vi day la nghiep vu
 * ghi lon theo lo (batch write), khong can toi uu latency thap nhu luong quet.
 * Chap nhan ca API key (ERP - muc 3.3) lan JWT (nhan vien dang nhap Web Admin -
 * muc 7), xem EnterpriseAuthGuard.
 */
@Controller('api/v1/codegen')
@UseGuards(EnterpriseAuthGuard)
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {}

  @Post('generate')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // gioi han goi sinh hang loat/phut
  async generate(@Req() req: any, @Body() dto: GenerateBatchDto) {
    const codes = await this.codegenService.generateBatch(
      req.enterpriseId,
      dto.batchId,
      dto.quantity,
      dto.hierarchyLevel ?? 'unit',
    );
    return {
      batchId: dto.batchId,
      requested: dto.quantity,
      generated: codes.length,
      codes, // { publicId, secretCode } - luu file nay an toan, khong the lay lai secretCode sau nay
    };
  }

  @Post('aggregate')
  async aggregate(@Req() req: any, @Body() dto: AggregateCodesDto) {
    return this.codegenService.aggregate(req.enterpriseId, dto.parentPublicId, dto.childPublicIds);
  }

  @Get('trace/:publicId')
  async trace(@Param('publicId') publicId: string) {
    return this.codegenService.traceTree(publicId);
  }
}
