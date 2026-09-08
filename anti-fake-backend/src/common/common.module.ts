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
import { SupabaseStorageService } from './supabase-storage.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-doi-trong-env',
      signOptions: { expiresIn: '8h' },
      global: true, // bat buoc: de JwtService kha dung o MOI module khac (ProductModule, WarehouseModule...)
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
    SupabaseStorageService,
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
    SupabaseStorageService,
  ],
})
export class CommonModule {}
