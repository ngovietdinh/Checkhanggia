import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  HelpCircle,
  Info,
  FileText,
  FlaskConical,
  Globe2,
  Factory,
  Package,
  AlertTriangle,
  Sparkles,
  Maximize2,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import type { BarcodeSearchResponse } from '../lib/types';

export default function Barcode() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BarcodeSearchResponse | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    api
      .get<BarcodeSearchResponse>(`/api/v1/search/barcode?code=${encodeURIComponent(code)}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [code]);

  const hasCounterfeit = (data?.counterfeitAlerts.length ?? 0) > 0;
  const hasLegit = (data?.legitimateMatches.length ?? 0) > 0;
  const isExternalResolved = data?.resolvedVia === 'openfoodfacts' || data?.resolvedVia === 'upcitemdb';
  const info = data?.resolvedProductInfo;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="px-5 pt-5 max-w-md mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
          <ArrowLeft size={16} /> Quét mã khác
        </button>
      </div>

      <div className="px-5 pb-16 pt-4 max-w-md mx-auto w-full">
        <h1 className="text-lg font-semibold">Kết quả kiểm tra tự động</h1>
        <p className="text-xs text-text-muted font-mono mt-1">Mã vạch: {code}</p>

        {loading && (
          <div className="flex flex-col items-center gap-2 py-14">
            <Loader2 className="animate-spin text-verify-data" size={26} />
            <p className="text-sm text-text-muted">Đang đối chiếu dữ liệu...</p>
          </div>
        )}

        {error && <p className="text-sm text-verify-danger mt-4">{error}</p>}

        {data && !loading && (
          <>
            {isExternalResolved && info && (
              <div className="flex gap-3 bg-canvas-surface border border-canvas-border rounded-xl p-4 mt-5">
                <button
                  onClick={() => info.imageUrl && setImageViewerOpen(true)}
                  className="relative shrink-0"
                  disabled={!info.imageUrl}
                >
                  {info.imageUrl ? (
                    <img src={info.imageUrl} alt={info.name} className="w-16 h-16 rounded-lg object-contain bg-canvas-surface2" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-canvas-surface2 flex items-center justify-center">
                      <FileText size={22} className="text-text-muted" />
                    </div>
                  )}
                  {info.imageUrl && (
                    <span className="absolute bottom-1 right-1 bg-black/60 rounded-full p-0.5">
                      <Maximize2 size={10} className="text-white" />
                    </span>
                  )}
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text">{info.name}</div>
                  {info.brand && <div className="text-xs text-text-muted mt-1">Thương hiệu: {info.brand}</div>}
                  {info.category && <div className="text-xs text-text-muted mt-0.5">{info.category}</div>}
                  {info.quantity && <div className="text-xs text-text-muted mt-0.5">Khối lượng/dung tích: {info.quantity}</div>}
                </div>
              </div>
            )}

            {isExternalResolved && info?.description && (
              <DetailRow icon={<Info size={15} />} label="Mô tả chung" value={info.description} />
            )}
            {isExternalResolved && info?.ingredients && (
              <DetailRow icon={<FlaskConical size={15} />} label="Thành phần công bố" value={info.ingredients} />
            )}
            {isExternalResolved && info?.countryOfOrigin && (
              <DetailRow icon={<Globe2 size={15} />} label="Xuất xứ" value={info.countryOfOrigin} />
            )}
            {isExternalResolved && info?.manufacturingPlace && (
              <DetailRow icon={<Factory size={15} />} label="Nơi sản xuất" value={info.manufacturingPlace} />
            )}
            {isExternalResolved && info?.packaging && (
              <DetailRow icon={<Package size={15} />} label="Bao bì" value={info.packaging} />
            )}
            {isExternalResolved && info?.allergens && info.allergens.length > 0 && (
              <DetailRow icon={<AlertTriangle size={15} />} label="Chất gây dị ứng" value={info.allergens.join(', ')} />
            )}
            {isExternalResolved && info?.traces && info.traces.length > 0 && (
              <DetailRow icon={<AlertTriangle size={15} />} label="Có thể chứa vết của" value={info.traces.join(', ')} />
            )}
            {isExternalResolved && info?.additives && info.additives.length > 0 && (
              <DetailRow icon={<FlaskConical size={15} />} label="Phụ gia" value={info.additives.join(', ')} />
            )}
            {isExternalResolved && info?.nutritionSummary && (
              <DetailRow icon={<Sparkles size={15} />} label="Dinh dưỡng cơ bản" value={info.nutritionSummary} />
            )}

            {isExternalResolved && (
              <div className="flex gap-2.5 bg-verify-data/10 border border-verify-data/30 rounded-xl px-3.5 py-3 mt-4">
                <Info size={16} className="text-verify-data shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-relaxed">
                  Nhận diện qua cơ sở dữ liệu công khai{' '}
                  {data.resolvedVia === 'openfoodfacts' ? 'Open Food Facts' : 'UPCitemdb'} — chỉ mang tính tham khảo,
                  không xác nhận đây là hàng thật hay giả.
                </p>
              </div>
            )}

            {data.resolvedVia === 'not_found' && (
              <div className="flex flex-col items-center text-center py-12">
                <HelpCircle size={28} className="text-text-muted mb-3" />
                <p className="text-sm text-text">Chưa nhận diện được sản phẩm</p>
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                  Mã vạch này chưa có trong dữ liệu hệ thống lẫn cơ sở dữ liệu công khai. Không đồng nghĩa với hàng
                  giả — hãy thử tra cứu theo tên sản phẩm.
                </p>
                <Link
                  to="/search"
                  className="mt-4 bg-canvas-surface border border-canvas-border rounded-xl px-6 py-2.5 text-sm hover:border-verify-data/40 transition"
                >
                  Tra cứu theo tên
                </Link>
              </div>
            )}

            {/* ===== PHAN CANH BAO HANG GIA - GIU NGUYEN, KHONG THAY DOI ===== */}
            {hasCounterfeit && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={16} className="text-verify-danger" />
                  <h2 className="text-sm font-semibold text-verify-danger">Đã xác nhận là hàng giả/vi phạm</h2>
                </div>
                <div className="space-y-3">
                  {data.counterfeitAlerts.map((c, i) => (
                    <div key={i} className="bg-verify-danger/10 border border-verify-danger/30 rounded-xl p-4">
                      <div className="text-sm font-semibold text-text">{c.productName}</div>
                      {c.productType && <div className="text-xs text-text-muted mt-0.5">{c.productType}</div>}
                      {c.registrationNumber && (
                        <div className="text-xs font-mono text-text-muted mt-1">Mã ĐKSP: {c.registrationNumber}</div>
                      )}
                      {c.responsibleEntity && (
                        <div className="text-xs text-verify-danger mt-2 pt-2 border-t border-verify-danger/20">
                          {c.responsibleEntity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasLegit && (
              <div className="mt-6">
                <h2 className="text-sm font-medium text-text-muted mb-3">Sản phẩm có đăng ký</h2>
                <div className="space-y-3">
                  {data.legitimateMatches.map((r, i) => (
                    <div key={i} className="bg-canvas-surface border border-canvas-border rounded-xl p-4">
                      <div className="text-sm font-medium">{r.productName}</div>
                      <div className="text-xs text-text-muted font-mono mt-0.5">Lô: {r.batchNumber}</div>
                      <div className="text-xs text-text-muted mt-1">{r.enterpriseName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.resolvedVia === 'local_barcode' && !hasCounterfeit && !hasLegit && (
              <p className="text-sm text-text-muted mt-6">Không có dữ liệu phù hợp.</p>
            )}
            {/* ===== HET PHAN CANH BAO HANG GIA ===== */}
          </>
        )}
      </div>

      {imageViewerOpen && info?.imageUrl && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 px-4"
          onClick={() => setImageViewerOpen(false)}
        >
          <img src={info.imageUrl} alt={info.name} className="max-w-full max-h-[80vh] object-contain" />
          <button
            onClick={() => setImageViewerOpen(false)}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
          >
            <X size={22} className="text-text" />
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2.5 mt-3 pb-3 border-b border-canvas-border">
      <div className="text-verify-data mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] text-text-muted uppercase tracking-wide mb-1">{label}</div>
        <div className="text-sm text-text leading-relaxed">{value}</div>
      </div>
    </div>
  );
}
