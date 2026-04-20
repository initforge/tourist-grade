import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTourInstances, mockTourPrograms, TOUR_INSTANCE_STATUS_LABEL } from '@entities/tour-program/data/tourProgram';
import type { TourInstance } from '@entities/tour-program/data/tourProgram';

// ── Types ────────────────────────────────────────────────────────────────────

type TourTab = 'pending_sell' | 'insufficient' | 'pending_estimate' | 'deployed' | 'completed' | 'cancelled';

const TAB_STATUS_MAP: Record<TourTab, string[]> = {
  pending_sell: ['cho_duyet_ban'],
  insufficient: ['chua_du_kien', 'dang_mo_ban'],       // đang mở bán nhưng chưa đủ KH
  pending_estimate: ['cho_duyet_du_toan'],
  deployed: ['dang_trien_khai', 'san_sang_trien_khai', 'cho_nhan_dieu_hanh'],
  completed: ['hoan_thanh', 'cho_quyet_toan'],
  cancelled: ['da_huy'],
};

const TABS: { key: TourTab; label: string; icon: string }[] = [
  { key: 'pending_sell', label: 'Chờ duyệt bán', icon: 'pending' },
  { key: 'insufficient', label: 'Không đủ ĐK KH', icon: 'group_remove' },
  { key: 'pending_estimate', label: 'Chờ duyệt dự toán', icon: 'request_quote' },
  { key: 'completed', label: 'Hoàn thành', icon: 'task_alt' },
  { key: 'cancelled', label: 'Đã hủy', icon: 'cancel' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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
        ? index === 5 ? 'Lễ 30/04 - 1/5' : index === 2 ? 'Giỗ tổ' : 'Ngày thường'
        : index === 2 ? 'Giỗ tổ' : 'Ngày thường',
      expectedGuests: Math.max(instance?.expectedGuests || 0, instance?.minParticipants) + index,
      costPerAdult,
      sellPrice,
      profitPercent,
      bookingDeadline: bookingDeadline?.toISOString(),
      checked: index !== 3 && index !== 4,
    };
  });
}

// ── Popups ───────────────────────────────────────────────────────────────────

function RejectPopup({ title, onConfirm, onCancel }: { title: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="manager-reject-title" className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <h3 id="manager-reject-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">{title}</h3>
        <p className="text-xs text-[#2A2421]/60 mb-4">Vui lòng nhập lý do.</p>
        <textarea value={reason} onChange={e => setReason(e?.target?.value)} rows={3}
          placeholder="Lý do..." className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
          <button onClick={() => reason?.trim() && onConfirm(reason)} disabled={!reason?.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${reason?.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            Xác nhận
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
            <h3 id="manager-approve-title" className="font-['Noto_Serif'] text-2xl text-[#2A2421]">Duyệt tour chờ bán</h3>
            <p className="text-xs text-[#2A2421]/60 mt-1">Kiểm tra phạm vi khách nhìn thấy trước khi duyệt mở bán.</p>
          </div>
          <button onClick={onCancel} className="text-[#2A2421]/40 hover:text-[#2A2421]">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              ['Tên chương trình', instance?.programName],
              ['Loại tour', program?.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'],
              ['Điểm khởi hành', instance?.departurePoint],
              ['Điểm tham quan', instance?.sightseeingSpots?.join(', ')],
              ['Thời lượng tour', program ? `${program?.duration?.days} ngày ${program?.duration?.nights} đêm` : '-'],
              ['Người tạo chương trình', instance?.createdBy],
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
                  {['Mã tour', 'Ngày khởi hành', 'Loại ngày', 'Số khách dự kiến', 'Giá vốn/người lớn', 'Lợi nhuận', 'Giá bán', 'Hạn đặt tour', 'Thao tác']?.map(header => (
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
                    <td className="px-4 py-3">{row?.costPerAdult?.toLocaleString('vi-VN')}đ</td>
                    <td className="px-4 py-3">{row?.profitPercent}%</td>
                    <td className="px-4 py-3">{row?.sellPrice?.toLocaleString('vi-VN')}đ</td>
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
            <span>Đã chọn: {selectedCount} tour</span>
            <span>Chưa chọn: {unselectedCount} tour</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onApprove} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Duyệt</button>
            <button onClick={onRequestEdit} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors">Yêu cầu sửa</button>
            <button onClick={onReject} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors">Từ chối</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtendDeadlinePopup({ onConfirm, onCancel }: { onConfirm: (newDate: string) => void; onCancel: () => void }) {
  // Mặc định: 7 ngày sau hôm nay
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
        <h3 id="manager-extend-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">Gia hạn bán</h3>
        <p className="text-xs text-[#2A2421]/60 mb-4">Chọn ngày gia hạn đến:</p>
        <input type="date" value={extendTo} onChange={e => setExtendTo(e?.target?.value)}
          className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] mb-6" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50">Hủy bỏ</button>
          <button onClick={() => extendTo && onConfirm(extendTo)} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#D4AF37] text-white hover:bg-[#C49B2F]">Gia hạn</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

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
      title: 'Hủy tour không đủ điều kiện',
      description: 'Kiểm tra lại các tour đã chọn trước khi hủy.',
      confirmLabel: 'Xác nhận hủy tour',
    },
    continue: {
      title: 'Tiếp tục triển khai tour',
      description: 'Xác nhận các tour đã chọn đủ điều kiện tiếp tục triển khai.',
      confirmLabel: 'Xác nhận tiếp tục',
    },
    extend: {
      title: 'Gia hạn bán',
      description: 'Chọn ngày gia hạn đến cho từng tour đã chọn.',
      confirmLabel: 'Xác nhận gia hạn',
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
                    'Mã tour',
                    'Tên chương trình',
                    'Ngày KH',
                    'Số KH hiện tại/tối thiểu',
                    'Hạn bán',
                    'Dự kiến hoàn',
                    'Lợi nhuận dự kiến',
                    ...(mode === 'extend' ? ['Gia hạn đến ngày'] : []),
                    'Thao tác',
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
                          aria-label={`Gia hạn đến ngày ${instance?.id}`}
                          className="border border-[#D0C5AF]/40 px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <button onClick={() => onRemove(instance?.id)} className="text-red-500 hover:text-red-700" aria-label={`Bỏ ${instance?.id}`}>
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between bg-[#FAFAF5] border border-[#D0C5AF]/20 px-4 py-3 text-sm text-[#2A2421]/70">
            <span>Đã chọn: {instances?.length} tour</span>
            <span>Có thể bỏ bớt tour bằng nút X trước khi xác nhận.</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
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
              cancelReason: instance?.cancelReason || 'Quản lý hủy tour do không đủ điều kiện khởi hành',
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
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Quản lý Tour</h1>
          </div>
          <p className="text-xs text-[#2A2421]/50 ml-4">Theo dõi và phê duyệt các tour du lịch trong hệ thống.</p>
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

        {/* ── Tab: Chờ duyệt bán ── */}
        {activeTab === 'pending_sell' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['Mã yêu cầu', 'Tên chương trình', 'Loại tour', 'Ngày KH gần nhất', 'Ngày tạo YC', 'Số tour YC tạo', 'Người tạo', 'Hành động']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#2A2421]">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.transport === 'maybay' ? 'Máy bay' : 'Xe'}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.createdAt ? formatDate(t?.createdAt) : '—'}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold">1</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.createdBy}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setShowApprovePopup(t?.id)} className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700">Duyệt</button>
                        <button onClick={() => setShowRejectPopup({ id: t?.id, name: t?.programName, mode: 'reject' })} className="px-3 py-1.5 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50">Từ chối</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: Không đủ điều kiện KH ── */}
        {activeTab === 'insufficient' && (
          <>
            <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs text-[#2A2421]/70 cursor-pointer">
                <input type="checkbox"
                  checked={selectedIds.size === filtered?.length && filtered?.length > 0}
                  onChange={toggleAll} className="w-4 h-4 accent-[#D4AF37]" />
                Chọn tất cả ({selectedIds?.size}/{filtered?.length})
              </label>
              <div className="flex gap-2">
                <button disabled={selectedIds.size === 0} onClick={() => openBatchAction('cancel')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${selectedIds.size === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
                  Hủy tour ({selectedIds?.size})
                </button>
                <button disabled={selectedIds.size === 0} onClick={() => openBatchAction('continue')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedIds.size === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                  Tiếp tục triển khai ({selectedIds?.size})
                </button>
                <button disabled={selectedIds.size === 0} onClick={() => openBatchAction('extend')}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedIds.size === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#D4AF37] text-white hover:bg-[#C49B2F]'}`}>
                  Gia hạn
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                    <th className="px-4 py-3.5 w-10" />
                    {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH hiện tại/tối thiểu', 'Hạn bán', 'Dự kiến hoàn', 'Lợi nhuận dự kiến']?.map(h => (
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

        {/* ── Tab: Chờ duyệt dự toán ── */}
        {activeTab === 'pending_estimate' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Tổng chi phí DT', 'Lợi nhuận DT (%)', 'Người tạo DT', 'Hành động']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">
                      {t?.costEstimate ? fmtCurrency(t?.costEstimate?.totalCost) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {t?.costEstimate ? (() => {
                        const est = t?.costEstimate!;
                        const revenue = est?.estimatedGuests * est?.pricingConfig?.sellPriceAdult;
                        const profit = revenue - est?.totalCost;
                        const profitPct = revenue > 0 ? ((profit / revenue) * 100)?.toFixed(1) : '—';
                        return (
                          <span className={`px-2 py-1 text-xs font-bold ${profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {profitPct}%
                          </span>
                        );
                      })() : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t?.createdBy}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => navigate(`/manager/tours/${t?.id}/estimate-approval`)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700">
                        Duyệt DT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: Đang triển khai ── */}
        {activeTab === 'deployed' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Điểm KH', 'Điểm TQ', 'Số KH', 'Người tạo', 'Trạng thái']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
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

        {/* ── Tab: Hoàn thành ── */}
        {activeTab === 'completed' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH thực tế', 'Doanh thu TT', 'Chi phí TT', 'Lợi nhuận TT (%)']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold">{t?.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">
                      {t?.settlement ? fmtCurrency(t?.settlement?.revenue) : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">
                      {t?.settlement ? fmtCurrency(t?.settlement?.totalActualCost) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {t?.settlement ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold">{t?.settlement?.profitPercent}%</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: Đã hủy ── */}
        {activeTab === 'cancelled' && (
          <div className="bg-white border border-[#D0C5AF]/20 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH ĐK', 'Thời điểm hủy', 'Tổng tiền hoàn', 'Lý do']?.map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered?.map(t => (
                  <tr key={t?.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t?.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t?.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t?.departureDate)}</td>
                    <td className="px-4 py-4 text-center text-sm">{t?.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm text-red-500">{t?.cancelledAt ? formatDate(t?.cancelledAt) : '—'}</td>
                    <td className="px-4 py-4 text-sm font-bold text-red-600">{t?.refundTotal ? fmtCurrency(t?.refundTotal) : '—'}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70 max-w-40 truncate">{t?.cancelReason ?? '—'}</td>
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
          title={showRejectPopup.mode === 'request_edit' ? 'Yêu cầu sửa' : 'Từ chối'}
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
