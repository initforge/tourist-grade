import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTourInstances, mockTourPrograms, TOUR_INSTANCE_STATUS_LABEL } from '@entities/tour-program/data/tourProgram';
import type { TourInstance } from '@entities/tour-program/data/tourProgram';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type TourTab = 'pending_sell' | 'insufficient' | 'pending_estimate' | 'deployed' | 'completed' | 'cancelled';

const TAB_STATUS_MAP: Record<TourTab, string[]> = {
  pending_sell: ['cho_duyet_ban'],
  insufficient: ['chua_du_kien', 'dang_mo_ban'],       // Ä‘ang má»Ÿ bÃ¡n nhÆ°ng chÆ°a Ä‘á»§ KH
  pending_estimate: ['cho_duyet_du_toan'],
  deployed: ['dang_trien_khai', 'san_sang_trien_khai', 'cho_nhan_dieu_hanh'],
  completed: ['hoan_thanh', 'cho_quyet_toan'],
  cancelled: ['da_huy'],
};

const TABS: { key: TourTab; label: string; icon: string }[] = [
  { key: 'pending_sell', label: 'Chá» duyá»‡t bÃ¡n', icon: 'pending' },
  { key: 'insufficient', label: 'KhÃ´ng Ä‘á»§ ÄK KH', icon: 'group_remove' },
  { key: 'pending_estimate', label: 'Chá» duyá»‡t dá»± toÃ¡n', icon: 'request_quote' },
  { key: 'completed', label: 'HoÃ n thÃ nh', icon: 'task_alt' },
  { key: 'cancelled', label: 'ÄÃ£ há»§y', icon: 'cancel' },
];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatDate(iso: string) {
  const d = new Date(iso);
  return d?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtCurrency(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000)?.toFixed(1) + 'tr';
  if (n >= 1_000) return (n / 1_000)?.toFixed(0) + 'K';
  return n?.toString();
}

function getProjectedProfitPercent(instance: TourInstance) {
  if (instance?.costEstimate) {
    const revenue = instance?.costEstimate?.estimatedGuests * instance?.costEstimate?.pricingConfig?.sellPriceAdult;
    const profit = revenue - instance?.costEstimate?.totalCost;
    return revenue > 0 ? Number(((profit / revenue) * 100)?.toFixed(1)) : 0;
  }

  const program = mockTourPrograms?.find(item => item?.id === instance?.programId);
  return program?.pricingConfig?.profitMargin ?? 0;
}

function getDefaultExtendDate() {
  const d = new Date();
  d?.setDate(d?.getDate() + 7);
  return d?.toISOString()?.split('T')[0];
}

type ApprovalPreviewRow = {
  id: string;
  departureDate: string;
  dayType: string;
  expectedGuests: number;
  costPerAdult: number;
  sellPrice: number;
  profitPercent: number;
  bookingDeadline: string;
  checked: boolean;
};

function buildApprovalPreviewRows(instance: TourInstance): ApprovalPreviewRow[] {
  const program = mockTourPrograms?.find(item => item.id === instance?.programId);

  return Array.from({ length: 6 }, (_, index) => {
    const departureDate = new Date(instance?.departureDate);
    departureDate?.setDate(departureDate?.getDate() + index * 7);
    const bookingDeadline = new Date(departureDate);
    bookingDeadline?.setDate(bookingDeadline?.getDate() - Math.max(1, program?.bookingDeadline ?? 7));

    const sellPrice = instance?.priceAdult + index * 100000;
    const costPerAdult = Math.round(sellPrice * 0.68);
    const profitPercent = Number((((sellPrice - costPerAdult) / sellPrice) * 100)?.toFixed(1));

    return {
      id: `T${String(index + 1)?.padStart(3, '0')}x`,
      departureDate: departureDate?.toISOString(),
      dayType: program?.tourType === 'mua_le'
        ? index === 5 ? 'Lá»… 30/04 - 1/5' : index === 2 ? 'Giá»— tá»•' : 'NgÃ y thÆ°á»ng'
        : index === 2 ? 'Giá»— tá»•' : 'NgÃ y thÆ°á»ng',
      expectedGuests: Math.max(instance?.expectedGuests || 0, instance?.minParticipants) + index,
      costPerAdult,
      sellPrice,
      profitPercent,
      bookingDeadline: bookingDeadline?.toISOString(),
      checked: index !== 3 && index !== 4,
    };
  });
}

// â”€â”€ Popups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RejectPopup({ title, onConfirm, onCancel }: { title: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="manager-reject-title" className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <h3 id="manager-reject-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">{title}</h3>
        <p className="text-xs text-[#2A2421]/60 mb-4">Vui lÃ²ng nháº­p l? do?.</p>
        <textarea value={reason} onChange={e => setReason(e?.target?.value)} rows={3}
          placeholder="LÃ½ do..." className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Há»§y bá»</button>
          <button onClick={() => reason?.trim() && onConfirm(reason)} disabled={!reason?.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${reason?.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            XÃ¡c nháº­n
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovePreviewPopup({
  instance,
  onApprove,
  onRequestEdit,
  onReject,
  onCancel,
}: {
  instance: TourInstance;
  onApprove: () => void;
  onRequestEdit: () => void;
  onReject: () => void;
  onCancel: () => void;
}) {
  const program = mockTourPrograms?.find(item => item.id === instance?.programId);
  const rows = buildApprovalPreviewRows(instance);
  const selectedCount = rows?.filter(row => row?.checked)?.length;
  const unselectedCount = rows?.length - selectedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="manager-approve-title" className="relative bg-white w-full max-w-6xl shadow-2xl border border-[#D0C5AF]/30 max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#D0C5AF]/30 px-8 py-5 flex items-center justify-between z-10">
          <div>
            <h3 id="manager-approve-title" className="font-['Noto_Serif'] text-2xl text-[#2A2421]">Duyá»‡t tour chá» bÃ¡n</h3>
            <p className="text-xs text-[#2A2421]/60 mt-1">Review pháº¡m vi khÃ¡ch nhÃ¢n tháº¥y trÆ°á»›c khi duyá»‡t má»Ÿ bÃ¡n?.</p>
          </div>
          <button onClick={onCancel} className="text-[#2A2421]/40 hover:text-[#2A2421]">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              ['T?n chÆ°Æ¡ng trÃ¬nh', instance?.programName],
              ['Loáº¡i tour', program?.tourType === 'mua_le' ? 'MÃ¹a lá»…' : 'Quanh nÄƒm'],
              ['Äiá»ƒm khá»Ÿi hÃ nh', instance?.departurePoint],
              ['Äiá»ƒm tham quan', instance?.sightseeingSpots?.join(', ')],
              ['Thá»i lÆ°á»£ng tour', program ? `${program?.duration?.days} ngÃ y ${program?.duration?.nights} Ä‘Ãªm` : '-'],
              ['NgÆ°á»i táº¡o chÆ°Æ¡ng trÃ¬nh', instance?.createdBy],
            ]?.map(([label, value]) => (
              <div key={label} className="bg-[#FAFAF5] border border-[#D0C5AF]/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/45 font-bold mb-1">{label}</p>
                <p className="text-sm font-medium text-[#2A2421]">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto border border-[#D0C5AF]/30">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['MÃ£ tour', 'NgÃ y khá»Ÿi hÃ nh', 'Loáº¡i ngÃ y', 'Sá»‘ khÃ¡ch dá»± kiáº¿n', 'GiÃ¡ vá»‘n/ngÆ°á»i lá»›n', 'Lá»£i nhuáº­n', 'GiÃ¡ bÃ¡n', 'Háº¡n Ä‘áº·t tour', 'Thao tÃ¡c']?.map(header => (
                    <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows?.map(row => (
                  <tr key={row?.id} className={row?.checked ? 'bg-white border-b border-[#D0C5AF]/15' : 'bg-gray-100 text-gray-400 border-b border-[#D0C5AF]/15'}>
                    <td className="px-4 py-3 font-mono text-xs">{row?.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(row?.departureDate)}</td>
                    <td className="px-4 py-3">{row?.dayType}</td>
                    <td className="px-4 py-3">{row?.expectedGuests}</td>
                    <td className="px-4 py-3">{row?.costPerAdult?.toLocaleString('vi-VN')}Ä‘</td>
                    <td className="px-4 py-3">{row?.profitPercent}%</td>
                    <td className="px-4 py-3">{row?.sellPrice?.toLocaleString('vi-VN')}Ä‘</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(row?.bookingDeadline)}</td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={row?.checked} readOnly aria-label={`review ${row?.id}`} className="w-4 h-4 accent-[#D4AF37]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-[#FAFAF5] border border-[#D0C5AF]/20 px-4 py-3 text-sm text-[#2A2421]/70">
            <span>ÄÃ£ chá»n: {selectedCount} tour</span>
            <span>ChÆ°a chá»n: {unselectedCount} tour</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onApprove} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Duyá»‡t</button>
            <button onClick={onRequestEdit} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors">YÃªu cáº§u sá»­a</button>
            <button onClick={onReject} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors">Tá»« chá»‘i</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtendDeadlinePopup({ onConfirm, onCancel }: { onConfirm: (newDate: string) => void; onCancel: () => void }) {
  // Máº·c Ä‘á»‹nh: 7 ngÃ y sau hÃ´m nay
  const getDefaultDate = () => {
    const d = new Date();
    d?.setDate(d?.getDate() + 7);
    return d?.toISOString()?.split('T')[0];
  };
  const [extendTo, setExtendTo] = useState(getDefaultDate());
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="manager-extend-title" className="relative bg-white w-full max-w-xs mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <h3 id="manager-extend-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">Gia háº¡n bÃ¡n</h3>
        <p className="text-xs text-[#2A2421]/60 mb-4">Chá»n ngÃ y gia háº¡n Ä‘áº¿n:</p>
        <input type="date" value={extendTo} onChange={e => setExtendTo(e?.target?.value)}
          className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] mb-6" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50">Há»§y bá»</button>
          <button onClick={() => extendTo && onConfirm(extendTo)} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#D4AF37] text-white hover:bg-[#C49B2F]">Gia háº¡n</button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type BatchActionMode = 'cancel' | 'extend' | 'continue';

function SelectedToursActionPopup({
  mode,
  instances,
  extendDates,
  onChangeExtendDate,
  onRemove,
  onConfirm,
  onCancel,
}: {
  mode: BatchActionMode;
  instances: TourInstance[];
  extendDates: Record<string, string>;
  onChangeExtendDate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const config = {
    cancel: {
      title: 'Há»§y tour khÃ´ng Ä‘á»§ Ä‘iá»u kiá»‡n',
      description: 'Kiá»ƒm tra láº¡i cÃ¡c tour Ä‘Ã£ chá»n trÆ°á»›c khi há»§y.',
      confirmLabel: 'XÃ¡c nháº­n há»§y tour',
    },
    continue: {
      title: 'Ti\u1ebfp t\u1ee5c tri\u1ec3n khai tour',
      description: 'XÃ¡c nháº­n cÃ¡c tour Ä‘Ã£ chá»n Ä‘á»§ Ä‘iá»u kiá»‡n tiáº¿p tá»¥c triá»ƒn khai.',
      confirmLabel: 'XÃ¡c nháº­n tiáº¿p tá»¥c',
    },
    extend: {
      title: 'Gia háº¡n bÃ¡n',
      description: 'Chá»n ngÃ y gia háº¡n Ä‘áº¿n cho tá»«ng tour Ä‘Ã£ chá»n.',
      confirmLabel: 'XÃ¡c nháº­n gia háº¡n',
    },
  }[mode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="manager-selected-action-title" className="relative bg-white w-full max-w-5xl shadow-2xl border border-[#D0C5AF]/30 max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#D0C5AF]/30 px-8 py-5 flex items-center justify-between z-10">
          <div>
            <h3 id="manager-selected-action-title" className="font-['Noto_Serif'] text-2xl text-[#2A2421]">{config?.title}</h3>
            <p className="text-xs text-[#2A2421]/60 mt-1">{config?.description}</p>
          </div>
          <button onClick={onCancel} className="text-[#2A2421]/40 hover:text-[#2A2421]">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="overflow-x-auto border border-[#D0C5AF]/30">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {[
                    'MÃ£ tour',
                    'TÃªn chÆ°Æ¡ng trÃ¬nh',
                    'NgÃ y KH',
                    'Sá»‘ KH hiá»‡n táº¡i/tá»‘i thiá»ƒu',
                    'Háº¡n bÃ¡n',
                    'Doanh thu hiá»‡n táº¡i',
                    'Lá»£i nhuáº­n dá»± kiáº¿n',
                    ...(mode === 'extend' ? ['Gia háº¡n Ä‘áº¿n ngÃ y'] : []),
                    'Thao tÃ¡c',
                  ]?.map(header => (
                    <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instances?.map(instance => (
                  <tr key={instance?.id} className="border-b border-[#D0C5AF]/15">
                    <td className="px-4 py-3 font-mono text-xs">{instance?.id}</td>
                    <td className="px-4 py-3 font-medium text-[#2A2421]">{instance?.programName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(instance?.departureDate)}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 font-bold">{instance?.expectedGuests}</span>
                      <span className="text-[#2A2421]/30"> / </span>
                      <span className="text-[#2A2421]/50">{instance?.minParticipants}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{instance?.bookingDeadline}</td>
                    <td className="px-4 py-3">{fmtCurrency(instance?.expectedGuests * instance?.priceAdult)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        {getProjectedProfitPercent(instance)}%
                      </span>
                    </td>
                    {mode === 'extend' && (
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={extendDates[instance?.id] ?? getDefaultExtendDate()}
                          onChange={event => onChangeExtendDate(instance?.id, event?.target?.value)}
                          aria-label={`Gia háº¡n Ä‘áº¿n ngÃ y ${instance?.id}`}
                          className="border border-[#D0C5AF]/40 px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <button onClick={() => onRemove(instance?.id)} className="text-red-500 hover:text-red-700" aria-label={`Bá» ${instance?.id}`}>
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-[#FAFAF5] border border-[#D0C5AF]/20 px-4 py-3 text-sm text-[#2A2421]/70">
            <span>ÄÃ£ chá»n: {instances?.length} tour</span>
            <span>CÃ³ thá»ƒ bá» bá»›t tour báº±ng nÃºt X trÆ°á»›c khi xÃ¡c nháº­n.</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Há»§y bá»</button>
            <button onClick={onConfirm} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#D4AF37] text-white hover:bg-[#C49B2F] transition-colors">
              {config?.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminActiveTours() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TourTab>('pending_sell');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRejectPopup, setShowRejectPopup] = useState<{ id: string; name: string; mode: 'reject' | 'request_edit' } | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState<string | null>(null);
  const [batchActionMode, setBatchActionMode] = useState<BatchActionMode | null>(null);
  const [extendDates, setExtendDates] = useState<Record<string, string>>({});
  const [instances, setInstances] = useState<TourInstance[]>(mockTourInstances);

  // Filter theo tab
  const filtered = instances?.filter(i => TAB_STATUS_MAP[activeTab]?.includes(i?.status) ?? false);

  // Tab counts
  const tabCounts = Object.fromEntries(
    TABS?.map(tab => [tab?.key, instances?.filter(i => TAB_STATUS_MAP[tab?.key]?.includes(i?.status) ?? false)?.length])
  ) as Record<TourTab, number>;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next?.has(id)) next?.delete(id); else next?.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    const ids = filtered?.map(t => t?.id);
    setSelectedIds(prev => prev.size === ids?.length ? new Set() : new Set(ids));
  };

  const handleApprove = (_id: string) => { setShowApprovePopup(null); };
  const handleReject = (_id: string, _reason: string) => { setShowRejectPopup(null); };
  const openBatchAction = (mode: BatchActionMode) => {
    if (selectedIds.size === 0) return;
    if (mode === 'extend') {
      const nextDates = filtered?.reduce<Record<string, string>>((result, instance) => {
        if (selectedIds?.has(instance?.id)) {
          result[instance?.id] = instance?.bookingDeadline || getDefaultExtendDate();
        }
        return result;
      }, {});
      setExtendDates(nextDates);
    }
    setBatchActionMode(mode);
  };

  const removeSelectedInPopup = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next?.delete(id);
      if (next.size === 0) {
        setBatchActionMode(null);
      }
      return next;
    });
  };

  const handleBatchConfirm = () => {
    if (!batchActionMode || selectedIds.size === 0) return;

    if (batchActionMode === 'cancel') {
      setInstances(prev => prev?.map(instance => (
        selectedIds?.has(instance?.id)
          ? {
              ...instance,
              status: 'da_huy',
              cancelledAt: new Date()?.toISOString(),
              cancelReason: instance?.cancelReason || 'Quáº£n lÃ½ há»§y tour do khÃ´ng Ä‘á»§ Ä‘iá»u kiá»‡n khá»Ÿi hÃ nh',
              refundTotal: instance?.refundTotal ?? 0,
            }
          : instance
      )));
    }

    if (batchActionMode === 'continue') {
      setInstances(prev => prev?.map(instance => (
        selectedIds?.has(instance?.id)
          ? {
              ...instance,
              status: 'san_sang_trien_khai',
              readyAt: new Date()?.toISOString(),
            }
          : instance
      )));
    }

    if (batchActionMode === 'extend') {
      setInstances(prev => prev?.map(instance => (
        selectedIds?.has(instance?.id)
          ? {
              ...instance,
              bookingDeadline: extendDates[instance?.id] || instance?.bookingDeadline,
            }
          : instance
      )));
    }

    setSelectedIds(new Set());
    setBatchActionMode(null);
  };

  const insufficientIds = new Set(
    instances?.filter(i => TAB_STATUS_MAP?.insufficient?.includes(i?.status))?.map(i => i?.id)
  );
  const selectedInsufficientInstances = filtered?.filter(instance => selectedIds?.has(instance?.id));

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#D4AF37] rounded-sm"></div>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Quáº£n lÃ½ Tour</h1>
          </div>
          <p className="text-xs text-[#2A2421]/50 ml-4">Theo dÃµi vÃ  phÃª duyá»‡t cÃ¡c tour du lá»‹ch trong há»‡ thá»‘ng?.</p>
        </div>

        {/* Tab Bar */}
        <div className="bg-white border border-[#D0C5AF]/30 mb-6 overflow-x-auto">
          <div className="flex min-w-max">
            {TABS?.map(tab => (
              <button key={tab?.key} onClick={() => { setActiveTab(tab?.key); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-['Inter'] uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab?.key ? 'border-[#D4AF37] text-[#D4AF37] font-bold bg-[#D4AF37]/5' : 'border-transparent text-[#2A2421]/50 hover:text-[#2A2421] hover:bg-gray-50'
                }`}>
                <span className="material-symbols-outlined text-[16px]">{tab?.icon}</span>
                {tab?.label}
                <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === tab?.key ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-500'}`}>
                  {tabCounts[tab?.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* â”€â”€ Tab: Chá» duyá»‡t bÃ¡n â”€â”€ */}
        {activeTab === 'pending_sell' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['MÃ£ yÃªu cáº§u', 'TÃªn chÆ°Æ¡ng trÃ¬nh', 'Loáº¡i tour', 'NgÃ y KH gáº§n nháº¥t', 'NgÃ y táº¡o YC', 'Sá»‘ tour YC táº¡o', 'NgÆ°á»i táº¡o', 'HÃ nh Ä‘á»™ng']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">KhÃ´ng cÃ³ tour nÃ o</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#2A2421]">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.transport === 'maybay' ? 'MÃ¡y bay' : 'Xe'}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.createdAt ? formatDate(t?.createdAt) : 'â€”'}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold">1</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.createdBy}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setShowApprovePopup(t?.id)} className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700">Duyá»‡t</button>
                        <button onClick={() => setShowRejectPopup({ id: t?.id, name: t?.programName, mode: 'reject' })} className="px-3 py-1.5 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50">Tá»« chá»‘i</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* â”€â”€ Tab: KhÃ´ng Ä‘á»§ Ä‘iá»u kiá»‡n KH â”€â”€ */}
        {activeTab === 'insufficient' && (
          <>
            <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs text-[#2A2421]/70 cursor-pointer">
                <input type="checkbox"
                  checked={selectedIds.size === filtered?.length && filtered?.length > 0}
                  onChange={toggleAll} className="w-4 h-4 accent-[#D4AF37]" />
                Chá»n táº¥t cáº£ ({selectedIds?.size}/{filtered?.length})
              </label>
              <div className="flex gap-2">
                <button disabled={selectedIds.size === 0} onClick={() => openBatchAction('cancel')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${selectedIds.size === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
                  Há»§y tour ({selectedIds?.size})
                </button>
                <button disabled={selectedIds.size === 0} onClick={() => openBatchAction('continue')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedIds.size === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                  {'Ti\u1ebfp t\u1ee5c tri\u1ec3n khai'} ({selectedIds?.size})
                </button>
                <button disabled={selectedIds.size === 0} onClick={() => openBatchAction('extend')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedIds.size === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#D4AF37] text-white hover:bg-[#C49B2F]'}`}>
                  Gia háº¡n
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                    <th className="px-4 py-3.5 w-10" />
                    {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH hiện tại/tối thiểu', 'Hạn bán', 'Doanh thu', 'Lợi nhuận dự kiến']?.map(h => (
                      <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/15">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                  ) : filtered?.map(t => (
                    <tr key={t?.id} className={`hover:bg-[#FAFAF5] transition-colors ${selectedIds?.has(t?.id) ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" checked={selectedIds?.has(t?.id)} onChange={() => toggleSelect(t?.id)} className="w-4 h-4 accent-[#D4AF37]" />
                      </td>
                      <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                      <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className="text-red-600 font-bold">{t?.expectedGuests}</span>
                        <span className="text-[#2A2421]/30"> / </span>
                        <span className="text-[#2A2421]/50">{t?.minParticipants}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.bookingDeadline}</td>
                      <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">{fmtCurrency(t?.expectedGuests * t?.priceAdult)}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          {getProjectedProfitPercent(t)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* â”€â”€ Tab: Chá» duyá»‡t dá»± toÃ¡n â”€â”€ */}
        {activeTab === 'pending_estimate' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['MÃ£ tour', 'TÃªn chÆ°Æ¡ng trÃ¬nh', 'NgÃ y KH', 'Tá»•ng chi phÃ­ DT', 'Lá»£i nhuáº­n DT (%)', 'NgÆ°á»i táº¡o DT', 'HÃ nh Ä‘á»™ng']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">KhÃ´ng cÃ³ tour nÃ o</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">
                      {t?.costEstimate ? fmtCurrency(t?.costEstimate?.totalCost) : 'â€”'}
                    </td>
                    <td className="px-4 py-4">
                      {t?.costEstimate ? (() => {
                        const est = t?.costEstimate!;
                        const revenue = est?.estimatedGuests * est?.pricingConfig?.sellPriceAdult;
                        const profit = revenue - est?.totalCost;
                        const profitPct = revenue > 0 ? ((profit / revenue) * 100)?.toFixed(1) : 'â€”';
                        return (
                          <span className={`px-2 py-1 text-xs font-bold ${profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {profitPct}%
                          </span>
                        );
                      })() : 'â€”'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.createdBy}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => navigate(`/manager/tours/${t?.id}/estimate-approval`)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700">
                        Duyá»‡t DT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* â”€â”€ Tab: Äang triá»ƒn khai â”€â”€ */}
        {activeTab === 'deployed' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['MÃ£ tour', 'TÃªn chÆ°Æ¡ng trÃ¬nh', 'NgÃ y KH', 'Äiá»ƒm KH', 'Äiá»ƒm TQ', 'Sá»‘ KH', 'NgÆ°á»i táº¡o', 'Tráº¡ng thÃ¡i']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">KhÃ´ng cÃ³ tour nÃ o</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.departurePoint}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.sightseeingSpots?.join(', ')}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.createdBy}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold">{TOUR_INSTANCE_STATUS_LABEL[t?.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* â”€â”€ Tab: HoÃ n thÃ nh â”€â”€ */}
        {activeTab === 'completed' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['MÃ£ tour', 'TÃªn chÆ°Æ¡ng trÃ¬nh', 'NgÃ y KH', 'Sá»‘ KH thá»±c táº¿', 'Doanh thu TT', 'Chi phÃ­ TT', 'Lá»£i nhuáº­n TT (%)']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">KhÃ´ng cÃ³ tour nÃ o</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold">{t?.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">
                      {t?.settlement ? fmtCurrency(t?.settlement?.revenue) : 'â€”'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">
                      {t?.settlement ? fmtCurrency(t?.settlement?.totalActualCost) : 'â€”'}
                    </td>
                    <td className="px-4 py-4">
                      {t?.settlement ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold">{t?.settlement?.profitPercent}%</span>
                      ) : 'â€”'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* â”€â”€ Tab: ÄÃ£ há»§y â”€â”€ */}
        {activeTab === 'cancelled' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['MÃ£ tour', 'TÃªn chÆ°Æ¡ng trÃ¬nh', 'NgÃ y KH', 'Sá»‘ KH ÄK', 'Thá»i Ä‘iá»ƒm há»§y', 'Tá»•ng tiá»n hoÃ n', 'LÃ½ do']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">KhÃ´ng cÃ³ tour nÃ o</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-center text-sm">{t?.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm text-red-500">{t?.cancelledAt ? formatDate(t?.cancelledAt) : 'â€”'}</td>
                    <td className="px-4 py-4 text-sm font-bold text-red-600">{t?.refundTotal ? fmtCurrency(t?.refundTotal) : 'â€”'}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70 max-w-40 truncate">{t?.cancelReason ?? 'â€”'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popups */}
      {showRejectPopup && (
        <RejectPopup
          title={showRejectPopup.mode === 'request_edit' ? 'YÃªu cáº§u sá»­a' : 'Tá»« chá»‘i'}
          onConfirm={reason => handleReject(showRejectPopup?.id, reason)}
          onCancel={() => setShowRejectPopup(null)}
        />
      )}
      {showApprovePopup && (() => {
        const selectedInstance = instances?.find(instance => instance.id === showApprovePopup);
        if (!selectedInstance) return null;
        return (
          <ApprovePreviewPopup
            instance={selectedInstance}
            onApprove={() => handleApprove(showApprovePopup)}
            onRequestEdit={() => {
              setShowApprovePopup(null);
              setShowRejectPopup({ id: selectedInstance?.id, name: selectedInstance?.programName, mode: 'request_edit' });
            }}
            onReject={() => {
              setShowApprovePopup(null);
              setShowRejectPopup({ id: selectedInstance?.id, name: selectedInstance?.programName, mode: 'reject' });
            }}
            onCancel={() => setShowApprovePopup(null)}
          />
        );
      })()}
      {batchActionMode && selectedInsufficientInstances.length > 0 && (
        <SelectedToursActionPopup
          mode={batchActionMode}
          instances={selectedInsufficientInstances}
          extendDates={extendDates}
          onChangeExtendDate={(id, value) => setExtendDates(prev => ({ ...prev, [id]: value }))}
          onRemove={removeSelectedInPopup}
          onConfirm={handleBatchConfirm}
          onCancel={() => setBatchActionMode(null)}
        />
      )}
    </div>
  );
}

