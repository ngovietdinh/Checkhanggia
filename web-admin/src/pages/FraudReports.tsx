import { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, Image as ImageIcon, Loader2, CheckCircle2, XCircle, Search } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import type { FraudReportListResponse, FraudReportItem, FraudReportStatus } from '../lib/types';

const STATUS_TABS: { value: FraudReportStatus | 'all'; label: string }[] = [
  { value: 'new', label: 'Mới' },
  { value: 'verifying', label: 'Đang xác minh' },
  { value: 'confirmed', label: 'Đã xác nhận giả' },
  { value: 'rejected', label: 'Đã loại bỏ' },
  { value: 'all', label: 'Tất cả' },
];

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card>
      <div className="text-xs text-text-muted mb-1.5">{label}</div>
      <div className="text-2xl font-semibold font-mono tabular-nums" style={{ color: accent }}>
        {value}
      </div>
    </Card>
  );
}

function ReportDetailModal({
  report,
  onClose,
  onUpdated,
}: {
  report: FraudReportItem;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  async function updateStatus(status: FraudReportStatus) {
    setUpdating(true);
    try {
      await api.patch(`/api/v1/fraud-reports/${report.id}/status`, { status });
      onUpdated();
      onClose();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-canvas-surface border border-canvas-border rounded-xl w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Chi tiết báo cáo</h3>
          <StatusBadge status={report.status} />
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs text-text-muted mb-1">Sản phẩm</div>
            <div>{report.product_name || 'Chưa xác định (mã không đọc được hoặc không quét)'}</div>
            {report.batch_number && (
              <div className="text-xs text-text-muted font-mono mt-0.5">Lô: {report.batch_number}</div>
            )}
          </div>

          {report.store_name && (
            <div>
              <div className="text-xs text-text-muted mb-1">Điểm bán</div>
              <div>{report.store_name}</div>
            </div>
          )}

          {report.description && (
            <div>
              <div className="text-xs text-text-muted mb-1">Mô tả từ người báo cáo</div>
              <div className="text-text-muted leading-relaxed">{report.description}</div>
            </div>
          )}

          {report.lat && report.lng && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <MapPin size={13} />
              {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
            </div>
          )}

          {report.image_urls.length > 0 && (
            <div>
              <div className="text-xs text-text-muted mb-2">Ảnh đính kèm ({report.image_urls.length})</div>
              <div className="grid grid-cols-3 gap-2">
                {report.image_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-square rounded-lg overflow-hidden border border-canvas-border"
                  >
                    <img src={url} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-6">
          <button
            onClick={() => updateStatus('confirmed')}
            disabled={updating}
            className="flex items-center justify-center gap-1.5 bg-verify-danger/10 border border-verify-danger/30 text-verify-danger text-sm rounded-lg py-2.5 hover:bg-verify-danger/20 transition disabled:opacity-50"
          >
            <CheckCircle2 size={15} /> Xác nhận là hàng giả
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={updating}
            className="flex items-center justify-center gap-1.5 bg-canvas-surface2 border border-canvas-border text-text-muted text-sm rounded-lg py-2.5 hover:text-text transition disabled:opacity-50"
          >
            <XCircle size={15} /> Loại bỏ báo cáo
          </button>
          <button
            onClick={() => updateStatus('verifying')}
            disabled={updating}
            className="col-span-2 flex items-center justify-center gap-1.5 bg-verify-warn/10 border border-verify-warn/30 text-verify-warn text-sm rounded-lg py-2.5 hover:bg-verify-warn/20 transition disabled:opacity-50"
          >
            <Search size={15} /> Đánh dấu đang xác minh
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FraudReports() {
  const [data, setData] = useState<FraudReportListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FraudReportStatus | 'all'>('new');
  const [selected, setSelected] = useState<FraudReportItem | null>(null);

  async function load() {
    setLoading(true);
    try {
      const query = tab === 'all' ? '' : `?status=${tab}`;
      const res = await api.get<FraudReportListResponse>(`/api/v1/fraud-reports${query}`);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Báo cáo hàng giả</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Báo cáo do người tiêu dùng gửi qua trang tra cứu công khai (CU-03)
        </p>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Mới" value={data.statusCounts.new} accent="#3ECFFF" />
          <StatCard label="Đang xác minh" value={data.statusCounts.verifying} accent="#FFB020" />
          <StatCard label="Đã xác nhận giả" value={data.statusCounts.confirmed} accent="#FF4D6D" />
          <StatCard label="Đã loại bỏ" value={data.statusCounts.rejected} accent="#8A95A6" />
        </div>
      )}

      {data && data.categoryCounts.length > 0 && (
        <Card>
          <div className="text-sm font-medium mb-3">Tổng hợp theo loại hàng hóa</div>
          <div className="flex flex-wrap gap-2">
            {data.categoryCounts.map((c) => (
              <span
                key={c.category}
                className="text-xs bg-canvas-surface2 border border-canvas-border rounded-full px-3 py-1.5"
              >
                {c.category} <span className="text-text-muted">({c.count})</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-1 border-b border-canvas-border">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3.5 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.value ? 'border-verify-valid text-text' : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-verify-danger bg-verify-danger/10 border border-verify-danger/30 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Loader2 size={16} className="animate-spin" /> Đang tải...
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="text-sm text-text-muted py-10 text-center">Không có báo cáo nào ở trạng thái này.</div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((r) => (
            <Card key={r.id} glow className="cursor-pointer">
              <div onClick={() => setSelected(r)} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-verify-warn/10 border border-verify-warn/30 flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} className="text-verify-warn" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.product_name || 'Chưa xác định sản phẩm'}</div>
                    <div className="text-xs text-text-muted mt-0.5 truncate">
                      {r.store_name || 'Không rõ điểm bán'} · {new Date(r.created_at).toLocaleDateString('vi-VN')}
                    </div>
                    {r.description && <div className="text-xs text-text-muted mt-1 line-clamp-2">{r.description}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.image_urls.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <ImageIcon size={12} /> {r.image_urls.length}
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && <ReportDetailModal report={selected} onClose={() => setSelected(null)} onUpdated={load} />}
    </div>
  );
}
