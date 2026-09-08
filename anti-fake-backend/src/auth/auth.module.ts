import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

// JwtModule da duoc dang ky global:true trong CommonModule - khong can
// dang ky lai o day. AuthService inject JwtService truc tiep, tu dong
// nhan duoc instance tu CommonModule.
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
