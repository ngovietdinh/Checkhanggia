import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync } from 'fs';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Tao san thu muc luu anh bao cao hang gia (CU-03) - multer diskStorage
  // khong tu tao thu muc, phai co truoc khi nhan file upload dau tien.
  mkdirSync(join(process.cwd(), 'uploads', 'fraud-reports'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

  app.use(helmet({ crossOriginResourcePolicy: false })); // tat crossOriginResourcePolicy de anh /uploads load duoc tu origin khac (frontend)

  // Phuc vu anh bao cao hang gia (CU-03) - MVP luu dia cuc bo, xem ghi chu
  // trong FraudReportController ve viec chuyen sang object storage sau nay.
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  // Loai bo field khong khai bao trong DTO, chan payload thua/khong hop le som
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Anti-Fake Backend (Code-Gen + Verify) listening on port ${port}`);
}

bootstrap();
