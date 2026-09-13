import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Bat loi render cua React - neu khong co lop nay, 1 loi JS trong bat ky
 * trang nao se lam toan bo app "sap" thanh man hinh trang/den (vi nen toan
 * cuc la mau toi #0A0E14), rat kho chan doan tu xa. Hien thi ro thong bao
 * loi + nut tai lai thay vi de trong.
 *
 * QUAN TRONG: React co the "catch" ca gia tri KHONG PHAI Error thuc su (vi
 * du ai do vo tinh `throw 'chuoi loi'` hoac `throw {...}` thay vi
 * `throw new Error(...)`) - luc do error.message/error.stack se undefined,
 * hien ra trong rong nhu da gap phai. Ham chuan hoa duoi day ep MOI gia tri
 * bi throw ve dang Error that su de luon co message doc duoc.
 */
function normalizeError(value: unknown): Error {
  if (value instanceof Error) return value;
  try {
    return new Error(typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: normalizeError(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const normalized = normalizeError(error);
    // eslint-disable-next-line no-console
    console.error('Loi render trang:', normalized, info);
    // Hien ngay bang alert() - khong can may tinh/DevTools/cap USB gi ca,
    // doc duoc thang tren man hinh dien thoai ngay lap tuc.
    window.alert(
      `LOI: ${normalized.message}\n\nVi tri:\n${info.componentStack?.slice(0, 500) || '(khong co)'}`,
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
          <AlertTriangle size={32} className="text-verify-danger mb-4" />
          <h1 className="text-text text-base font-semibold mb-2">Đã có lỗi xảy ra</h1>
          <p className="text-text-muted text-xs mb-1 max-w-sm break-words">
            {this.state.error.message || '(không có thông báo lỗi cụ thể)'}
          </p>
          <pre className="text-text-muted/60 text-[10px] max-w-sm overflow-auto mt-2 text-left bg-canvas-surface p-3 rounded-lg whitespace-pre-wrap break-words">
            {this.state.error.stack || '(không có stack trace)'}
          </pre>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-5 bg-verify-valid text-canvas font-semibold rounded-lg px-5 py-2.5 text-sm"
          >
            Về trang chủ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
