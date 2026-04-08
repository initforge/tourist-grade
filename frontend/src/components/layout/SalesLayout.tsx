import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

export function SalesLayout() {
  const location = useLocation();
  const user = useAuthStore(s => s.user);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const role = user?.role || 'guest';

  if (role !== 'sales') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] text-[#2A2421]">
      <aside className={`bg-white border-r border-[#D0C5AF]/40 flex flex-col h-full z-50 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className={`p-4 border-b border-[#D0C5AF]/40 flex items-center justify-between ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <div>
              <h1 className="font-['Noto_Serif'] font-bold text-xl tracking-tighter text-[#D4AF37]">Travela</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-0.5">NV Kinh doanh</p>
            </div>
          )}
          {collapsed && (
            <h1 className="font-['Noto_Serif'] font-bold text-xl tracking-tighter text-[#D4AF37]">T</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-[#2A2421]/50 hover:text-[#D4AF37]"
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {collapsed ? 'chevron_right' : 'menu_open'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 font-['Inter']">
          <div className="space-y-1">
            <Link
              to="/sales/dashboard"
              title="Dashboard"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${isActive('/sales/dashboard') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50 text-[#2A2421]/70'}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">dashboard</span>
              {!collapsed && <span>Dashboard</span>}
            </Link>

            <Link
              to="/sales/bookings"
              title="Quản lý Booking"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${isActive('/sales/bookings') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50 text-[#2A2421]/70'}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">receipt_long</span>
              {!collapsed && <span>Quản lý Booking</span>}
            </Link>

            <Link
              to="/sales/vouchers"
              title="Quản lý Voucher"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${isActive('/sales/vouchers') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50 text-[#2A2421]/70'}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">sell</span>
              {!collapsed && <span>Quản lý Voucher</span>}
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-[#D0C5AF]/40">
          <Link
            to="/"
            title="Về Trang Chủ"
            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors text-red-500 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            {!collapsed && <span>Về Trang Chủ</span>}
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
    </div>
  );
}
