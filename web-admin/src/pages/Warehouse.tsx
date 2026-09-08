import { useEffect, useState } from 'react';
import { Plus, Truck, X, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import { api } from '../lib/api';
import type { WarehouseExport, ProductBatch } from '../lib/types';

const inputClass =
  'w-full bg-canvas-surface2 border border-canvas-border rounded-lg px-3 py-2 text-sm outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors';

function CreateExportModal({
  batches,
  onClose,
  onCreated,
}: {
  batches: ProductBatch[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [destinationRegion, setDestinationRegion] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [cartonQuantity, setCartonQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/v1/warehouse-exports', { batchId, destinationRegion, agencyName, cartonQuantity });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-canvas-surface border border-canvas-border rounded-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Ghi nhận xuất kho</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Lô sản xuất</label>
            <select className={inputClass} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} — {b.product?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Vùng đích</label>
            <input
              className={inputClass}
              value={destinationRegion}
              onChange={(e) => setDestinationRegion(e.target.value)}
              placeholder="Ví dụ: Hà Nội, Đà Nẵng..."
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Tên đại lý</label>
            <input className={inputClass} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Đại lý ABC" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Số lượng thùng</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={cartonQuantity}
              onChange={(e) => setCartonQuantity(Number(e.target.value))}
            />
          </div>
          {error && <div className="text-xs text-verify-danger">{error}</div>}
          <button
            onClick={submit}
            disabled={submitting || !batchId || !destinationRegion || !agencyName}
            className="w-full flex items-center justify-center gap-2 bg-verify-valid text-canvas font-semibold text-sm rounded-lg py-2.5 hover:brightness-110 transition disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Ghi nhận xuất kho
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Warehouse() {
  const [exports, setExports] = useState<WarehouseExport[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [e, b] = await Promise.all([
        api.get<WarehouseExport[]>('/api/v1/warehouse-exports'),
        api.get<ProductBatch[]>('/api/v1/products/batches'),
      ]);
      setExports(e);
      setBatches(b);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <Loader2 size={16} className="animate-spin" /> Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Quản lý xuất kho</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Ghi nhận thùng hàng xuất đi từng vùng/đại lý — dữ liệu này đối chiếu với lượt quét thực tế để phát hiện bất thường (mục 4.4 SRS)
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={batches.length === 0}
          className="flex items-center gap-2 bg-verify-valid text-canvas font-semibold text-sm rounded-lg px-3.5 py-2 hover:brightness-110 transition disabled:opacity-50"
        >
          <Plus size={15} /> Ghi nhận xuất kho
        </button>
      </div>

      {error && (
        <div className="text-sm text-verify-danger bg-verify-danger/10 border border-verify-danger/30 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Truck size={16} className="text-verify-valid" />
          <h2 className="text-sm font-medium">Lịch sử xuất kho ({exports.length})</h2>
        </div>
        {exports.length === 0 ? (
          <div className="text-sm text-text-muted py-8 text-center">
            {batches.length === 0
              ? 'Cần tạo lô sản xuất trước khi ghi nhận xuất kho.'
              : 'Chưa có bản ghi xuất kho nào.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-canvas-border">
                  <th className="pb-2 font-normal">Lô</th>
                  <th className="pb-2 font-normal">Sản phẩm</th>
                  <th className="pb-2 font-normal">Vùng đích</th>
                  <th className="pb-2 font-normal">Đại lý</th>
                  <th className="pb-2 font-normal">Số thùng</th>
                  <th className="pb-2 font-normal">Ngày xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-border">
                {exports.map((ex) => (
                  <tr key={ex.id}>
                    <td className="py-2.5 font-mono text-xs">{ex.batch?.batchNumber}</td>
                    <td className="py-2.5">{ex.batch?.product?.name}</td>
                    <td className="py-2.5">{ex.destinationRegion}</td>
                    <td className="py-2.5 text-text-muted">{ex.agencyName}</td>
                    <td className="py-2.5 font-mono">{ex.cartonQuantity}</td>
                    <td className="py-2.5 text-text-muted">{new Date(ex.exportedAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreate && <CreateExportModal batches={batches} onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}
