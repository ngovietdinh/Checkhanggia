import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Flashlight, FlashlightOff } from 'lucide-react';

const ELEMENT_ID = 'qr-reader';

export type ScannedCodeType = 'qr' | 'barcode';

export default function QrScanner({ onScan }: { onScan: (text: string, type: ScannedCodeType) => void }) {
  const scannerRef = useRef<any>(null);
  const stoppedRef = useRef(false); // tu theo doi trang thai, khong dua vao noi bo thu vien
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  /**
   * Dung camera an toan - html5-qrcode co the NEM LOI DONG BO ngay khi goi
   * .stop() neu scanner da dung roi (khong phai loi bat dong bo qua Promise
   * nhu tuong), nen .catch() thong thuong KHONG bat duoc - phai boc them
   * try/catch that su. Dong thoi tu theo doi stoppedRef de khong goi stop()
   * 2 lan (1 lan luc quet thanh cong, 1 lan luc thoat trang) - day chinh la
   * nguyen nhan gay loi "Cannot stop, scanner is not running or paused."
   */
  function safeStop(scanner: any) {
    if (!scanner || stoppedRef.current) return;
    stoppedRef.current = true;
    try {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => undefined);
    } catch {
      // scanner da o trang thai khong the dung (vi du da dung tu truoc) - bo qua an toan
    }
  }

  useEffect(() => {
    let cancelled = false;
    stoppedRef.current = false;

    // Import dong (dynamic import) de tranh loi SSR/build khi thu vien dung
    // truc tiep window/navigator.mediaDevices luc module-load.
    import('html5-qrcode').then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(ELEMENT_ID, {
        // Liet ke day du dinh dang de tang kha nang nhan dien - khong chi
        // rieng QR, ho tro them cac mã vạch bán le pho bien tren san pham.
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ],
        // Uu tien dung API goc cua trinh duyet (BarcodeDetector - co san tren
        // Chrome/Edge tren Android va nhieu ban desktop) thay vi bo giai ma
        // JS thuan cua thu vien - chinh xac va nhanh hon dang ke cho mã vạch
        // 1D (EAN/UPC/Code128...). PHAI dat long trong experimentalFeatures.
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      } as any);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 160 } },
          (decodedText: string, decodedResult: any) => {
            // Chi lay ket qua dau tien, dung camera ngay de tranh quet lap
            const format = decodedResult?.result?.format?.formatName;
            const type: ScannedCodeType = format === 'QR_CODE' ? 'qr' : 'barcode';
            safeStop(scanner);
            onScan(decodedText, type);
          },
          () => {
            // Loi tung frame khong doc duoc ma (binh thuong, khong can xu ly) - bo qua
          },
        )
        .then(() => {
          setReady(true);
          // Kiem tra thiet bi co ho tro den pin khong (khong phai trinh duyet
          // nao/thiet bi nao cung ho tro qua MediaStreamTrack constraints)
          try {
            const capabilities = scanner.getRunningTrackCapabilities?.();
            if (capabilities && 'torch' in capabilities) setTorchSupported(true);
          } catch {
            // bo qua - coi nhu khong ho tro den pin
          }
        })
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
      safeStop(scannerRef.current);
    };
  }, [onScan]);

  function toggleTorch() {
    const scanner = scannerRef.current;
    if (!scanner?.applyVideoConstraints) return;
    const next = !torchOn;
    scanner
      .applyVideoConstraints({ advanced: [{ torch: next }] })
      .then(() => setTorchOn(next))
      .catch(() => undefined);
  }

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
      {ready && torchSupported && (
        <button
          onClick={toggleTorch}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 h-11 w-11 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          {torchOn ? <FlashlightOff size={18} /> : <Flashlight size={18} />}
        </button>
      )}
    </div>
  );
}
