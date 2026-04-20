import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockBookings } from '@entities/booking/data/bookings';
import { mockTours } from '@entities/tour/data/tours';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useRequireAuth } from '@shared/hooks/useAuthGuard';
import { CancelBookingModal } from '@shared/ui/CancelBookingModal';
import type { Booking } from '@entities/booking/data/bookings';

export default function BookingHistory() {
  useRequireAuth('/login?redirect=/customer/bookings');
  const navigate = useNavigate();
  const user = useAuthStore(s => s?.user);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [payBooking, setPayBooking] = useState<Booking | null>(null);
  const [reviewText, setReviewText] = useState('');

  const statusMap: Record<string, string[]> = {
    upcoming: ['booked', 'pending', 'pending_cancel', 'confirmed'],
    completed: ['completed'],
    cancelled: ['cancelled'],
  };

  // Filter by current user if logged in, else show all
  const filteredBookings = mockBookings
    ?.filter(b => statusMap[activeTab]?.includes(b?.status) ?? false)
    ?.filter(b => !user || b.userId === user?.id);

  const getBookingImage = (tourId: string) =>
    mockTours?.find(t => t.id === tourId)?.image ?? '';

  const handleReviewSubmit = () => {
    setReviewBookingId(null);
    setRating(0);
    setReviewText('');
  };

  const canCancel = (b: Booking) =>
    ['booked', 'pending', 'confirmed']?.includes(b?.status) &&
    new Date(b?.tourDate) > new Date();

  const canPay = (b: Booking) =>
    ['booked', 'pending', 'confirmed']?.includes(b?.status) &&
    new Date(b?.tourDate) > new Date() &&
    (b.paymentStatus === 'unpaid' || b.paymentStatus === 'partial');

  const canReview = (b: Booking) => b.status === 'completed';

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pt-16 pb-32">
      <main className="max-w-5xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-8">Lịch Sử Đặt Chỗ</h1>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-[#D0C5AF]/30">
          {([
            { key: 'upcoming', label: 'Sắp Khởi Hành', count: mockBookings?.filter(b => statusMap?.upcoming?.includes(b?.status))?.length },
            { key: 'completed', label: 'Đã Hoàn Thành', count: mockBookings?.filter(b => statusMap?.completed?.includes(b?.status))?.length },
            { key: 'cancelled', label: 'Đã Hủy', count: mockBookings?.filter(b => statusMap?.cancelled?.includes(b?.status))?.length },
          ] as const)?.map(t => (
            <button
              key={t?.key}
              onClick={() => setActiveTab(t?.key)}
              className={`pb-4 px-2 text-sm uppercase tracking-widest font-medium transition-colors flex items-center gap-2 ${
                activeTab === t?.key
                  ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]'
                  : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
              }`}
            >
              {t?.label}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === t?.key ? 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' : 'bg-surface text-primary/40'
              }`}>
                {t?.count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-20 border border-[#D0C5AF]/30 bg-white">
              <span className="material-symbols-outlined text-[48px] text-[var(--color-primary)]/20 mb-4 block">receipt_long</span>
              <p className="text-[var(--color-primary)]/60 text-sm">Qu? khách chưa có chuyến đi nào trong mục này?.</p>
            </div>
          ) : (
            filteredBookings?.map(booking => (
              <div key={booking?.id} className="bg-white border border-[#D0C5AF]/40 shadow-sm flex flex-col md:flex-row group animate-in fade-in duration-500 hover:border-[var(--color-secondary)]/50 transition-colors">
                {/* Image */}
                <div className="md:w-64 h-48 md:h-auto overflow-hidden relative shrink-0">
                  <img src={getBookingImage(booking?.tourId)} alt={booking?.tourName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] mb-2 font-bold">
                        {booking?.bookingCode}
                      </p>
                      <h3 className="font-serif text-xl text-[var(--color-primary)] max-w-lg mb-2 line-clamp-2">
                        {booking?.tourName}
                      </h3>
                      <p className="text-sm text-[var(--color-primary)]/70 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        {new Date(booking?.tourDate)?.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        <span className="mx-1">·</span>
                        {booking?.tourDuration}
                      </p>
                      {booking.paymentStatus === 'partial' && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          Còn nợ {booking?.remainingAmount?.toLocaleString('vi-VN')}đ
                        </p>
                      )}
                      {booking.status === 'pending_cancel' && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                          Đã gửi yêu cầu hủy
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 hidden md:block">
                      <p className="font-serif text-xl text-[var(--color-primary)]">
                        {booking?.totalAmount?.toLocaleString('vi-VN')}đ
                      </p>
                      {booking.paymentStatus === 'partial' && (
                        <p className="text-xs text-orange-600 mt-1">
                          Đã TT: {booking?.paidAmount?.toLocaleString('vi-VN')}đ
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-6 border-t border-[var(--color-surface)]">
                    {/* Mobile total */}
                    <div className="md:hidden">
                      <p className="font-serif text-xl text-[var(--color-primary)]">
                        {booking?.totalAmount?.toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 ml-auto">
                      <button
                        onClick={() => navigate(`/customer/bookings/${booking?.id}`)}
                        className="px-6 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                      >
                        Chi tiết
                      </button>

                      {canPay(booking) && (
                        <button
                          onClick={() => setPayBooking(booking)}
                          className="px-6 py-2 bg-[var(--color-primary)] text-white font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-[var(--color-secondary)] transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          Thanh toán
                        </button>
                      )}

                      {canCancel(booking) && (
                        <button
                          onClick={() => setCancelBooking(booking)}
                          className="px-6 py-2 border border-red-400 text-red-600 font-sans uppercase tracking-[0.1em] text-[10px] hover:bg-red-50 transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          Hủy
                        </button>
                      )}

                      {canReview(booking) && (
                        <button
                          onClick={() => setReviewBookingId(booking?.id)}
                          className="px-6 py-2 bg-[var(--color-tertiary)] text-white font-sans uppercase tracking-[0.1em] text-[10px] hover:opacity-90 transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">rate_review</span>
                          Đánh giá
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

      {/* Cancel Modal */}
      {cancelBooking && (
        <CancelBookingModal
          booking={cancelBooking}
          onClose={() => setCancelBooking(null)}
        />
      )}

      {/* Payment Modal */}
      {payBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setPayBooking(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl text-primary">Thanh toán</h3>
                <button onClick={() => setPayBooking(null)} className="text-primary/40 hover:text-primary">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-[var(--color-surface)] p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-primary/60">Tổng tiền</span><span>{payBooking?.totalAmount?.toLocaleString('vi-VN')}đ</span></div>
                  <div className="flex justify-between text-sm text-emerald-600"><span>Đã thanh toán</span><span>{payBooking?.paidAmount?.toLocaleString('vi-VN')}đ</span></div>
                  <div className="border-t border-outline-variant/30 pt-2 flex justify-between font-bold">
                    <span>Còn lại</span>
                    <span className="text-[var(--color-secondary)]">{payBooking?.remainingAmount?.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'vnpay', label: 'Chuyển khoản VietQR', icon: 'account_balance' },
                    { id: 'stripe', label: 'Thẻ tín dụng (VNPAY)', icon: 'credit_card' },
                  ]?.map(m => (
                    <label key={m?.id} className="flex items-center gap-3 p-4 border border-outline-variant/30 cursor-pointer hover:border-[var(--color-secondary)] transition-colors">
                      <input type="radio" name="payMethod" className="accent-[var(--color-secondary)]" />
                      <span className="material-symbols-outlined text-xl text-primary/30">{m?.icon}</span>
                      <span className="text-sm font-medium">{m?.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => { setPayBooking(null); navigate(`/customer/bookings/${payBooking?.id}`); }}
                  className="w-full py-3.5 bg-primary text-white font-sans uppercase tracking-wider text-xs hover:bg-[var(--color-secondary)] transition-colors"
                >
                  Thanh toán {payBooking?.remainingAmount?.toLocaleString('vi-VN')}đ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setReviewBookingId(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-300 p-8">
            <button onClick={() => setReviewBookingId(null)} className="absolute top-4 right-4 text-primary/40 hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-8">
              <span className="material-symbols-outlined text-4xl text-secondary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <h3 className="font-serif text-2xl text-primary mb-2">Đánh Giá Chuyến Đi</h3>
              <p className="text-xs text-primary/60">Đơn {reviewBookingId}</p>
            </div>
            <div className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5]?.map((star) => (
                  <button key={star} onClick={() => setRating(star)}
                    className="material-symbols-outlined text-4xl transition-colors cursor-pointer"
                    style={rating >= star ? { color: 'var(--color-secondary)', fontVariationSettings: "'FILL' 1" } : { color: '#D0C5AF' }}>
                    star
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-primary/60 font-medium block">Chia sẻ trải nghiệm</label>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e?.target?.value)}
                  className="w-full border border-outline-variant/50 p-4 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none resize-none min-h-[120px]"
                  placeholder="Dịch vụ đẳng cấp, hướng dẫn viên chu đ?o..."
                />
              </div>
              <button
                onClick={handleReviewSubmit}
                disabled={rating === 0}
                className="w-full bg-primary text-white py-4 font-sans uppercase tracking-[0.2em] text-[12px] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gửi Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

