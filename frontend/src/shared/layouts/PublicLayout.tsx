import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { createLocalAvatar } from '@entities/user/data/users';
import { useAuthStore } from '@shared/store/useAuthStore';

const roleRedirects: Record<string, string> = {
  admin: '/admin',
  manager: '/manager',
  coordinator: '/coordinator',
  sales: '/sales',
  customer: '/',
};

export function PublicLayout() {
  const user = useAuthStore(s => s?.user);
  const isAuthenticated = useAuthStore(s => s?.isAuthenticated);
  const logout = useAuthStore(s => s?.logout);
  const navigate = useNavigate();
  const avatarSrc = user?.avatar || createLocalAvatar(user?.name || 'Travela');
  const showLookup = !isAuthenticated || user?.role !== 'customer';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col public-page">
      <div className="hidden md:flex bg-[var(--color-primary)] text-white text-xs py-2 px-8 justify-between items-center">
        <div className="flex gap-6">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">call</span>
            Hotline: 1900 1234
          </span>
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            Email: booking@travela.vn
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="font-sans uppercase tracking-widest font-bold text-[10px] opacity-80 border-r border-white/20 pr-4">
            Tiếng Việt
          </span>
          {isAuthenticated && (
            <span className="text-[var(--color-secondary)]">Xin chào, {user?.name} ({user?.role})</span>
          )}
        </div>
      </div>

      <div className="md:hidden bg-[var(--color-primary)] text-white/80 text-[11px]">
        <div className="public-container py-2 flex items-center justify-between gap-3">
          <span className="truncate">Hotline: 1900 1234</span>
          <span className="uppercase tracking-[0.18em] text-[10px] text-white/60">VN</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--color-surface)] shadow-sm">
        <div className="public-container min-h-[72px] md:h-20 py-3 md:py-0 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl md:text-2xl font-serif font-semibold tracking-tighter text-[var(--color-tertiary)] flex items-center gap-2 shrink-0">
            <svg className="w-7 h-7 md:w-8 md:h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2zm0 3.8L18.4 19H5.6L12 5.8z" />
            </svg>
            TRAVELA
          </Link>

          <nav className="hidden md:flex gap-6 lg:gap-8 text-[var(--color-primary)] font-medium text-sm">
            <Link to="/tours" className="hover:text-[var(--color-tertiary)] transition-colors">Tour Nội Địa</Link>
            <Link to="/about" className="hover:text-[var(--color-tertiary)] transition-colors">Về Chúng Tôi</Link>
            <Link to="/blog" className="hover:text-[var(--color-tertiary)] transition-colors">Cẩm Nang</Link>
            {showLookup && (
              <Link to="/booking/lookup" className="hover:text-[var(--color-secondary)] transition-colors font-semibold">Tra Cứu Đã Đặt</Link>
            )}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="px-4 md:px-5 py-2.5 rounded-full border border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-medium hover:bg-[var(--color-primary)] hover:text-white transition-all whitespace-nowrap"
              >
                Đăng Nhập
              </Link>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                {user?.role !== 'customer' && (
                  <Link to={roleRedirects[user?.role || 'admin']} className="hidden lg:inline text-sm font-medium text-[var(--color-tertiary)] hover:underline whitespace-nowrap">
                    Vào Trang Quản Trị →
                  </Link>
                )}
                {user?.role === 'customer' && (
                  <div className="hidden md:flex items-center gap-4 border-r border-[#D0C5AF]/40 pr-4 mr-2">
                    <Link to="/customer/bookings" className="text-sm font-medium hover:text-[var(--color-tertiary)] transition-colors whitespace-nowrap">Lịch sử Tour</Link>
                    <Link to="/customer/wishlist" className="text-sm font-medium hover:text-[var(--color-tertiary)] transition-colors whitespace-nowrap">Yêu thích</Link>
                    <Link to="/customer/profile" className="text-sm font-medium hover:text-[var(--color-tertiary)] transition-colors whitespace-nowrap">Tài khoản</Link>
                  </div>
                )}
                <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-700 whitespace-nowrap">
                  Đăng Xuất
                </button>
                <img src={avatarSrc} alt="avatar" className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[var(--color-surface)] bg-gray-100 shrink-0" />
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden border-t border-[var(--color-surface)] bg-white/95">
          <div className="public-container overflow-x-auto">
            <nav className="flex items-center gap-5 min-w-max py-3 text-[13px] font-medium text-[var(--color-primary)]">
              <Link to="/tours" className="whitespace-nowrap hover:text-[var(--color-tertiary)] transition-colors">Tour Nội Địa</Link>
              <Link to="/about" className="whitespace-nowrap hover:text-[var(--color-tertiary)] transition-colors">Về Chúng Tôi</Link>
              <Link to="/blog" className="whitespace-nowrap hover:text-[var(--color-tertiary)] transition-colors">Cẩm Nang</Link>
              {showLookup && (
                <Link to="/booking/lookup" className="whitespace-nowrap hover:text-[var(--color-secondary)] transition-colors">Tra Cứu</Link>
              )}
              {user?.role === 'customer' && (
                <>
                  <Link to="/customer/bookings" className="whitespace-nowrap hover:text-[var(--color-tertiary)] transition-colors">Lịch sử</Link>
                  <Link to="/customer/wishlist" className="whitespace-nowrap hover:text-[var(--color-tertiary)] transition-colors">Yêu thích</Link>
                  <Link to="/customer/profile" className="whitespace-nowrap hover:text-[var(--color-tertiary)] transition-colors">Tài khoản</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <footer className="bg-[var(--color-primary)] text-white/70 py-16">
        <div className="public-container grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-[var(--color-secondary)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h20L12 2zm0 3.8L18.4 19H5.6L12 5.8z" />
              </svg>
              TRAVELA
            </h3>
            <p className="text-sm leading-relaxed text-white/60">
              Chuyên các hành trình du lịch trong nước với lịch trình rõ ràng, giao diện gọn gàng và trải nghiệm đặt tour dễ theo dõi.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Về Chúng Tôi</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">Câu chuyện thương hiệu</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Cam kết chất lượng</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Tuyển dụng</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm">
              {showLookup && (
                <li><Link to="/booking/lookup" className="hover:text-[var(--color-secondary)] transition-colors">Tra cứu hóa đơn</Link></li>
              )}
              <li><Link to="/about" className="hover:text-white transition-colors">Chính sách hủy đổi</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Bảo mật thông tin</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Chứng Nhận</h4>
            <div className="flex gap-4 opacity-50">
              <div className="w-16 h-8 border border-white/20 flex items-center justify-center text-[10px]">VN-Pay</div>
              <div className="w-16 h-8 border border-white/20 flex items-center justify-center text-[10px]">IATA</div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-xs text-white/40">
          © 2026 Travela Luxury. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

