import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { CryptoUtil } from './crypto.util';
import { RateLimiterService } from './rate-limiter.service';
import { ApiKeyGuard } from './api-key.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { EnterpriseAuthGuard } from './enterprise-auth.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-doi-trong-env',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [
    PrismaService,
    RedisService,
    CryptoUtil,
    RateLimiterService,
    ApiKeyGuard,
    JwtAuthGuard,
    RolesGuard,
    EnterpriseAuthGuard,
  ],
  exports: [
    PrismaService,
    RedisService,
    CryptoUtil,
    RateLimiterService,
    ApiKeyGuard,
    JwtAuthGuard,
    RolesGuard,
    EnterpriseAuthGuard,
  ],
})
export class CommonModule {}
