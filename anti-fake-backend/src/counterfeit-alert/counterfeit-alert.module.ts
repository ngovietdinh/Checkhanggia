import { Module } from '@nestjs/common';
import { CounterfeitAlertService } from './counterfeit-alert.service';
import { CounterfeitAlertController } from './counterfeit-alert.controller';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Module({
  controllers: [CounterfeitAlertController],
  providers: [CounterfeitAlertService, AdminKeyGuard],
})
export class CounterfeitAlertModule {}
