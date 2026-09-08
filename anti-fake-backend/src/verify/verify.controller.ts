import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { VerifyService } from './verify.service';
import { ScanDto } from './dto/scan.dto';

/**
 * Verify Service (muc 3.1): dich vu quan trong nhat ve hieu nang, phai dat
 * nguong 5.000 req/s (muc 6.2). Khong goi bat ky dich vu ngoai nao dong bo
 * tren duong di cua request (xem ghi chu trong VerifyService).
 */
@Controller('api/v1/verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Get('public/:publicId')
  async lookupPublic(@Param('publicId') publicId: string) {
    const result = await this.verifyService.lookupPublic(publicId);
    if (!result) return { status: 'not_found' };
    return result;
  }

  @Post('scan')
  @HttpCode(200)
  // Rate-limit tang ung dung (NestThrottler) bo sung cho rate-limit theo device/IP
  // da xu ly rieng trong VerifyService (muc 4.3) - lop nay chan o muc request/giay
  // tho cho toan bo endpoint, khong phan biet device/IP.
  @Throttle({ default: { limit: 200, ttl: 1000 } })
  async scan(@Req() req: any, @Body() dto: ScanDto) {
    const requestIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return this.verifyService.verifyScan(dto, requestIp);
  }
}
