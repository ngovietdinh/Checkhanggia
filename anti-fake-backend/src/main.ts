import 'reflect-metadata';
import { createApp } from './create-app';

/**
 * Entry point khi chay nhu server thuong (local, Railway, Render, may chu
 * rieng...). Tren Vercel, dung api/index.ts thay the (khong .listen()).
 */
async function bootstrap() {
  const app = await createApp();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Anti-Fake Backend (Code-Gen + Verify) listening on port ${port}`);
}

bootstrap();
