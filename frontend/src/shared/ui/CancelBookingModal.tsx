import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '@entities/booking/data/bookings';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { createPublicCancelRequest } from '@shared/lib/api/bookings';
import { formatCurrency, getRefundAmountEstimate } from '@shared/lib/booking';

interface CancelBookingModalProps {
  booking: Booking;
  onClose: () => void;
}

export function CancelBookingModal({ booking, onClose }: CancelBookingModalProps) {
  const navigate = useNavigate();
  const upsertBooking = useAppDataStore((state) => state.upsertBooking);
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState(booking.bankInfo?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(booking.bankInfo?.accountNumber ?? '');
  const [accountHolder, setAccountHolder] = useState(booking.bankInfo?.accountHolder ?? '');
  const [agreed, setAgreed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refundAmount = getRefundAmountEstimate(booking);
  const canSubmit = agreed && bankName.trim() && accountNumber.trim() && accountHolder.trim();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        cancellationReason: reason.trim() || 'Khách hàng gửi yêu cầu hủy',
        bankInfo: {
          accountNumber: accountNumber.trim(),
          bankName: bankName.trim(),
          accountHolder: accountHolder.trim(),
        },
      };

      const response = await createPublicCancelRequest(booking.id, {
        contact: booking.contactInfo.email || booking.contactInfo.phone,
        ...payload,
      });

      upsertBooking(response.booking);
      setIsSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi yêu cầu hủy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-white shadow-2xl p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-tertiary)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-[var(--color-tertiary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h3 className="font-serif text-2xl text-primary">Đã gửi yêu cầu hủy</h3>
          <p className="text-sm text-primary/70">
            Đơn <strong>{booking.bookingCode}</strong> đã được cập nhật. Bộ phận kinh doanh sẽ xử lý trong thời gian sớm nhất.
          </p>
          <button
            onClick={() => {
              onClose();
              navigate('/customer/bookings');
            }}
            className="w-full bg-primary text-white py-4 font-sans uppercase tracking-wider text-xs hover:bg-[var(--color-secondary)] transition-colors"
          >
            Quay lại danh sách đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
        className="relative w-full max-w-lg bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 id="cancel-booking-title" className="font-serif text-2xl text-primary">Gửi yêu cầu hủy</h3>
            <button onClick={onClose} className="text-primary/40 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="bg-[var(--color-surface)] p-4 mb-5 space-y-1">
            <p className="text-sm font-medium text-primary">{booking.tourName}</p>
            <p className="text-xs text-primary/60">
              {booking.bookingCode} · {new Date(booking.tourDate).toLocaleDateString('vi-VN')} · {booking.tourDuration}
            </p>
            <p className="text-xs text-primary/60">
              Đã thanh toán: <strong className="text-primary">{formatCurrency(booking.paidAmount)}</strong>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 mb-6 space-y-2">
            <p className="font-bold text-amber-800 text-xs uppercase tracking-widest">Chính sách hoàn hủy</p>
            <div className="space-y-1 text-xs text-amber-700">
              <div className="flex justify-between"><span>Hủy trước 30 ngày</span><strong>→ hoàn 100%</strong></div>
              <div className="flex justify-between"><span>Hủy trước 15-29 ngày</span><strong>→ hoàn 70%</strong></div>
              <div className="flex justify-between"><span>Hủy trước 7-14 ngày</span><strong>→ hoàn 50%</strong></div>
              <div className="flex justify-between"><span>Hủy trước 3-6 ngày</span><strong>→ hoàn 20%</strong></div>
            </div>
            <div className="border-t border-amber-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-xs text-amber-800 font-medium">Số tiền hoàn ước tính</span>
              <span className="text-xl font-serif font-bold text-amber-800">{formatCurrency(refundAmount)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Lý do hủy</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full border border-outline-variant/50 p-4 text-sm focus:border-[var(--color-secondary)] outline-none resize-none min-h-[70px]"
                placeholder="Chia sẻ lý do để chúng tôi hỗ trợ tốt hơn..."
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">Thông tin tài khoản nhận hoàn tiền</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/50 font-label block mb-1">Ngân hàng *</label>
                  <input
                    value={bankName}
                    onChange={(event) => setBankName(event.target.value)}
                    className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none"
                    placeholder="Vietcombank"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/50 font-label block mb-1">Số tài khoản *</label>
                  <input
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none font-mono"
                    placeholder="1234567890"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/50 font-label block mb-1">Tên chủ tài khoản *</label>
                <input
                  value={accountHolder}
                  onChange={(event) => setAccountHolder(event.target.value)}
                  className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none uppercase"
                  placeholder="NGUYEN VAN A"
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer text-sm text-primary/70">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-0.5 accent-[var(--color-secondary)]"
              />
              <span>Tôi đồng ý với chính sách hoàn hủy và xác nhận thông tin tài khoản trên là chính xác.</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors"
              >
                Giữ lại đơn
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`flex-1 py-3 font-sans uppercase tracking-wider text-xs transition-colors ${
                  canSubmit && !isSubmitting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
