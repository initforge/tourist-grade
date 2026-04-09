import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockBookings, type Booking, type Passenger } from '../../data/bookings';

type ExtendedBooking = Booking & {
  // Đồng bộ với schema thực: không còn notes/cancelReason/pendingAction
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PASSENGER_TYPE: Record<string, string> = {
  adult: 'Người lớn',
  child: 'Trẻ em',
  infant: 'Em bé',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Cần xác nhận đơn đặt',
  pending_cancel: 'Cần xác nhận hủy',
  booked: 'Đã đặt',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  pending_cancel: 'bg-orange-100 text-orange-700 border-orange-300',
  booked: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};
const REFUND_STATUS_LABEL: Record<string, string> = {
  none: '—',
  pending: 'Chờ hoàn tiền',
  refunded: 'Đã hoàn tiền',
  not_required: 'Không cần hoàn',
};
const PAYMENT_LABEL: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};
const PAYMENT_STYLE: Record<string, string> = {
  unpaid: 'bg-gray-100 text-gray-600',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-red-100 text-red-700',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── Passenger Edit Popup ───────────────────────────────────────────────────────

interface PassengerEditModalProps {
  passengers: Passenger[];
  onSave: (updated: Passenger[]) => void;
  onClose: () => void;
}

function PassengerEditModal({ passengers, onSave, onClose }: PassengerEditModalProps) {
  const [drafts, setDrafts] = useState<Passenger[]>(passengers.map(p => ({ ...p })));

  const handleChange = (idx: number, field: keyof Passenger, value: string) => {
    setDrafts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const canSave = drafts.every(p => {
    if (p.type === 'adult') return !!p.cccd?.trim();
    return !!p.name?.trim(); // trẻ em/em bé chỉ cần có tên (GKS có thể bổ sung sau)
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl mx-4 shadow-2xl border border-[#D0C5AF]/30 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#D0C5AF]/20 flex items-center justify-between shrink-0">
          <div>
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Cập nhật hành khách</p>
            <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421]">Danh sách Hành khách</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <p className="text-xs text-[#2A2421]/50 mb-4">
            Vui lòng nhập CCCD cho người lớn và số Giấy khai sinh cho trẻ em/ém bé dưới 14 tuổi.
          </p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#D0C5AF]/20">
                <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-8">STT</th>
                <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">Họ và tên</th>
                <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">Loại</th>
                <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">Ngày sinh</th>
                <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">
                  {drafts.some(p => p.type === 'adult') ? 'CCCD *' : 'Giấy khai sinh *'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/10">
              {drafts.map((p, idx) => (
                <tr key={idx}>
                  <td className="py-3 text-sm text-[#2A2421]/60">{idx + 1}</td>
                  <td className="py-3">
                    <input
                      value={p.name}
                      onChange={e => handleChange(idx, 'name', e.target.value)}
                      className="w-full border border-[#D0C5AF]/40 px-2 py-1 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </td>
                  <td className="py-3 text-xs">
                    <span className={`px-2 py-0.5 ${p.type === 'adult' ? 'bg-blue-50 text-blue-600' : p.type === 'child' ? 'bg-amber-50 text-amber-600' : 'bg-pink-50 text-pink-600'}`}>
                      {PASSENGER_TYPE[p.type]}
                    </span>
                  </td>
                  <td className="py-3">
                    <input
                      type="date"
                      value={p.dob}
                      onChange={e => handleChange(idx, 'dob', e.target.value)}
                      className="border border-[#D0C5AF]/40 px-2 py-1 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      value={p.cccd ?? ''}
                      onChange={e => handleChange(idx, 'cccd', e.target.value)}
                      placeholder={p.type === 'adult' ? '012345678901' : 'Số GKS'}
                      className="w-full border border-[#D0C5AF]/40 px-2 py-1 text-sm focus:border-[#D4AF37] outline-none font-mono"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#D0C5AF]/20 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onSave(drafts)}
            disabled={!canSave}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${
              canSave
                ? 'bg-[#D4AF37] text-white hover:bg-[#C49B2F]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Popup ─────────────────────────────────────────────────────────────

interface ConfirmPopupProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmPopup({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-[#D4AF37]">help</span>
        </div>
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">{title}</h3>
        <p className="text-sm text-[#2A2421]/60 mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#D4AF37] text-white hover:bg-[#C49B2F] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Reason Popup ───────────────────────────────────────────────────────

interface RejectReasonPopupProps {
  title: string;
  label: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function RejectReasonPopup({ title, label, onConfirm, onCancel }: RejectReasonPopupProps) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-6">{title}</h3>
        <div className="mb-8">
          <label className="block text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2">
            {label}
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Nhập lý do..."
            className="w-full border border-[#D0C5AF]/40 px-3 py-2 text-sm focus:border-[#D4AF37] outline-none resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${
              reason.trim()
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SalesBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | undefined>(() =>
    mockBookings.find(b => b.id === id)
  );
  const [showRefundPopup, setShowRefundPopup] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showRejectCancelPopup, setShowRejectCancelPopup] = useState(false);
  const [showConfirmCancelPopup, setShowConfirmCancelPopup] = useState(false);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [, setBillFile] = useState<File | null>(null);

  // Cleanup BLOB URLs
  useEffect(() => {
    return () => {
      if (billPreview) URL.revokeObjectURL(billPreview);
    };
  }, [billPreview]);

  if (!booking) {
    return (
      <div className="w-full min-h-full flex items-center justify-center bg-[#F3F3F3]">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Không tìm thấy đơn booking</p>
          <Link to="/sales/bookings" className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:underline">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  // refundStatus === 'pending' = yêu cầu hủy đang chờ xử lý
  const isPendingCancel = booking.status === 'pending' && booking.refundStatus === 'pending';
  const isPendingBook = booking.status === 'pending' && !isPendingCancel;

  // Nút "Xác nhận" chỉ hiện khi tất cả adults có CCCD
  const allAdultsHaveCCCD = booking.passengers
    .filter(p => p.type === 'adult')
    .every(p => !!p.cccd?.trim());

  const canConfirm = booking.status === 'pending' && allAdultsHaveCCCD;
  const canRefund = booking.status === 'cancelled' && booking.refundStatus === 'pending';

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillFile(file);
      setBillPreview(URL.createObjectURL(file));
    }
  };
  const handleClearBill = () => {
    if (billPreview) URL.revokeObjectURL(billPreview);
    setBillFile(null);
    setBillPreview(null);
  };
  const handleConfirmRefund = () => {
    if (!billPreview) return;
    const url = billPreview;
    setBooking(prev => prev ? { ...prev, refundStatus: 'refunded' as const, refundBillUrl: url } : prev);
    setBillFile(null);
    setBillPreview(null);
    setShowRefundPopup(false);
  };

  const handleSavePassengers = (updated: Passenger[]) => {
    setBooking(prev => prev ? { ...prev, passengers: updated } : prev);
    setShowPassengerModal(false);
  };

  // Xác nhận đơn đặt → chuyển sang Đã xác nhận
  const handleConfirmBooking = () => {
    setBooking(prev => prev ? { ...prev, status: 'confirmed' as const } : prev);
    setShowConfirmPopup(false);
  };

  // Từ chối hủy → chuyển về Đã đặt
  const handleRejectCancel = (reason: string) => {
    setBooking(prev => prev ? { ...prev, status: 'booked' as const } : prev);
    setShowRejectCancelPopup(false);
  };

  // Xác nhận hủy → chuyển sang Đã hủy + pending refund
  const handleConfirmCancel = () => {
    setBooking(prev => prev ? {
      ...prev,
      status: 'cancelled' as const,
      refundStatus: 'pending' as const,
    } : prev);
    setShowConfirmCancelPopup(false);
  };

  const handleDownloadPassengers = () => {
    let content = '\uFEFF';
    content += 'THÔNG TIN TOUR\n';
    content += `Tên tour,${booking.tourName}\n`;
    content += `Ngày khởi hành,${formatDate(booking.tourDate)}\n`;
    content += `Thời gian,${booking.tourDuration}\n`;
    content += `Mã đơn,${booking.bookingCode}\n\n`;
    content += 'DANH SÁCH HÀNH KHÁCH\n';
    content += 'STT,Họ và Tên,Loại,Ngày sinh,Giới tính,CCCD/GKS\n';
    booking.passengers.forEach((p, i) => {
      content += `${i + 1},${p.name},${PASSENGER_TYPE[p.type]},${p.dob},${p.gender === 'male' ? 'Nam' : 'Nữ'},${p.cccd || ''}\n`;
    });
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `DSHK_${booking.bookingCode}.xls`; a.click();
    URL.revokeObjectURL(url);
  };

  const displayStatus = booking.status === 'pending'
    ? (isPendingCancel ? 'pending_cancel' : 'pending')
    : booking.status;

  return (
    <div className="w-full min-h-full bg-[#F3F3F3]">

      {/* ── POPUP: Passenger Edit ── */}
      {showPassengerModal && (
        <PassengerEditModal
          passengers={booking.passengers}
          onSave={handleSavePassengers}
          onClose={() => setShowPassengerModal(false)}
        />
      )}

      {/* ── POPUP: Confirm Xác nhận đơn ── */}
      {showConfirmPopup && (
        <ConfirmPopup
          title="Xác nhận đơn đặt"
          message={`Bạn có chắc muốn xác nhận đơn #${booking.bookingCode}?`}
          confirmLabel="Có, xác nhận"
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmPopup(false)}
        />
      )}

      {/* ── POPUP: Từ chối hủy ── */}
      {showRejectCancelPopup && (
        <RejectReasonPopup
          title="Từ chối yêu cầu hủy"
          label="Lý do từ chối"
          onConfirm={handleRejectCancel}
          onCancel={() => setShowRejectCancelPopup(false)}
        />
      )}

      {/* ── POPUP: Xác nhận hủy đơn ── */}
      {showConfirmCancelPopup && (
        <ConfirmPopup
          title="Xác nhận hủy đơn"
          message={`Xác nhận hủy đơn #${booking.bookingCode} và tiến hành hoàn tiền cho khách?`}
          confirmLabel="Có, hủy đơn"
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowConfirmCancelPopup(false)}
        />
      )}

      {/* ── POPUP: Hoàn tiền ── */}
      {showRefundPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={() => setShowRefundPopup(false)}></div>
          <div className="relative bg-white w-full max-w-md mx-4 shadow-2xl border border-[#D0C5AF]/30">
            <div className="p-6 border-b border-[#D0C5AF]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Hoàn tiền</p>
                  <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421]">Hoàn tiền đơn hàng</h3>
                </div>
                <button onClick={() => setShowRefundPopup(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
                  <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-[#FAFAF5] p-4 border border-[#D0C5AF]/20 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/50">Mã đơn</span>
                  <span className="font-semibold font-['Noto_Serif']">#{booking.bookingCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/50">Số tiền cần hoàn</span>
                  <span className="font-bold text-[#D4AF37] font-['Noto_Serif']">{formatCurrency(booking.totalAmount)}</span>
                </div>
                {booking.bankInfo && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2A2421]/50">Số tài khoản</span>
                      <span className="font-mono">{booking.bankInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2A2421]/50">Ngân hàng</span>
                      <span>{booking.bankInfo.bankName}</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2">Ảnh bill chuyển khoản *</p>
                {billPreview ? (
                  <div className="relative">
                    <img src={billPreview} alt="Bill" className="w-full max-h-48 object-contain border border-[#D0C5AF]/30 bg-gray-50" />
                    <button onClick={handleClearBill} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D0C5AF]/50 bg-[#FAFAF5] cursor-pointer hover:border-[#D4AF37] transition-colors">
                    <span className="material-symbols-outlined text-3xl text-[#D0C5AF] mb-2">cloud_upload</span>
                    <span className="text-xs text-[#2A2421]/40">Click để tải ảnh bill lên</span>
                    <input type="file" accept="image/*" onChange={handleBillUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#D0C5AF]/20 flex gap-3">
              <button onClick={() => setShowRefundPopup(false)} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRefund}
                disabled={!billPreview}
                className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${
                  billPreview ? 'bg-[#D4AF37] text-white hover:bg-[#C49B2F]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Xác nhận hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-5xl mx-auto p-6 md:p-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm">
          <Link to="/sales/bookings" className="text-[#D4AF37] hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            Danh sách đơn booking
          </Link>
          <span className="text-[#2A2421]/30">/</span>
          <span className="text-[#2A2421]/60">Chi tiết đơn booking</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="space-y-1">
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Chi tiết đặt chỗ</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Đơn hàng #{booking.bookingCode}</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border ${ORDER_STATUS_STYLE[displayStatus]}`}>
              {ORDER_STATUS_LABEL[displayStatus]}
            </span>
            {booking.status === 'cancelled' && (
              <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border ${
                booking.refundStatus === 'refunded' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : booking.refundStatus === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}>
                {REFUND_STATUS_LABEL[booking.refundStatus]}
              </span>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tour Info */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Thông tin Hành trình</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Tên tour</p>
                  <p className="text-sm font-medium">{booking.tourName}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ngày khởi hành</p>
                  <p className="text-sm font-medium font-['Noto_Serif'] text-[#D4AF37]">{formatDate(booking.tourDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Thời gian</p>
                  <p className="text-sm font-medium">{booking.tourDuration}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Số hành khách</p>
                  <p className="text-sm font-medium">
                    {booking.passengers.filter(p => p.type === 'adult').length} NL /{' '}
                    {booking.passengers.filter(p => p.type === 'child').length} TE /{' '}
                    {booking.passengers.filter(p => p.type === 'infant').length} EB
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Phương thức thanh toán</p>
                  <p className="text-sm font-medium uppercase">{booking.paymentMethod}</p>
                </div>
                {/* Ghi chú từ contactInfo.note */}
                {booking.contactInfo.note && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ghi chú</p>
                    <p className="text-xs text-[#2A2421]/70 bg-amber-50 p-3 border border-amber-200">{booking.contactInfo.note}</p>
                  </div>
                )}
                {/* Lý do hủy */}
                {booking.status === 'cancelled' && booking.cancellationReason && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-red-400 mb-1">Lý do hủy</p>
                    <p className="text-xs text-red-600 bg-red-50 p-3 border border-red-200">{booking.cancellationReason}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Passenger List */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#D4AF37]"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Danh sách Hành khách</h2>
                  <span className="ml-2 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold">{booking.passengers.length}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPassengers}
                    className="flex items-center gap-1.5 bg-[#2A2421] text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Tải về DSHK
                  </button>
                  {/* Chỉ tab Cần xác nhận đơn đặt mới cho chỉnh sửa */}
                  {isPendingBook && (
                    <button
                      onClick={() => setShowPassengerModal(true)}
                      className="flex items-center gap-1.5 border border-[#D4AF37] text-[#D4AF37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37]/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>

              {!allAdultsHaveCCCD && isPendingBook && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
                  <p className="text-xs text-amber-800">
                    Vui lòng điền đầy đủ CCCD cho người lớn và số Giấy khai sinh cho trẻ em dưới 14 tuổi trước khi xác nhận.
                  </p>
                </div>
              )}

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#D0C5AF]/20">
                    <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-8">STT</th>
                    <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">Họ và tên</th>
                    <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">Loại</th>
                    <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">Ngày sinh</th>
                    <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold">CCCD / GKS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/10">
                  {booking.passengers.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-sm text-[#2A2421]/60">{idx + 1}</td>
                      <td className="py-3 text-sm font-semibold">{p.name}</td>
                      <td className="py-3 text-xs">
                        <span className={`px-2 py-0.5 ${p.type === 'adult' ? 'bg-blue-50 text-blue-600' : p.type === 'child' ? 'bg-amber-50 text-amber-600' : 'bg-pink-50 text-pink-600'}`}>
                          {PASSENGER_TYPE[p.type]}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-[#2A2421]/60">{p.dob}</td>
                      <td className="py-3 text-sm font-mono text-[#2A2421]/70">{p.cccd || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Refund Bill */}
            {booking.refundStatus === 'refunded' && booking.refundBillUrl && (
              <section className="bg-white border border-emerald-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-emerald-700">Ảnh bill chuyển khoản hoàn tiền</h2>
                </div>
                <img src={booking.refundBillUrl} alt="Bill hoàn tiền" className="max-w-sm border border-[#D0C5AF]/30" />
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Action Buttons — chỉ hiện khi Cần xác nhận */}
            {booking.status === 'pending' && (
              <div className="bg-white border border-[#D0C5AF]/20 p-6 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-[#D4AF37]"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Hành động</h2>
                </div>

                {isPendingBook && (
                  <>
                    {/* Cần xác nhận đơn đặt */}
                    <button
                      onClick={() => setShowPassengerModal(true)}
                      className="w-full flex items-center justify-center gap-2 border border-[#D4AF37] text-[#D4AF37] py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold hover:bg-[#D4AF37]/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      Chỉnh sửa danh sách HK
                    </button>
                    <button
                      onClick={() => setShowConfirmPopup(true)}
                      disabled={!canConfirm}
                      className={`w-full flex items-center justify-center gap-2 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${
                        canConfirm
                          ? 'bg-[#D4AF37] text-white hover:bg-[#C49B2F]'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Xác nhận đơn đặt
                    </button>
                  </>
                )}

                {isPendingCancel && (
                  <>
                    {/* Cần xác nhận hủy */}
                    <button
                      onClick={() => setShowConfirmCancelPopup(true)}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Xác nhận hủy đơn
                    </button>
                    <button
                      onClick={() => setShowRejectCancelPopup(true)}
                      className="w-full flex items-center justify-center gap-2 border border-[#2A2421]/20 text-[#2A2421]/70 py-3 text-xs font-['Inter'] uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">undo</span>
                      Từ chối hủy
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Customer Info */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Khách hàng</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Họ và tên</p>
                  <p className="text-sm font-semibold">{booking.contactInfo.name}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Email</p>
                  <p className="text-sm">{booking.contactInfo.email}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Số điện thoại</p>
                  <p className="text-sm font-medium text-[#D4AF37]">{booking.contactInfo.phone}</p>
                </div>
                {booking.contactInfo.note && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ghi chú</p>
                    <p className="text-xs text-[#2A2421]/70 bg-[#FAFAF5] p-3 border border-[#D0C5AF]/20">{booking.contactInfo.note}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Thanh toán</h2>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/60">Tổng tiền</span>
                  <span className="font-['Noto_Serif'] font-bold text-lg">{formatCurrency(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#2A2421]/50">
                  <span>Phương thức</span>
                  <span className="uppercase font-medium">{booking.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#2A2421]/50">Trạng thái thanh toán</span>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking.paymentStatus] ?? ''}`}>
                    {PAYMENT_LABEL[booking.paymentStatus] ?? '—'}
                  </span>
                </div>
                {booking.status === 'cancelled' && booking.refundAmount && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-red-500">Số tiền hoàn</span>
                    <span className="font-bold text-red-600">{formatCurrency(booking.refundAmount)}</span>
                  </div>
                )}
              </div>

              {/* Hoàn tiền */}
              {canRefund && (
                <button
                  onClick={() => setShowRefundPopup(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-white py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold hover:bg-[#C49B2F] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  Hoàn tiền
                </button>
              )}
              {booking.refundStatus === 'refunded' && (
                <div className="w-full flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-emerald-300">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Đã hoàn tiền
                </div>
              )}
            </section>

            {/* Bank Info */}
            {booking.bankInfo && (
              <section className="bg-white border border-[#D0C5AF]/20 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-4 bg-[#D4AF37]"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Thông tin Ngân hàng</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Chủ tài khoản</p>
                    <p className="text-sm font-medium">{booking.bankInfo.accountHolder}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Số tài khoản</p>
                    <p className="text-sm font-mono">{booking.bankInfo.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ngân hàng</p>
                    <p className="text-sm font-medium">{booking.bankInfo.bankName}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
