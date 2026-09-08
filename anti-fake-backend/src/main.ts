import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Entry point duy nhat - dung chung cho ca chay local/server thuong (Railway,
 * Render...) lan Vercel (Zero-Config NestJS support, xem
 * https://vercel.com/docs/frameworks/backend/nestjs). Vercel tu dong boc
 * app nay thanh 1 Vercel Function dung Fluid compute - KHONG can file
 * api/index.ts hay vercel.json rieng nhu ban truoc.
 *
 * QUAN TRONG: Vercel quet file nay de tim dong `import ... from '@nestjs/core'`
 * TRUC TIEP nham nhan dien day la NestJS app - khong duoc tach logic
 * NestFactory.create() ra file khac roi chi import lai o day, se khien
 * Vercel bao loi "No entrypoint found which imports nestjs".
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

  app.use(helmet());

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
