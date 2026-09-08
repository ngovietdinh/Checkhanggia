import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Truck, LogOut, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Sản phẩm & Lô', icon: Package, end: false },
  { to: '/warehouse', label: 'Xuất kho', icon: Truck, end: false },
  { to: '/fraud-reports', label: 'Báo cáo hàng giả', icon: AlertTriangle, end: false },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-canvas text-text">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-canvas-border bg-canvas-surface flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-canvas-border">
          <div className="h-8 w-8 rounded-md bg-verify-valid/10 border border-verify-valid/30 flex items-center justify-center">
            <ShieldCheck size={18} className="text-verify-valid" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Anti-Fake Admin</div>
            <div className="text-[11px] text-text-muted">Doanh nghiệp</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-verify-valid/10 text-verify-valid border border-verify-valid/25'
                    : 'text-text-muted hover:text-text hover:bg-canvas-surface2 border border-transparent'
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-canvas-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-verify-danger hover:bg-verify-danger/10 transition-colors"
          >
            <LogOut size={17} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-canvas-border flex items-center justify-between px-6">
          <div className="text-sm text-text-muted">Xin chào,</div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">{user?.fullName || user?.email}</div>
              <div className="text-[11px] text-text-muted">
                {user?.role === 'ENTERPRISE_ADMIN' ? 'Quản trị viên doanh nghiệp' : 'Nhân viên doanh nghiệp'}
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-canvas-surface2 border border-canvas-border flex items-center justify-center text-sm font-semibold text-verify-data">
              {(user?.fullName || user?.email || '?').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
