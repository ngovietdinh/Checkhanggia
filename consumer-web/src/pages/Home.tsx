import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, ShieldCheck, Keyboard, FileWarning, X } from 'lucide-react';
import QrScanner from '../components/QrScanner';

export default function Home() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  function extractPublicId(raw: string): string {
    // QR co the chua nguyen URL (vd https://domain.vn/verify/ABC123) hoac chi ma tran -
    // lay doan cuoi cung sau dau '/' neu la URL, ngược lai giu nguyen.
    const trimmed = raw.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/').filter(Boolean);
      return parts[parts.length - 1];
    }
    return trimmed;
  }

  function handleScan(text: string) {
    setScanning(false);
    navigate(`/verify/${encodeURIComponent(extractPublicId(text))}`);
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    navigate(`/verify/${encodeURIComponent(extractPublicId(manualCode))}`);
  }

  return (
    <div className="min-h-screen bg-canvas relative overflow-hidden flex flex-col">
      {/* Nen luoi ky thuat mo, goi lien tuong "quet xac thuc" - dung nhat quan voi Web Admin */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#3ECFFF 1px, transparent 1px), linear-gradient(90deg, #3ECFFF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-verify-valid/10 blur-3xl" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative max-w-md mx-auto w-full">
        <div className="h-16 w-16 rounded-2xl bg-verify-valid/10 border border-verify-valid/30 flex items-center justify-center mb-5">
          <ShieldCheck size={30} className="text-verify-valid" />
        </div>
        <h1 className="text-2xl font-bold text-center leading-snug">Kiểm tra hàng thật</h1>
        <p className="text-sm text-text-muted text-center mt-2 leading-relaxed">
          Quét mã QR trên tem sản phẩm để xác thực nguồn gốc trong vài giây
        </p>

        {!scanning && !manualMode && (
          <div className="w-full mt-8 space-y-3">
            <button
              onClick={() => setScanning(true)}
              className="w-full flex items-center justify-center gap-2.5 bg-verify-valid text-canvas font-semibold rounded-2xl py-4 text-base hover:brightness-110 active:scale-[0.98] transition shadow-glow"
            >
              <ScanLine size={20} />
              Quét mã QR
            </button>
            <button
              onClick={() => setManualMode(true)}
              className="w-full flex items-center justify-center gap-2.5 bg-canvas-surface border border-canvas-border rounded-2xl py-4 text-sm text-text-muted hover:text-text hover:border-verify-data/40 transition"
            >
              <Keyboard size={17} />
              Nhập mã thủ công
            </button>
          </div>
        )}

        {scanning && (
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-muted">Hướng camera vào mã QR trên tem</span>
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
              className="w-full bg-canvas-surface2 border border-canvas-border rounded-xl px-4 py-3.5 text-base font-mono outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full bg-verify-valid text-canvas font-semibold rounded-xl py-3.5 hover:brightness-110 transition disabled:opacity-50"
            >
              Tiếp tục
            </button>
          </form>
        )}

        <button
          onClick={() => navigate('/report')}
          className="mt-10 flex items-center gap-2 text-xs text-text-muted hover:text-verify-warn transition"
        >
          <FileWarning size={14} />
          Nghi ngờ hàng giả? Gửi báo cáo
        </button>
      </div>
    </div>
  );
}
