import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.vn');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // loi da duoc AuthContext luu vao `error`, hien thi ben duoi form
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 relative overflow-hidden">
      {/* Diem nhan hinh anh: luoi ky thuat mo nhat lam nen, goi lien tuong "quet xac thuc" */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#3ECFFF 1px, transparent 1px), linear-gradient(90deg, #3ECFFF 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-verify-valid/10 blur-3xl" />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-verify-valid/10 border border-verify-valid/30 flex items-center justify-center mb-4">
            <ShieldCheck size={24} className="text-verify-valid" />
          </div>
          <h1 className="text-lg font-semibold text-text">Anti-Fake Admin</h1>
          <p className="text-sm text-text-muted mt-1">Đăng nhập vào tài khoản doanh nghiệp</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-canvas-surface border border-canvas-border rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-canvas-surface2 border border-canvas-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors"
              placeholder="ban@doanhnghiep.vn"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-canvas-surface2 border border-canvas-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-verify-valid/50 focus:ring-1 focus:ring-verify-valid/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs text-verify-danger bg-verify-danger/10 border border-verify-danger/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-verify-valid text-canvas font-semibold text-sm rounded-lg py-2.5 hover:brightness-110 transition disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Đăng nhập
          </button>
        </form>

        <p className="text-center text-xs text-text-muted mt-5">
          Tài khoản demo: <span className="font-mono text-text">admin@demo.vn</span> — mật khẩu tạo bởi{' '}
          <span className="font-mono text-text">npm run seed</span>
        </p>
      </div>
    </div>
  );
}
