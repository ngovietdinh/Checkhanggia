import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

export interface JwtPayload {
  sub: string; // app_user.id
  email: string;
  role: 'ENTERPRISE_ADMIN' | 'ENTERPRISE_STAFF';
  enterpriseId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Xac thuc email/mat khau va phat JWT mang theo role + enterpriseId (scope) -
   * dung nguyen tac scoped RBAC muc 7.1 SRS: moi request sau nay se bi loc theo
   * enterpriseId trong token, khong bao gio nhan enterpriseId tu client gui len.
   */
  async login(email: string, password: string) {
    const user = await this.prisma.appUser.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Email hoac mat khau khong dung');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Email hoac mat khau khong dung');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      enterpriseId: user.enterpriseId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        enterpriseId: user.enterpriseId,
      },
    };
  }
}
