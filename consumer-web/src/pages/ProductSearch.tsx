import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Package,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { SearchResponse, SuggestItem } from '../lib/types';

const DEBOUNCE_MS = 300;

export default function ProductSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SearchResponse | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLFormElement | null>(null);

  // Dong dropdown khi bam ra ngoai
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Goi y tu dong khi go phim - debounce 300ms + huy request cu de tranh
  // ket qua den sau "de len" ket qua den truoc (race condition khi go nhanh)
  function handleQueryChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setSuggestLoading(true);
      try {
        const results = await api.get<SuggestItem[]>(
          `/api/v1/search/suggest?q=${encodeURIComponent(trimmed)}`,
          controller.signal,
        );
        setSuggestions(results);
        setShowDropdown(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Loi goi y khong nghiem trong - im lang bo qua, khong lam gian doan go phim cua nguoi dung
        }
      } finally {
        setSuggestLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  async function runSearch(q: string) {
    if (q.trim().length < 2) return;
    setShowDropdown(false);
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await api.get<SearchResponse>(`/api/v1/search/products?q=${encodeURIComponent(q.trim())}`);
      setResponse(res);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  function handleSelectSuggestion(item: SuggestItem) {
    setQuery(item.label);
    runSearch(item.label);
  }

  const hasCounterfeitAlerts = (response?.counterfeitAlerts.length ?? 0) > 0;
  const hasLegitimateMatches = (response?.legitimateMatches.length ?? 0) > 0;
  const hasNoResultsAtAll = response && !hasCounterfeitAlerts && !hasLegitimateMatches;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="px-5 pt-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>

      <div className="flex-1 px-5 pb-10 pt-4 max-w-md mx-auto w-full">
        <h1 className="text-lg font-semibold">Tra cứu nhanh</h1>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">
          Gõ tên sản phẩm, số lô, mã ĐKSP, hoặc tên doanh nghiệp — không cần nhớ chính xác, không cần quét QR.
        </p>

        <div className="mt-4 flex gap-2.5 bg-verify-warn/10 border border-verify-warn/30 rounded-xl px-3.5 py-3">
          <HelpCircle size={16} className="text-verify-warn shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            Kết quả "sản phẩm có đăng ký" chỉ xác nhận thông tin này{' '}
            <span className="text-text">có tồn tại trong hệ thống</span> — không xác thực được chính món hàng
            bạn đang cầm. Để chắc chắn nhất, hãy quét mã QR trên tem.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 relative" ref={containerRef}>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => query.trim().length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
              placeholder="Tìm theo tên, số lô, mã ĐKSP, doanh nghiệp..."
              autoComplete="off"
              className="w-full bg-canvas-surface2 border border-canvas-border rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            {suggestLoading && (
              <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted animate-spin" />
            )}
          </div>

          {/* Dropdown goi y - tu dong khi go, chon 1 dong se chay tim kiem day du ngay */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1.5 w-full bg-canvas-surface border border-canvas-border rounded-xl overflow-hidden shadow-lg max-h-72 overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-canvas-surface2 transition-colors border-b border-canvas-border last:border-0"
                >
                  {s.type === 'counterfeit' ? (
                    <ShieldAlert size={15} className="text-verify-danger shrink-0" />
                  ) : (
                    <Package size={15} className="text-verify-data shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm text-text truncate">{s.label}</div>
                    <div className="text-xs text-text-muted truncate">{s.sublabel}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-verify-data text-canvas font-semibold rounded-lg py-3 hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Tra cứu
          </button>
        </form>

        {error && <div className="text-xs text-verify-danger mt-3">{error}</div>}

        {response && (
          <div className="mt-6 space-y-6">
            {hasCounterfeitAlerts && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={16} className="text-verify-danger" />
                  <h2 className="text-sm font-semibold text-verify-danger">
                    Đã xác nhận là hàng giả/vi phạm ({response.counterfeitAlerts.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {response.counterfeitAlerts.map((c, i) => (
                    <div key={i} className="bg-verify-danger/10 border border-verify-danger/30 rounded-xl p-4">
                      <div className="text-sm font-semibold text-text">{c.productName}</div>
                      {c.productType && <div className="text-xs text-text-muted mt-0.5">{c.productType}</div>}
                      {c.registrationNumber && (
                        <div className="text-xs font-mono text-text-muted mt-1">Mã ĐKSP: {c.registrationNumber}</div>
                      )}
                      {c.violatingBatches.length > 0 && (
                        <div className="text-xs text-text-muted mt-1">
                          Lô vi phạm: <span className="font-mono">{c.violatingBatches.join(', ')}</span>
                        </div>
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

            {hasLegitimateMatches && (
              <div>
                <h2 className="text-sm font-medium text-text-muted mb-3">
                  Sản phẩm có đăng ký ({response.legitimateMatches.length})
                </h2>
                <div className="space-y-3">
                  {response.legitimateMatches.map((r, i) => (
                    <div key={i} className="bg-canvas-surface border border-canvas-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{r.productName}</div>
                          <div className="text-xs text-text-muted font-mono mt-0.5">Lô: {r.batchNumber}</div>
                          <div className="text-xs text-text-muted mt-1">{r.enterpriseName}</div>
                        </div>
                        {r.matchType === 'exact' ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-verify-valid/10 border border-verify-valid/30 text-verify-valid">
                            <CheckCircle2 size={12} /> Khớp chính xác
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-verify-warn/10 border border-verify-warn/30 text-verify-warn">
                            <AlertTriangle size={12} /> Gần đúng ({Math.round(r.score * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasNoResultsAtAll && (
              <div className="flex flex-col items-center text-center py-10">
                <AlertTriangle size={26} className="text-verify-warn mb-3" />
                <p className="text-sm text-text">Không tìm thấy kết quả nào khớp</p>
                <p className="text-xs text-text-muted mt-1">
                  Chưa nằm trong danh sách đăng ký lẫn danh sách vi phạm — hãy thận trọng và ưu tiên quét QR nếu
                  có tem.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
