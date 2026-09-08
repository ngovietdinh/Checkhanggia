import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { VerifyService } from './verify.service';
import { VerifyController } from './verify.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 1000, limit: 200 }]),
  ],
  controllers: [VerifyController],
  providers: [
    VerifyService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class VerifyModule {}
