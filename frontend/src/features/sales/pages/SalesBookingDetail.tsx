import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import type { Booking, Passenger } from '@entities/booking/data/bookings';
import { useAuthStore } from '@shared/store/useAuthStore';
import { isVietnameseNationality } from '@shared/lib/bookingLifecycle';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { updateBooking } from '@shared/lib/api/bookings';
import { NationalitySelect } from '@shared/ui/NationalitySelect';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PASSENGER_TYPE: Record<string, string> = {
  adult: 'Người lớn',
  child: 'Trẻ em',
  infant: 'Em bé',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Cần xác nhận đơn đặt',
  pending_cancel: 'Cần xác nhận hủy',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  pending_cancel: 'bg-orange-100 text-orange-700 border-orange-300',
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
  partial: '50%',
  paid: '100%',
  refunded: '100%',
};
const PAYMENT_STYLE: Record<string, string> = {
  unpaid: 'bg-gray-100 text-gray-600',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  refunded: 'bg-red-100 text-red-700',
};
const PAYMENT_METHOD_LABEL: Record<Booking['paymentMethod'], string> = {
  vnpay: 'VNPAY / VietQR',
  stripe: 'Thẻ / Stripe',
  payos: 'PayOS',
};

type RoomCounts = NonNullable<Booking['roomCounts']>;
type RoomCountsDraft = Record<keyof RoomCounts, string>;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN')?.format(amount) + ' VND';
}
function formatDate(dateStr: string) {
  return new Date(dateStr)?.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatAuditDateTime(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN', {
    timeZone: 'UTC',
    hour12: false,
  });
}

const MAX_REFUND_BILL_FILE_BYTES = 25 * 1024 * 1024;
const MAX_REFUND_BILL_DATA_URL_LENGTH = 12_000_000;
const MAX_REFUND_BILL_DIMENSION = 2200;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Không thể đọc file bill.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromObjectUrl(objectUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không thể đọc nội dung ảnh bill.'));
    image.src = objectUrl;
  });
}

function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality: number) {
  return canvas.toDataURL('image/jpeg', quality);
}

async function optimizeRefundBillFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('File bill hoàn tiền phải là hình ảnh.');
  }

  if (file.size > MAX_REFUND_BILL_FILE_BYTES) {
    throw new Error('Ảnh bill quá lớn. Vui lòng chọn file nhỏ hơn 25MB.');
  }

  if (file.type === 'image/svg+xml') {
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > MAX_REFUND_BILL_DATA_URL_LENGTH) {
      throw new Error('Ảnh SVG quá lớn sau khi xử lý. Vui lòng dùng ảnh nhẹ hơn.');
    }
    return dataUrl;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const canvas = document.createElement('canvas');

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Không thể xử lý ảnh bill trên trình duyệt hiện tại.');
    }

    const dimensionSteps = [MAX_REFUND_BILL_DIMENSION, 1800, 1400, 1000];
    const qualitySteps = [0.9, 0.84, 0.76, 0.68, 0.6, 0.52];
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight, 1);

    for (const maxDimension of dimensionSteps) {
      const scale = Math.min(1, maxDimension / longestEdge);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualitySteps) {
        const dataUrl = canvasToJpegDataUrl(canvas, quality);
        if (dataUrl.length <= MAX_REFUND_BILL_DATA_URL_LENGTH) {
          return dataUrl;
        }
      }
    }

    throw new Error('Ảnh bill vẫn quá lớn sau khi tối ưu. Vui lòng cắt bớt hoặc giảm độ phân giải ảnh.');
  } catch (error) {
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length <= MAX_REFUND_BILL_DATA_URL_LENGTH) {
      return dataUrl;
    }
    throw error;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function toRoomCountsDraft(roomCounts?: Booking['roomCounts']): RoomCountsDraft {
  return {
    single: String(roomCounts?.single ?? 0),
    double: String(roomCounts?.double ?? 0),
    triple: String(roomCounts?.triple ?? 0),
  };
}

function parseRoomCountsDraft(draft: RoomCountsDraft): RoomCounts {
  return {
    single: Math.max(0, Number(draft.single) || 0),
    double: Math.max(0, Number(draft.double) || 0),
    triple: Math.max(0, Number(draft.triple) || 0),
  };
}

function getPassengerDocumentError(passenger: Passenger) {
  const documentValue = passenger?.cccd?.trim() ?? '';
  const requiresVietnameseDocumentValidation = isVietnameseNationality(passenger.nationality);

  if (!documentValue) {
    return passenger.type === 'adult'
      ? 'Vui lòng nhập số CCCD/Căn cước.'
      : 'Vui lòng nhập số giấy khai sinh.';
  }

  if (!requiresVietnameseDocumentValidation) {
    return null;
  }

  if (passenger.type === 'adult') {
    return /^\d{12}$/.test(documentValue)
      ? null
      : 'CCCD/Căn cước phải gồm đúng 12 chữ số.';
  }

  return /^\d{12}$/.test(documentValue)
    ? null
    : 'Giấy khai sinh phải gồm đúng 12 chữ số.';
}

function isValidPassengerDocument(passenger: Passenger) {
  return getPassengerDocumentError(passenger) === null;
}

function hasCompletePassengerData(passenger: Passenger) {
  return Boolean(
    passenger?.name?.trim() &&
    passenger?.dob &&
    passenger?.gender &&
    passenger?.nationality?.trim() &&
    isValidPassengerDocument(passenger),
  );
}

// ── Passenger Edit Popup ───────────────────────────────────────────────────────

interface PassengerEditModalProps {
  passengers: Passenger[];
  onSave: (updated: Passenger[]) => void;
  onClose: () => void;
}

function PassengerEditModal({ passengers, onSave, onClose }: PassengerEditModalProps) {
  const [drafts, setDrafts] = useState<Passenger[]>(passengers?.map(p => ({ nationality: 'Việt Nam', ...p })));

  const handleChange = (idx: number, field: keyof Passenger, value: string) => {
    setDrafts(prev => prev?.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="passenger-edit-title">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-[calc(100vw-2rem)] max-w-6xl mx-4 shadow-2xl border border-[#D0C5AF]/30 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#D0C5AF]/20 flex items-center justify-between shrink-0">
          <div>
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Cập nhật hành khách</p>
            <h3 id="passenger-edit-title" className="font-['Noto_Serif'] text-xl text-[#2A2421]">Danh sách Hành khách</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <p className="text-xs text-[#2A2421]/50 mb-4">
            Có thể lưu tạm danh sách hành khách khi thông tin còn thiếu. Hệ thống sẽ chỉ kiểm tra đủ thông tin, CCCD/Căn cước và GKS khi xác nhận đơn đặt.
          </p>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left table-fixed">
            <thead>
              <tr className="border-b border-[#D0C5AF]/20">
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-10">STT</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-44">Họ và tên</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-24">Loại</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-28">Giới tính</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-40">Ngày sinh</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-44">CCCD / GKS *</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-52">Quốc tịch</th>
                {drafts?.some(p => p.type === 'adult') && (
                  <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold text-right w-24">Phụ thu đơn</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/10">
              {drafts?.map((p, idx) => {
                return (
                <tr key={idx}>
                  <td className="py-3 pr-3 text-sm text-[#2A2421]/60">{idx + 1}</td>
                  <td className="py-3 pr-3">
                    <input
                      value={p?.name}
                      onChange={e => handleChange(idx, 'name', e?.target?.value)}
                      className="w-full border border-[#D0C5AF]/40 px-2 py-1 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    <span className={`inline-flex px-2 py-0.5 whitespace-nowrap ${p.type === 'adult' ? 'bg-blue-50 text-blue-600' : p.type === 'child' ? 'bg-amber-50 text-amber-600' : 'bg-pink-50 text-pink-600'}`}>
                      {PASSENGER_TYPE[p?.type]}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      value={p?.gender}
                      onChange={e => handleChange(idx, 'gender', e?.target?.value)}
                      className="w-full border border-[#D0C5AF]/40 px-2 py-1 text-xs focus:border-[#D4AF37] outline-none bg-white"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="date"
                      value={p?.dob}
                      onChange={e => handleChange(idx, 'dob', e?.target?.value)}
                      className="w-full border border-[#D0C5AF]/40 px-2 py-1 text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      value={p?.cccd ?? ''}
                      onChange={e => handleChange(idx, 'cccd', e?.target?.value)}
                      placeholder={p.type === 'adult' ? '012345678901' : 'Số GKS'}
                      inputMode={p.type === 'adult' ? 'numeric' : 'text'}
                      className="w-full border border-[#D0C5AF]/40 px-2 py-1 text-sm outline-none font-mono focus:border-[#D4AF37]"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <NationalitySelect
                      value={p?.nationality ?? 'Việt Nam'}
                      onChange={value => handleChange(idx, 'nationality', value)}
                      ariaLabel={`Quốc tịch hành khách ${idx + 1}`}
                    />
                  </td>
                  {p.type === 'adult' ? (
                    <td className="py-3 text-xs text-right text-[#2A2421]/60 font-mono">
                      {p?.singleRoomSupplement ? `+${p?.singleRoomSupplement?.toLocaleString('vi-VN')}đ` : '—'}
                    </td>
                  ) : (
                    <td className="py-3 text-sm text-[#2A2421]/30 text-right">—</td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
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
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors bg-[#D4AF37] text-white hover:bg-[#C49B2F]"
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function SalesBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tab = searchParams?.get('tab') ?? 'pending_confirm';
  const currentUser = useAuthStore(s => s?.user);
  const accessToken = useAuthStore(s => s?.accessToken);
  const bookings = useAppDataStore(s => s.bookings);
  const protectedLoading = useAppDataStore(s => s.protectedLoading);
  const upsertBooking = useAppDataStore(s => s.upsertBooking);

  const foundBooking = bookings?.find(b => b.id === id || b.bookingCode === id);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showRefundPopup, setShowRefundPopup] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showConfirmCancelPopup, setShowConfirmCancelPopup] = useState(false);

  // Bill edit state (for refunded bookings)
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPersistedValue, setBillPersistedValue] = useState<string | null>(null);
  const [isProcessingBill, setIsProcessingBill] = useState(false);
  const [isEditingBill, setIsEditingBill] = useState(false);
  const [roomCountsDraft, setRoomCountsDraft] = useState<RoomCountsDraft>(
    toRoomCountsDraft(foundBooking?.roomCounts)
  );
  const [showEmailToast, setShowEmailToast] = useState(false);
  const [persistCount, setPersistCount] = useState(0);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!foundBooking) return;

    setBooking(foundBooking);
    setRoomCountsDraft(toRoomCountsDraft(foundBooking.roomCounts));
    setBillPreview(foundBooking.refundBillUrl ?? null);
    setBillPersistedValue(foundBooking.refundBillUrl ?? null);
    setBillFile(null);
  }, [foundBooking]);

  // Cleanup BLOB URLs
  useEffect(() => {
    return () => {
      if (billPreview?.startsWith('blob:')) URL?.revokeObjectURL(billPreview);
    };
  }, [billPreview]);

  const resetBillDraft = (savedBillUrl?: string | null) => {
    setBillPreview(currentPreview => {
      if (currentPreview?.startsWith('blob:')) {
        URL?.revokeObjectURL(currentPreview);
      }
      return savedBillUrl ?? null;
    });
    setBillFile(null);
    setBillPersistedValue(savedBillUrl ?? null);
    setIsProcessingBill(false);
  };

  if (!booking) {
    return (
      <div className="w-full min-h-full bg-[#F3F3F3] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D0C5AF]/30 p-8 text-center shadow-sm">
          <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-2">
            {protectedLoading ? 'Đang tải dữ liệu' : 'Không tìm thấy booking'}
          </p>
          <h1 className="font-['Noto_Serif'] text-2xl text-[#2A2421] mb-4">
            {protectedLoading ? 'Đang đồng bộ dữ liệu đơn hàng' : `Booking ${id ?? ''} không tồn tại`}
          </h1>
          {!protectedLoading && (
            <Link
              to={`/sales/bookings?tab=${tab}`}
              className="inline-flex items-center justify-center px-5 py-3 bg-[#2A2421] text-white text-xs font-['Inter'] uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
            >
              Danh sách đơn booking
            </Link>
          )}
        </div>
      </div>
    );
  }

  const closeRefundPopup = () => {
    resetBillDraft(booking?.refundBillUrl ?? null);
    setShowRefundPopup(false);
  };

  const persistBooking = async (
    updater: (current: Booking) => Booking,
    toPatch?: (next: Booking) => Record<string, unknown>,
  ) => {
    if (!booking) return null;

    const next = updater(booking);
    if (!accessToken) {
      message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để lưu thay đổi.');
      return null;
    }

    const payload = toPatch ? toPatch(next) : next as unknown as Record<string, unknown>;
    setPersistCount(count => count + 1);
    const job = persistQueueRef.current
      .catch(() => undefined)
      .then(() => updateBooking(next.id, payload, accessToken))
      .then((result) => {
        setBooking(result.booking);
        upsertBooking(result.booking);
        return result.booking;
      })
      .catch(() => {
        message.error('Không thể lưu thay đổi đơn booking. Vui lòng thử lại.');
        return null;
      })
      .finally(() => setPersistCount(count => Math.max(0, count - 1)));
    persistQueueRef.current = job.then(() => undefined);
    return job;
  };

  // refundStatus === 'pending' = yêu cầu hủy đang chờ xử lý
  const isPendingCancel = booking.status === 'pending_cancel';
  const isPendingBook = booking.status === 'pending';

  const hasValidPassengerData = booking?.passengers?.every(hasCompletePassengerData);
  const parsedRoomCounts = parseRoomCountsDraft(roomCountsDraft);
  const hasAssignedRooms = Object.values(parsedRoomCounts)?.some(count => count > 0);
  const canConfirm = booking.status === 'pending' && hasValidPassengerData && hasAssignedRooms && persistCount === 0;
  const isManagerTourCancellation = booking.cancellationSource === 'manager_tour_cancel';
  const canRefund = booking.status === 'cancelled' && booking.refundStatus === 'pending' && !isManagerTourCancellation;

  // ── Actions ──────────────────────────────────────────────────────────────

  const prepareBillDraft = async (file: File) => {
    if (billPreview?.startsWith('blob:')) {
      URL?.revokeObjectURL(billPreview);
    }

    const nextPreview = URL?.createObjectURL(file);
    setBillFile(file);
    setBillPreview(nextPreview);
    setBillPersistedValue(null);
    setIsProcessingBill(true);

    try {
      const optimizedValue = await optimizeRefundBillFile(file);
      setBillPersistedValue(optimizedValue);
    } catch (error) {
      URL?.revokeObjectURL(nextPreview);
      setBillFile(null);
      setBillPreview(null);
      setBillPersistedValue(null);
      throw error;
    } finally {
      setIsProcessingBill(false);
    }
  };

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    try {
      await prepareBillDraft(file);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể xử lý ảnh bill.');
    } finally {
      e.target.value = '';
    }
  };
  const handleClearBill = () => {
    if (billPreview?.startsWith('blob:')) URL?.revokeObjectURL(billPreview);
    setBillFile(null);
    setBillPreview(null);
    setBillPersistedValue(null);
    setIsProcessingBill(false);
  };
  const handleCancelBillEdit = () => {
    resetBillDraft(booking?.refundBillUrl ?? null);
    setIsEditingBill(false);
  };


  const handleConfirmRefund = async () => {
    if (!billPersistedValue || isProcessingBill) return;
    const persistedBillUrl = billPersistedValue;

    const now = new Date()?.toISOString();
    const userName = currentUser?.name ?? 'NV Kinh doanh';
    const saved = await persistBooking(prev => ({
      ...prev,
      refundStatus: 'refunded' as const,
      refundBillUrl: persistedBillUrl,
      refundedBy: userName,
      refundedAt: now,
    }));
    if (!saved) return;
    resetBillDraft(persistedBillUrl);
    setShowRefundPopup(false);
    setShowEmailToast(true);
    message.success('Đã lưu bill hoàn tiền thành công.');
    setTimeout(() => setShowEmailToast(false), 4000);
  };

  const handleSaveRoomCounts = async () => {
    const saved = await persistBooking(
      prev => ({ ...prev, roomCounts: parseRoomCountsDraft(roomCountsDraft) }),
      next => ({ roomCounts: next.roomCounts }),
    );
    if (saved) {
      message.success('Đã cập nhật thông tin phòng.');
    }
  };

  const handleSavePassengers = async (updated: Passenger[]) => {
    const saved = await persistBooking(
      prev => ({ ...prev, passengers: updated }),
      next => ({ passengers: next.passengers }),
    );
    if (!saved) return;
    setShowPassengerModal(false);
    message.success('Đã cập nhật danh sách hành khách.');
  };

  // Xác nhận đơn đặt → chuyển sang Đã xác nhận
  const handleConfirmBooking = async () => {
    const now = new Date()?.toISOString();
    const userName = currentUser?.name ?? 'NV Kinh doanh';
    const saved = await persistBooking(prev => ({
      ...prev,
      status: 'confirmed' as const,
      roomCounts: parseRoomCountsDraft(roomCountsDraft),
      confirmedBy: userName,
      confirmedAt: now,
    }));
    if (!saved) return;
    setShowConfirmPopup(false);
    message.success('Xác nhận đơn đặt tour thành công.');
  };

  // Xác nhận hủy → chuyển sang Đã hủy + pending refund
  const handleConfirmCancel = async () => {
    const now = new Date()?.toISOString();
    const userName = currentUser?.name ?? 'NV Kinh doanh';
    const saved = await persistBooking(prev => ({
      ...prev,
      status: 'cancelled' as const,
      refundStatus: 'pending' as const,
      cancelledConfirmedBy: userName,
      cancelledConfirmedAt: now,
    }));
    if (!saved) return;
    setShowConfirmCancelPopup(false);
    message.success('Xác nhận yêu cầu hủy tour thành công.');
  };

  const handleDownloadPassengers = () => {
    let content = '\uFEFF';
    content += 'THÔNG TIN TOUR\n';
    content += `Tên tour,${booking?.tourName}\n`;
    content += `Ngày khởi hành,${formatDate(booking?.tourDate)}\n`;
    content += `Thời gian,${booking?.tourDuration}\n`;
    content += `Mã đơn,${booking?.bookingCode}\n\n`;
    content += 'DANH SÁCH HÀNH KHÁCH\n';
    content += 'STT,Họ và Tên,Loại,Ngày sinh,Giới tính,Quốc tịch,CCCD/GKS,Phụ thu đơn\n';
    booking?.passengers?.forEach((p, i) => {
      content += `${i + 1},${p?.name},${PASSENGER_TYPE[p?.type]},${p?.dob},${p.gender === 'male' ? 'Nam' : 'Nữ'},${p?.nationality || 'Việt Nam'},${p?.cccd || ''},${p?.singleRoomSupplement ? formatCurrency(p?.singleRoomSupplement) : ''}\n`;
    });
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL?.createObjectURL(blob);
    const a = document?.createElement('a');
    a.href = url; a.download = `DSHK_${booking?.bookingCode}.xls`; a?.click();
    URL?.revokeObjectURL(url);
  };

  const displayStatus = booking.status === 'pending'
    ? (isPendingCancel ? 'pending_cancel' : 'pending')
    : booking?.status;

  return (
    <div className="w-full min-h-full bg-[#F3F3F3]">

      {/* ── POPUP: Passenger Edit ── */}
      {showPassengerModal && (
        <PassengerEditModal
          passengers={booking?.passengers}
          onSave={handleSavePassengers}
          onClose={() => setShowPassengerModal(false)}
        />
      )}

      {/* ── POPUP: Confirm Xác nhận đơn ── */}
      {showConfirmPopup && (
        <ConfirmPopup
          title="Xác nhận đơn đặt"
          message={`Bạn có chắc muốn xác nhận đơn #${booking?.bookingCode}?`}
          confirmLabel="Có, xác nhận"
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmPopup(false)}
        />
      )}

      {/* ── POPUP: Xác nhận hủy đơn ── */}
      {showConfirmCancelPopup && (
        <ConfirmPopup
          title="Xác nhận hủy đơn"
          message={`Xác nhận hủy đơn #${booking?.bookingCode} và tiến hành hoàn tiền cho khách?`}
          confirmLabel="Có, hủy đơn"
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowConfirmCancelPopup(false)}
        />
      )}

      {/* ── POPUP: Hoàn tiền ── */}
      {showRefundPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="refund-payment-title">
          <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={closeRefundPopup}></div>
          <div className="relative bg-white w-full max-w-md mx-4 shadow-2xl border border-[#D0C5AF]/30">
            <div className="p-6 border-b border-[#D0C5AF]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Hoàn tiền</p>
                  <h3 id="refund-payment-title" className="font-['Noto_Serif'] text-xl text-[#2A2421]">Hoàn tiền đơn hàng</h3>
                </div>
                <button onClick={closeRefundPopup} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
                  <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-[#FAFAF5] p-4 border border-[#D0C5AF]/20 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/50">Mã đơn</span>
                  <span className="font-semibold font-['Noto_Serif']">#{booking?.bookingCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/50">Số tiền cần hoàn</span>
                  <span className="font-bold text-[#D4AF37] font-['Noto_Serif']">{formatCurrency(booking?.refundAmount ?? 0)}</span>
                </div>
                {booking?.bankInfo && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2A2421]/50">Số tài khoản</span>
                      <span className="font-mono">{booking?.bankInfo?.accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2A2421]/50">Ngân hàng</span>
                      <span>{booking?.bankInfo?.bankName}</span>
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
              <button onClick={closeRefundPopup} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRefund}
                  disabled={!billPersistedValue || isProcessingBill}
                className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${
                    billPersistedValue && !isProcessingBill ? 'bg-[#D4AF37] text-white hover:bg-[#C49B2F]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                  {isProcessingBill ? 'Đang tối ưu bill' : 'Xác nhận hoàn tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email notification toast ── */}
      {showEmailToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom">
          <span className="material-symbols-outlined text-xl">mail</span>
          <div>
            <p className="text-sm font-semibold">Đã gửi email thông báo cho khách</p>
            <p className="text-xs text-emerald-200">Khách hàng đã được thông báo về việc cập nhật thông tin hoàn tiền.</p>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="w-full p-6 md:p-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm">
          <Link to={`/sales/bookings?tab=${tab}`} className="text-[#D4AF37] hover:underline flex items-center gap-1">
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
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Đơn hàng #{booking?.bookingCode}</h1>
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
                {REFUND_STATUS_LABEL[booking?.refundStatus]}
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
                  <p className="text-sm font-medium">{booking?.tourName}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ngày khởi hành</p>
                  <p className="text-sm font-medium font-['Noto_Serif'] text-[#D4AF37]">{formatDate(booking?.tourDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Thời gian</p>
                  <p className="text-sm font-medium">{booking?.tourDuration}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Số hành khách</p>
                  <p className="text-sm font-medium">
                    {booking?.passengers?.filter(p => p.type === 'adult')?.length} NL /{' '}
                    {booking?.passengers?.filter(p => p.type === 'child')?.length} TE /{' '}
                    {booking?.passengers?.filter(p => p.type === 'infant')?.length} EB
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Phương thức thanh toán</p>
                  <p className="text-sm font-medium">{PAYMENT_METHOD_LABEL[booking?.paymentMethod]}</p>
                </div>
                {/* Số phòng */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Số phòng</p>
                  {isPendingBook ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ['single', 'Đơn'],
                          ['double', 'Đôi'],
                          ['triple', 'Ba'],
                        ] as const)?.map(([key, label]) => (
                          <label key={key} className="text-[10px] text-[#2A2421]/60">
                            {label}
                            <input
                              type="text"
                              inputMode="numeric"
                              value={roomCountsDraft[key]}
                              onChange={e => setRoomCountsDraft(prev => ({
                                ...prev,
                                [key]: e?.target?.value,
                              }))}
                              className="mt-1 w-full border border-[#D0C5AF]/40 px-2 py-1 text-xs outline-none focus:border-[#D4AF37]"
                            />
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={handleSaveRoomCounts}
                        className="px-3 py-1.5 bg-[#2A2421] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
                      >
                        Lưu số phòng
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 text-xs">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 font-medium">Đơn: {booking?.roomCounts?.single ?? 0}</span>
                      <span className="px-2 py-1 bg-green-50 text-green-600 font-medium">Đôi: {booking?.roomCounts?.double ?? 0}</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 font-medium">Ba: {booking?.roomCounts?.triple ?? 0}</span>
                    </div>
                  )}
                </div>
                {/* Ghi chú từ contactInfo?.note */}
                {booking?.contactInfo?.note && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ghi chú</p>
                    <p className="text-xs text-[#2A2421]/70 bg-amber-50 p-3 border border-amber-200">{booking?.contactInfo?.note}</p>
                  </div>
                )}
                {/* Lý do hủy */}
                {(booking.status === 'cancelled' || booking.status === 'pending_cancel') && booking?.cancellationReason && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-red-400 mb-1">Lý do hủy</p>
                    <p className="text-xs text-red-600 bg-red-50 p-3 border border-red-200">{booking?.cancellationReason}</p>
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
                  <span className="ml-2 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold">{booking?.passengers?.length}</span>
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

              {!canConfirm && isPendingBook && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
                  <p className="text-xs text-amber-800">
                    Vui lòng điền đầy đủ thông tin hành khách và phân phòng hợp lệ trước khi xác nhận.
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left table-fixed">
                <thead>
                  <tr className="border-b border-[#D0C5AF]/20">
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-10">STT</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-48">Họ và tên</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-24">Loại</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-24">Giới tính</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-32">Ngày sinh</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-44">CCCD / GKS</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-40">Quốc tịch</th>
                    {booking?.passengers?.some(p => p.type === 'adult') && (
                      <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold text-right w-28">Phụ thu đơn</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/10">
                  {booking?.passengers?.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-3 pr-3 text-sm text-[#2A2421]/60">{idx + 1}</td>
                      <td className="py-3 pr-3 text-sm font-semibold">{p?.name}</td>
                      <td className="py-3 pr-3 text-xs">
                        <span className={`inline-flex px-2 py-0.5 whitespace-nowrap ${p.type === 'adult' ? 'bg-blue-50 text-blue-600' : p.type === 'child' ? 'bg-amber-50 text-amber-600' : 'bg-pink-50 text-pink-600'}`}>
                          {PASSENGER_TYPE[p?.type]}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-[#2A2421]/70">{p.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                      <td className="py-3 pr-3 text-sm text-[#2A2421]/60">{p?.dob}</td>
                      <td className="py-3 pr-3 text-sm font-mono text-[#2A2421]/70">{p?.cccd || '—'}</td>
                      <td className="py-3 pr-3 text-xs text-[#2A2421]/60">{p?.nationality || 'Việt Nam'}</td>
                      {p.type === 'adult' ? (
                        <td className="py-3 text-sm text-right font-medium text-amber-600">
                          {p?.singleRoomSupplement ? `+${p?.singleRoomSupplement?.toLocaleString('vi-VN')}đ` : '—'}
                        </td>
                      ) : (
                        <td className="py-3 text-sm text-[#2A2421]/30 text-right">—</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </section>

            {/* Refund Bill — editable after refund completed */}
            {booking.refundStatus === 'refunded' && !isManagerTourCancellation && (
              <section className="bg-white border border-emerald-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-emerald-700">Ảnh bill chuyển khoản hoàn tiền</h2>
                  {!isEditingBill && (
                    <button
                      onClick={() => {
                        setBillFile(null);
                        setBillPreview(booking?.refundBillUrl ?? null);
                        setIsEditingBill(true);
                      }}
                      className="ml-auto px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-emerald-400 text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px] mr-1">edit</span>
                      Chỉnh sửa bill
                    </button>
                  )}
                </div>

                {isEditingBill ? (
                  /* Edit mode */
                  <div className="space-y-4">
                    {billPreview ? (
                      <div className="relative">
                        <img
                          src={billPreview}
                          alt={billFile ? 'Bill mới' : 'Bill hiện tại'}
                          className="w-full max-w-sm border border-[#D0C5AF]/30 bg-gray-50"
                        />
                        <button
                          onClick={() => {
                            if (billFile && billPreview) URL?.revokeObjectURL(billPreview);
                            setBillPreview(null);
                            setBillFile(null);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-300 bg-emerald-50 cursor-pointer hover:border-emerald-500 transition-colors">
                        <span className="material-symbols-outlined text-3xl text-emerald-300 mb-2">cloud_upload</span>
                        <span className="text-xs text-emerald-600">Click để tải ảnh bill mới</span>
                        <input type="file" accept="image/*" onChange={async e => {
                          const file = e?.target?.files?.[0];
                          if (!file) return;

                          try {
                            await prepareBillDraft(file);
                          } catch (error) {
                            message.error(error instanceof Error ? error.message : 'Không thể xử lý ảnh bill.');
                          } finally {
                            e.target.value = '';
                          }
                        }} className="hidden" />
                      </label>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelBillEdit}
                        className="flex-1 py-2.5 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        onClick={async () => {
                          if (!billFile || !billPersistedValue || isProcessingBill) return;
                          const persistedBillUrl = billPersistedValue;
                          const now = new Date()?.toISOString();
                          const saved = await persistBooking(prev => ({
                            ...prev,
                            refundBillUrl: persistedBillUrl,
                            refundedBy: currentUser?.name ?? 'NV Kinh doanh',
                            refundedAt: now,
                          }));
                          if (!saved) return;
                          resetBillDraft(persistedBillUrl);
                          setIsEditingBill(false);
                          setShowEmailToast(true);
                          message.success('Đã cập nhật bill hoàn tiền.');
                          setTimeout(() => setShowEmailToast(false), 4000);
                        }}
                        disabled={!billFile || !billPersistedValue || isProcessingBill}
                        className={`flex-1 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${
                          billFile && billPersistedValue && !isProcessingBill
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div>
                    {booking?.refundBillUrl && (
                      <img src={booking?.refundBillUrl} alt="Bill hoàn tiền" className="max-w-sm border border-[#D0C5AF]/30 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window?.open(booking?.refundBillUrl, '_blank')} />
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Action Buttons — chỉ hiện khi Cần xác nhận */}
            {(booking.status === 'pending' || booking.status === 'pending_cancel') && (
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
                  </>
                )}
              </div>
            )}

            {/* Người xác nhận đơn — hiện khi confirmed và có confirmedBy */}
            {booking.status === 'confirmed' && booking?.confirmedBy && (
              <section className="bg-white border border-[#D0C5AF]/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-blue-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-blue-700">Người xác nhận đơn đặt</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{booking?.confirmedBy}</p>
                  {booking?.confirmedAt && (
                    <p className="text-xs text-[#2A2421]/50">{formatAuditDateTime(booking?.confirmedAt)}</p>
                  )}
                </div>
              </section>
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
                  <p className="text-sm font-semibold">{booking?.contactInfo?.name}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Email</p>
                  <p className="text-sm">{booking?.contactInfo?.email}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Số điện thoại</p>
                  <p className="text-sm font-medium text-[#D4AF37]">{booking?.contactInfo?.phone}</p>
                </div>
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
                  <span className="font-['Noto_Serif'] font-bold text-lg">{formatCurrency(booking?.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#2A2421]/50">Phương thức</span>
                  <span className="font-semibold text-[#2A2421]">{PAYMENT_METHOD_LABEL[booking?.paymentMethod]}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#2A2421]/50">Trạng thái thanh toán</span>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking?.paymentStatus] ?? ''}`}>
                    {PAYMENT_LABEL[booking?.paymentStatus] ?? '—'}
                  </span>
                </div>
                {booking.status === 'cancelled' && booking?.refundAmount && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-red-500">Số tiền hoàn</span>
                    <span className="font-bold text-red-600">{formatCurrency(booking?.refundAmount)}</span>
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
              {booking.refundStatus === 'refunded' && !isManagerTourCancellation && (
                <div className="w-full flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-emerald-300">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Đã hoàn tiền
                </div>
              )}
            </section>

            {/* Thông tin xác nhận hủy — cancelled only */}
            {booking.status === 'cancelled' && booking?.cancelledConfirmedBy && (
              <section className="bg-white border border-red-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-red-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-red-600">Người xác nhận hủy</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{booking?.cancelledConfirmedBy}</p>
                  {booking?.cancelledConfirmedAt && (
                    <p className="text-xs text-[#2A2421]/50">{formatAuditDateTime(booking?.cancelledConfirmedAt)}</p>
                  )}
                </div>
              </section>
            )}

            {/* Thông tin hoàn tiền — refunded only */}
            {booking.refundStatus === 'refunded' && !isManagerTourCancellation && (
              <section className="bg-white border border-emerald-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-emerald-700">Người hoàn tiền</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{booking?.refundedBy ?? '—'}</p>
                  {booking?.refundedAt && (
                    <p className="text-xs text-[#2A2421]/50">Lúc {formatAuditDateTime(booking?.refundedAt)}</p>
                  )}
                </div>
              </section>
            )}

            {/* Bank Info */}
            {booking?.bankInfo && !isManagerTourCancellation && (
              <section className="bg-white border border-[#D0C5AF]/20 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-4 bg-[#D4AF37]"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Thông tin Ngân hàng</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Chủ tài khoản</p>
                    <p className="text-sm font-medium">{booking?.bankInfo?.accountHolder}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Số tài khoản</p>
                    <p className="text-sm font-mono">{booking?.bankInfo?.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ngân hàng</p>
                    <p className="text-sm font-medium">{booking?.bankInfo?.bankName}</p>
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


