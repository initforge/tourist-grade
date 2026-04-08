import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockBookings, type Booking } from '../../data/bookings';

const STATUS_LABEL: Record<string, string> = {
  booked: 'Đã đặt',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export default function OrderLookup() {
  const navigate = useNavigate();
  const [bookingCode, setBookingCode] = useState('');
  const [phone, setPhone] = useState('');
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNotFound(false);
    setFoundBooking(null);

    // Real lookup in mockBookings
    const found = mockBookings.find(b =>
      b.bookingCode.toLowerCase() === bookingCode.toLowerCase()
      // In real app: also match phone/email
    );
    if (found) {
      setFoundBooking(found);
    } else {
      setNotFound(true);
    }
  };

  const isFuture = foundBooking
    ? new Date(foundBooking.tourDate) > new Date()
    : false;
  const isPast = foundBooking
    ? foundBooking.status === 'completed'
    : false;
  const canCancel = foundBooking
    ? isFuture && foundBooking.status !== 'cancelled' && foundBooking.status !== 'completed'
    : false;
  const canPay = foundBooking
    ? isFuture && (foundBooking.paymentStatus === 'unpaid' || foundBooking.paymentStatus === 'partial')
    : false;
  const canReview = foundBooking
    ? foundBooking.status === 'completed'
    : false;

  const refundAmount = foundBooking ? (() => {
    const daysLeft = Math.ceil((new Date(foundBooking.tourDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft >= 30) return foundBooking.totalAmount;
    if (daysLeft >= 15) return Math.round(foundBooking.totalAmount * 0.7);
    if (daysLeft >= 7) return Math.round(foundBooking.totalAmount * 0.5);
    if (daysLeft >= 3) return Math.round(foundBooking.totalAmount * 0.2);
    return 0;
  })() : 0;

  return (
    <div className="w-full bg-[var(--color-background)] min-h-[80vh] flex flex-col items-center pt-24 pb-32">
      <div className="text-center mb-12 animate-in slide-in-from-bottom-5 duration-700">
        <h1 className="font-serif text-4xl text-[var(--color-primary)] tracking-tight mb-4">Tra Cứu Đơn Đặt Chỗ</h1>
        <p className="text-[var(--color-primary)]/70 max-w-lg mx-auto font-light text-sm">
          Kiểm tra tình trạng đơn đặt chỗ, thông tin hành trình và chi tiết thanh toán của quý khách.
        </p>
      </div>

      <div className="w-full max-w-xl bg-white border border-[#D0C5AF]/40 shadow-sm p-10 animate-in fade-in duration-500 delay-150">
        <form onSubmit={handleSearch} className="space-y-8">
          <div className="space-y-1 relative group">
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">
              Mã Đơn Đặt Chỗ
            </label>
            <input
              type="text"
              required
              placeholder="VD: BK-582910"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-lg font-serif outline-none transition-colors uppercase"
            />
          </div>

          <div className="space-y-1 relative group">
            <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 transition-colors group-focus-within:text-[var(--color-secondary)]">
              Email hoặc Số Điện Thoại
            </label>
            <input
              type="text"
              required
              placeholder="0988 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-b border-[#D0C5AF]/50 bg-transparent py-2 px-0 focus:ring-0 focus:border-[var(--color-secondary)] text-sm outline-none transition-colors"
            />
          </div>

          {notFound && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 text-center rounded-sm">
              Không tìm thấy đơn đặt chỗ. Vui lòng kiểm tra lại mã đơn.
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-white py-4 font-sans uppercase tracking-[0.2em] text-xs hover:bg-[var(--color-secondary)] transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Tra Cứu Thông Tin
          </button>
        </form>
      </div>

      {foundBooking && (
        <div className="w-full max-w-xl mt-8 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-[var(--color-surface)] border border-[#D0C5AF]/40 p-8 shadow-sm space-y-5">

            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#D0C5AF]/30 pb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 mb-1">Mã đơn</p>
                <h3 className="font-serif text-xl text-[var(--color-primary)]">{foundBooking.bookingCode}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block mb-1">Tổng tiền</p>
                <span className="font-serif text-xl text-[var(--color-primary)]">
                  {foundBooking.totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-3 py-1 border font-label uppercase tracking-wider ${
                foundBooking.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                foundBooking.status === 'cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                foundBooking.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {STATUS_LABEL[foundBooking.status]}
              </span>
              {foundBooking.paymentStatus === 'partial' && (
                <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 font-label">
                  Còn nợ {foundBooking.remainingAmount.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>

            {/* Info */}
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
                  <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 block">Thanh toán</span>
                  <p className="text-sm font-medium">
                    {foundBooking.paymentStatus === 'paid' ? 'Đã thanh toán' :
                     foundBooking.paymentStatus === 'partial' ? `${foundBooking.paidAmount.toLocaleString('vi-VN')}đ` :
                     'Chưa thanh toán'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-[#D0C5AF]/30 pt-5 space-y-3">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/customer/bookings/${foundBooking!.id}`)}
                  className="px-6 py-2.5 border border-[var(--color-primary)] text-[var(--color-primary)] font-sans uppercase tracking-wider text-[10px] hover:bg-[var(--color-primary)] hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">info</span>
                  Xem chi tiết
                </button>

                {canPay && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-6 py-2.5 bg-[var(--color-primary)] text-white font-sans uppercase tracking-wider text-[10px] hover:bg-[var(--color-secondary)] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">payments</span>
                    Thanh toán
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-6 py-2.5 border border-red-400 text-red-600 font-sans uppercase tracking-wider text-[10px] hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    Hủy
                  </button>
                )}

                {canReview && (
                  <button
                    onClick={() => navigate(`/customer/bookings/${foundBooking!.id}`)}
                    className="px-6 py-2.5 bg-[var(--color-tertiary)] text-white font-sans uppercase tracking-wider text-[10px] hover:opacity-90 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">rate_review</span>
                    Đánh giá
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && foundBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl text-primary">Gửi yêu cầu hủy</h3>
                <button onClick={() => setShowCancelModal(false)} className="text-primary/40 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Booking info */}
              <div className="bg-[var(--color-surface)] p-4 mb-6 space-y-1">
                <p className="text-sm font-medium text-primary">{foundBooking.tourName}</p>
                <p className="text-xs text-primary/60">Mã: {foundBooking.bookingCode} · {new Date(foundBooking.tourDate).toLocaleDateString('vi-VN')}</p>
              </div>

              {/* Refund policy */}
              <div className="bg-amber-50 border border-amber-200 p-4 mb-6 space-y-2 text-sm">
                <p className="font-bold text-amber-800 text-xs uppercase tracking-widest">Chính sách hoàn hủy</p>
                <ul className="text-amber-700 space-y-1 text-xs">
                  <li>· Hủy trước 30 ngày → hoàn 100%</li>
                  <li>· Hủy trước 15-29 ngày → hoàn 70%</li>
                  <li>· Hủy trước 7-14 ngày → hoàn 50%</li>
                  <li>· Hủy trước 3-6 ngày → hoàn 20%</li>
                </ul>
                <p className="font-medium text-amber-800 pt-2">
                  Số tiền hoàn (ước tính): <strong className="text-lg font-serif">{refundAmount.toLocaleString('vi-VN')}đ</strong>
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Lý do hủy (tùy chọn)</label>
                  <textarea
                    className="w-full border border-outline-variant/50 p-4 text-sm focus:border-[var(--color-secondary)] outline-none resize-none min-h-[80px]"
                    placeholder="Chia sẻ lý do để chúng tôi hỗ trợ tốt hơn..."
                  />
                </div>

                {/* Bank info */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-primary">Thông tin tài khoản nhận hoàn tiền</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none" placeholder="Ngân hàng" />
                    <input className="border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none font-mono" placeholder="Số tài khoản" />
                  </div>
                  <input className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none uppercase" placeholder="Tên chủ tài khoản" />
                </div>

                <label className="flex items-start gap-3 cursor-pointer text-sm text-primary/70">
                  <input type="checkbox" className="mt-0.5 accent-[var(--color-secondary)]" />
                  <span>Tôi đồng ý với chính sách hoàn hủy</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors"
                  >
                    Giữ lại đơn
                  </button>
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      // In real app: call API
                    }}
                    className="flex-1 py-3 bg-red-600 text-white font-sans uppercase tracking-wider text-xs hover:bg-red-700 transition-colors"
                  >
                    Gửi yêu cầu hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && foundBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl text-primary">Thanh toán</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-primary/40 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-[var(--color-surface)] p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary/60">Tổng tiền</span>
                    <span className="font-medium">{foundBooking.totalAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary/60">Đã thanh toán</span>
                    <span className="text-emerald-600">{foundBooking.paidAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="border-t border-outline-variant/30 pt-2 flex justify-between font-bold">
                    <span className="text-primary">Còn lại</span>
                    <span className="text-[var(--color-secondary)]">{foundBooking.remainingAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-primary">Chọn phương thức</p>
                  {['Chuyển khoản VietQR', 'Thẻ tín dụng'].map(m => (
                    <label key={m} className="flex items-center gap-3 p-4 border border-outline-variant/30 cursor-pointer hover:border-[var(--color-secondary)] transition-colors">
                      <input type="radio" name="payMethod" className="accent-[var(--color-secondary)]" />
                      <span className="text-sm">{m}</span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-3.5 bg-primary text-white font-sans uppercase tracking-wider text-xs hover:bg-[var(--color-secondary)] transition-colors"
                >
                  Thanh toán {foundBooking.remainingAmount.toLocaleString('vi-VN')}đ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
