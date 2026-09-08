import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { CodegenModule } from './codegen/codegen.module';
import { VerifyModule } from './verify/verify.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FraudReportModule } from './fraud-report/fraud-report.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    CodegenModule,
    VerifyModule,
    AuthModule,
    ProductModule,
    WarehouseModule,
    DashboardModule,
    FraudReportModule,
  ],
})
export class AppModule {}
