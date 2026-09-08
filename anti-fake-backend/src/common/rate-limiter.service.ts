import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Fixed-window counter bang INCR + EXPIRE. Don gian va du nhanh cho muc tieu
   * 5.000 req/s (mot lenh INCR trong Redis xu ly duoc hang tram nghin op/s).
   * Neu Redis khong san sang, fail-open (khong chan request) va log canh bao -
   * quyet dinh thiet ke: uu tien khong lam gian doan trai nghiem nguoi dung that
   * hon la chan nham khi ha tang phu (cache) gap su co, vi lop UNIQUE constraint
   * + atomic UPDATE o Verify Service (muc 4.3 buoc 4) van la tuyen phong thu chinh
   * chong double-scan bat ke rate-limit co hoat dong hay khong.
   */
  async checkAndIncrement(key: string, config: RateLimitConfig): Promise<boolean> {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await this.redis.client.incr(redisKey);
      if (count === 1) {
        await this.redis.client.expire(redisKey, config.windowSeconds);
      }
      return count <= config.limit;
    } catch (err) {
      this.logger.warn(`Rate limiter unavailable, fail-open: ${(err as Error).message}`);
      return true;
    }
  }
}
