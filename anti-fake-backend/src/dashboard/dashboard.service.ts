import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tong hop so lieu cho dashboard EN-04. Ghi chu quan trong: chi so
   * volume_anomaly day du theo tung vung (muc 4.4 SRS) can doi chieu toa do
   * scan_log voi ranh gioi hanh chinh (reverse geocoding) - chua trien khai o
   * MVP nay (TODO giai doan sau, can them Geofencing/Fraud Detection Service
   * rieng). O day tam thoi chi tra ty le nghi van tong the (khong tach vung)
   * de dashboard co du lieu dung ngay, khong bi block boi phan con thieu.
   */
  async summary(enterpriseId: string) {
    const [totalCodes, scannedCodes, revokedCodes, productCount, batchCount] = await Promise.all([
      this.prisma.code.count({ where: { batch: { enterpriseId } } }),
      this.prisma.code.count({ where: { batch: { enterpriseId }, status: 'scanned' } }),
      this.prisma.code.count({ where: { batch: { enterpriseId }, status: 'revoked' } }),
      this.prisma.product.count({ where: { enterpriseId } }),
      this.prisma.productBatch.count({ where: { enterpriseId } }),
    ]);

    // scan_log khong co enterprise_id truc tiep (bang nay dung chung toan he
    // thong theo thiet ke muc 3.1) - loc gian tiep qua public_id thuoc cac
    // code cua doanh nghiep bang subquery.
    const scanCounts = await this.prisma.$queryRaw<
      { result: string; count: bigint }[]
    >`
      SELECT sl.result, COUNT(*) as count
      FROM scan_log sl
      INNER JOIN code c ON c.public_id = sl.public_id
      INNER JOIN product_batch pb ON pb.id = c.batch_id
      WHERE pb.enterprise_id = ${enterpriseId}::uuid
        AND sl.scanned_at >= NOW() - INTERVAL '30 days'
      GROUP BY sl.result;
    `;

    const counts: Record<string, number> = {};
    for (const row of scanCounts) counts[row.result] = Number(row.count);

    const validFirst = counts['valid_first'] ?? 0;
    const duplicate = counts['duplicate'] ?? 0;
    const notFound = counts['not_found'] ?? 0;
    const wrongSecret = counts['wrong_secret'] ?? 0;
    const suspicionRatio = validFirst > 0 ? (duplicate + notFound) / validFirst : 0;

    const dailySeries = await this.prisma.$queryRaw<
      { day: Date; result: string; count: bigint }[]
    >`
      SELECT DATE_TRUNC('day', sl.scanned_at) as day, sl.result, COUNT(*) as count
      FROM scan_log sl
      INNER JOIN code c ON c.public_id = sl.public_id
      INNER JOIN product_batch pb ON pb.id = c.batch_id
      WHERE pb.enterprise_id = ${enterpriseId}::uuid
        AND sl.scanned_at >= NOW() - INTERVAL '14 days'
      GROUP BY 1, sl.result
      ORDER BY 1 ASC;
    `;

    return {
      totalCodes,
      scannedCodes,
      unscannedCodes: totalCodes - scannedCodes - revokedCodes,
      revokedCodes,
      productCount,
      batchCount,
      last30Days: { validFirst, duplicate, notFound, wrongSecret, suspicionRatio },
      dailySeries: dailySeries.map((r) => ({ day: r.day, result: r.result, count: Number(r.count) })),
    };
  }
}
