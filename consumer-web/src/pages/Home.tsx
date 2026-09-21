import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Keyboard, FileWarning, X, Search } from 'lucide-react';
import QrScanner from '../components/QrScanner';

export default function Home() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  function extractPublicId(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/').filter(Boolean);
      return parts[parts.length - 1];
    }
    return trimmed;
  }

  function handleScan(text: string, type: 'qr' | 'barcode') {
    setScanning(false);
    if (type === 'qr') {
      navigate(`/verify/${encodeURIComponent(extractPublicId(text))}`);
    } else {
      navigate(`/barcode/${encodeURIComponent(text.trim())}`);
    }
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    navigate(`/verify/${encodeURIComponent(extractPublicId(manualCode))}`);
  }

  return (
    <div className="min-h-screen bg-canvas relative overflow-hidden flex flex-col">
      {/* Hoa tiet van song mo nhat - goi hoa tiet an ninh in tren tien/chung chi */}
      <div className="pointer-events-none absolute inset-0 bg-guilloche" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative max-w-md mx-auto w-full">
        <span className="text-[11px] tracking-[0.2em] text-text-muted font-medium">HỆ THỐNG XÁC THỰC SẢN PHẨM</span>
        <h1 className="font-display text-[2.35rem] leading-[1.08] font-semibold text-center mt-3 text-text">
          Hàng thật hay hàng giả?
        </h1>
        <p className="text-[15px] text-text-muted text-center mt-3 leading-relaxed max-w-[300px]">
          Quét tem, đối chiếu ngay với dữ liệu chính thức — biết kết quả trong vài giây
        </p>

        {!scanning && !manualMode && (
          <div className="w-full mt-10 flex flex-col items-center">
            {/* Nut quet chinh - dang "con dau": vien dut net goi canh tem/xu, khong phai o vuong bo goc thong thuong */}
            <button
              onClick={() => setScanning(true)}
              className="group relative h-40 w-40 rounded-full flex flex-col items-center justify-center gap-1.5 bg-canvas-surface transition active:scale-[0.97]"
              style={{
                border: '2px dashed rgba(15,31,61,0.22)',
                boxShadow: '0 1px 2px rgba(15,31,61,0.06), 0 12px 28px -8px rgba(15,31,61,0.18)',
              }}
            >
              <span className="absolute inset-[6px] rounded-full border border-canvas-border" />
              <ScanLine size={30} className="text-verify-danger" strokeWidth={1.75} />
              <span className="text-[13px] font-semibold text-text">Quét mã</span>
              <span className="text-[10px] text-text-muted">QR · Mã vạch</span>
            </button>

            <div className="flex items-center gap-4 mt-8 text-[13px]">
              <button
                onClick={() => setManualMode(true)}
                className="flex items-center gap-1.5 text-text-muted hover:text-text transition"
              >
                <Keyboard size={15} />
                Nhập mã tay
              </button>
              <span className="h-3 w-px bg-canvas-border" />
              <button
                onClick={() => navigate('/search')}
                className="flex items-center gap-1.5 text-text-muted hover:text-text transition"
              >
                <Search size={15} />
                Tra cứu theo tên
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-muted">Hướng camera vào mã QR hoặc mã vạch sản phẩm</span>
              <button onClick={() => setScanning(false)} className="text-text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>
            <QrScanner onScan={handleScan} />
          </div>
        )}

        {manualMode && (
          <form onSubmit={handleManualSubmit} className="w-full mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-text-muted">Mã in trên tem (lớp công khai)</label>
              <button type="button" onClick={() => setManualMode(false)} className="text-text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>
            <input
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ví dụ: A1B2C3D4E5F6G7H8"
              className="w-full bg-canvas-surface2 border border-canvas-border rounded-xl px-4 py-3.5 text-base font-mono outline-none focus:border-verify-danger/40 focus:ring-1 focus:ring-verify-danger/20 transition-colors"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full bg-verify-danger text-canvas font-semibold rounded-xl py-3.5 hover:brightness-110 transition disabled:opacity-40"
            >
              Tiếp tục
            </button>
          </form>
        )}

        <button
          onClick={() => navigate('/report')}
          className="mt-12 flex items-center gap-2 text-xs text-text-muted hover:text-verify-warn transition"
        >
          <FileWarning size={14} />
          Nghi ngờ hàng giả? Gửi báo cáo
        </button>
      </div>
    </div>
  );
}
