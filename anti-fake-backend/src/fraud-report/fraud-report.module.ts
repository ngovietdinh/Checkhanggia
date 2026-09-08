import { Module } from '@nestjs/common';
import { FraudReportService } from './fraud-report.service';
import { FraudReportController } from './fraud-report.controller';

@Module({
  controllers: [FraudReportController],
  providers: [FraudReportService],
})
export class FraudReportModule {}
