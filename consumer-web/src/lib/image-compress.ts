/**
 * Nen anh ngay tren trinh duyet bang Canvas API truoc khi upload - bat buoc
 * vi backend gioi han 1MB/anh (de tuong thich gioi han 4.5MB cua Vercel
 * Serverless Function), trong khi anh chup dien thoai thuong 3-8MB. Khong
 * nen thi hau het luot gui bao cao se bi loi vuot dung luong.
 *
 * Chien luoc: giam kich thuoc canh dai nhat xuong toi da 1280px, xuat JPEG,
 * giam dan chat luong (quality) neu van vuot targetBytes.
 */
export async function compressImage(file: File, targetBytes = 900 * 1024, maxDimension = 1280): Promise<File> {
  // Anh da du nho thi khong can nen, tranh ton cong xu ly khong can thiet
  if (file.size <= targetBytes) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file; // moi truong khong ho tro Canvas - fallback giu nguyen file goc

  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.85;
  let blob: Blob | null = await canvasToBlob(canvas, quality);

  // Giam dan chat luong toi da 6 lan cho toi khi vua duoi targetBytes
  let attempts = 0;
  while (blob && blob.size > targetBytes && quality > 0.3 && attempts < 6) {
    quality -= 0.12;
    blob = await canvasToBlob(canvas, quality);
    attempts++;
  }

  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
}
