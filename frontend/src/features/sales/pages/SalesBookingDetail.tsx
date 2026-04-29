import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import type { Booking, Passenger } from '@entities/booking/data/bookings';
import { useAuthStore } from '@shared/store/useAuthStore';
import { isVietnameseNationality } from '@shared/lib/bookingLifecycle';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { updateBooking } from '@shared/lib/api/bookings';
import { NationalitySelect } from '@shared/ui/NationalitySelect';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PASSENGER_TYPE: Record<string, string> = {
  adult: 'NgÆ°á»i lá»›n',
  child: 'Tráº» em',
  infant: 'Em bÃ©',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Cáº§n xÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t',
  pending_cancel: 'Cáº§n xÃ¡c nháº­n há»§y',
  confirmed: 'ÄÃ£ xÃ¡c nháº­n',
  completed: 'HoÃ n thÃ nh',
  cancelled: 'ÄÃ£ há»§y',
};
const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  pending_cancel: 'bg-orange-100 text-orange-700 border-orange-300',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};
const REFUND_STATUS_LABEL: Record<string, string> = {
  none: 'â€”',
  pending: 'Chá» hoÃ n tiá»n',
  refunded: 'ÄÃ£ hoÃ n tiá»n',
  not_required: 'KhÃ´ng cáº§n hoÃ n',
};
const PAYMENT_LABEL: Record<string, string> = {
  unpaid: 'ChÆ°a thanh toÃ¡n',
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
  stripe: 'Tháº» / Stripe',
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

const MAX_REFUND_BILL_FILE_BYTES = 12 * 1024 * 1024;
const MAX_REFUND_BILL_DATA_URL_LENGTH = 5_000_000;
const MAX_REFUND_BILL_DIMENSION = 2200;
const ACCEPTED_REFUND_BILL_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('KhÃ´ng thá»ƒ Ä‘á»c file bill.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromObjectUrl(objectUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('KhÃ´ng thá»ƒ Ä‘á»c ná»™i dung áº£nh bill.'));
    image.src = objectUrl;
  });
}

function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality: number) {
  return canvas.toDataURL('image/jpeg', quality);
}

async function optimizeRefundBillFile(file: File) {
  if (!ACCEPTED_REFUND_BILL_TYPES.has(file.type)) {
    throw new Error('Chá»‰ há»— trá»£ áº£nh JPG, PNG, WEBP hoáº·c SVG cho bill hoÃ n tiá»n.');
  }

  if (file.size > MAX_REFUND_BILL_FILE_BYTES) {
    throw new Error('áº¢nh bill quÃ¡ lá»›n. Vui lÃ²ng chá»n file nhá» hÆ¡n 12MB.');
  }

  if (file.type === 'image/svg+xml') {
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > MAX_REFUND_BILL_DATA_URL_LENGTH) {
      throw new Error('áº¢nh SVG quÃ¡ lá»›n sau khi xá»­ lÃ½. Vui lÃ²ng dÃ¹ng áº£nh nháº¹ hÆ¡n.');
    }
    return dataUrl;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight, 1);
    const scale = Math.min(1, MAX_REFUND_BILL_DIMENSION / longestEdge);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('KhÃ´ng thá»ƒ xá»­ lÃ½ áº£nh bill trÃªn trÃ¬nh duyá»‡t hiá»‡n táº¡i.');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const qualitySteps = [0.9, 0.84, 0.76, 0.68];
    for (const quality of qualitySteps) {
      const dataUrl = canvasToJpegDataUrl(canvas, quality);
      if (dataUrl.length <= MAX_REFUND_BILL_DATA_URL_LENGTH) {
        return dataUrl;
      }
    }

    throw new Error('áº¢nh bill váº«n quÃ¡ lá»›n sau khi tá»‘i Æ°u. Vui lÃ²ng cáº¯t bá»›t hoáº·c giáº£m Ä‘á»™ phÃ¢n giáº£i áº£nh.');
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
      ? 'Vui lÃ²ng nháº­p sá»‘ CCCD/CÄƒn cÆ°á»›c.'
      : 'Vui lÃ²ng nháº­p sá»‘ giáº¥y khai sinh.';
  }

  if (!requiresVietnameseDocumentValidation) {
    return null;
  }

  if (passenger.type === 'adult') {
    return /^\d{12}$/.test(documentValue)
      ? null
      : 'CCCD/CÄƒn cÆ°á»›c pháº£i gá»“m Ä‘Ãºng 12 chá»¯ sá»‘.';
  }

  return /^\d{12}$/.test(documentValue)
    ? null
    : 'Giáº¥y khai sinh pháº£i gá»“m Ä‘Ãºng 12 chá»¯ sá»‘.';
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

// â”€â”€ Passenger Edit Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PassengerEditModalProps {
  passengers: Passenger[];
  onSave: (updated: Passenger[]) => void;
  onClose: () => void;
}

function PassengerEditModal({ passengers, onSave, onClose }: PassengerEditModalProps) {
  const [drafts, setDrafts] = useState<Passenger[]>(passengers?.map(p => ({ nationality: 'Viá»‡t Nam', ...p })));

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
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Cáº­p nháº­t hÃ nh khÃ¡ch</p>
            <h3 id="passenger-edit-title" className="font-['Noto_Serif'] text-xl text-[#2A2421]">Danh sÃ¡ch HÃ nh khÃ¡ch</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <p className="text-xs text-[#2A2421]/50 mb-4">
            CÃ³ thá»ƒ lÆ°u táº¡m danh sÃ¡ch hÃ nh khÃ¡ch khi thÃ´ng tin cÃ²n thiáº¿u. Há»‡ thá»‘ng sáº½ chá»‰ kiá»ƒm tra Ä‘á»§ thÃ´ng tin, CCCD/CÄƒn cÆ°á»›c vÃ  GKS khi xÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t.
          </p>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left table-fixed">
            <thead>
              <tr className="border-b border-[#D0C5AF]/20">
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-10">STT</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-44">Há» vÃ  tÃªn</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-24">Loáº¡i</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-28">Giá»›i tÃ­nh</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-40">NgÃ y sinh</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-44">CCCD / GKS *</th>
                <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-52">Quá»‘c tá»‹ch</th>
                {drafts?.some(p => p.type === 'adult') && (
                  <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold text-right w-24">Phá»¥ thu Ä‘Æ¡n</th>
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
                      <option value="female">Ná»¯</option>
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
                      placeholder={p.type === 'adult' ? '012345678901' : 'Sá»‘ GKS'}
                      inputMode={p.type === 'adult' ? 'numeric' : 'text'}
                      className="w-full border border-[#D0C5AF]/40 px-2 py-1 text-sm outline-none font-mono focus:border-[#D4AF37]"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <NationalitySelect
                      value={p?.nationality ?? 'Viá»‡t Nam'}
                      onChange={value => handleChange(idx, 'nationality', value)}
                      ariaLabel={`Quá»‘c tá»‹ch hÃ nh khÃ¡ch ${idx + 1}`}
                    />
                  </td>
                  {p.type === 'adult' ? (
                    <td className="py-3 text-xs text-right text-[#2A2421]/60 font-mono">
                      {p?.singleRoomSupplement ? `+${p?.singleRoomSupplement?.toLocaleString('vi-VN')}Ä‘` : 'â€”'}
                    </td>
                  ) : (
                    <td className="py-3 text-sm text-[#2A2421]/30 text-right">â€”</td>
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
            Há»§y bá»
          </button>
          <button
            onClick={() => onSave(drafts)}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors bg-[#D4AF37] text-white hover:bg-[#C49B2F]"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            LÆ°u
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Confirm Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            KhÃ´ng
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

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            {protectedLoading ? 'Äang táº£i dá»¯ liá»‡u' : 'KhÃ´ng tÃ¬m tháº¥y booking'}
          </p>
          <h1 className="font-['Noto_Serif'] text-2xl text-[#2A2421] mb-4">
            {protectedLoading ? 'Äang Ä‘á»“ng bá»™ dá»¯ liá»‡u Ä‘Æ¡n hÃ ng' : `Booking ${id ?? ''} khÃ´ng tá»“n táº¡i`}
          </h1>
          {!protectedLoading && (
            <Link
              to={`/sales/bookings?tab=${tab}`}
              className="inline-flex items-center justify-center px-5 py-3 bg-[#2A2421] text-white text-xs font-['Inter'] uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
            >
              Danh sÃ¡ch Ä‘Æ¡n booking
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
      message.error('PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i Ä‘á»ƒ lÆ°u thay Ä‘á»•i.');
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
        message.error('KhÃ´ng thá»ƒ lÆ°u thay Ä‘á»•i Ä‘Æ¡n booking. Vui lÃ²ng thá»­ láº¡i.');
        return null;
      })
      .finally(() => setPersistCount(count => Math.max(0, count - 1)));
    persistQueueRef.current = job.then(() => undefined);
    return job;
  };

  // refundStatus === 'pending' = yÃªu cáº§u há»§y Ä‘ang chá» xá»­ lÃ½
  const isPendingCancel = booking.status === 'pending_cancel';
  const isPendingBook = booking.status === 'pending';

  const hasValidPassengerData = booking?.passengers?.every(hasCompletePassengerData);
  const parsedRoomCounts = parseRoomCountsDraft(roomCountsDraft);
  const hasAssignedRooms = Object.values(parsedRoomCounts)?.some(count => count > 0);
  const canConfirm = booking.status === 'pending' && hasValidPassengerData && hasAssignedRooms && persistCount === 0;
  const canRefund = booking.status === 'cancelled' && booking.refundStatus === 'pending';

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      message.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ xá»­ lÃ½ áº£nh bill.');
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
    message.success('ÄÃ£ lÆ°u bill hoÃ n tiá»n thÃ nh cÃ´ng.');
    setTimeout(() => setShowEmailToast(false), 4000);
  };

  const handleSaveRoomCounts = async () => {
    const saved = await persistBooking(
      prev => ({ ...prev, roomCounts: parseRoomCountsDraft(roomCountsDraft) }),
      next => ({ roomCounts: next.roomCounts }),
    );
    if (saved) {
      message.success('ÄÃ£ cáº­p nháº­t thÃ´ng tin phÃ²ng.');
    }
  };

  const handleSavePassengers = async (updated: Passenger[]) => {
    const saved = await persistBooking(
      prev => ({ ...prev, passengers: updated }),
      next => ({ passengers: next.passengers }),
    );
    if (!saved) return;
    setShowPassengerModal(false);
    message.success('ÄÃ£ cáº­p nháº­t danh sÃ¡ch hÃ nh khÃ¡ch.');
  };

  // XÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t â†’ chuyá»ƒn sang ÄÃ£ xÃ¡c nháº­n
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
    message.success('XÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t tour thÃ nh cÃ´ng.');
  };

  // XÃ¡c nháº­n há»§y â†’ chuyá»ƒn sang ÄÃ£ há»§y + pending refund
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
    message.success('XÃ¡c nháº­n yÃªu cáº§u há»§y tour thÃ nh cÃ´ng.');
  };

  const handleDownloadPassengers = () => {
    let content = '\uFEFF';
    content += 'THÃ”NG TIN TOUR\n';
    content += `TÃªn tour,${booking?.tourName}\n`;
    content += `NgÃ y khá»Ÿi hÃ nh,${formatDate(booking?.tourDate)}\n`;
    content += `Thá»i gian,${booking?.tourDuration}\n`;
    content += `MÃ£ Ä‘Æ¡n,${booking?.bookingCode}\n\n`;
    content += 'DANH SÃCH HÃ€NH KHÃCH\n';
    content += 'STT,Há» vÃ  TÃªn,Loáº¡i,NgÃ y sinh,Giá»›i tÃ­nh,Quá»‘c tá»‹ch,CCCD/GKS,Phá»¥ thu Ä‘Æ¡n\n';
    booking?.passengers?.forEach((p, i) => {
      content += `${i + 1},${p?.name},${PASSENGER_TYPE[p?.type]},${p?.dob},${p.gender === 'male' ? 'Nam' : 'Ná»¯'},${p?.nationality || 'Viá»‡t Nam'},${p?.cccd || ''},${p?.singleRoomSupplement ? formatCurrency(p?.singleRoomSupplement) : ''}\n`;
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

      {/* â”€â”€ POPUP: Passenger Edit â”€â”€ */}
      {showPassengerModal && (
        <PassengerEditModal
          passengers={booking?.passengers}
          onSave={handleSavePassengers}
          onClose={() => setShowPassengerModal(false)}
        />
      )}

      {/* â”€â”€ POPUP: Confirm XÃ¡c nháº­n Ä‘Æ¡n â”€â”€ */}
      {showConfirmPopup && (
        <ConfirmPopup
          title="XÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t"
          message={`Báº¡n cÃ³ cháº¯c muá»‘n xÃ¡c nháº­n Ä‘Æ¡n #${booking?.bookingCode}?`}
          confirmLabel="CÃ³, xÃ¡c nháº­n"
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirmPopup(false)}
        />
      )}

      {/* â”€â”€ POPUP: XÃ¡c nháº­n há»§y Ä‘Æ¡n â”€â”€ */}
      {showConfirmCancelPopup && (
        <ConfirmPopup
          title="XÃ¡c nháº­n há»§y Ä‘Æ¡n"
          message={`XÃ¡c nháº­n há»§y Ä‘Æ¡n #${booking?.bookingCode} vÃ  tiáº¿n hÃ nh hoÃ n tiá»n cho khÃ¡ch?`}
          confirmLabel="CÃ³, há»§y Ä‘Æ¡n"
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowConfirmCancelPopup(false)}
        />
      )}

      {/* â”€â”€ POPUP: HoÃ n tiá»n â”€â”€ */}
      {showRefundPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="refund-payment-title">
          <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={closeRefundPopup}></div>
          <div className="relative bg-white w-full max-w-md mx-4 shadow-2xl border border-[#D0C5AF]/30">
            <div className="p-6 border-b border-[#D0C5AF]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">HoÃ n tiá»n</p>
                  <h3 id="refund-payment-title" className="font-['Noto_Serif'] text-xl text-[#2A2421]">HoÃ n tiá»n Ä‘Æ¡n hÃ ng</h3>
                </div>
                <button onClick={closeRefundPopup} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
                  <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-[#FAFAF5] p-4 border border-[#D0C5AF]/20 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/50">MÃ£ Ä‘Æ¡n</span>
                  <span className="font-semibold font-['Noto_Serif']">#{booking?.bookingCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/50">Sá»‘ tiá»n cáº§n hoÃ n</span>
                  <span className="font-bold text-[#D4AF37] font-['Noto_Serif']">{formatCurrency(booking?.refundAmount ?? 0)}</span>
                </div>
                {booking?.bankInfo && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2A2421]/50">Sá»‘ tÃ i khoáº£n</span>
                      <span className="font-mono">{booking?.bankInfo?.accountNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#2A2421]/50">NgÃ¢n hÃ ng</span>
                      <span>{booking?.bankInfo?.bankName}</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2">áº¢nh bill chuyá»ƒn khoáº£n *</p>
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
                    <span className="text-xs text-[#2A2421]/40">Click Ä‘á»ƒ táº£i áº£nh bill lÃªn</span>
                    <input type="file" accept="image/*" onChange={handleBillUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#D0C5AF]/20 flex gap-3">
              <button onClick={closeRefundPopup} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">
                Há»§y bá»
              </button>
              <button
                onClick={handleConfirmRefund}
                  disabled={!billPersistedValue || isProcessingBill}
                className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors ${
                    billPersistedValue && !isProcessingBill ? 'bg-[#D4AF37] text-white hover:bg-[#C49B2F]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                  {isProcessingBill ? 'Äang tá»‘i Æ°u bill' : 'XÃ¡c nháº­n hoÃ n tiá»n'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Email notification toast â”€â”€ */}
      {showEmailToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom">
          <span className="material-symbols-outlined text-xl">mail</span>
          <div>
            <p className="text-sm font-semibold">ÄÃ£ gá»­i email thÃ´ng bÃ¡o cho khÃ¡ch</p>
            <p className="text-xs text-emerald-200">KhÃ¡ch hÃ ng Ä‘Ã£ Ä‘Æ°á»£c thÃ´ng bÃ¡o vá» viá»‡c cáº­p nháº­t thÃ´ng tin hoÃ n tiá»n.</p>
          </div>
        </div>
      )}

      {/* â”€â”€ MAIN CONTENT â”€â”€ */}
      <div className="w-full p-6 md:p-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-sm">
          <Link to={`/sales/bookings?tab=${tab}`} className="text-[#D4AF37] hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            Danh sÃ¡ch Ä‘Æ¡n booking
          </Link>
          <span className="text-[#2A2421]/30">/</span>
          <span className="text-[#2A2421]/60">Chi tiáº¿t Ä‘Æ¡n booking</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="space-y-1">
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Chi tiáº¿t Ä‘áº·t chá»—</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">ÄÆ¡n hÃ ng #{booking?.bookingCode}</h1>
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
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">ThÃ´ng tin HÃ nh trÃ¬nh</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">TÃªn tour</p>
                  <p className="text-sm font-medium">{booking?.tourName}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">NgÃ y khá»Ÿi hÃ nh</p>
                  <p className="text-sm font-medium font-['Noto_Serif'] text-[#D4AF37]">{formatDate(booking?.tourDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Thá»i gian</p>
                  <p className="text-sm font-medium">{booking?.tourDuration}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Sá»‘ hÃ nh khÃ¡ch</p>
                  <p className="text-sm font-medium">
                    {booking?.passengers?.filter(p => p.type === 'adult')?.length} NL /{' '}
                    {booking?.passengers?.filter(p => p.type === 'child')?.length} TE /{' '}
                    {booking?.passengers?.filter(p => p.type === 'infant')?.length} EB
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">PhÆ°Æ¡ng thá»©c thanh toÃ¡n</p>
                  <p className="text-sm font-medium">{PAYMENT_METHOD_LABEL[booking?.paymentMethod]}</p>
                </div>
                {/* Sá»‘ phÃ²ng */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Sá»‘ phÃ²ng</p>
                  {isPendingBook ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ['single', 'ÄÆ¡n'],
                          ['double', 'ÄÃ´i'],
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
                        LÆ°u sá»‘ phÃ²ng
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 text-xs">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 font-medium">ÄÆ¡n: {booking?.roomCounts?.single ?? 0}</span>
                      <span className="px-2 py-1 bg-green-50 text-green-600 font-medium">ÄÃ´i: {booking?.roomCounts?.double ?? 0}</span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 font-medium">Ba: {booking?.roomCounts?.triple ?? 0}</span>
                    </div>
                  )}
                </div>
                {/* Ghi chÃº tá»« contactInfo?.note */}
                {booking?.contactInfo?.note && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Ghi chÃº</p>
                    <p className="text-xs text-[#2A2421]/70 bg-amber-50 p-3 border border-amber-200">{booking?.contactInfo?.note}</p>
                  </div>
                )}
                {/* LÃ½ do há»§y */}
                {(booking.status === 'cancelled' || booking.status === 'pending_cancel') && booking?.cancellationReason && (
                  <div className="col-span-2">
                    <p className="text-[9px] uppercase tracking-widest text-red-400 mb-1">LÃ½ do há»§y</p>
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
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Danh sÃ¡ch HÃ nh khÃ¡ch</h2>
                  <span className="ml-2 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold">{booking?.passengers?.length}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadPassengers}
                    className="flex items-center gap-1.5 bg-[#2A2421] text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Táº£i vá» DSHK
                  </button>
                  {/* Chá»‰ tab Cáº§n xÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t má»›i cho chá»‰nh sá»­a */}
                  {isPendingBook && (
                    <button
                      onClick={() => setShowPassengerModal(true)}
                      className="flex items-center gap-1.5 border border-[#D4AF37] text-[#D4AF37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37]/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      Chá»‰nh sá»­a
                    </button>
                  )}
                </div>
              </div>

              {!canConfirm && isPendingBook && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0">info</span>
                  <p className="text-xs text-amber-800">
                    Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin hÃ nh khÃ¡ch vÃ  phÃ¢n phÃ²ng há»£p lá»‡ trÆ°á»›c khi xÃ¡c nháº­n.
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left table-fixed">
                <thead>
                  <tr className="border-b border-[#D0C5AF]/20">
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-10">STT</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-48">Há» vÃ  tÃªn</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-24">Loáº¡i</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-24">Giá»›i tÃ­nh</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-32">NgÃ y sinh</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-44">CCCD / GKS</th>
                    <th className="pb-3 pr-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold w-40">Quá»‘c tá»‹ch</th>
                    {booking?.passengers?.some(p => p.type === 'adult') && (
                      <th className="pb-3 text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold text-right w-28">Phá»¥ thu Ä‘Æ¡n</th>
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
                      <td className="py-3 pr-3 text-xs text-[#2A2421]/70">{p.gender === 'male' ? 'Nam' : 'Ná»¯'}</td>
                      <td className="py-3 pr-3 text-sm text-[#2A2421]/60">{p?.dob}</td>
                      <td className="py-3 pr-3 text-sm font-mono text-[#2A2421]/70">{p?.cccd || 'â€”'}</td>
                      <td className="py-3 pr-3 text-xs text-[#2A2421]/60">{p?.nationality || 'Viá»‡t Nam'}</td>
                      {p.type === 'adult' ? (
                        <td className="py-3 text-sm text-right font-medium text-amber-600">
                          {p?.singleRoomSupplement ? `+${p?.singleRoomSupplement?.toLocaleString('vi-VN')}Ä‘` : 'â€”'}
                        </td>
                      ) : (
                        <td className="py-3 text-sm text-[#2A2421]/30 text-right">â€”</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </section>

            {/* Refund Bill â€” editable after refund completed */}
            {booking.refundStatus === 'refunded' && (
              <section className="bg-white border border-emerald-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-emerald-700">áº¢nh bill chuyá»ƒn khoáº£n hoÃ n tiá»n</h2>
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
                      Chá»‰nh sá»­a bill
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
                          alt={billFile ? 'Bill má»›i' : 'Bill hiá»‡n táº¡i'}
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
                        <span className="text-xs text-emerald-600">Click Ä‘á»ƒ táº£i áº£nh bill má»›i</span>
                        <input type="file" accept="image/*" onChange={async e => {
                          const file = e?.target?.files?.[0];
                          if (!file) return;

                          try {
                            await prepareBillDraft(file);
                          } catch (error) {
                            message.error(error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ xá»­ lÃ½ áº£nh bill.');
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
                        Há»§y bá»
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
                          message.success('ÄÃ£ cáº­p nháº­t bill hoÃ n tiá»n.');
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
                        LÆ°u
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div>
                    {booking?.refundBillUrl && (
                      <img src={booking?.refundBillUrl} alt="Bill hoÃ n tiá»n" className="max-w-sm border border-[#D0C5AF]/30 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window?.open(booking?.refundBillUrl, '_blank')} />
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Action Buttons â€” chá»‰ hiá»‡n khi Cáº§n xÃ¡c nháº­n */}
            {(booking.status === 'pending' || booking.status === 'pending_cancel') && (
              <div className="bg-white border border-[#D0C5AF]/20 p-6 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-[#D4AF37]"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">HÃ nh Ä‘á»™ng</h2>
                </div>

                {isPendingBook && (
                  <>
                    {/* Cáº§n xÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t */}
                    <button
                      onClick={() => setShowPassengerModal(true)}
                      className="w-full flex items-center justify-center gap-2 border border-[#D4AF37] text-[#D4AF37] py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold hover:bg-[#D4AF37]/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      Chá»‰nh sá»­a danh sÃ¡ch HK
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
                      XÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t
                    </button>
                  </>
                )}

                {isPendingCancel && (
                  <>
                    {/* Cáº§n xÃ¡c nháº­n há»§y */}
                    <button
                      onClick={() => setShowConfirmCancelPopup(true)}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      XÃ¡c nháº­n há»§y Ä‘Æ¡n
                    </button>
                  </>
                )}
              </div>
            )}

            {/* NgÆ°á»i xÃ¡c nháº­n Ä‘Æ¡n â€” hiá»‡n khi confirmed vÃ  cÃ³ confirmedBy */}
            {booking.status === 'confirmed' && booking?.confirmedBy && (
              <section className="bg-white border border-[#D0C5AF]/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-blue-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-blue-700">NgÆ°á»i xÃ¡c nháº­n Ä‘Æ¡n Ä‘áº·t</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{booking?.confirmedBy}</p>
                  {booking?.confirmedAt && (
                    <p className="text-xs text-[#2A2421]/50">{new Date(booking?.confirmedAt)?.toLocaleString('vi-VN')}</p>
                  )}
                </div>
              </section>
            )}

            {/* Customer Info */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">KhÃ¡ch hÃ ng</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Há» vÃ  tÃªn</p>
                  <p className="text-sm font-semibold">{booking?.contactInfo?.name}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Email</p>
                  <p className="text-sm">{booking?.contactInfo?.email}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Sá»‘ Ä‘iá»‡n thoáº¡i</p>
                  <p className="text-sm font-medium text-[#D4AF37]">{booking?.contactInfo?.phone}</p>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Thanh toÃ¡n</h2>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#2A2421]/60">Tá»•ng tiá»n</span>
                  <span className="font-['Noto_Serif'] font-bold text-lg">{formatCurrency(booking?.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#2A2421]/50">PhÆ°Æ¡ng thá»©c</span>
                  <span className="font-semibold text-[#2A2421]">{PAYMENT_METHOD_LABEL[booking?.paymentMethod]}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#2A2421]/50">Tráº¡ng thÃ¡i thanh toÃ¡n</span>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking?.paymentStatus] ?? ''}`}>
                    {PAYMENT_LABEL[booking?.paymentStatus] ?? 'â€”'}
                  </span>
                </div>
                {booking.status === 'cancelled' && booking?.refundAmount && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-red-500">Sá»‘ tiá»n hoÃ n</span>
                    <span className="font-bold text-red-600">{formatCurrency(booking?.refundAmount)}</span>
                  </div>
                )}
              </div>

              {/* HoÃ n tiá»n */}
              {canRefund && (
                <button
                  onClick={() => setShowRefundPopup(true)}
                  className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-white py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold hover:bg-[#C49B2F] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  HoÃ n tiá»n
                </button>
              )}
              {booking.refundStatus === 'refunded' && (
                <div className="w-full flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-emerald-300">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  ÄÃ£ hoÃ n tiá»n
                </div>
              )}
            </section>

            {/* ThÃ´ng tin xÃ¡c nháº­n há»§y â€” cancelled only */}
            {booking.status === 'cancelled' && booking?.cancelledConfirmedBy && (
              <section className="bg-white border border-red-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-red-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-red-600">NgÆ°á»i xÃ¡c nháº­n há»§y</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{booking?.cancelledConfirmedBy}</p>
                  {booking?.cancelledConfirmedAt && (
                    <p className="text-xs text-[#2A2421]/50">{new Date(booking?.cancelledConfirmedAt)?.toLocaleString('vi-VN')}</p>
                  )}
                </div>
              </section>
            )}

            {/* ThÃ´ng tin hoÃ n tiá»n â€” refunded only */}
            {booking.refundStatus === 'refunded' && (
              <section className="bg-white border border-emerald-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-500"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-emerald-700">NgÆ°á»i hoÃ n tiá»n</h2>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{booking?.refundedBy ?? 'â€”'}</p>
                  {booking?.refundedAt && (
                    <p className="text-xs text-[#2A2421]/50">LÃºc {new Date(booking?.refundedAt)?.toLocaleString('vi-VN')}</p>
                  )}
                </div>
              </section>
            )}

            {/* Bank Info */}
            {booking?.bankInfo && (
              <section className="bg-white border border-[#D0C5AF]/20 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-4 bg-[#D4AF37]"></div>
                  <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">ThÃ´ng tin NgÃ¢n hÃ ng</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Chá»§ tÃ i khoáº£n</p>
                    <p className="text-sm font-medium">{booking?.bankInfo?.accountHolder}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">Sá»‘ tÃ i khoáº£n</p>
                    <p className="text-sm font-mono">{booking?.bankInfo?.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 mb-1">NgÃ¢n hÃ ng</p>
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


