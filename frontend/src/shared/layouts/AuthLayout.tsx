import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="bg-[#F9F6F0] p-8 flex items-center justify-center relative z-10">
        <Outlet />
      </div>
      <div className="hidden md:block relative bg-[#1A1512] overflow-hidden">
        <img
          src="/login_hero.png"
          alt="Travela - Giới thiệu hệ thống"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1512]/80 via-transparent to-transparent flex items-end p-16">
          <div className="text-[#D0C5AF] max-w-lg mb-10">
            <h2 className="font-serif text-4xl mb-6 text-[#E8E1D5] leading-snug">Hệ thống Quản trị<br />Điều hành Travela</h2>
            <p className="font-sans text-sm tracking-wide opacity-80 leading-relaxed">
              Nền tảng quản lý và vận hành tour du lịch chuyên nghiệp, bảo mật cao. Được thiết kế tối ưu hóa luồng công việc cho đội ngũ nhân sự và quản lý của Travela.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
