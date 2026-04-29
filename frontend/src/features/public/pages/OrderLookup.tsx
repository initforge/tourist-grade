import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '@entities/booking/data/bookings';
import { ApiError } from '@shared/lib/api/client';
import { createBookingPaymentLink, lookupBooking } from '@shared/lib/api/bookings';
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL, canCustomerPay, formatCurrency } from '@shared/lib/booking';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { CancelBookingModal } from '@shared/ui/CancelBookingModal';

export default function OrderLookup() {
  const navigate = useNavigate();
  const publicTours = useAppDataStore((state) => state.publicTours);
  const upsertBooking = useAppDataStore((state) => state.upsertBooking);
  const [bookingCode, setBookingCode] = useState('');
  const [contact, setContact] = useState('');
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const matchingTour = foundBooking
    ? publicTours.find((tour) => tour.id === foundBooking.tourId)
    : null;
  const paymentAmount = foundBooking
    ? foundBooking.remainingAmount > 0 ? foundBooking.remainingAmount : foundBooking.totalAmount
    : 0;

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setFoundBooking(null);

    try {
      const response = await lookupBooking(bookingCode.trim(), contact.trim());
      setFoundBooking(response.booking);
      upsertBooking(response.booking);
    } catch (searchError) {
      if (searchError instanceof ApiError && searchError.status === 404) {
        setError('Không tìm thấy đơn đặt chỗ.');
      } else {
        setError(searchError instanceof Error ? searchError.message : 'Không tìm thấy đơn đặt chỗ.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async () => {
    if (!foundBooking) {
      return;
    }

    setIsPaying(true);
    setError('');

    try {
      const response = await createBookingPaymentLink(foundBooking.id);
      const checkoutUrl = response.paymentLink.checkoutUrl;

      if (checkoutUrl) {
        setShowPaymentModal(false);
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      setError('Không tạo được link thanh toán PayOS.');
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Không thể tạo link thanh toán.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-[80vh] pt-16 md:pt-20 pb-20 md:pb-24 px-4 sm:px-6">
      <div className="text-center mb-10 md:mb-12 max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl text-[var(--color-primary)] tracking-tight mb-4">Tra cứu đơn đặt chỗ</h1>
        <p className="text-[var(--color-primary)]/70 max-w-lg mx-auto font-light text-sm">
          Kiểm tra thông tin booking, tình trạng thanh toán và tiếp tục xử lý ngay trên hệ thống thật.
        </p>
      </div>

      <div
        data-testid="lookup-layout"
        className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-8 items-start"
      >
        <section
          role="region"
          aria-label="Form tra cứu đơn đặt"
          className="w-full bg-white border border-[#D0C5AF]/40 shadow-sm p-10"
        >
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Mã đơn đặt chỗ</label>
              <input
                type="text"
                required
                placeholder="VD: BK-582910"
                value={bookingCode}
                onChange={(event) => setBookingCode(event.target.value.toUpperCase())}
                className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-lg font-serif outline-none uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60">Email hoặc số điện thoại</label>
              <input
                type="text"
                required
                placeholder="0988 123 456"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 text-center rounded-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--color-primary)] text-white py-4 font-sans uppercase tracking-[0.2em] text-xs hover:bg-[var(--color-secondary)] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              {isLoading ? 'Đang tra cứu' : 'Tra cứu thông tin'}
            </button>
          </form>
        </section>

        {foundBooking && (
          <section role="region" aria-label="Kết quả tra cứu đơn đặt" className="w-full">
            <div className="bg-[var(--color-surface)] border border-[#D0C5AF]/40 p-8 shadow-sm space-y-5">
              <div className="flex justify-between items-start border-b border-[#D0C5AF]/30 pb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 mb-1">Mã đơn</p>
                  <h3 className="font-serif text-xl text-[var(--color-primary)]">{foundBooking.bookingCode}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block mb-1">Tổng tiền</p>
                  <span className="font-serif text-xl text-[var(--color-primary)]">{formatCurrency(foundBooking.totalAmount)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] px-3 py-1 border font-label uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200">
                  {BOOKING_STATUS_LABEL[foundBooking.status]}
                </span>
                <span className="text-[10px] px-3 py-1 border font-label uppercase tracking-wider bg-sky-50 text-sky-700 border-sky-200">
                  {PAYMENT_STATUS_LABEL[foundBooking.paymentStatus]}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block">Hành trình</span>
                  <p className="font-medium text-[var(--color-primary)]">{foundBooking.tourName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block">Khởi hành</span>
                    <p className="text-sm font-medium">{new Date(foundBooking.tourDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block">Thời lượng</span>
                    <p className="text-sm font-medium">{foundBooking.tourDuration}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block">Hành khách</span>
                    <p className="text-sm font-medium">{foundBooking.passengers.length} người</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block">Còn lại</span>
                    <p className="text-sm font-medium">{formatCurrency(foundBooking.remainingAmount)}</p>
                  </div>
                </div>
              </div>

              {foundBooking.status === 'pending_cancel' && (
                <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Đã gửi yêu cầu hủy. Bộ phận kinh doanh sẽ liên hệ và cập nhật tiến độ hoàn tiền.
                </div>
              )}

              <div className="border-t border-[#D0C5AF]/30 pt-5 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/booking/lookup/${foundBooking.bookingCode}?contact=${encodeURIComponent(contact.trim())}`)}
                    className="px-6 py-2.5 border border-[var(--color-primary)] text-[var(--color-primary)] font-sans uppercase tracking-wider text-[10px] hover:bg-[var(--color-primary)] hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">info</span>
                    Xem chi tiết
                  </button>

                  {canCustomerPay(foundBooking) && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-sans uppercase tracking-wider text-[10px] hover:bg-[var(--color-secondary)] transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">payments</span>
                      Thanh toán
                    </button>
                  )}

                  {['pending', 'confirmed'].includes(foundBooking.status) && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-6 py-2.5 border border-red-400 text-red-600 font-sans uppercase tracking-wider text-[10px] hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      Hủy
                    </button>
                  )}

                  {foundBooking.status === 'completed' && matchingTour?.slug && (
                    <button
                      onClick={() => navigate(`/tours/${matchingTour.slug}#reviews`)}
                      className="px-6 py-2.5 border border-emerald-400 text-emerald-700 font-sans uppercase tracking-wider text-[10px] hover:bg-emerald-50 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">reviews</span>
                      Đánh giá
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {showCancelModal && foundBooking && (
        <CancelBookingModal booking={foundBooking} onClose={() => setShowCancelModal(false)} />
      )}

      {showPaymentModal && foundBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lookup-payment-title"
            className="relative w-full max-w-md bg-white shadow-2xl p-8 space-y-5"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="lookup-payment-title" className="font-serif text-2xl text-primary">Thanh toán</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-primary/50 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <div className="bg-[var(--color-surface)] border border-[#D0C5AF]/30 p-4 space-y-2">
              <p className="text-sm font-medium text-primary">{foundBooking.tourName}</p>
              <p className="text-xs text-primary/60">{foundBooking.bookingCode}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#D0C5AF]/30">
                <span className="text-sm text-primary/60">Số tiền cần thanh toán</span>
                <strong className="font-serif text-xl text-primary">{formatCurrency(paymentAmount)}</strong>
              </div>
            </div>

            <p className="text-xs text-primary/60">
              Thanh toán hiện được xử lý qua PayOS. Hệ thống chưa có luồng VietQR nội bộ tách riêng ngoài cổng thanh toán này.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={isPaying}
                className="flex-1 py-3 bg-[var(--color-primary)] text-white font-sans uppercase tracking-wider text-xs hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-60"
              >
                {isPaying ? 'Đang tạo link thanh toán' : `Thanh toán ${formatCurrency(paymentAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
