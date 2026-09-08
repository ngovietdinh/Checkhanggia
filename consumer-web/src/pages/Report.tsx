import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, CheckCircle2, Loader2, X } from 'lucide-react';
import { api } from '../lib/api';

const MAX_IMAGES = 4;

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const publicId = searchParams.get('publicId') || '';

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    requestLocation();
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) return;
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos);
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { timeout: 5000 },
    );
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files].slice(0, MAX_IMAGES));
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))].slice(0, MAX_IMAGES));
    e.target.value = '';
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      if (publicId) formData.append('publicId', publicId);
      if (storeName) formData.append('storeName', storeName);
      if (description) formData.append('description', description);
      if (position) {
        formData.append('lat', String(position.coords.latitude));
        formData.append('lng', String(position.coords.longitude));
      }
      images.forEach((img) => formData.append('images', img));

      await api.postForm('/api/v1/fraud-reports', formData);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
        <div className="h-20 w-20 rounded-full bg-verify-valid/10 border border-verify-valid/30 flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-verify-valid" />
        </div>
        <h1 className="text-xl font-bold">Đã gửi báo cáo</h1>
        <p className="text-sm text-text-muted mt-2 max-w-xs leading-relaxed">
          Cảm ơn bạn đã đóng góp. Đội ngũ kiểm tra sẽ xem xét báo cáo này.
        </p>
        <Link
          to="/"
          className="mt-8 w-full max-w-xs text-center bg-canvas-surface border border-canvas-border rounded-xl py-3.5 text-sm hover:border-verify-data/40 transition"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="px-5 pt-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      <div className="flex-1 px-5 pb-10 pt-4 max-w-md mx-auto w-full">
        <h1 className="text-lg font-semibold">Báo cáo hàng giả</h1>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">
          Cung cấp thông tin càng chi tiết, đội ngũ xử lý càng nhanh và chính xác.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs text-text-muted mb-2">
              Ảnh tem & sản phẩm ({images.length}/{MAX_IMAGES})
            </label>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-canvas-border">
                  <img src={src} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-canvas/80 rounded-full p-0.5 text-text hover:text-verify-danger"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="aspect-square rounded-lg border border-dashed border-canvas-border flex items-center justify-center cursor-pointer hover:border-verify-data/40 transition">
                  <Camera size={20} className="text-text-muted" />
                  <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
            <p className="text-[11px] text-text-muted mt-1.5">Nên chụp cả mặt tem và tổng thể sản phẩm</p>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Tên điểm bán (nếu có)</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ví dụ: Cửa hàng ABC, Q.1"
              className="w-full bg-canvas-surface2 border border-canvas-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Mô tả thêm</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Điều gì khiến bạn nghi ngờ đây là hàng giả?"
              className="w-full bg-canvas-surface2 border border-canvas-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted">
            <MapPin size={14} className={locationStatus === 'granted' ? 'text-verify-valid' : 'text-text-muted'} />
            {locationStatus === 'loading' && 'Đang lấy vị trí...'}
            {locationStatus === 'granted' && 'Đã đính kèm vị trí hiện tại'}
            {locationStatus === 'denied' && 'Chưa có vị trí — bạn vẫn có thể gửi báo cáo'}
            {locationStatus === 'idle' && 'Vị trí sẽ được đính kèm nếu bạn cho phép'}
          </div>

          {error && <div className="text-xs text-verify-danger">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-verify-danger text-canvas font-semibold rounded-xl py-3.5 hover:brightness-110 transition disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Gửi báo cáo
          </button>
        </form>
      </div>
    </div>
  );
}
