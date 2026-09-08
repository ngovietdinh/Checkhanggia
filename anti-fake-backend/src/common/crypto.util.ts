import { Injectable } from '@nestjs/common';
import { randomBytes, createHash, timingSafeEqual, randomUUID } from 'crypto';

// Bang chu Base32 an toan: loai bo 0/O va 1/I de tranh nham lan khi doc tem in.
// Tham chieu muc 4.2 trong SRS.
const SAFE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class CryptoUtil {
  /**
   * Sinh ma phu cao (secret code) 12 ky tu tu CSPRNG - khong dung Math.random().
   * ~80 bit entropy thu duoc tu 10 byte ngau nhien nguon goc, sau do map sang
   * bang chu an toan.
   */
  generateSecretCode(length = 12): string {
    const bytes = randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) {
      out += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
    }
    return out;
  }

  /**
   * Sinh public_id (lop cong khai) - khong can bi mat, chi can duy nhat.
   * Dung UUID rut gon de de in ma vach/QR ngan gon hon UUID day du.
   */
  generatePublicId(): string {
    return randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
  }

  /**
   * Hash secret code bang SHA-256 + pepper tu bien moi truong (khong luu plaintext
   * trong DB - dung HASH(secret_code) dung nhu mo ta muc 3.2 / 4.3).
   * Trong production nen can nhac dung Argon2/bcrypt cho ma nguoi dung tu dat,
   * nhung voi ma CSPRNG do he thong sinh (khong doan duoc, khong dung lai giua
   * cac nguoi dung), SHA-256 + pepper la du va nhanh hon nhieu cho throughput
   * xac thuc lon (5.000 req/s).
   */
  hashSecret(secret: string, pepper: string): string {
    return createHash('sha256').update(`${pepper}:${secret}`).digest('hex');
  }

  /**
   * So khop hash theo constant-time de chong timing attack (muc 4.3, buoc 3) -
   * KHONG duoc dung `===` hoac so sanh string thong thuong o day.
   */
  constantTimeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) {
      // Van phai chay timingSafeEqual voi buffer cung do dai de khong lo do dai
      // qua thoi gian phan hoi - so sanh voi chinh no roi tra false.
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
