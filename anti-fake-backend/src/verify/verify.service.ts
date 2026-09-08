import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { CryptoUtil } from '../common/crypto.util';
import { RateLimiterService } from '../common/rate-limiter.service';
import { ScanDto } from './dto/scan.dto';

export type VerifyOutcome =
  | { result: 'BLOCKED'; message: string }
  | { result: 'NOT_FOUND' }
  | { result: 'INVALID' }
  | { result: 'REVOKED' }
  | {
      result: 'DUPLICATE';
      firstScannedAt: Date | null;
      approxLocation: { lat: number | null; lng: number | null } | null;
    }
  | { result: 'VALID'; productName?: string; batchNumber?: string };

interface CachedCode {
  id: string;
  secretHash: string;
  status: string;
}

const CACHE_TTL_SECONDS = 3600;
const DEVICE_LIMIT = { limit: 20, windowSeconds: 60 }; // muc 4.3 buoc 1
const IP_LIMIT = { limit: 100, windowSeconds: 60 };

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);
  private readonly pepper: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly crypto: CryptoUtil,
    private readonly rateLimiter: RateLimiterService,
  ) {
    this.pepper = process.env.SECRET_HASH_PEPPER || '';
  }

  /**
   * Trien khai bam sat pseudocode verify_scan() o muc 4.3 SRS.
   * Thu tu buoc giu nguyen dung nhu tai lieu: rate-limit -> cache lookup ->
   * so khop hash constant-time -> UPDATE nguyen tu WHERE status='unscanned'.
   */
  async verifyScan(dto: ScanDto, requestIp: string): Promise<VerifyOutcome> {
    const deviceKey = dto.deviceFingerprint || `ip:${requestIp}`;

    // Buoc 1: Rate-limit theo device + theo IP, tach rieng 2 tang
    const deviceOk = await this.rateLimiter.checkAndIncrement(`device:${deviceKey}`, DEVICE_LIMIT);
    if (!deviceOk) {
      await this.logScan(dto.publicId, null, 'blocked', dto, requestIp);
      return { result: 'BLOCKED', message: 'Thiet bi quet qua nhieu lan trong thoi gian ngan' };
    }
    const ipOk = await this.rateLimiter.checkAndIncrement(`ip:${requestIp}`, IP_LIMIT);
    if (!ipOk) {
      await this.logScan(dto.publicId, null, 'blocked', dto, requestIp);
      return { result: 'BLOCKED', message: 'IP vuot nguong cho phep' };
    }

    // Buoc 2: Tra Redis cache truoc, fallback Postgres khi cache miss/loi
    const code = await this.getCodeCached(dto.publicId);
    if (!code) {
      await this.logScan(dto.publicId, null, 'not_found', dto, requestIp);
      return { result: 'NOT_FOUND' };
    }

    if (code.status === 'revoked') {
      await this.logScan(dto.publicId, code.id, 'revoked', dto, requestIp);
      return { result: 'REVOKED' };
    }

    // Buoc 3: So khop bang constant-time compare (chong timing attack)
    const inputHash = this.crypto.hashSecret(dto.secretCode, this.pepper);
    if (!this.crypto.constantTimeEquals(inputHash, code.secretHash)) {
      await this.logScan(dto.publicId, code.id, 'wrong_secret', dto, requestIp);
      return { result: 'INVALID' };
    }

    // Buoc 4: UPDATE nguyen tu WHERE status='unscanned' - day la tuyen phong thu
    // chinh chong double-scan (race condition), khong phai buoc select-roi-update.
    const updated = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE code
      SET status = 'scanned',
          "first_scanned_at" = NOW(),
          "first_scanned_lat" = ${dto.lat ?? null},
          "first_scanned_lng" = ${dto.lng ?? null}
      WHERE id = ${code.id} AND status = 'unscanned'
      RETURNING id;
    `;

    // Bat ke ket qua the nao, cache da co the stale - xoa de lan sau doc lai tu DB.
    await this.invalidateCache(dto.publicId);

    if (updated.length === 0) {
      // Da duoc quet truoc do - lay lai thong tin lan quet dau de tra ve cho client
      const existing = await this.prisma.code.findUnique({ where: { id: code.id } });
      await this.logScan(dto.publicId, code.id, 'duplicate', dto, requestIp);
      return {
        result: 'DUPLICATE',
        firstScannedAt: existing?.firstScannedAt ?? null,
        approxLocation: existing
          ? { lat: existing.firstScannedLat, lng: existing.firstScannedLng }
          : null,
      };
    }

    await this.logScan(dto.publicId, code.id, 'valid_first', dto, requestIp);
    // TODO(giai doan sau): publish Kafka event 'scan.events' de kich hoat Loyalty/
    // Warranty Service bat dong bo, dung nhu kien truc muc 3.1. MVP hien tai chua
    // co message broker nen bo qua buoc nay - khong lam gian doan phan hoi cho nguoi dung.
    return { result: 'VALID' };
  }

  private async getCodeCached(publicId: string): Promise<CachedCode | null> {
    try {
      const cached = await this.redis.client.get(`code:${publicId}`);
      if (cached) return JSON.parse(cached) as CachedCode;
    } catch (err) {
      this.logger.warn(`Redis cache read failed, fallback to DB: ${(err as Error).message}`);
    }

    const code = await this.prisma.code.findUnique({ where: { publicId } });
    if (!code) return null;

    const cachedCode: CachedCode = { id: code.id, secretHash: code.secretHash, status: code.status };
    this.redis.client
      .set(`code:${publicId}`, JSON.stringify(cachedCode), 'EX', CACHE_TTL_SECONDS)
      .catch((err) => this.logger.warn(`Redis cache write failed: ${(err as Error).message}`));

    return cachedCode;
  }

  private async invalidateCache(publicId: string) {
    await this.redis.client.del(`code:${publicId}`).catch(() => undefined);
  }

  private async logScan(
    publicId: string,
    codeId: string | null,
    result: 'valid_first' | 'duplicate' | 'not_found' | 'wrong_secret' | 'revoked' | 'blocked',
    dto: Partial<ScanDto>,
    requestIp: string,
  ) {
    // Ghi log bat dong bo, khong await/chan response tra ve nguoi dung - do la du
    // lieu phuc vu Heatmap/fraud detection (muc 3.1, 4.4), khong nam tren duong
    // gang critical path cua request xac thuc.
    this.prisma.scanLog
      .create({
        data: {
          publicId,
          codeId: codeId ?? undefined,
          result,
          lat: dto.lat,
          lng: dto.lng,
          deviceFingerprint: dto.deviceFingerprint,
          requestIp,
        },
      })
      .catch((err) => this.logger.error(`Ghi scan_log that bai: ${(err as Error).message}`));
  }

  /**
   * Tra thong tin co ban cua tem truoc khi nguoi dung cao lop phu bac (buoc 2
   * trong luong 5.1 SRS) - chi tra ve thong tin cong khai, KHONG bao gio tra
   * secret_hash hay bat ky thong tin nao co the dung de doan ma phu cao.
   */
  async lookupPublic(publicId: string) {
    const code = await this.prisma.code.findUnique({
      where: { publicId },
      include: { batch: { include: { product: true } } },
    });
    if (!code) return null;

    return {
      publicId: code.publicId,
      status: code.status === 'revoked' ? 'revoked' : 'exists',
      productName: code.batch.product.name,
      batchNumber: code.batch.batchNumber,
      manufactureDate: code.batch.manufactureDate,
    };
  }
}
