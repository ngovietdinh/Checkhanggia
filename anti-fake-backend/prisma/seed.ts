import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const demoApiKey = process.env.SEED_API_KEY || randomBytes(24).toString('hex');
  const apiKeyHash = createHash('sha256').update(demoApiKey).digest('hex');

  const enterprise = await prisma.enterprise.upsert({
    where: { apiKeyHash },
    update: {},
    create: {
      name: 'Doanh nghiep Demo',
      apiKeyHash,
    },
  });

  const demoPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const adminUser = await prisma.appUser.upsert({
    where: { email: 'admin@demo.vn' },
    update: {},
    create: {
      email: 'admin@demo.vn',
      passwordHash,
      fullName: 'Quan tri vien Demo',
      role: 'ENTERPRISE_ADMIN',
      enterpriseId: enterprise.id,
    },
  });

  const product = await prisma.product.create({
    data: {
      enterpriseId: enterprise.id,
      name: 'San pham Demo A',
      categoryCode: 'DEMO_CATEGORY',
      warrantyMonths: 12,
      dataSource: 'manual',
    },
  });

  const batch = await prisma.productBatch.create({
    data: {
      productId: product.id,
      enterpriseId: enterprise.id,
      batchNumber: 'LOT-0001',
      manufactureDate: new Date(),
      factoryCode: 'NM01',
    },
  });

  // eslint-disable-next-line no-console
  console.log('=== SEED HOAN TAT ===');
  // eslint-disable-next-line no-console
  console.log('Enterprise ID:', enterprise.id);
  // eslint-disable-next-line no-console
  console.log('API Key (luu lai, khong hien thi lai):', demoApiKey);
  // eslint-disable-next-line no-console
  console.log('--- Tai khoan dang nhap Web Admin ---');
  // eslint-disable-next-line no-console
  console.log('Email:', adminUser.email);
  // eslint-disable-next-line no-console
  console.log('Mat khau:', demoPassword);
  // eslint-disable-next-line no-console
  console.log('---');
  // eslint-disable-next-line no-console
  console.log('Product ID:', product.id);
  // eslint-disable-next-line no-console
  console.log('Batch ID (dung de goi /api/v1/codegen/generate):', batch.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
