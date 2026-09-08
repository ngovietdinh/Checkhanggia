import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Dung sau JwtAuthGuard (can req.user da duoc gan). Vi du: chi Enterprise Admin
 * moi duoc xoa san pham -> @Roles('ENTERPRISE_ADMIN') tren endpoint delete
 * (dung theo ma tran quyen han muc 7.2 SRS).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userRole = request.user?.role;
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Tai khoan khong co quyen thuc hien hanh dong nay');
    }
    return true;
  }
}
