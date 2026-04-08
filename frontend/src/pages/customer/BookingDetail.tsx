import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockBookings, type Booking } from '../../data/bookings';
import { mockTours } from '../../data/tours';
import { CancelBookingModal } from '../../components/CancelBookingModal';
import { useRequireAuth } from '../../hooks/useAuthGuard';

const STATUS_LABEL: Record<string, string> = {
  booked: 'Đã đặt',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const STATUS_STYLE: Record<string, string> = {
  booked: 'bg-amber-100 text-amber-700 border-amber-300',
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const PAYMENT_LABEL: Record<string, string> = {
  vnpay: 'VNPay',
  cash: 'Tiền mặt',
  stripe: 'Stripe',
};

const REFUND_LABEL: Record<string, string> = {
  none: '—',
  pending: 'Đang xử lý',
  refunded: 'Đã hoàn',
  not_required: 'Không cần',
};

export default function BookingDetail() {
  useRequireAuth('/login?redirect=/customer/bookings');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const booking: Booking | undefined = mockBookings.find(b => b.id === id);

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

  const tour = mockTours.find(t => t.id === booking.tourId);
  const canCancel = ['booked', 'pending', 'confirmed'].includes(booking.status) && new Date(booking.tourDate) > new Date();
  const canPay = canCancel && (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'partial');
  const canReview = booking.status === 'completed';

  const passengerTypeLabel = (type: Booking['passengers'][0]['type']) =>
    type === 'adult' ? 'Người lớn' : type === 'child' ? 'Trẻ em' : 'Em bé';

  const passengerTypeStyle = (type: Booking['passengers'][0]['type']) =>
    type === 'adult' ? 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]' :
    type === 'child' ? 'bg-amber-50 text-amber-700' :
    'bg-sky-50 text-sky-700';

  return (
    <div className="w-full bg-[var(--color-background)]">
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-32">
        {/* Back */}
        <button
          onClick={() => navigate('/customer/bookings')}
          className="flex items-center gap-2 text-sm text-[var(--color-primary)] opacity-70 hover:opacity-100 transition-opacity mb-8 font-sans"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Lịch sử đặt chỗ
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-serif text-3xl text-[var(--color-primary)] tracking-tight mb-2">Chi Tiết Đơn Đặt Chỗ</h1>
            <p className="text-sm font-sans tracking-widest text-[var(--color-secondary)] uppercase">
              {booking.bookingCode}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium ${STATUS_STYLE[booking.status] ?? ''}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            {STATUS_LABEL[booking.status] ?? booking.status}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="md:col-span-2 space-y-8">

            {/* Tour info */}
            <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
              <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-secondary)]">tour</span>
                Thông Tin Hành Trình
              </h2>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[var(--color-primary)] leading-snug">{booking.tourName}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--color-surface)]">
                  {[
                    { icon: 'calendar_today', label: 'Khởi hành', value: new Date(booking.tourDate).toLocaleDateString('vi-VN') },
                    { icon: 'schedule', label: 'Thời lượng', value: booking.tourDuration },
                    { icon: 'group', label: 'Hành khách', value: `${booking.passengers.length} người` },
                    { icon: 'luggage', label: 'Loại', value: tour?.category === 'domestic' ? 'Trong nước' : 'Quốc tế' },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <span className="material-symbols-outlined text-lg text-[var(--color-secondary)] block mb-1">{item.icon}</span>
                      <p className="text-[10px] uppercase tracking-widest text-primary/50 mb-1">{item.label}</p>
                      <p className="text-xs font-medium text-primary">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact info */}
            <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
              <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-secondary)]">contact_phone</span>
                Thông Tin Liên Hệ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: 'person', label: 'Người đặt', value: booking.contactInfo.name },
                  { icon: 'phone', label: 'Điện thoại', value: booking.contactInfo.phone },
                  { icon: 'mail', label: 'Email', value: booking.contactInfo.email },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-base text-primary/30 mt-0.5 shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label">{item.label}</p>
                      <p className="text-sm font-medium text-primary">{item.value}</p>
                    </div>
                  </div>
                ))}
                {booking.contactInfo.note && (
                  <div className="sm:col-span-3 flex items-start gap-3 bg-amber-50 p-3">
                    <span className="material-symbols-outlined text-base text-amber-400 shrink-0">info</span>
                    <p className="text-xs text-amber-800">
                      <strong>Ghi chú:</strong> {booking.contactInfo.note}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Passenger list */}
            <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
              <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--color-secondary)]">group</span>
                Danh Sách Hành Khách
                <span className="ml-auto text-xs bg-[var(--color-surface)] px-3 py-1 text-primary/60 font-mono">
                  {booking.passengers.length}
                </span>
              </h2>
              <div className="space-y-0 divide-y divide-[var(--color-surface)]">
                {booking.passengers.map((p, idx) => (
                  <div key={idx} className="py-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar placeholder */}
                      <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg text-primary/30">
                          {p.gender === 'male' ? 'face' : 'face_3'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-primary text-sm">{p.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          {p.dob && (
                            <span className="text-xs text-primary/50 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">cake</span>
                              {new Date(p.dob).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          <span className="text-xs text-primary/50 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">{p.gender === 'male' ? 'male' : 'female'}</span>
                            {p.gender === 'male' ? 'Nam' : 'Nữ'}
                          </span>
                          {p.cccd && (
                            <span className="text-xs text-primary/50 font-mono flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">badge</span>
                              {p.cccd}
                            </span>
                          )}
                          {p.nationality && p.nationality !== 'Việt Nam' && (
                            <span className="text-xs text-primary/50">{p.nationality}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest px-3 py-1 shrink-0 font-label ${passengerTypeStyle(p.type)}`}>
                      {passengerTypeLabel(p.type)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Payment Transactions */}
            {booking.paymentTransactions.length > 0 && (
              <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
                <h2 className="font-serif text-xl text-[var(--color-primary)] mb-5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--color-secondary)]">receipt_long</span>
                  Lịch Sử Thanh Toán
                </h2>
                <div className="space-y-3">
                  {booking.paymentTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-lg ${
                          tx.status === 'completed' ? 'text-emerald-500' :
                          tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {tx.status === 'completed' ? 'check_circle' : tx.status === 'pending' ? 'hourglass_empty' : 'error'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-primary">
                            {tx.amount.toLocaleString('vi-VN')}đ
                          </p>
                          <p className="text-xs text-primary/50 mt-0.5">
                            {PAYMENT_LABEL[tx.method]} · {new Date(tx.paidAt).toLocaleString('vi-VN')}
                            {tx.transactionRef && <span className="ml-2 font-mono">#{tx.transactionRef}</span>}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 font-label uppercase tracking-wider ${
                        tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        tx.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {tx.status === 'completed' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Refund info */}
            {(booking.refundStatus !== 'none' || booking.cancelledAt) && (
              <section className="bg-white border border-[#D0C5AF]/30 p-8 shadow-sm">
                <h2 className="font-serif text-xl text-[var(--color-primary)] mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--color-secondary)]">currency_exchange</span>
                  Thông Tin Hoàn Tiền
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary/60">Trạng thái hoàn tiền</span>
                    <span className={`font-medium ${
                      booking.refundStatus === 'refunded' ? 'text-emerald-600' :
                      booking.refundStatus === 'pending' ? 'text-amber-600' : 'text-primary/60'
                    }`}>
                      {REFUND_LABEL[booking.refundStatus]}
                    </span>
                  </div>
                  {booking.refundAmount && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary/60">Số tiền hoàn</span>
                      <span className="font-bold text-[var(--color-secondary)] font-serif text-lg">
                        {booking.refundAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                  {booking.refundBillUrl && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary/60">Biên lai hoàn tiền</span>
                      <a href={booking.refundBillUrl} target="_blank" rel="noreferrer"
                        className="text-[var(--color-secondary)] underline text-xs">
                        Xem biên lai
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT — Price & Actions */}
          <div className="space-y-6">
            {/* Price Breakdown */}
            <section className="bg-[#FBFBFB] border border-[#D0C5AF]/40 p-6 shadow-sm">
              <h2 className="font-serif text-lg text-[var(--color-primary)] mb-5 border-b border-[#D0C5AF]/30 pb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-secondary)]">payments</span>
                Chi Tiết Thanh Toán
              </h2>

              <div className="space-y-3 text-sm mb-5">
                {booking.passengers.filter(p => p.type === 'adult').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-primary/60">Người lớn × {booking.passengers.filter(p => p.type === 'adult').length}</span>
                    <span>{(tour?.price.adult ?? 0) * booking.passengers.filter(p => p.type === 'adult').length}</span>
                  </div>
                )}
                {booking.passengers.filter(p => p.type === 'child').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-primary/60">Trẻ em × {booking.passengers.filter(p => p.type === 'child').length}</span>
                    <span>{(tour?.price.child ?? 0) * booking.passengers.filter(p => p.type === 'child').length}</span>
                  </div>
                )}
                {booking.passengers.filter(p => p.type === 'infant').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-primary/60">Em bé × {booking.passengers.filter(p => p.type === 'infant').length}</span>
                    <span>{(tour?.price.infant ?? 0) * booking.passengers.filter(p => p.type === 'infant').length}</span>
                  </div>
                )}
                {booking.discountAmount && booking.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá</span>
                    <span>-{booking.discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[#D0C5AF]/30 pt-4 mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-primary/60">Tổng cộng</span>
                  <span className="font-serif text-xl font-bold text-[var(--color-primary)]">
                    {booking.totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {booking.paymentStatus === 'partial' && (
                  <div className="flex justify-between text-xs text-orange-600">
                    <span>Đã thanh toán</span>
                    <span>{booking.paidAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                {booking.remainingAmount > 0 && (
                  <div className="flex justify-between text-xs text-red-600 mt-1">
                    <span>Còn phải trả</span>
                    <span className="font-medium">{booking.remainingAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
              </div>

              <div className="bg-[var(--color-surface)] p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary/60">Phương thức</span>
                  <span className="font-medium">{PAYMENT_LABEL[booking.paymentMethod]}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary/60">Trạng thái</span>
                  <span className={`font-medium ${
                    booking.paymentStatus === 'paid' ? 'text-emerald-600' :
                    booking.paymentStatus === 'partial' ? 'text-orange-600' :
                    booking.paymentStatus === 'refunded' ? 'text-gray-500' : 'text-red-600'
                  }`}>
                    {booking.paymentStatus === 'paid' ? 'Đã thanh toán' :
                     booking.paymentStatus === 'partial' ? 'Thanh toán 1 phần' :
                     booking.paymentStatus === 'refunded' ? 'Đã hoàn' : 'Chưa thanh toán'}
                  </span>
                </div>
                {booking.promoCode && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary/60">Mã giảm giá</span>
                    <span className="font-mono text-xs text-emerald-600">{booking.promoCode}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <section className="space-y-3">
              {canPay && (
                <button className="w-full bg-[var(--color-primary)] text-white font-sans uppercase tracking-[0.1em] text-xs py-4 hover:bg-[var(--color-secondary)] transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">payments</span>
                  Thanh toán {booking.remainingAmount.toLocaleString('vi-VN')}đ
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full border border-red-400 text-red-600 font-sans uppercase tracking-[0.1em] text-xs py-4 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                  Yêu Cầu Hủy Tour
                </button>
              )}
              {canReview && (
                <button className="w-full bg-[var(--color-tertiary)] text-white font-sans uppercase tracking-[0.1em] text-xs py-4 hover:opacity-90 transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">rate_review</span>
                  Đánh Giá Chuyến Đi
                </button>
              )}
              <button
                onClick={() => navigate('/customer/bookings')}
                className="w-full border border-outline-variant/50 text-primary/60 font-sans uppercase tracking-[0.1em] text-xs py-3 hover:bg-surface transition-colors"
              >
                ← Quay lại danh sách
              </button>
            </section>
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelBookingModal
          booking={booking}
          onClose={() => setShowCancelModal(false)}
        />
      )}
    </div>
  );
}
