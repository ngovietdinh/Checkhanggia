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
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Loi render trang:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
          <AlertTriangle size={32} className="text-verify-danger mb-4" />
          <h1 className="text-text text-base font-semibold mb-2">Đã có lỗi xảy ra</h1>
          <p className="text-text-muted text-xs mb-1 max-w-sm">{this.state.error.message}</p>
          <pre className="text-text-muted/60 text-[10px] max-w-sm overflow-auto mt-2 text-left bg-canvas-surface p-3 rounded-lg">
            {this.state.error.stack}
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
