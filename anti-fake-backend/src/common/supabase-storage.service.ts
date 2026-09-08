import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const BUCKET = 'fraud-report-images';

/**
 * Luu anh bao cao hang gia (CU-03) len Supabase Storage thay vi dia cuc bo.
 * Ly do bat buoc: hau het nen tang hosting cho backend Node (Railway,
 * Render...) dung filesystem tam thoi (ephemeral) - anh luu dia se mat het
 * moi lan redeploy. Can tao bucket PUBLIC ten "fraud-report-images" tren
 * Supabase Dashboard truoc khi dung (xem DEPLOYMENT.md).
 */
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: SupabaseClient | null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      this.logger.warn(
        'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY chua duoc cau hinh - upload anh se that bai. Xem DEPLOYMENT.md.',
      );
      this.client = null;
      return;
    }
    // Dung Service Role Key (chi o phia server, KHONG BAO GIO dua vao frontend)
    // vi can quyen ghi vao bucket ma khong bi rang buoc boi Row Level Security
    // danh cho nguoi dung cuoi.
    this.client = createClient(url, key);
  }

  async uploadImage(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'Chua cau hinh Supabase Storage (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)',
      );
    }

    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extname(originalName)}`;

    const { error } = await this.client.storage.from(BUCKET).upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) {
      this.logger.error(`Upload Supabase Storage that bai: ${error.message}`);
      throw new InternalServerErrorException('Khong the luu anh, vui long thu lai');
    }

    const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
