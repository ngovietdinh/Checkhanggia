import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateWarehouseExportDto } from './dto/create-export.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async list(enterpriseId: string) {
    return this.prisma.warehouseExport.findMany({
      where: { enterpriseId },
      orderBy: { exportedAt: 'desc' },
      include: { batch: { include: { product: { select: { name: true } } } } },
    });
  }

  async create(enterpriseId: string, userId: string, dto: CreateWarehouseExportDto) {
    const batch = await this.prisma.productBatch.findUnique({ where: { id: dto.batchId } });
    if (!batch) throw new NotFoundException('Khong tim thay lo san xuat');
    if (batch.enterpriseId !== enterpriseId) throw new ForbiddenException();

    return this.prisma.warehouseExport.create({
      data: {
        enterpriseId,
        batchId: dto.batchId,
        destinationRegion: dto.destinationRegion,
        agencyName: dto.agencyName,
        cartonQuantity: dto.cartonQuantity,
        exportedBy: userId,
      },
    });
  }
}
