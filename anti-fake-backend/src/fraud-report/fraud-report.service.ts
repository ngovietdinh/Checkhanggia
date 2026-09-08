import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export interface CreateFraudReportInput {
  publicId?: string;
  lat?: number;
  lng?: number;
  storeName?: string;
  description?: string;
  imageUrls: string[];
}

export interface FraudReportRow {
  id: string;
  public_id: string | null;
  image_urls: string[];
  lat: number | null;
  lng: number | null;
  store_name: string | null;
  description: string | null;
  status: 'new' | 'verifying' | 'confirmed' | 'rejected';
  created_at: Date;
  product_name: string | null;
  category_code: string | null;
  batch_number: string | null;
}

const PAGE_SIZE = 20;

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

  /**
   * Danh sach bao cao cho Web Admin (EN-07). `fraud_report.public_id` la
   * String thuong (khong phai relation trong schema), nen dung raw SQL JOIN
   * qua code -> product_batch de loc theo enterprise cua nguoi dang nhap.
   * Bao cao KHONG doc duoc ma (public_id rong, vi du nguoi dung khong quet
   * duoc tem) van hien thi cho MOI doanh nghiep - vi chua the biet no thuoc
   * san pham cua ai, can con nguoi xem thu de phan loai (khac voi bao cao da
   * xac dinh duoc san pham thi CHI enterprise so huu san pham do moi thay).
   */
  async listForEnterprise(enterpriseId: string, page = 1, status?: string) {
    const statusFilter = status ? `AND fr.status = '${status}'::"FraudReportStatus"` : '';

    const items = await this.prisma.$queryRawUnsafe<FraudReportRow[]>(
      `SELECT fr.id, fr.public_id, fr.image_urls, fr.lat, fr.lng, fr.store_name,
              fr.description, fr.status, fr.created_at,
              p.name as product_name, p.category_code as category_code, pb.batch_number as batch_number
       FROM fraud_report fr
       LEFT JOIN code c ON c.public_id = fr.public_id
       LEFT JOIN product_batch pb ON pb.id = c.batch_id
       LEFT JOIN product p ON p.id = pb.product_id
       WHERE (pb.enterprise_id IS NULL OR pb.enterprise_id = $1::uuid)
       ${statusFilter}
       ORDER BY fr.created_at DESC
       LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE};`,
      enterpriseId,
    );

    const countRows = await this.prisma.$queryRawUnsafe<{ status: string; count: bigint }[]>(
      `SELECT fr.status, COUNT(*) as count
       FROM fraud_report fr
       LEFT JOIN code c ON c.public_id = fr.public_id
       LEFT JOIN product_batch pb ON pb.id = c.batch_id
       WHERE (pb.enterprise_id IS NULL OR pb.enterprise_id = $1::uuid)
       GROUP BY fr.status;`,
      enterpriseId,
    );

    const categoryRows = await this.prisma.$queryRawUnsafe<{ category_code: string; count: bigint }[]>(
      `SELECT p.category_code, COUNT(*) as count
       FROM fraud_report fr
       LEFT JOIN code c ON c.public_id = fr.public_id
       LEFT JOIN product_batch pb ON pb.id = c.batch_id
       LEFT JOIN product p ON p.id = pb.product_id
       WHERE (pb.enterprise_id IS NULL OR pb.enterprise_id = $1::uuid) AND p.category_code IS NOT NULL
       GROUP BY p.category_code
       ORDER BY count DESC;`,
      enterpriseId,
    );

    const statusCounts: Record<string, number> = { new: 0, verifying: 0, confirmed: 0, rejected: 0 };
    for (const row of countRows) statusCounts[row.status] = Number(row.count);
    const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return {
      items,
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      statusCounts,
      categoryCounts: categoryRows.map((r) => ({ category: r.category_code, count: Number(r.count) })),
    };
  }

  /**
   * Cap nhat trang thai bao cao (duyet/tu choi). Cho phep enterprise cap
   * nhat bao cao chua xac dinh san pham (public_id null) vi ho co the la
   * nguoi dau tien phat hien/xac minh; khong can kiem tra quyen so huu chat
   * che nhu du lieu san pham vi day la du lieu cong dong bao cao chung.
   */
  async updateStatus(id: string, status: 'new' | 'verifying' | 'confirmed' | 'rejected') {
    const existing = await this.prisma.fraudReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy báo cáo');

    return this.prisma.fraudReport.update({ where: { id }, data: { status } });
  }
}
