import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from '../../store/useAuthStore';

export function AdminLayout() {
  const location = useLocation();
  const user = useAuthStore(s => s.user);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const role = user?.role || 'guest';
  
  // Only Admin can access /admin
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] text-[#2A2421]">
      <aside className="w-64 bg-white border-r border-[#D0C5AF]/40 flex flex-col h-full z-50">
        <div className="p-6 border-b border-[#D0C5AF]/40">
          <h1 className="font-['Noto_Serif'] font-bold text-2xl tracking-tighter text-[#D4AF37]">Travela</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-1">Quản trị hệ thống</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 font-['Inter']">
          <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/40 px-4 mb-2">Cấu hình</p>
          <Link to="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/admin/users') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50'}`}>
            <span className="material-symbols-outlined text-[20px]">group</span> Quản lý Người dùng
          </Link>
        </nav>
        <div className="p-4 border-t border-[#D0C5AF]/40">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-gray-50 transition-colors text-red-600">
            <span className="material-symbols-outlined text-[20px]">logout</span> Về Trang Chủ
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
    </div>
  ); 
}