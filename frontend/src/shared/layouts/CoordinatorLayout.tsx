import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from '@shared/store/useAuthStore';

export function CoordinatorLayout() {
  const location = useLocation();
  const user = useAuthStore(s => s?.user);

  const isActive = (path: string) => location.pathname === path || location?.pathname?.startsWith(path + '/');
  const role = user?.role || 'guest';

  if (role !== 'coordinator') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] text-[#2A2421]">
      <aside className="w-64 bg-white border-r border-[#D0C5AF]/40 flex flex-col h-full z-50">
        <div className="p-6 border-b border-[#D0C5AF]/40">
          <h1 className="font-['Noto_Serif'] font-bold text-2xl tracking-tighter text-[#D4AF37]">Travela</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-1">Điều phối viên</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 font-['Inter']">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/40 px-4 mb-2">Tổng quan</p>
            <Link to="/coordinator/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/coordinator/dashboard') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50'}`}>
              <span className="material-symbols-outlined text-[20px]">dashboard</span> Dashboard
            </Link>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/40 px-4 mb-2">Điều hành</p>
            <div className="space-y-1">
              <Link to="/coordinator/tour-rules" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/coordinator/tour-rules') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span> Quản lý Tour
              </Link>
              <Link to="/coordinator/tour-programs" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/coordinator/tour-programs') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">post_add</span> Chương trình Tour
              </Link>
              <Link to="/coordinator/tours" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/coordinator/tours') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">tour</span> Điều hành Tour
              </Link>
              <Link to="/coordinator/services" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/coordinator/services') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">room_service</span> Kho Dịch vụ
              </Link>
              <Link to="/coordinator/suppliers" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/coordinator/suppliers') ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' : 'hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[20px]">handshake</span> Đối tác (NCC)
              </Link>
            </div>
          </div>
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

