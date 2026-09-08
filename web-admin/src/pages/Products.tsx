import { useEffect, useState } from 'react';
import { Plus, Package, Layers, QrCode, Download, X, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import type { Product, ProductBatch, GeneratedCode } from '../lib/types';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-canvas-surface border border-canvas-border rounded-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-canvas-surface2 border border-canvas-border rounded-lg px-3 py-2 text-sm outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors';

function CreateProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/v1/products', { name, categoryCode, warrantyMonths });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Thêm sản phẩm mới" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Tên sản phẩm</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Sữa tắm dưỡng ẩm 500ml" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Mã danh mục</label>
          <input className={inputClass} value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)} placeholder="Ví dụ: CHAM_SOC_CA_NHAN" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Bảo hành (tháng)</label>
          <input
            type="number"
            className={inputClass}
            value={warrantyMonths}
            onChange={(e) => setWarrantyMonths(Number(e.target.value))}
          />
        </div>
        {error && <div className="text-xs text-verify-danger">{error}</div>}
        <button
          onClick={submit}
          disabled={submitting || !name || !categoryCode}
          className="w-full flex items-center justify-center gap-2 bg-verify-valid text-canvas font-semibold text-sm rounded-lg py-2.5 hover:brightness-110 transition disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Tạo sản phẩm
        </button>
      </div>
    </Modal>
  );
}

function CreateBatchModal({
  products,
  onClose,
  onCreated,
}: {
  products: Product[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufactureDate, setManufactureDate] = useState(new Date().toISOString().slice(0, 10));
  const [factoryCode, setFactoryCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/v1/products/batches', { productId, batchNumber, manufactureDate, factoryCode });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Thêm lô sản xuất" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Sản phẩm</label>
          <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Số lô</label>
          <input className={inputClass} value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="LOT-0002" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Ngày sản xuất</label>
          <input type="date" className={inputClass} value={manufactureDate} onChange={(e) => setManufactureDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Mã nhà máy (tùy chọn)</label>
          <input className={inputClass} value={factoryCode} onChange={(e) => setFactoryCode(e.target.value)} placeholder="NM01" />
        </div>
        {error && <div className="text-xs text-verify-danger">{error}</div>}
        <button
          onClick={submit}
          disabled={submitting || !productId || !batchNumber}
          className="w-full flex items-center justify-center gap-2 bg-verify-valid text-canvas font-semibold text-sm rounded-lg py-2.5 hover:brightness-110 transition disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Tạo lô sản xuất
        </button>
      </div>
    </Modal>
  );
}

function GenerateCodesModal({
  batch,
  onClose,
}: {
  batch: ProductBatch;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedCode[] | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ codes: GeneratedCode[] }>('/api/v1/codegen/generate', {
        batchId: batch.id,
        quantity,
      });
      setResult(res.codes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function downloadCsv() {
    if (!result) return;
    const rows = [['public_id', 'secret_code'], ...result.map((c) => [c.publicId, c.secretCode])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes-${batch.batchNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal title={`Sinh mã cho lô ${batch.batchNumber}`} onClose={onClose}>
      {!result ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Số lượng mã cần sinh</label>
            <input
              type="number"
              min={1}
              max={100000}
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Mã phủ cào (secret code) chỉ hiển thị một lần duy nhất ngay sau khi sinh — hệ thống không
            lưu dạng plaintext nên không thể xem lại. Hãy tải file CSV ngay sau khi sinh.
          </p>
          {error && <div className="text-xs text-verify-danger">{error}</div>}
          <button
            onClick={submit}
            disabled={submitting || quantity < 1}
            className="w-full flex items-center justify-center gap-2 bg-verify-valid text-canvas font-semibold text-sm rounded-lg py-2.5 hover:brightness-110 transition disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Sinh mã
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-verify-valid bg-verify-valid/10 border border-verify-valid/30 rounded-lg px-3 py-2">
            Đã sinh thành công {result.length} mã.
          </div>
          <div className="max-h-48 overflow-y-auto border border-canvas-border rounded-lg divide-y divide-canvas-border">
            {result.slice(0, 20).map((c) => (
              <div key={c.publicId} className="px-3 py-2 text-xs font-mono flex justify-between">
                <span className="text-verify-data">{c.publicId}</span>
                <span className="text-text-muted">{c.secretCode}</span>
              </div>
            ))}
            {result.length > 20 && (
              <div className="px-3 py-2 text-xs text-text-muted">... và {result.length - 20} mã khác trong file CSV</div>
            )}
          </div>
          <button
            onClick={downloadCsv}
            className="w-full flex items-center justify-center gap-2 bg-verify-data/10 border border-verify-data/30 text-verify-data font-semibold text-sm rounded-lg py-2.5 hover:bg-verify-data/20 transition"
          >
            <Download size={16} />
            Tải file CSV
          </button>
        </div>
      )}
    </Modal>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [genBatch, setGenBatch] = useState<ProductBatch | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, b] = await Promise.all([
        api.get<Product[]>('/api/v1/products'),
        api.get<ProductBatch[]>('/api/v1/products/batches'),
      ]);
      setProducts(p);
      setBatches(b);
    } catch (e: any) {
      setError(e.message);
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
          <h1 className="text-lg font-semibold">Sản phẩm & Lô sản xuất</h1>
          <p className="text-sm text-text-muted mt-0.5">Quản lý danh mục sản phẩm và sinh mã tem chống giả</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateBatch(true)}
            disabled={products.length === 0}
            className="flex items-center gap-2 border border-canvas-border bg-canvas-surface2 text-sm rounded-lg px-3.5 py-2 hover:border-verify-valid/40 transition disabled:opacity-50"
          >
            <Layers size={15} /> Thêm lô
          </button>
          <button
            onClick={() => setShowCreateProduct(true)}
            className="flex items-center gap-2 bg-verify-valid text-canvas font-semibold text-sm rounded-lg px-3.5 py-2 hover:brightness-110 transition"
          >
            <Plus size={15} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-verify-danger bg-verify-danger/10 border border-verify-danger/30 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Package size={16} className="text-verify-data" />
          <h2 className="text-sm font-medium">Sản phẩm ({products.length})</h2>
        </div>
        {products.length === 0 ? (
          <div className="text-sm text-text-muted py-8 text-center">
            Chưa có sản phẩm nào. Bấm "Thêm sản phẩm" để bắt đầu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-canvas-border">
                  <th className="pb-2 font-normal">Tên sản phẩm</th>
                  <th className="pb-2 font-normal">Danh mục</th>
                  <th className="pb-2 font-normal">Bảo hành</th>
                  <th className="pb-2 font-normal">Nguồn dữ liệu</th>
                  <th className="pb-2 font-normal">Số lô</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-border">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 font-mono text-xs text-text-muted">{p.categoryCode}</td>
                    <td className="py-2.5 text-text-muted">{p.warrantyMonths} tháng</td>
                    <td className="py-2.5">
                      <StatusBadge status={p.dataQualityStatus} />
                    </td>
                    <td className="py-2.5 text-text-muted">{p._count?.batches ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Layers size={16} className="text-verify-valid" />
          <h2 className="text-sm font-medium">Lô sản xuất ({batches.length})</h2>
        </div>
        {batches.length === 0 ? (
          <div className="text-sm text-text-muted py-8 text-center">
            Chưa có lô sản xuất nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-canvas-border">
                  <th className="pb-2 font-normal">Số lô</th>
                  <th className="pb-2 font-normal">Sản phẩm</th>
                  <th className="pb-2 font-normal">Ngày SX</th>
                  <th className="pb-2 font-normal">Số mã đã sinh</th>
                  <th className="pb-2 font-normal"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-border">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 font-mono text-xs">{b.batchNumber}</td>
                    <td className="py-2.5">{b.product?.name}</td>
                    <td className="py-2.5 text-text-muted">{new Date(b.manufactureDate).toLocaleDateString('vi-VN')}</td>
                    <td className="py-2.5 text-text-muted">{b._count?.codes ?? 0}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setGenBatch(b)}
                        className="inline-flex items-center gap-1.5 text-xs text-verify-data hover:underline"
                      >
                        <QrCode size={13} /> Sinh mã
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreateProduct && (
        <CreateProductModal onClose={() => setShowCreateProduct(false)} onCreated={load} />
      )}
      {showCreateBatch && (
        <CreateBatchModal products={products} onClose={() => setShowCreateBatch(false)} onCreated={load} />
      )}
      {genBatch && <GenerateCodesModal batch={genBatch} onClose={() => setGenBatch(null)} />}
    </div>
  );
}
