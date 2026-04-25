import { useMemo, useState } from 'react';
import { VOUCHER_STATUS_LABEL, VOUCHER_STATUS_STYLE } from '@entities/voucher/data/vouchers';
import type { Voucher, VoucherStatus } from '@entities/voucher/data/vouchers';
import {
  MANAGER_APPROVAL_WARNING,
  approvedVoucherStatus,
  formatVoucherValue,
  hasManagerApprovalWarning,
  normalizeVoucherLifecycle,
} from '@entities/voucher/lib/voucherRules';
import { approveVoucher, rejectVoucher } from '@shared/lib/api/vouchers';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { useAuthStore } from '@shared/store/useAuthStore';

const FILTERS: VoucherStatus[] = ['pending_approval', 'upcoming', 'active', 'inactive'];
const VISIBLE = new Set<VoucherStatus>(FILTERS);

function WarningIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700" title={MANAGER_APPROVAL_WARNING} aria-label={MANAGER_APPROVAL_WARNING}>
      <span className="material-symbols-outlined text-[14px]">warning</span>
    </span>
  );
}

function RejectPopup({ voucherCode, onConfirm, onCancel }: { voucherCode: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="manager-voucher-reject-title">
      <div className="absolute inset-0 bg-[#2A2421]/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm border border-[#D0C5AF]/30 bg-white p-8 shadow-2xl">
        <h3 id="manager-voucher-reject-title" className="mb-2 text-center font-['Noto_Serif'] text-xl text-[#2A2421]">Từ chối Voucher</h3>
        <p className="mb-4 text-center text-xs text-[#2A2421]/60">Mã voucher <strong>{voucherCode}</strong> sẽ bị từ chối. Vui lòng nhập lý do.</p>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Lý do không phê duyệt..." className="mb-4 w-full resize-none border border-[#D0C5AF]/40 p-3 text-sm outline-none" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-[#2A2421]/20 py-3 font-['Inter'] text-xs uppercase tracking-widest">Hủy bỏ</button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim()} className={`flex-1 py-3 font-['Inter'] text-xs font-bold uppercase tracking-widest ${reason.trim() ? 'bg-red-600 text-white' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

function ApprovePopup({ voucherCode, onConfirm, onCancel }: { voucherCode: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="manager-voucher-approve-title">
      <div className="absolute inset-0 bg-[#2A2421]/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm border border-[#D0C5AF]/30 bg-white p-8 text-center shadow-2xl">
        <h3 id="manager-voucher-approve-title" className="mb-2 font-['Noto_Serif'] text-xl text-[#2A2421]">Phê duyệt Voucher</h3>
        <p className="mb-6 text-xs text-[#2A2421]/60">Bạn có chắc muốn phê duyệt voucher <strong>{voucherCode}</strong>?</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-[#2A2421]/20 py-3 font-['Inter'] text-xs uppercase tracking-widest">Không</button>
          <button onClick={onConfirm} className="flex-1 bg-emerald-600 py-3 font-['Inter'] text-xs font-bold uppercase tracking-widest text-white">Phê duyệt</button>
        </div>
      </div>
    </div>
  );
}

export default function ManagerVoucherApproval() {
  const token = useAuthStore((state) => state.accessToken);
  const storeVouchers = useAppDataStore((state) => state.vouchers);
  const tourPrograms = useAppDataStore((state) => state.tourPrograms);
  const upsertVoucher = useAppDataStore((state) => state.upsertVoucher);
  const [status, setStatus] = useState<VoucherStatus>('pending_approval');
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const getTourName = (id: string) => tourPrograms.find((tour) => tour.id === id)?.name ?? id;
  const vouchers = useMemo(
    () => storeVouchers.map((voucher) => normalizeVoucherLifecycle(voucher)).filter((voucher) => VISIBLE.has(voucher.status)).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [storeVouchers],
  );
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return vouchers
      .filter((voucher) => voucher.status === status)
      .filter((voucher) => !keyword || `${voucher.code} ${voucher.description ?? ''} ${voucher.applicableTours.map(getTourName).join(' ')}`.toLowerCase().includes(keyword))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [search, status, vouchers]);
  const approveTarget = vouchers.find((voucher) => voucher.id === approveId);
  const rejectTarget = vouchers.find((voucher) => voucher.id === rejectId);

  const handleApprove = (voucher: Voucher) => {
    const next = { ...voucher, status: approvedVoucherStatus(voucher.startDate) };
    upsertVoucher(next);
    if (token) void approveVoucher(token, voucher.id).then((response) => upsertVoucher(response.voucher)).catch(() => null);
    setApproveId(null);
  };

  const handleReject = (voucher: Voucher, reason: string) => {
    const next = { ...voucher, status: 'rejected' as VoucherStatus, rejectionReason: reason };
    upsertVoucher(next);
    if (token) void rejectVoucher(token, voucher.id, reason).then((response) => upsertVoucher(response.voucher)).catch(() => null);
    setRejectId(null);
  };

  return (
    <div className="min-h-full w-full bg-[#F3F3F3]">
      <div className="p-6 md:p-10">
        <div className="mb-8">
          <p className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Khuyến mãi</p>
          <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Phê duyệt Voucher</h1>
        </div>
        <div className="mb-6 flex flex-wrap gap-3 border border-[#D0C5AF]/20 bg-white p-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo mã voucher, ghi chú, tour áp dụng..." className="min-w-48 flex-1 border border-[#D0C5AF]/40 px-4 py-2 text-sm outline-none" />
          <select value={status} onChange={(event) => setStatus(event.target.value as VoucherStatus)} className="border border-[#D0C5AF]/40 bg-white px-4 py-2 text-sm outline-none">
            {FILTERS.map((item) => <option key={item} value={item}>{VOUCHER_STATUS_LABEL[item]}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto border border-[#D0C5AF]/20 bg-white shadow-sm">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#D0C5AF]/30 bg-[#FAFAF5]">
                {['Mã Code', 'Loại', 'Giá trị', 'Thời gian áp dụng', 'Áp dụng', 'Tour áp dụng', 'Trạng thái', 'Thao tác'].map((header) => (
                  <th key={header} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#2A2421]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/20">
              {filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-[#2A2421]/50">Không có voucher phù hợp với bộ lọc hiện tại</td></tr>}
              {filtered.map((voucher) => (
                <tr key={voucher.id}>
                  <td className="px-5 py-4 font-mono text-sm font-bold">{voucher.code}</td>
                  <td className="px-5 py-4 text-sm">{voucher.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt'}</td>
                  <td className="px-5 py-4 text-sm font-semibold">{formatVoucherValue(voucher)}</td>
                  <td className="px-5 py-4 text-xs">{voucher.startDate} → {voucher.endDate}</td>
                  <td className="px-5 py-4 text-sm">{voucher.used} / {voucher.limit}</td>
                  <td className="px-5 py-4 text-sm">{voucher.applicableTours.length ? voucher.applicableTours.map(getTourName).join(', ') : 'Tất cả'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {voucher.status === 'pending_approval' && hasManagerApprovalWarning(voucher.startDate) && <WarningIcon />}
                      <span className={`inline-block rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${VOUCHER_STATUS_STYLE[voucher.status]}`}>{VOUCHER_STATUS_LABEL[voucher.status]}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {voucher.status === 'pending_approval' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setApproveId(voucher.id)} className="text-xs font-bold text-emerald-600">Phê duyệt</button>
                        <button onClick={() => setRejectId(voucher.id)} className="text-xs font-bold text-red-600">Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {approveTarget && <ApprovePopup voucherCode={approveTarget.code} onCancel={() => setApproveId(null)} onConfirm={() => handleApprove(approveTarget)} />}
      {rejectTarget && <RejectPopup voucherCode={rejectTarget.code} onCancel={() => setRejectId(null)} onConfirm={(reason) => handleReject(rejectTarget, reason)} />}
    </div>
  );
}
