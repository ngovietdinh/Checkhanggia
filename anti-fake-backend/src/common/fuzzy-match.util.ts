/**
 * Cac ham so khop chuoi "gan dung" dung cho tim kiem theo ten san pham / so lo
 * (muc dich: nguoi dung go tay khong dau, sai chinh ta van tim ra). Khong dung
 * extension Postgres (pg_trgm) de tranh phu thuoc quyen enable extension tren
 * moi moi truong (local/Supabase) - tinh diem hoan toan trong ung dung.
 */

/** Bo dau tieng Viet + ha chu thuong + trim khoang trang thua, phuc vu so sanh khong phan biet dau/hoa-thuong */
export function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bo dau
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Khoang cach Levenshtein (so buoc sua it nhat de bien chuoi a thanh chuoi b) */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * Diem tuong dong 0..1 (1 = giong het) dua tren Levenshtein, da chuan hoa
 * theo do dai chuoi dai hon. Dung cho ca ten san pham lan so lo.
 */
export function similarity(a: string, b: string): number {
  const na = normalizeVietnamese(a);
  const nb = normalizeVietnamese(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return Math.max(0, 1 - dist / maxLen);
}

/** True neu b la mot cum con nam trong a (sau khi chuan hoa) - dung de mo rong tap ung vien tim kiem */
export function containsNormalized(haystack: string, needle: string): boolean {
  return normalizeVietnamese(haystack).includes(normalizeVietnamese(needle));
}
