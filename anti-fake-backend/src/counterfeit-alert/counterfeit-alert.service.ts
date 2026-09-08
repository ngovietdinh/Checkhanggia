import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCounterfeitAlertDto } from './dto/create-counterfeit-alert.dto';

const PAGE_SIZE = 50;

@Injectable()
export class CounterfeitAlertService {
  constructor(private readonly prisma: PrismaService) {}

  async list(page = 1, q?: string) {
    const where = q
      ? {
          OR: [
            { productName: { contains: q, mode: 'insensitive' as const } },
            { responsibleEntity: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.counterfeitAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      this.prisma.counterfeitAlert.count({ where }),
    ]);

    return { items, total, page, pageSize: PAGE_SIZE };
  }

  async create(dto: CreateCounterfeitAlertDto) {
    return this.prisma.counterfeitAlert.create({ data: dto });
  }
}
