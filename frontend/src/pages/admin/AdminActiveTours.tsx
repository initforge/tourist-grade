import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTourInstances, TOUR_INSTANCE_STATUS_LABEL } from '../../data/tourProgram';
import type { TourInstance } from '../../data/tourProgram';

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
  { key: 'deployed', label: 'Đang triển khai', icon: 'luggage' },
  { key: 'completed', label: 'Hoàn thành', icon: 'task_alt' },
  { key: 'cancelled', label: 'Đã hủy', icon: 'cancel' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtCurrency(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'tr';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

// ── Popups ───────────────────────────────────────────────────────────────────

function RejectPopup({ title, onConfirm, onCancel }: { title: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">{title}</h3>
        <p className="text-xs text-[#2A2421]/60 mb-4">Vui lòng nhập lý do.</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          placeholder="Lý do..." className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${reason.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveConfirmPopup({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
        </div>
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Xác nhận duyệt</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-6">{label}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Không</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Duyệt</button>
        </div>
      </div>
    </div>
  );
}

function ExtendDeadlinePopup({ onConfirm, onCancel }: { onConfirm: (days: number) => void; onCancel: () => void }) {
  const [days, setDays] = useState(7);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-xs mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">Gia hạn bán</h3>
        <p className="text-xs text-[#2A2421]/60 mb-4">Chọn số ngày gia hạn thêm:</p>
        <input type="number" value={days} onChange={e => setDays(Number(e.target.value))}
          min={1} max={30} className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] mb-6" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50">Hủy bỏ</button>
          <button onClick={() => onConfirm(days)} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#D4AF37] text-white hover:bg-[#C49B2F]">Gia hạn</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminActiveTours() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TourTab>('pending_sell');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showRejectPopup, setShowRejectPopup] = useState<{ id: string; name: string } | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState<string | null>(null);
  const [showExtendPopup, setShowExtendPopup] = useState(false);
  const [instances, setInstances] = useState<TourInstance[]>(mockTourInstances);

  // Filter theo tab
  const filtered = instances.filter(i => TAB_STATUS_MAP[activeTab]?.includes(i.status) ?? false);

  // Tab counts
  const tabCounts = Object.fromEntries(
    TABS.map(tab => [tab.key, instances.filter(i => TAB_STATUS_MAP[tab.key]?.includes(i.status) ?? false).length])
  ) as Record<TourTab, number>;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    const ids = filtered.map(t => t.id);
    setSelectedIds(prev => prev.size === ids.length ? new Set() : new Set(ids));
  };

  const handleApprove = (_id: string) => { setShowApprovePopup(null); };
  const handleReject = (_id: string, _reason: string) => { setShowRejectPopup(null); };
  const handleExtend = (_days: number) => { setShowExtendPopup(false); };
  const handleCancelTour = () => {
    if (selectedIds.size === 0) return;
    setInstances(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
  };

  const insufficientIds = new Set(
    instances.filter(i => TAB_STATUS_MAP.insufficient.includes(i.status)).map(i => i.id)
  );

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
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-['Inter'] uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.key ? 'border-[#D4AF37] text-[#D4AF37] font-bold bg-[#D4AF37]/5' : 'border-transparent text-[#2A2421]/50 hover:text-[#2A2421] hover:bg-gray-50'
                }`}>
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === tab.key ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-500'}`}>
                  {tabCounts[tab.key]}
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
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Người tạo', 'Trạng thái', 'Hành động'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#2A2421]">{t.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t.departureDate)}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.departurePoint}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.sightseeingSpots.join(', ')}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">—</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.createdBy}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold">{TOUR_INSTANCE_STATUS_LABEL[t.status]}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setShowApprovePopup(t.id)} className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700">Duyệt</button>
                        <button onClick={() => setShowRejectPopup({ id: t.id, name: t.programName })} className="px-3 py-1.5 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50">Từ chối</button>
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
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll} className="w-4 h-4 accent-[#D4AF37]" />
                Chọn tất cả ({selectedIds.size}/{filtered.length})
              </label>
              <div className="flex gap-2">
                <button disabled={selectedIds.size === 0} onClick={handleCancelTour}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${selectedIds.size === 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
                  Hủy tour ({selectedIds.size})
                </button>
                <button disabled={selectedIds.size === 0} onClick={() => setShowExtendPopup(true)}
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
                    {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH hiện tại/tối thiểu', 'Hạn bán', 'Doanh thu'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/15">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} className={`hover:bg-[#FAFAF5] transition-colors ${selectedIds.has(t.id) ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSelect(t.id)} className="w-4 h-4 accent-[#D4AF37]" />
                      </td>
                      <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t.id}</td>
                      <td className="px-4 py-4 text-sm font-semibold">{t.programName}</td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t.departureDate)}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className="text-red-600 font-bold">{t.expectedGuests}</span>
                        <span className="text-[#2A2421]/30"> / </span>
                        <span className="text-[#2A2421]/50">{t.minParticipants}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.bookingDeadline}</td>
                      <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">—</td>
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
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Tổng chi phí DT', 'Lợi nhuận DT (%)', 'Người tạo DT', 'Hành động'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t.departureDate)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">
                      {t.costEstimate ? fmtCurrency(t.costEstimate.totalFixedCost + t.costEstimate.totalVariableCost) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {t.costEstimate ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold">—</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.createdBy}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => navigate(`/manager/tours/${t.id}/estimate-approval`)}
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
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Điểm KH', 'Điểm TQ', 'Số KH', 'Người tạo', 'Trạng thái'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t.departureDate)}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.departurePoint}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.sightseeingSpots.join(', ')}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{t.createdBy}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold">{TOUR_INSTANCE_STATUS_LABEL[t.status]}</span>
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
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH thực tế', 'Doanh thu TT', 'Chi phí TT', 'Lợi nhuận TT (%)'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t.departureDate)}</td>
                    <td className="px-4 py-4 text-center text-sm font-bold">{t.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">
                      {t.settlement ? fmtCurrency(t.settlement.revenue) : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">
                      {t.settlement ? fmtCurrency(t.settlement.totalActualCost) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {t.settlement ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold">{t.settlement.profitPercent}%</span>
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
                  {['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH ĐK', 'Thời điểm hủy', 'Tổng tiền hoàn', 'Lý do'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/15">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không có tour nào</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="hover:bg-[#FAFAF5] transition-colors">
                    <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{t.id}</td>
                    <td className="px-4 py-4 text-sm font-semibold">{t.programName}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(t.departureDate)}</td>
                    <td className="px-4 py-4 text-center text-sm">{t.expectedGuests}</td>
                    <td className="px-4 py-4 text-sm text-red-500">{t.cancelledAt ? formatDate(t.cancelledAt) : '—'}</td>
                    <td className="px-4 py-4 text-sm font-bold text-red-600">{t.refundTotal ? fmtCurrency(t.refundTotal) : '—'}</td>
                    <td className="px-4 py-4 text-sm text-[#2A2421]/70 max-w-40 truncate">{t.cancelReason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popups */}
      {showRejectPopup && (
        <RejectPopup title="Từ chối" onConfirm={reason => handleReject(showRejectPopup.id, reason)} onCancel={() => setShowRejectPopup(null)} />
      )}
      {showApprovePopup && (
        <ApproveConfirmPopup label="Bạn có chắc muốn duyệt tour này?" onConfirm={() => handleApprove(showApprovePopup)} onCancel={() => setShowApprovePopup(null)} />
      )}
      {showExtendPopup && (
        <ExtendDeadlinePopup onConfirm={handleExtend} onCancel={() => setShowExtendPopup(false)} />
      )}
    </div>
  );
}
