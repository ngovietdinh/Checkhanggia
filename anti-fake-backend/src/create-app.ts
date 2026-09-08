import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Tao va cau hinh NestJS app (KHONG goi .listen()) - dung chung giua:
 *  - main.ts: chay local/tren may chu binh thuong (Railway, Render...), tu
 *    goi .listen(port) sau khi nhan duoc app tu ham nay.
 *  - api/index.ts: chay tren Vercel Serverless Function, boc app bang
 *    @vendia/serverless-express thay vi .listen() (serverless khong co khai
 *    niem "server luon lang nghe port" nhu server thuong).
 * Tach rieng de tranh lap lai cau hinh CORS/helmet/ValidationPipe 2 noi.
 */
export async function createApp(): Promise<INestApplication> {
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

  return app;
}
