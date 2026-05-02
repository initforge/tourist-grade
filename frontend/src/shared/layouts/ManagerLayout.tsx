import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from '@shared/store/useAuthStore';
import { useAppDataStore } from '@shared/store/useAppDataStore';

export function ManagerLayout() {
  const location = useLocation();
  const user = useAuthStore(s => s?.user);
  const isBootstrapping = useAuthStore(s => s?.isBootstrapping);
  const protectedReady = useAppDataStore(s => s?.protectedReady);
  const protectedLoading = useAppDataStore(s => s?.protectedLoading);

  const isActive = (path: string) => location.pathname === path || location?.pathname?.startsWith(path + '/');
  const role = user?.role || 'guest';

  if (isBootstrapping || protectedLoading || !protectedReady) {
    return null;
  }

  if (role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F3F3F3] text-[#2A2421]">
      <aside className="w-64 bg-white border-r border-[#D0C5AF]/40 flex flex-col h-full z-50">
        <div className="p-6 border-b border-[#D0C5AF]/40">
          <h1 className="font-['Noto_Serif'] font-bold text-2xl tracking-tighter text-[#D4AF37]">Travela</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/80 mt-1">Quản lý</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 font-['Inter']">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 px-4 mb-2">Tổng quan</p>
            <Link to="/manager/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/manager/dashboard') ? 'bg-[#D4AF37]/10 !text-[#D4AF37] font-medium' : '!text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}>
              <span className="material-symbols-outlined text-[20px]">dashboard</span> Dashboard
            </Link>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 px-4 mb-2">Kinh doanh</p>
            <div className="space-y-1">
              <Link to="/manager/tour-programs" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/manager/tour-programs') ? 'bg-[#D4AF37]/10 !text-[#D4AF37] font-medium' : '!text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}>
                <span className="material-symbols-outlined text-[20px]">post_add</span> Chương trình Tour
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 px-4 mb-2">Điều hành</p>
            <div className="space-y-1">
              <Link to="/manager/tours" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/manager/tours') ? 'bg-[#D4AF37]/10 !text-[#D4AF37] font-medium' : '!text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}>
                <span className="material-symbols-outlined text-[20px]">tour</span> Quản lý Tour
              </Link>
              <Link to="/manager/voucher-approval" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/manager/voucher-approval') ? 'bg-[#D4AF37]/10 !text-[#D4AF37] font-medium' : '!text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}>
                <span className="material-symbols-outlined text-[20px]">verified</span> Phê duyệt Voucher
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60 px-4 mb-2">Danh mục</p>
            <div className="space-y-1">
              <Link to="/manager/special-days" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive('/manager/special-days') ? 'bg-[#D4AF37]/10 !text-[#D4AF37] font-medium' : '!text-[#D4AF37] hover:bg-[#D4AF37]/10'}`}>
                <span className="material-symbols-outlined text-[20px]">event</span> Ngày đặc biệt
              </Link>
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-[#D0C5AF]/40">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-[#D4AF37]/10 transition-colors !text-[#D4AF37]">
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

