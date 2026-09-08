import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

const ELEMENT_ID = 'qr-reader';

export default function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Import dong (dynamic import) de tranh loi SSR/build khi thu vien dung
    // truc tiep window/navigator.mediaDevices luc module-load.
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(ELEMENT_ID);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            // Chi lay ket qua dau tien, dung camera ngay de tranh quet lap
            scanner
              .stop()
              .then(() => scanner.clear())
              .catch(() => undefined);
            onScan(decodedText);
          },
          () => {
            // Loi tung frame khong doc duoc ma (binh thuong, khong can xu ly) - bo qua
          },
        )
        .then(() => setReady(true))
        .catch((err: any) => {
          setError(
            err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError'
              ? 'Bạn cần cho phép truy cập camera để quét mã'
              : 'Không thể mở camera trên thiết bị này',
          );
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => undefined);
      }
    };
  }, [onScan]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 text-center py-10 px-4">
        <AlertCircle className="text-verify-warn" size={28} />
        <p className="text-sm text-text-muted">{error}</p>
        <p className="text-xs text-text-muted">Bạn vẫn có thể nhập mã thủ công bên dưới.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div id={ELEMENT_ID} className="rounded-2xl overflow-hidden border border-canvas-border" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted bg-canvas-surface rounded-2xl">
          Đang mở camera...
        </div>
      )}
    </div>
  );
}
