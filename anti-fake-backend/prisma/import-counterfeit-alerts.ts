import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface RawEntry {
  productName: string;
  productType?: string;
  registrationNumber?: string;
  violatingBatches: string[];
  responsibleEntity?: string;
  sourceGroup?: string;
}

/**
 * Import danh sach hang gia/vi pham tu file JSON vao bang counterfeit_alert.
 * Chay: npm run import:counterfeit -- <duong-dan-file.json>
 * Neu khong truyen duong dan, mac dinh dung file mau
 * prisma/data/counterfeit-alerts-seed.json (du lieu nguoi dung cung cap ban dau).
 *
 * An toan chay lai nhieu lan: dung createMany voi kiem tra trung theo
 * productName + registrationNumber truoc khi insert tung dong (khong dung
 * unique constraint DB vi du lieu nguon co the co productName trung nhau
 * that su giua cac vu vi pham khac nhau).
 */
async function main() {
  const filePath = process.argv[2] || join(__dirname, 'data', 'counterfeit-alerts-seed.json');
  const raw = readFileSync(filePath, 'utf-8');
  const entries: RawEntry[] = JSON.parse(raw);

  let inserted = 0;
  let skipped = 0;

  for (const entry of entries) {
    const existing = await prisma.counterfeitAlert.findFirst({
      where: {
        productName: entry.productName,
        registrationNumber: entry.registrationNumber ?? null,
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.counterfeitAlert.create({
      data: {
        productName: entry.productName,
        productType: entry.productType,
        registrationNumber: entry.registrationNumber,
        violatingBatches: entry.violatingBatches || [],
        responsibleEntity: entry.responsibleEntity,
        sourceGroup: entry.sourceGroup,
      },
    });
    inserted++;
  }

  // eslint-disable-next-line no-console
  console.log(`=== IMPORT HOAN TAT ===`);
  // eslint-disable-next-line no-console
  console.log(`Da them moi: ${inserted}`);
  // eslint-disable-next-line no-console
  console.log(`Da bo qua (trung): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
