import { useLocation, useNavigate } from 'react-router-dom';

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location?.state as {
    bookingId?: string;
    bookingCode?: string;
    tourName?: string;
    amount?: number;
  } | null;

  const bookingCode = state?.bookingCode ?? 'BK-000000';
  const tourName = state?.tourName ?? '';
  const amount = state?.amount ?? 0;

  return (
    <div className="w-full bg-[var(--color-background)] min-h-[85vh] flex flex-col items-center justify-center pt-20 pb-32">
      <div className="max-w-xl w-full text-center space-y-8 animate-in zoom-in-95 duration-700 px-6">

        <div className="w-24 h-24 mx-auto rounded-full bg-[var(--color-tertiary)]/10 flex items-center justify-center border border-[var(--color-tertiary)]/20 shadow-sm relative overflow-hidden">
           <div className="absolute inset-0 bg-[var(--color-tertiary)]/5 animate-pulse"></div>
           <span className="material-symbols-outlined text-[48px] text-[var(--color-tertiary)] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
             check_circle
           </span>
        </div>

        <div>
           <h1 className="font-serif text-4xl text-[var(--color-primary)] tracking-tight mb-4">
               Xác Nhận Đặt Chỗ Thành Công
           </h1>
           <div className="w-12 h-px bg-[var(--color-secondary)] mx-auto mb-6"></div>

           <p className="text-[var(--color-primary)]/80 text-[15px] leading-relaxed max-w-md mx-auto">
             Cảm ơn quá khách đã lựa chọn Travela?. Hệ thống đã ghi nhận đơn đặt chỗ và sẽ gửi email xác nhận chi tiết trong vòng 5 phút?.
           </p>
           {tourName && (
             <p className="text-sm text-[var(--color-primary)]/60 mt-2 font-serif italic">
               {tourName}
             </p>
           )}
        </div>

        {bookingCode && (
           <div className="bg-white border border-[#D0C5AF]/40 p-6 mx-auto max-w-sm flex items-center justify-between shadow-sm">
              <div className="text-left">
                 <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block mb-1">Mã Đơn Đặt Chỗ</span>
                 <span className="font-serif text-xl tracking-widest text-[var(--color-primary)]">{bookingCode}</span>
              </div>
              <button
                onClick={() => navigator?.clipboard?.writeText(bookingCode)}
                className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
                title="Sao cháp mã"
              >
                 <span className="material-symbols-outlined">content_copy</span>
              </button>
           </div>
        )}

        <div className="bg-[var(--color-surface)] border border-[#D0C5AF]/30 p-5 mx-auto max-w-sm w-full text-center">
          <p className="text-xs text-primary/60">
            Thanh toán: <strong className="text-primary">{amount > 0 ? `${amount?.toLocaleString('vi-VN')}đ` : 'Chưa thanh toán'}</strong>
          </p>
          <p className="text-[10px] text-primary/30 mt-1">Email xác nhận sẽ gửi trong 5 phút</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
           <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] font-sans uppercase tracking-widest text-xs hover:bg-[var(--color-surface)] transition-colors w-full sm:w-auto"
           >
              Về Trang Chủ
           </button>
           <button
              onClick={() => navigate(`/customer/bookings/${state?.bookingId ?? ''}`)}
              className="px-8 py-4 bg-[var(--color-primary)] text-white font-sans uppercase tracking-widest text-xs hover:bg-[var(--color-secondary)] transition-colors w-full sm:w-auto shadow-sm"
           >
              Xem Đơn Của Qu? Khách
           </button>
        </div>
      </div>
    </div>
  );
}
