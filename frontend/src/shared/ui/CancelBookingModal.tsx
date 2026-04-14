import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '@entities/booking/data/bookings';

interface CancelBookingModalProps {
  booking: Booking;
  onClose: () => void;
}

export function CancelBookingModal({ booking, onClose }: CancelBookingModalProps) {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysLeft = Math.ceil(
    (new Date(booking?.tourDate)?.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const refundPercent =
    daysLeft >= 30 ? 100 :
    daysLeft >= 15 ? 70 :
    daysLeft >= 7  ? 50 :
    daysLeft >= 3  ? 20 : 0;

  const refundAmount = Math.round(booking?.paidAmount * refundPercent / 100);
  const canSubmit = agreed && bankName?.trim() && accountNumber?.trim() && accountHolder?.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-booking-success-title"
          className="relative w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-300 p-8 text-center space-y-5"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-tertiary)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[40px] text-[var(--color-tertiary)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h3 id="cancel-booking-success-title" className="font-serif text-2xl text-primary">Đã gửi yêu cầu hủy</h3>
          <p className="text-sm text-primary/70">
            Yêu cầu hủy đơn <strong>{booking?.bookingCode}</strong> đã được tiếp nhận?. Bộ phận Concierge sẽ liên hệ trong 24h?.
          </p>
          <button
            onClick={() => { onClose(); navigate('/customer/bookings'); }}
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 id="cancel-booking-title" className="font-serif text-2xl text-primary">Gửi yêu cầu hủy</h3>
            <button onClick={onClose} className="text-primary/40 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Booking info */}
          <div className="bg-[var(--color-surface)] p-4 mb-5 space-y-1">
            <p className="text-sm font-medium text-primary">{booking?.tourName}</p>
            <p className="text-xs text-primary/60">
              {booking?.bookingCode} · {new Date(booking?.tourDate)?.toLocaleDateString('vi-VN')} · {booking?.tourDuration}
            </p>
            <p className="text-xs text-primary/60">
              Đã thanh toán: <strong className="text-primary">{booking?.paidAmount?.toLocaleString('vi-VN')}đ</strong>
            </p>
          </div>

          {/* Refund policy */}
          <div className="bg-amber-50 border border-amber-200 p-4 mb-6 space-y-2">
            <p className="font-bold text-amber-800 text-xs uppercase tracking-widest">Chính sách hoàn hủy</p>
            <div className="space-y-1 text-xs text-amber-700">
              <div className="flex justify-between"><span>Hủy trước 30 ngày</span><strong>→ hoàn 100%</strong></div>
              <div className="flex justify-between"><span>Hủy trước 15-29 ngày</span><strong>→ hoàn 70%</strong></div>
              <div className="flex justify-between"><span>Hủy trước 7-14 ngày</span><strong>→ hoàn 50%</strong></div>
              <div className="flex justify-between"><span>Hủy trước 3-6 ngày</span><strong>→ hoàn 20%</strong></div>
            </div>
            <div className="border-t border-amber-200 pt-2 mt-2 flex justify-between items-center">
              <span className="text-xs text-amber-800 font-medium">Số tiền hoàn (ước tính)</span>
              <span className="text-xl font-serif font-bold text-amber-800">
                {refundAmount?.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Reason */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                Lý do hủy (tùy chọn)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e?.target?.value)}
                className="w-full border border-outline-variant/50 p-4 text-sm focus:border-[var(--color-secondary)] outline-none resize-none min-h-[70px]"
                placeholder="Chia sẻ l? do để chúng tôi hỗ trợ tốt hơn..."
              />
            </div>

            {/* Bank info */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">Thông tin tài khoản nhận hoàn tiền</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/50 font-label block mb-1">Ngàn hàng *</label>
                  <input
                    value={bankName}
                    onChange={e => setBankName(e?.target?.value)}
                    className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none"
                    placeholder="Vietcombank"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/50 font-label block mb-1">Số tài khoản *</label>
                  <input
                    value={accountNumber}
                    onChange={e => setAccountNumber(e?.target?.value)}
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
                  onChange={e => setAccountHolder(e?.target?.value)}
                  className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none uppercase"
                  placeholder="NGUYEN VAN A"
                  required
                />
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer text-sm text-primary/70">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e?.target?.checked)}
                className="mt-0.5 accent-[var(--color-secondary)]"
              />
              <span>Tôi đồng ? với chành sách hoàn hủy và xác nhận thông tin tài khoản trên l? chành xác?.</span>
            </label>

            {/* Actions */}
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

