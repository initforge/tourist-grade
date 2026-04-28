import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRequireAuth } from '@shared/hooks/useAuthGuard';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { CancelBookingModal } from '@shared/ui/CancelBookingModal';
import { TourReviewModal } from '@shared/ui/TourReviewModal';
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  canCustomerPay,
  formatCurrency,
  REFUND_STATUS_LABEL,
} from '@shared/lib/booking';
import { createBookingPaymentLink } from '@shared/lib/api/bookings';
import { useAuthStore } from '@shared/store/useAuthStore';

export default function BookingDetail() {
  useRequireAuth('/login?redirect=/customer/bookings');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const bookings = useAppDataStore((state) => state.bookings);
  const publicTours = useAppDataStore((state) => state.publicTours);
  const booking = bookings.find((item) => item.id === id);
  const tour = publicTours.find((item) => item.id === booking?.tourId);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  if (!booking) {
    return (
      <div className="w-full bg-[var(--color-background)] min-h-screen pt-16 pb-32 flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Không tìm thấy đơn booking</p>
          <button onClick={() => navigate('/customer/bookings')} className="text-[#D4AF37] hover:underline text-sm">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    setIsPaying(true);

    try {
      const response = await createBookingPaymentLink(booking.id, accessToken);
      const checkoutUrl = response.paymentLink.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="w-full bg-[var(--color-background)]">
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-32">
        <button
          onClick={() => navigate('/customer/bookings')}
          className="flex items-center gap-2 text-sm text-[var(--color-primary)] opacity-70 hover:opacity-100 transition-opacity mb-8 font-sans"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Lịch sử đặt tour
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-serif text-3xl text-[var(--color-primary)] tracking-tight mb-2">Chi tiết đơn đặt chỗ</h1>
            <p className="text-sm font-sans tracking-widest text-[var(--color-secondary)] uppercase">{booking.bookingCode}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-2 border text-sm font-medium bg-amber-50 text-amber-700 border-amber-300">
              {BOOKING_STATUS_LABEL[booking.status]}
            </span>
            <span className="px-4 py-2 border text-sm font-medium bg-sky-50 text-sky-700 border-sky-300">
              {PAYMENT_STATUS_LABEL[booking.paymentStatus]}
            </span>
            {booking.status === 'cancelled' && (
              <span className="px-4 py-2 border text-sm font-medium bg-rose-50 text-rose-700 border-rose-300">
                {REFUND_STATUS_LABEL[booking.refundStatus]}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
              <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5">Thông tin hành trình</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[var(--color-primary)] leading-snug">{booking.tourName}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--color-surface)]">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 mb-1">Khởi hành</p>
                    <p className="text-xs font-medium text-primary">{new Date(booking.tourDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 mb-1">Thời lượng</p>
                    <p className="text-xs font-medium text-primary">{booking.tourDuration}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 mb-1">Hành khách</p>
                    <p className="text-xs font-medium text-primary">{booking.passengers.length} người</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 mb-1">Mã tour</p>
                    <p className="text-xs font-medium text-primary">{`${booking.programCode ?? booking.tourId} - ${booking.instanceCode ?? ''}`}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
              <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5">Thông tin liên hệ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Người đặt</p>
                  <p className="text-sm font-medium text-primary">{booking.contactInfo.name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Điện thoại</p>
                  <p className="text-sm font-medium text-primary">{booking.contactInfo.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Email</p>
                  <p className="text-sm font-medium text-primary">{booking.contactInfo.email}</p>
                </div>
              </div>
            </section>

            <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
              <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5">Danh sách hành khách</h2>
              <div className="space-y-0 divide-y divide-[var(--color-surface)]">
                {booking.passengers.map((passenger, index) => (
                  <div key={`${passenger.name}-${index}`} className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-primary text-sm">{passenger.name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-primary/50">
                        <span>{passenger.type}</span>
                        <span>{passenger.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                        <span>{passenger.dob || 'Chưa cập nhật'}</span>
                        {passenger.cccd && <span>{passenger.cccd}</span>}
                        {passenger.nationality && <span>{passenger.nationality}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {booking.status === 'cancelled' && booking.bankInfo && (
              <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
                <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5">Thông tin hoàn tiền</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Ngân hàng</p>
                    <p className="text-sm font-medium text-primary">{booking.bankInfo.bankName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Số tài khoản</p>
                    <p className="text-sm font-medium text-primary">{booking.bankInfo.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Chủ tài khoản</p>
                    <p className="text-sm font-medium text-primary">{booking.bankInfo.accountHolder}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Trạng thái hoàn tiền</p>
                    <p className="text-sm font-medium text-primary">{REFUND_STATUS_LABEL[booking.refundStatus]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Số tiền hoàn</p>
                    <p className="text-sm font-medium text-primary">{formatCurrency(booking.refundAmount ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">Bill hoàn tiền</p>
                    {booking.refundBillUrl ? (
                      <a href={booking.refundBillUrl} target="_blank" rel="noreferrer" className="text-sm text-[var(--color-secondary)] hover:underline">Xem ảnh bill</a>
                    ) : (
                      <p className="text-sm font-medium text-primary">Chưa cập nhật</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {booking.paymentTransactions.length > 0 && (
              <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
                <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5">Lịch sử thanh toán</h2>
                <div className="space-y-3">
                  {booking.paymentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-outline-variant/20">
                      <div>
                        <p className="text-sm font-medium text-primary">{formatCurrency(transaction.amount)}</p>
                        <p className="text-xs text-primary/50 mt-0.5">
                          {PAYMENT_METHOD_LABEL[transaction.method]} · {new Date(transaction.paidAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-1 font-label uppercase tracking-wider bg-emerald-50 text-emerald-700">
                        {transaction.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="bg-[#FBFBFB] border border-[#D0C5AF]/40 p-6 shadow-sm">
              <h2 className="font-serif text-lg text-[var(--color-primary)] mb-5 border-b border-[#D0C5AF]/30 pb-4">Chi tiết thanh toán</h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="text-primary/60">Tổng cộng</span>
                  <span className="font-serif text-xl font-bold text-[var(--color-primary)]">{formatCurrency(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-primary/60">
                  <span>Đã thanh toán</span>
                  <span>{formatCurrency(booking.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-primary/60">
                  <span>Còn lại</span>
                  <span>{formatCurrency(booking.remainingAmount)}</span>
                </div>
                {booking.discountAmount ? (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Giảm giá</span>
                    <span>- {formatCurrency(booking.discountAmount)}</span>
                  </div>
                ) : null}
              </div>

              <div className="bg-[var(--color-surface)] p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary/60">Phương thức</span>
                  <span className="font-medium">{PAYMENT_METHOD_LABEL[booking.paymentMethod]}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary/60">Trạng thái</span>
                  <span className="font-medium">{PAYMENT_STATUS_LABEL[booking.paymentStatus]}</span>
                </div>
                {booking.promoCode && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary/60">Mã giảm giá</span>
                    <span className="font-mono text-xs text-emerald-600">{booking.promoCode}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              {canCustomerPay(booking) && (
                <button
                  onClick={() => void handlePay()}
                  disabled={isPaying}
                  className="w-full bg-[var(--color-primary)] text-white font-sans uppercase tracking-[0.1em] text-xs py-4 hover:bg-[var(--color-secondary)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">payments</span>
                  {isPaying ? 'Đang tạo link thanh toán' : `Thanh toán ${formatCurrency(booking.remainingAmount)}`}
                </button>
              )}
              {booking.status === 'completed' && (
                booking.review ? (
                  <div className="w-full border border-sky-300 bg-sky-50 text-sky-700 font-sans uppercase tracking-[0.1em] text-xs py-4 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">visibility</span>
                    Đã có đánh giá
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full border border-emerald-400 text-emerald-700 font-sans uppercase tracking-[0.1em] text-xs py-4 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">reviews</span>
                    Đánh giá tour
                  </button>
                )
              )}
              {['pending', 'confirmed'].includes(booking.status) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full border border-red-400 text-red-600 font-sans uppercase tracking-[0.1em] text-xs py-4 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                  Yêu cầu hủy tour
                </button>
              )}
              <button
                onClick={() => navigate('/customer/bookings')}
                className="w-full border border-outline-variant/50 text-primary/60 font-sans uppercase tracking-[0.1em] text-xs py-3 hover:bg-surface transition-colors"
              >
                Quay lại danh sách
              </button>
            </section>
          </div>
        </div>
      </main>

      {showCancelModal && (
        <CancelBookingModal booking={booking} onClose={() => setShowCancelModal(false)} />
      )}

      {showReviewModal && (
        <TourReviewModal bookingId={booking.id} tourId={booking.tourId} onClose={() => setShowReviewModal(false)} />
      )}
    </div>
  );
}
