import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '@entities/booking/data/bookings';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { useRequireAuth } from '@shared/hooks/useAuthGuard';
import { CancelBookingModal } from '@shared/ui/CancelBookingModal';
import { TourReviewModal } from '@shared/ui/TourReviewModal';
import {
  BOOKING_STATUS_LABEL,
  canCustomerPay,
  formatCurrency,
  getUpcomingPaymentNote,
  PAYMENT_STATUS_LABEL,
  REFUND_STATUS_LABEL,
} from '@shared/lib/booking';
import { createBookingPaymentLink } from '@shared/lib/api/bookings';

const BOOKING_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop';

export default function BookingHistory() {
  useRequireAuth('/login?redirect=/customer/bookings');
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const publicTours = useAppDataStore((state) => state.publicTours);
  const bookings = useAppDataStore((state) => state.bookings);
  const initializeProtected = useAppDataStore((state) => state.initializeProtected);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [payBookingId, setPayBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      void initializeProtected();
    }
  }, [accessToken, initializeProtected]);

  const statusMap: Record<typeof activeTab, Booking['status'][]> = {
    upcoming: ['pending', 'pending_cancel', 'confirmed'],
    completed: ['completed'],
    cancelled: ['cancelled'],
  };

  const filteredBookings = bookings
    .filter((booking) => !user || booking.userId === user.id)
    .filter((booking) => statusMap[activeTab].includes(booking.status));

  const counts = {
    upcoming: bookings.filter((booking) => booking.userId === user?.id && statusMap.upcoming.includes(booking.status)).length,
    completed: bookings.filter((booking) => booking.userId === user?.id && statusMap.completed.includes(booking.status)).length,
    cancelled: bookings.filter((booking) => booking.userId === user?.id && statusMap.cancelled.includes(booking.status)).length,
  };

  const getBookingImage = (tourId: string) => publicTours.find((tour) => tour.id === tourId)?.image || BOOKING_IMAGE_FALLBACK;

  const handlePay = async (booking: Booking) => {
    setPayBookingId(booking.id);

    try {
      const response = await createBookingPaymentLink(booking.id, accessToken, { returnTo: 'booking_detail' });
      const checkoutUrl = response.paymentLink.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } finally {
      setPayBookingId(null);
    }
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pt-16 pb-32">
      <main className="max-w-5xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-8">Lịch sử đặt tour</h1>

        <div className="flex gap-8 mb-8 border-b border-[#D0C5AF]/30">
          {([
            { key: 'upcoming', label: 'Sắp khởi hành', count: counts.upcoming },
            { key: 'completed', label: 'Đã hoàn thành', count: counts.completed },
            { key: 'cancelled', label: 'Đã hủy', count: counts.cancelled },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 px-2 text-sm uppercase tracking-widest font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]'
                  : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === tab.key ? 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' : 'bg-surface text-primary/40'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-20 border border-[#D0C5AF]/30 bg-white">
              <span className="material-symbols-outlined text-[48px] text-[var(--color-primary)]/20 mb-4 block">receipt_long</span>
              <p className="text-[var(--color-primary)]/60 text-sm">Bạn chưa có chuyến đi nào trong mục này.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-[#D0C5AF]/40 shadow-sm flex flex-col md:flex-row group transition-colors hover:border-[var(--color-secondary)]/50">
                <div className="md:w-64 h-48 md:h-auto overflow-hidden relative shrink-0">
                  <img
                    src={getBookingImage(booking.tourId)}
                    alt={booking.tourName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] mb-2 font-bold">{booking.bookingCode}</p>
                      <h3 className="font-serif text-xl text-[var(--color-primary)] max-w-lg mb-2 line-clamp-2">{booking.tourName}</h3>
                      <p className="text-sm text-[var(--color-primary)]/70 flex items-center gap-2 flex-wrap">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        {new Date(booking.tourDate).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        <span className="mx-1">·</span>
                        {booking.tourDuration}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-primary/55">{BOOKING_STATUS_LABEL[booking.status]}</span>
                        <span className="text-xs text-primary/45">· {PAYMENT_STATUS_LABEL[booking.paymentStatus]}</span>
                        {booking.status === 'cancelled' && (
                          <span className="text-xs text-primary/45">· {REFUND_STATUS_LABEL[booking.refundStatus]}</span>
                        )}
                      </div>
                      {activeTab === 'upcoming' && getUpcomingPaymentNote(booking) && (
                        <p className="text-xs text-amber-700 mt-2">{getUpcomingPaymentNote(booking)}</p>
                      )}
                      {activeTab === 'cancelled' && (
                        <p className="text-xs text-primary/55 mt-2">
                          Hoàn tiền: <strong>{booking.refundAmount ? formatCurrency(booking.refundAmount) : '0đ'}</strong>
                          {booking.refundBillUrl && (
                            <>
                              <span className="mx-2">·</span>
                              <a
                                href={booking.refundBillUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="text-[var(--color-secondary)] hover:underline"
                              >
                                Xem bill hoàn tiền
                              </a>
                            </>
                          )}
                        </p>
                      )}
                      {activeTab === 'cancelled' && booking.refundBillUrl && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            window.open(booking.refundBillUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="mt-2 block overflow-hidden border border-outline-variant/30 bg-surface"
                          aria-label="Xem anh bill hoan tien"
                        >
                          <img src={booking.refundBillUrl} alt="Bill hoan tien" className="h-20 w-32 object-cover" />
                        </button>
                      )}
                    </div>
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="font-serif text-xl text-[var(--color-primary)]">{formatCurrency(booking.totalAmount)}</p>
                      {booking.remainingAmount > 0 && (
                        <p className="text-xs text-orange-600 mt-1">Còn lại {formatCurrency(booking.remainingAmount)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-6 border-t border-[var(--color-surface)]">
                    <div className="md:hidden">
                      <p className="font-serif text-xl text-[var(--color-primary)]">{formatCurrency(booking.totalAmount)}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 ml-auto">
                      <button
                        onClick={() => navigate(`/customer/bookings/${booking.id}`)}
                        className="px-6 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                      >
                        Chi tiết
                      </button>

                      {canCustomerPay(booking) && (
                        <button
                          onClick={() => void handlePay(booking)}
                          disabled={payBookingId === booking.id}
                          className="px-6 py-2 bg-[var(--color-primary)] text-white font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-[var(--color-secondary)] transition-colors flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          {payBookingId === booking.id ? 'Đang tạo link' : 'Thanh toán'}
                        </button>
                      )}

                      {activeTab === 'completed' && (
                        booking.review ? (
                          <button
                            onClick={() => setReviewBooking(booking)}
                            className="px-6 py-2 border border-sky-300 text-sky-700 font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-sky-50 transition-colors flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                            Xem đánh giá
                          </button>
                        ) : (
                          <button
                            onClick={() => setReviewBooking(booking)}
                            className="px-6 py-2 border border-emerald-400 text-emerald-700 font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">reviews</span>
                            Đánh giá tour
                          </button>
                        )
                      )}

                      {['pending', 'confirmed'].includes(booking.status) && (
                        <button
                          onClick={() => setCancelBooking(booking)}
                          className="px-6 py-2 border border-red-400 text-red-600 font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-red-50 transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {cancelBooking && (
        <CancelBookingModal booking={cancelBooking} onClose={() => setCancelBooking(null)} />
      )}

      {reviewBooking && (
        <TourReviewModal
          bookingId={reviewBooking.id}
          tourId={reviewBooking.tourId}
          review={reviewBooking.review}
          onClose={() => setReviewBooking(null)}
        />
      )}
    </div>
  );
}
