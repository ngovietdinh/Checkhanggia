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
    });

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
