import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateProductDto, UpdateProductDto, CreateBatchDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async list(enterpriseId: string) {
    return this.prisma.product.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { batches: true } } },
    });
  }

  async getOne(enterpriseId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { batches: { orderBy: { createdAt: 'desc' }, include: { _count: { select: { codes: true } } } } },
    });
    if (!product) throw new NotFoundException('Khong tim thay san pham');
    if (product.enterpriseId !== enterpriseId) throw new ForbiddenException();
    return product;
  }

  async create(enterpriseId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        enterpriseId,
        name: dto.name,
        categoryCode: dto.categoryCode,
        warrantyMonths: dto.warrantyMonths ?? 0,
        dataSource: 'manual',
      },
    });
  }

  async update(enterpriseId: string, id: string, dto: UpdateProductDto) {
    await this.assertOwnership(enterpriseId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(enterpriseId: string, id: string) {
    await this.assertOwnership(enterpriseId, id);
    // Khong cho xoa neu da co lo san xuat gan vao (tranh mat du lieu tem da phat hanh)
    const batchCount = await this.prisma.productBatch.count({ where: { productId: id } });
    if (batchCount > 0) {
      throw new ForbiddenException(
        'San pham da co lo san xuat, khong the xoa. Hay ngung su dung thay vi xoa.',
      );
    }
    return this.prisma.product.delete({ where: { id } });
  }

  async createBatch(enterpriseId: string, dto: CreateBatchDto) {
    await this.assertOwnership(enterpriseId, dto.productId);
    return this.prisma.productBatch.create({
      data: {
        productId: dto.productId,
        enterpriseId,
        batchNumber: dto.batchNumber,
        manufactureDate: new Date(dto.manufactureDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        factoryCode: dto.factoryCode,
      },
    });
  }

  async listBatches(enterpriseId: string) {
    return this.prisma.productBatch.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true } }, _count: { select: { codes: true } } },
    });
  }

  private async assertOwnership(enterpriseId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Khong tim thay san pham');
    if (product.enterpriseId !== enterpriseId) {
      throw new ForbiddenException('San pham nay khong thuoc doanh nghiep cua ban');
    }
  }
}
