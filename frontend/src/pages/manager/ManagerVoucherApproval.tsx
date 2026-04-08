import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockVouchers, VOUCHER_STATUS_LABEL as STATUS_LABEL, VOUCHER_STATUS_STYLE as STATUS_STYLE } from '../../data/vouchers';
import type { Voucher } from '../../data/vouchers';

// Filtered: only pending_approval from canonical
const PENDING_VOUCHERS = mockVouchers.filter(v => v.status === 'pending_approval');

// ── Reject Popup ─────────────────────────────────────────────────────────────

function RejectPopup({ voucherCode, onConfirm, onCancel }: {
  voucherCode: string; onConfirm: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-500">block</span>
        </div>
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Từ chối Voucher</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-4">
          Mã voucher <strong>{voucherCode}</strong> sẽ bị từ chối. Vui lòng nhập lý do.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Lý do không phê duyệt..."
          className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">
            Hủy bỏ
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${
              reason.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approve Confirm Popup ─────────────────────────────────────────────────────

function ApproveConfirmPopup({ voucherCode, onConfirm, onCancel }: {
  voucherCode: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
        </div>
        <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Phê duyệt Voucher</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-6">
          Bạn có chắc muốn phê duyệt voucher <strong>{voucherCode}</strong>? Voucher sẽ chuyển sang trạng thái <strong>Đang hoạt động</strong>.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">
            Không
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Phê duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Voucher Detail ─────────────────────────────────────────────────────────────

function VoucherDetailPanel({ voucher, onBack, onApprove, onReject }: {
  voucher: Voucher;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-white border border-[#D0C5AF]/20 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6">
        <Link to="/manager/voucher-approval" onClick={onBack} className="text-[#D4AF37] hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Phê duyệt Voucher
        </Link>
        <span className="text-[#2A2421]/30">/</span>
        <span className="text-[#2A2421]/60">Chi tiết</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-['Noto_Serif'] text-2xl text-[#2A2421]">{voucher.code}</h2>
          <p className="text-xs text-[#2A2421]/50 mt-1">
            {voucher.createdBy && `Người tạo: ${voucher.createdBy} · `}
            {voucher.createdAt && `Ngày tạo: ${voucher.createdAt}`}
          </p>
        </div>
        <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded ${STATUS_STYLE[voucher.status]}`}>
          {STATUS_LABEL[voucher.status]}
        </span>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        {[
          { label: 'Loại giảm giá', value: voucher.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt' },
          { label: 'Giá trị', value: voucher.value },
          { label: 'Số lượng', value: `${voucher.used} / ${voucher.limit}` },
          { label: 'Hạn sử dụng', value: voucher.expiryDate },
        ].map(item => (
          <div key={item.label}>
            <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">{item.label}</p>
            <p className="text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tours */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-2">Chương trình tour áp dụng</p>
        {voucher.applicableTours.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {voucher.applicableTours.map(t => (
              <span key={t} className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold rounded-full border border-[#D4AF37]/20">{t}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#2A2421]/50">Áp dụng cho tất cả chương trình tour</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#D0C5AF]/20">
        <button
          onClick={onReject}
          className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
        >
          Từ chối
        </button>
        <button
          onClick={onApprove}
          className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Phê duyệt
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ManagerVoucherApproval() {
  const [vouchers, setVouchers] = useState<Voucher[]>(PENDING_VOUCHERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRejectPopup, setShowRejectPopup] = useState<string | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = vouchers.filter(v =>
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.createdBy?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApprove = (id: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
    setShowApprovePopup(null);
    setSelectedId(null);
  };

  const handleReject = (id: string, reason: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
    setShowRejectPopup(null);
    setSelectedId(null);
  };

  const selected = vouchers.find(v => v.id === selectedId);

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#D4AF37] rounded-sm"></div>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Phê Duyệt Voucher</h1>
          </div>
          <p className="text-xs text-[#2A2421]/50 ml-4">Danh sách voucher đang chờ phê duyệt từ nhân viên kinh doanh.</p>
        </div>

        {/* Detail view */}
        {selected && (
          <div className="mb-6">
            <VoucherDetailPanel
              voucher={selected}
              onBack={() => setSelectedId(null)}
              onApprove={() => setShowApprovePopup(selected.id)}
              onReject={() => setShowRejectPopup(selected.id)}
            />
          </div>
        )}

        {/* List */}
        {!selected && (
          <>
            {/* Search */}
            <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 flex items-center gap-3">
              <div className="flex items-center border border-[#D0C5AF]/40 focus-within:border-[#D4AF37] transition-colors flex-1">
                <span className="material-symbols-outlined text-[#2A2421]/40 text-[18px] pl-3">search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo mã voucher, người tạo..."
                  className="flex-1 pl-2 pr-4 py-2 text-sm outline-none bg-transparent"
                />
              </div>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-[#2A2421]/30 hover:text-[#2A2421]/60">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                    <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Mã Code</th>
                    <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Loại</th>
                    <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Giá trị</th>
                    <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Hạn SD</th>
                    <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Người tạo</th>
                    <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Ngày tạo</th>
                    <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/15">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-[#D0C5AF]">inbox</span>
                        Không có voucher nào chờ phê duyệt
                      </td>
                    </tr>
                  )}
                  {filtered.map(v => (
                    <tr key={v.id} className="hover:bg-[#FAFAF5] transition-colors cursor-pointer"
                      onClick={() => setSelectedId(v.id)}
                    >
                      <td className="px-5 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{v.code}</td>
                      <td className="px-5 py-4 text-sm text-[#2A2421]/70">
                        {v.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt'}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-[#D4AF37]">{v.value}</td>
                      <td className="px-5 py-4 text-sm text-[#2A2421]/70">{v.expiryDate}</td>
                      <td className="px-5 py-4 text-sm text-[#2A2421]/70">{v.createdBy ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-[#2A2421]/70">{v.createdAt ?? '—'}</td>
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setShowRejectPopup(v.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">block</span>
                            Từ chối
                          </button>
                          <button
                            onClick={() => setShowApprovePopup(v.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Phê duyệt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <p className="text-[11px] text-[#2A2421]/40">Hiển thị {filtered.length} voucher chờ phê duyệt</p>
            </div>
          </>
        )}
      </div>

      {/* Popups */}
      {showRejectPopup && (() => {
        const v = vouchers.find(x => x.id === showRejectPopup);
        return v ? (
          <RejectPopup
            voucherCode={v.code}
            onConfirm={reason => handleReject(v.id, reason)}
            onCancel={() => setShowRejectPopup(null)}
          />
        ) : null;
      })()}

      {showApprovePopup && (() => {
        const v = vouchers.find(x => x.id === showApprovePopup);
        return v ? (
          <ApproveConfirmPopup
            voucherCode={v.code}
            onConfirm={() => handleApprove(v.id)}
            onCancel={() => setShowApprovePopup(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
