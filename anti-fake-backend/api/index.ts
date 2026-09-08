import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/create-app';

/**
 * Entry point cho Vercel Serverless Function. vercel.json cau hinh dua TOAN
 * BO request (khong chi /api/*) vao day.
 *
 * Vercel Node.js Function nhan (req, res) theo dung chuan http.createServer
 * cua Node - va Express app (NestJS mac dinh dung Express lam HTTP adapter)
 * tu no da la 1 ham (req, res) => void hop le, KHONG can boc them thu vien
 * chuyen doi Lambda event nao ca (khac AWS Lambda that su).
 *
 * `cachedApp` giu o pham vi module: neu Vercel tai su dung tien trinh cho
 * request tiep theo ("warm" invocation), khong can khoi tao lai NestJS app
 * tu dau - giam do tre dang ke so voi cold start moi lan.
 */
let cachedExpressInstance: ((req: IncomingMessage, res: ServerResponse) => void) | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedExpressInstance) {
    const app = await createApp();
    await app.init(); // KHONG goi .listen() - serverless khong "lang nghe" port nhu server thuong
    cachedExpressInstance = app.getHttpAdapter().getInstance();
  }
  // Gan ra bien local sau khi da chac chan khong con undefined - TypeScript
  // khong tu suy luan duoc dieu nay qua ranh gioi await/module-scope `let`.
  const instance = cachedExpressInstance;
  instance(req, res);
}
