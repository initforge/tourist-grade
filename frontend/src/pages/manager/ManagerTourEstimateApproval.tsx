import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockTourInstances } from '../../data/tourProgram';
import type { CostCategory, CostItem } from '../../data/tourProgram';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'tr';
  return new Intl.NumberFormat('vi-VN').format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Reason Popup ─────────────────────────────────────────────────────────────

function ReasonPopup({ title, onConfirm, onCancel }: { title: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
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

function ApproveConfirmPopup({ instanceName, onConfirm, onCancel }: { instanceName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
        </div>
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Duyệt dự toán</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-6">
          Xác nhận duyệt dự toán cho tour <strong>{instanceName}</strong>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Không</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Duyệt</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ManagerTourEstimateApproval() {
  const { id } = useParams<{ id: string }>();
  const [showReject, setShowReject] = useState(false);
  const [showRequestEdit, setShowRequestEdit] = useState(false);
  const [showApprove, setShowApprove] = useState(false);

  const instance = mockTourInstances.find(i => i.id === id);
  const estimate = instance?.costEstimate;

  const handleApprove = () => { setShowApprove(false); };
  const handleReject = (_reason: string) => { setShowReject(false); };
  const handleRequestEdit = (_reason: string) => { setShowRequestEdit(false); };

  if (!instance) {
    return (
      <div className="w-full bg-[#F3F3F3] min-h-full flex items-center justify-center">
        <p className="text-[#2A2421]/50">Tour không tồn tại</p>
      </div>
    );
  }

  const categories: CostCategory[] = estimate?.categories ?? [];

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10 max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link to="/manager/tours" className="text-[#D4AF37] hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">tour</span>
            Quản lý Tour
          </Link>
          <span className="text-[#2A2421]/30">/</span>
          <span className="text-[#2A2421]/60">Duyệt dự toán</span>
        </nav>

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#FAFAF5] border border-[#D0C5AF]/30 px-6 py-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Duyệt dự toán tour</p>
            <h1 className="font-['Noto_Serif'] text-xl text-[#2A2421]">{id} — {instance.programName}</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowRequestEdit(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Yêu cầu chỉnh sửa
            </button>
            <button onClick={() => setShowReject(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">block</span>
              Từ chối
            </button>
            <button onClick={() => setShowApprove(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              <span className="material-symbols-outlined text-[16px]">check</span>
              Duyệt
            </button>
          </div>
        </div>

        {/* Tour Info */}
        <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Mã tour', value: instance.id },
            { label: 'Ngày khởi hành', value: fmtDate(instance.departureDate) },
            { label: 'Người tạo dự toán', value: instance.createdBy },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">{item.label}</p>
              <p className="text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Estimate Table */}
        <div className="bg-white border border-[#D0C5AF]/20 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D0C5AF]/20 flex items-center gap-2">
            <div className="w-1 h-4 bg-[#D4AF37]"></div>
            <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Bảng dự toán chi phí</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/20">
                {['STT', 'Hạng mục', 'Đơn vị tính', 'Đơn giá', 'Thành tiền'].map(h => (
                  <th key={h} className="px-6 py-3 text-[9px] uppercase tracking-widest text-[#2A2421]/50 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/10">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[#2A2421]/40">Chưa có dữ liệu dự toán</td>
                </tr>
              ) : (
                categories.flatMap((cat: CostCategory, ci: number) => [
                  <tr key={`cat-${ci}`} className={ci % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF5]/50'}>
                    <td rowSpan={(cat.items.length ?? 0) + 1} className="px-6 py-3 text-[10px] text-[#2A2421]/40 font-bold uppercase align-top">
                      {ci + 1}
                    </td>
                    <td colSpan={4} className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/5">
                      {cat.name}
                    </td>
                  </tr>,
                  ...(cat.items ?? []).map((item: CostItem, ii: number) => (
                    <tr key={`${ci}-${ii}`} className={ci % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF5]/50'}>
                      <td className="px-6 py-3 text-sm text-[#2A2421] pl-10">{item.name}</td>
                      <td className="px-6 py-3 text-sm text-[#2A2421]/70">{item.unit}</td>
                      <td className="px-6 py-3 text-sm text-[#2A2421]/70 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm font-bold text-[#2A2421] text-right font-mono">{item.total.toLocaleString()}</td>
                    </tr>
                  ))
                ])
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-white border border-[#D0C5AF]/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#D0C5AF]/20 flex items-center gap-2">
            <div className="w-1 h-4 bg-[#D4AF37]"></div>
            <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Tổng kết & Doanh thu</h2>
          </div>
          <div className="p-6">
            {estimate ? (
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#FAFAF5] p-4 border border-[#D0C5AF]/20">
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-2">Tổng chi phí dự toán</p>
                  <p className="font-['Noto_Serif'] text-xl font-bold text-[#2A2421]">{fmtCurrency(estimate.totalCost)}</p>
                  <p className="text-[10px] text-[#2A2421]/40 mt-1">VND</p>
                </div>
                <div className="bg-[#FAFAF5] p-4 border border-[#D0C5AF]/20">
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-2">Giá bán đề xuất</p>
                  <p className="font-['Noto_Serif'] text-xl font-bold text-[#D4AF37]">{fmtCurrency(estimate.pricingConfig.sellPriceAdult * estimate.estimatedGuests)}</p>
                  <p className="text-[10px] text-[#2A2421]/40 mt-1">VND</p>
                </div>
                <div className="bg-emerald-50 p-4 border border-emerald-200">
                  <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold mb-2">Lợi nhuận dự kiến</p>
                  <p className="font-['Noto_Serif'] text-xl font-bold text-emerald-700">
                    {fmtCurrency(estimate.pricingConfig.sellPriceAdult * estimate.estimatedGuests - estimate.totalCost)}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {estimate.totalCost > 0
                        ? (((estimate.pricingConfig.sellPriceAdult * estimate.estimatedGuests - estimate.totalCost) / estimate.totalCost * 100)).toFixed(1)
                        : 0}%
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-[#2A2421]/40">
                Chưa có dữ liệu dự toán cho tour này
              </div>
            )}
          </div>
        </div>
      </div>

      {showReject && <ReasonPopup title="Từ chối dự toán" onConfirm={handleReject} onCancel={() => setShowReject(false)} />}
      {showRequestEdit && <ReasonPopup title="Yêu cầu chỉnh sửa" onConfirm={handleRequestEdit} onCancel={() => setShowRequestEdit(false)} />}
      {showApprove && <ApproveConfirmPopup instanceName={instance.programName} onConfirm={handleApprove} onCancel={() => setShowApprove(false)} />}
    </div>
  );
}
