import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { JwtPayload } from '../auth/auth.service';

/**
 * Guard dung chung cho Code-Gen Service: chap nhan HOAC API key (doanh nghiep
 * tich hop ERP - muc 3.3) HOAC Bearer JWT (nhan vien dang nhap Web Admin -
 * muc 7). Ca hai deu chuan hoa ve req.enterpriseId de controller/service phia
 * sau dung thong nhat mot truong, khong can biet nguon xac thuc nao.
 */
@Injectable()
export class EnterpriseAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const apiKey = request.headers['x-api-key'];
    if (apiKey && typeof apiKey === 'string') {
      const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
      const enterprise = await this.prisma.enterprise.findUnique({ where: { apiKeyHash } });
      if (!enterprise) throw new UnauthorizedException('API key khong hop le');
      request.enterpriseId = enterprise.id;
      request.authSource = 'api_key';
      return true;
    }

    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-doi-trong-env',
        });
        request.enterpriseId = payload.enterpriseId;
        request.user = payload;
        request.authSource = 'jwt';
        return true;
      } catch {
        throw new UnauthorizedException('Token khong hop le hoac da het han');
      }
    }

    throw new UnauthorizedException('Can header x-api-key hoac Bearer token');
  }
}
