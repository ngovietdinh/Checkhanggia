import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from './prisma.service';

/**
 * Guard xac thuc doanh nghiep bang API Key (header x-api-key), dung cho
 * cac endpoint sinh ma / ingestion (chi doanh nghiep so huu moi duoc sinh ma
 * cho batch cua chinh minh). Gan enterprise da xac thuc vao request de cac
 * controller phia sau dung, dam bao moi truy van deu bi loc theo enterprise_id
 * (nguyen tac scoped RBAC - muc 7.1 trong SRS).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Thieu header x-api-key');
    }

    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
    const enterprise = await this.prisma.enterprise.findUnique({
      where: { apiKeyHash },
    });

    if (!enterprise) {
      throw new UnauthorizedException('API key khong hop le');
    }

    request.enterprise = enterprise;
    return true;
  }
}
