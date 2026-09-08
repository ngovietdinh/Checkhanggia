import { FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Loader2,
  Sparkles,
  FileWarning,
} from 'lucide-react';
import { api } from '../lib/api';
import type { PublicLookupResult, VerifyOutcome } from '../lib/types';

export default function Verify() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();

  const [lookup, setLookup] = useState<PublicLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [secretCode, setSecretCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;
    setLookupLoading(true);
    api
      .get<PublicLookupResult>(`/api/v1/verify/public/${encodeURIComponent(publicId)}`)
      .then(setLookup)
      .catch((e) => setLookupError(e.message))
      .finally(() => setLookupLoading(false));
  }, [publicId]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!publicId || !secretCode.trim()) return;
    setVerifying(true);
    setVerifyError(null);

    // Xin toa do vi tri (khong bat buoc - neu tu choi van tiep tuc xac thuc
    // duoc, chi la khong co du lieu vi tri cho scan_log)
    const getPosition = () =>
      new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          () => resolve(null),
          { timeout: 4000 },
        );
      });

    try {
      const pos = await getPosition();
      const res = await api.post<VerifyOutcome>('/api/v1/verify/scan', {
        publicId,
        secretCode: secretCode.trim(),
        lat: pos?.coords.latitude,
        lng: pos?.coords.longitude,
        deviceFingerprint: getDeviceFingerprint(),
      });
      setOutcome(res);
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  }

  if (lookupLoading) {
    return (
      <CenteredScreen>
        <Loader2 className="animate-spin text-verify-data" size={28} />
        <p className="text-sm text-text-muted mt-3">Đang tra cứu...</p>
      </CenteredScreen>
    );
  }

  if (lookupError || !lookup || lookup.status === 'not_found') {
    return (
      <CenteredScreen>
        <ResultHero
          icon={XCircle}
          color="danger"
          title="Không tìm thấy mã này"
          subtitle="Mã không tồn tại trong hệ thống. Đây có thể là dấu hiệu hàng giả."
        />
        <ActionRow publicId={publicId} showReport />
      </CenteredScreen>
    );
  }

  if (lookup.status === 'revoked') {
    return (
      <CenteredScreen>
        <ResultHero
          icon={Ban}
          color="danger"
          title="Mã đã bị thu hồi"
          subtitle="Sản phẩm này đã được doanh nghiệp thu hồi khỏi lưu thông."
        />
        <ActionRow publicId={publicId} showReport />
      </CenteredScreen>
    );
  }

  if (outcome) {
    return (
      <CenteredScreen>
        {outcome.result === 'VALID' && (
          <ResultHero
            icon={CheckCircle2}
            color="valid"
            title="Chính hãng"
            subtitle="Sản phẩm đã được xác thực thành công lần đầu tiên."
          />
        )}
        {outcome.result === 'DUPLICATE' && (
          <ResultHero
            icon={AlertTriangle}
            color="warn"
            title="Mã đã được quét trước đó"
            subtitle={
              outcome.firstScannedAt
                ? `Lần quét hợp lệ đầu tiên: ${new Date(outcome.firstScannedAt).toLocaleString('vi-VN')}`
                : 'Đây là dấu hiệu tem có thể đã bị sao chép hoặc dùng lại.'
            }
          />
        )}
        {outcome.result === 'INVALID' && (
          <ResultHero icon={XCircle} color="danger" title="Sai mã xác thực" subtitle="Mã bạn nhập không khớp với tem này." />
        )}
        {outcome.result === 'REVOKED' && (
          <ResultHero icon={Ban} color="danger" title="Mã đã bị thu hồi" subtitle="Sản phẩm đã được thu hồi khỏi lưu thông." />
        )}
        {outcome.result === 'BLOCKED' && (
          <ResultHero icon={AlertTriangle} color="warn" title="Tạm thời bị chặn" subtitle={outcome.message} />
        )}
        {outcome.result === 'NOT_FOUND' && (
          <ResultHero icon={XCircle} color="danger" title="Không tìm thấy mã" subtitle="Có thể đây là tem giả." />
        )}
        <ActionRow publicId={publicId} showReport={outcome.result !== 'VALID'} />
      </CenteredScreen>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="px-5 pt-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 max-w-md mx-auto w-full">
        <Sparkles size={26} className="text-verify-data mb-4" />
        <h1 className="text-lg font-semibold text-center">{lookup.productName || 'Sản phẩm'}</h1>
        {lookup.batchNumber && (
          <p className="text-xs text-text-muted font-mono mt-1">
            Lô: {lookup.batchNumber}
            {lookup.manufactureDate ? ` · SX ${new Date(lookup.manufactureDate).toLocaleDateString('vi-VN')}` : ''}
          </p>
        )}

        <p className="text-sm text-text-muted text-center mt-6 leading-relaxed">
          Cào lớp phủ bạc trên tem để lấy mã xác thực, sau đó nhập vào ô bên dưới
        </p>

        <form onSubmit={handleVerify} className="w-full mt-5 space-y-3">
          <input
            autoFocus
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            placeholder="Nhập mã dưới lớp phủ bạc"
            className="w-full bg-canvas-surface2 border border-canvas-border rounded-xl px-4 py-3.5 text-base font-mono tracking-wider text-center outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors"
          />
          {verifyError && <div className="text-xs text-verify-danger text-center">{verifyError}</div>}
          <button
            type="submit"
            disabled={verifying || !secretCode.trim()}
            className="w-full flex items-center justify-center gap-2 bg-verify-valid text-canvas font-semibold rounded-xl py-3.5 hover:brightness-110 transition disabled:opacity-50"
          >
            {verifying && <Loader2 size={16} className="animate-spin" />}
            Xác thực
          </button>
        </form>
      </div>
    </div>
  );
}

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
      <div className="max-w-md w-full flex flex-col items-center">{children}</div>
    </div>
  );
}

const COLOR_MAP = {
  valid: { text: 'text-verify-valid', bg: 'bg-verify-valid/10', border: 'border-verify-valid/30' },
  warn: { text: 'text-verify-warn', bg: 'bg-verify-warn/10', border: 'border-verify-warn/30' },
  danger: { text: 'text-verify-danger', bg: 'bg-verify-danger/10', border: 'border-verify-danger/30' },
};

function ResultHero({
  icon: Icon,
  color,
  title,
  subtitle,
}: {
  icon: any;
  color: keyof typeof COLOR_MAP;
  title: string;
  subtitle: string;
}) {
  const c = COLOR_MAP[color];
  return (
    <>
      <div className={`h-20 w-20 rounded-full ${c.bg} border ${c.border} flex items-center justify-center mb-5`}>
        <Icon size={40} className={c.text} />
      </div>
      <h1 className={`text-2xl font-bold ${c.text}`}>{title}</h1>
      <p className="text-sm text-text-muted mt-2 leading-relaxed">{subtitle}</p>
    </>
  );
}

function ActionRow({ publicId, showReport }: { publicId?: string; showReport: boolean }) {
  return (
    <div className="w-full mt-8 space-y-3">
      <Link
        to="/"
        className="block w-full text-center bg-canvas-surface border border-canvas-border rounded-xl py-3.5 text-sm text-text hover:border-verify-data/40 transition"
      >
        Quét mã khác
      </Link>
      {showReport && (
        <Link
          to={`/report${publicId ? `?publicId=${encodeURIComponent(publicId)}` : ''}`}
          className="flex items-center justify-center gap-2 w-full text-center bg-verify-danger/10 border border-verify-danger/30 rounded-xl py-3.5 text-sm text-verify-danger hover:bg-verify-danger/20 transition"
        >
          <FileWarning size={16} />
          Báo cáo hàng giả
        </Link>
      )}
    </div>
  );
}

function getDeviceFingerprint(): string {
  const key = 'af_device_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    localStorage.setItem(key, fp);
  }
  return fp;
}
