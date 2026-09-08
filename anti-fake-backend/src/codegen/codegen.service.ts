import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { CryptoUtil } from '../common/crypto.util';
import { HierarchyLevel } from '@prisma/client';

const CHUNK_SIZE = 5000; // insert theo lo, tranh 1 cau lenh INSERT qua lon (muc 4.2)
const CODEGEN_LOCK_TTL_SECONDS = 24 * 60 * 60;

export interface GeneratedCode {
  publicId: string;
  secretCode: string; // CHI tra ve 1 lan duy nhat luc sinh - khong luu plaintext trong DB
}

@Injectable()
export class CodegenService {
  private readonly pepper: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly crypto: CryptoUtil,
  ) {
    this.pepper = process.env.SECRET_HASH_PEPPER || '';
    if (!this.pepper) {
      // Khong cho phep chay production thieu pepper - se lam yeu hash secret code.
      // eslint-disable-next-line no-console
      console.warn(
        'CANH BAO: SECRET_HASH_PEPPER chua duoc cau hinh trong .env - KHONG dung cho production.',
      );
    }
  }

  /**
   * Sinh hang loat ma cho mot lo san xuat (product_batch), thuc thi dung
   * giai thuat generate_batch() mo ta o muc 4.2 SRS:
   *  - CSPRNG cho tung ma
   *  - Kiem tra trung qua Redis SETNX truoc khi cham DB (giam tai)
   *  - Bulk insert theo lo, DB unique constraint la tuyen phong thu cuoi cung
   */
  async generateBatch(
    enterpriseId: string,
    batchId: string,
    quantity: number,
    hierarchyLevel: HierarchyLevel = 'unit',
  ): Promise<GeneratedCode[]> {
    const batch = await this.prisma.productBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Khong tim thay lo san xuat (batch)');
    if (batch.enterpriseId !== enterpriseId) {
      throw new ForbiddenException('Lo san xuat nay khong thuoc doanh nghiep cua ban');
    }

    const results: GeneratedCode[] = [];
    const pending: {
      publicId: string;
      secretCode: string;
      secretHash: string;
    }[] = [];

    let attempts = 0;
    const maxAttempts = quantity * 20; // ngan chan vong lap vo han neu Redis loi lien tuc

    while (results.length < quantity) {
      attempts++;
      if (attempts > maxAttempts) {
        throw new BadRequestException(
          'Khong the sinh du so luong ma yeu cau - vui long thu lai voi so luong nho hon',
        );
      }

      const publicId = this.crypto.generatePublicId();
      const secretCode = this.crypto.generateSecretCode();

      // Buoc kiem tra trung qua Redis SETNX (muc 4.2) - lop phong thu dau tien,
      // re va nhanh hon nhieu so voi round-trip Postgres cho tung ma.
      const acquired = await this.redis.setNx(
        `codegen:lock:${publicId}`,
        CODEGEN_LOCK_TTL_SECONDS,
      );
      if (!acquired) continue; // trung ngau nhien (cuc hiem) -> thu ma khac

      const secretHash = this.crypto.hashSecret(secretCode, this.pepper);
      pending.push({ publicId, secretCode, secretHash });

      if (pending.length >= CHUNK_SIZE || results.length + pending.length === quantity) {
        const inserted = await this.flushChunk(batchId, hierarchyLevel, pending);
        results.push(...inserted);
        pending.length = 0;
      }
    }

    return results;
  }

  /**
   * Ghi mot lo (chunk) xuong Postgres bang createMany. skipDuplicates=true la
   * lop phong thu thu hai (DB unique constraint tren public_id) - phong truong
   * hop hi huu Redis bao chua trung nhung thuc te da ton tai (vi du Redis vua
   * bi flush). Cac ban ghi bi skip se duoc bo qua khoi ket qua tra ve cho client
   * (client se thay so luong tra ve < quantity trong truong hop cuc hiem nay va
   * co the goi lai de bu du so luong).
   */
  private async flushChunk(
    batchId: string,
    hierarchyLevel: HierarchyLevel,
    chunk: { publicId: string; secretCode: string; secretHash: string }[],
  ): Promise<GeneratedCode[]> {
    await this.prisma.code.createMany({
      data: chunk.map((c) => ({
        batchId,
        publicId: c.publicId,
        secretHash: c.secretHash,
        hierarchyLevel,
      })),
      skipDuplicates: true,
    });

    // Doi chieu lai nhung ban ghi thuc su duoc ghi (phong truong hop skipDuplicates
    // loai bo mot vai dong) de chi tra secretCode cho cac ma thuc su ton tai trong DB.
    const insertedPublicIds = await this.prisma.code.findMany({
      where: { publicId: { in: chunk.map((c) => c.publicId) } },
      select: { publicId: true },
    });
    const insertedSet = new Set(insertedPublicIds.map((r) => r.publicId));

    return chunk
      .filter((c) => insertedSet.has(c.publicId))
      .map((c) => ({ publicId: c.publicId, secretCode: c.secretCode }));
  }

  /**
   * Dong goi Parent-Child (muc 2.3 EN-03 / muc 3.2): gan parent_code_id cho
   * danh sach ma con vao mot ma cha (thung/hop). Chay trong 1 transaction de
   * dam bao tinh nguyen tu - hoac gan het, hoac khong gan gi ca.
   */
  async aggregate(enterpriseId: string, parentPublicId: string, childPublicIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      const parent = await tx.code.findUnique({
        where: { publicId: parentPublicId },
        include: { batch: true },
      });
      if (!parent) throw new NotFoundException('Khong tim thay ma cha (thung/hop)');
      if (parent.batch.enterpriseId !== enterpriseId) {
        throw new ForbiddenException('Ma nay khong thuoc doanh nghiep cua ban');
      }
      if (parent.hierarchyLevel === 'unit') {
        throw new BadRequestException(
          'Ma cha phai co hierarchy_level la box hoac carton, khong the la unit',
        );
      }

      const children = await tx.code.findMany({
        where: { publicId: { in: childPublicIds } },
        include: { batch: true },
      });

      if (children.length !== childPublicIds.length) {
        throw new BadRequestException('Mot hoac nhieu ma con khong ton tai trong he thong');
      }
      for (const child of children) {
        if (child.batch.enterpriseId !== enterpriseId) {
          throw new ForbiddenException(`Ma con ${child.publicId} khong thuoc doanh nghiep cua ban`);
        }
        if (child.parentCodeId) {
          throw new BadRequestException(`Ma con ${child.publicId} da thuoc mot thung/hop khac`);
        }
      }

      await tx.code.updateMany({
        where: { publicId: { in: childPublicIds } },
        data: { parentCodeId: parent.id },
      });

      return { parentPublicId, childCount: children.length };
    });
  }

  /**
   * Truy vet cay Parent-Child (IN-05 Trace) bang truy van de quy tren
   * parent_code_id (muc 3.2). Tra ve toan bo cay con cua mot ma thung/hop.
   */
  async traceTree(publicId: string) {
    const root = await this.prisma.code.findUnique({ where: { publicId } });
    if (!root) throw new NotFoundException('Khong tim thay ma');

    const tree = await this.prisma.$queryRawUnsafe<
      { id: string; public_id: string; hierarchy_level: string; parent_code_id: string | null }[]
    >(
      `WITH RECURSIVE tree AS (
         SELECT id, public_id, hierarchy_level, parent_code_id FROM code WHERE id = $1
         UNION ALL
         SELECT c.id, c.public_id, c.hierarchy_level, c.parent_code_id
         FROM code c
         INNER JOIN tree t ON c.parent_code_id = t.id
       )
       SELECT * FROM tree;`,
      root.id,
    );

    return tree;
  }
}
