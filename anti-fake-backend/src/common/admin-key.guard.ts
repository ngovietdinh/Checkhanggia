import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Guard rieng, don gian (khong dung chung voi ApiKeyGuard/EnterpriseAuthGuard)
 * vi danh sach hang gia la du lieu tham chieu QUOC GIA, khong thuoc scope cua
 * bat ky enterprise nao trong he thong (khac ban chat voi Product/Code).
 * Dung 1 key bi mat duy nhat luu trong bien moi truong ADMIN_API_KEY - phu
 * hop cho quy mo hien tai (mot nguoi/doi ngu quan tri quan ly danh sach nay).
 * Neu sau nay can nhieu nguoi dung voi phan quyen khac nhau, nen nang cap
 * thanh mot AppRole moi (vi du GOV_ADMIN) thay vi tiep tuc dung shared key.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-admin-key'];
    const expected = process.env.ADMIN_API_KEY;

    if (!expected) {
      throw new UnauthorizedException(
        'ADMIN_API_KEY chua duoc cau hinh tren server - lien he quan tri he thong',
      );
    }
    if (!key || key !== expected) {
      throw new UnauthorizedException('x-admin-key khong hop le');
    }
    return true;
  }
}
