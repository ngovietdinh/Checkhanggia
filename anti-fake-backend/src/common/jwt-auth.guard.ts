import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/auth.service';

/**
 * Guard dung cho toan bo API Web Admin (Product, Warehouse, Dashboard...).
 * Doc Bearer token, verify chu ky, gan payload (bao gom enterpriseId) vao
 * req.user. Cac controller PHAI luon loc du lieu theo req.user.enterpriseId,
 * khong bao gio tin enterpriseId do client truyen len trong body/query
 * (nguyen tac scoped RBAC - muc 7.1 SRS).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thieu Bearer token');
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-doi-trong-env',
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token khong hop le hoac da het han');
    }
  }
}
