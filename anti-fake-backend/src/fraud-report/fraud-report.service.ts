import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface CreateFraudReportInput {
  publicId?: string;
  lat?: number;
  lng?: number;
  storeName?: string;
  description?: string;
  imageUrls: string[];
}

@Injectable()
export class FraudReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tao bao cao nghi van hang gia (CU-03). Endpoint public - khong yeu cau
   * dang nhap vi nguoi tieu dung dung web/app khong co tai khoan. Rate-limit
   * o tang controller (ThrottlerGuard) de chong spam bao cao (nhu ghi chu
   * trong luong 5.2 SRS).
   */
  async create(input: CreateFraudReportInput) {
    return this.prisma.fraudReport.create({
      data: {
        publicId: input.publicId,
        lat: input.lat,
        lng: input.lng,
        storeName: input.storeName,
        description: input.description,
        imageUrls: input.imageUrls,
      },
    });
  }
}
