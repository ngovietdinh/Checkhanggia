import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 2,
      // Neu Redis chet, khong duoc de request treo vo han - fail nhanh de code
      // goi noi (Verify Service) fallback ve Postgres (xem muc 3.1 trong SRS).
      enableOfflineQueue: false,
      // connectTimeout ngan + lazyConnect: quan trong khi chay tren Vercel
      // Serverless Function - neu khong cau hinh REDIS_URL that (vi du chua
      // deploy Upstash), moi lan "cold start" se cho toi 10-20s mac dinh cua
      // ioredis truoc khi bao loi, lam request dau tien cua nguoi dung bi
      // treo lau khong can thiet. 2s la du de phat hien Redis khong ton tai
      // ma khong lam cham trai nghiem qua nhieu.
      connectTimeout: 2000,
      lazyConnect: true,
    });

    // lazyConnect:true doi lenh dau tien moi ket noi - chu dong ket noi ngay
    // (khong await, khong chan startup) de loi (neu co) duoc log som thay vi
    // an lang cho toi request dau tien.
    this.client.connect().catch(() => undefined);

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });
  }

  async onModuleInit() {
    // Khong throw neu Redis chua san sang luc app khoi dong - cache la optional,
    // Verify Service van hoat dong duoc (cham hon) khi khong co Redis.
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }

  /**
   * SETNX co TTL - dung cho khoa chong trung ma khi sinh hang loat (muc 4.2)
   * va co the tai su dung cho cac khoa idempotency khac.
   */
  async setNx(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }
}
