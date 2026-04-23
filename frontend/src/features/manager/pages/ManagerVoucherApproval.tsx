import { useState } from 'react';
import { mockVouchers, VOUCHER_STATUS_LABEL as STATUS_LABEL, VOUCHER_STATUS_STYLE as STATUS_STYLE } from '@entities/voucher/data/vouchers';
import type { Voucher, VoucherStatus } from '@entities/voucher/data/vouchers';
import { mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import { MANAGER_APPROVAL_WARNING, approvedVoucherStatus, hasManagerApprovalWarning, normalizeVoucherLifecycle } from '@entities/voucher/lib/voucherRules';

const PENDING_VOUCHERS = mockVouchers
  ?.map((voucher) => normalizeVoucherLifecycle(voucher))
  ?.filter(voucher => voucher.status === 'pending_approval')
  ?.sort((left, right) => left?.startDate?.localeCompare(right?.startDate));

function getTourName(id: string) {
  return mockTourPrograms?.find(tour => tour.id === id)?.name ?? id;
}

function hasStartWarning(voucher: Voucher) {
  return hasManagerApprovalWarning(voucher?.startDate);
}

function approvedStatusFor(voucher: Voucher): VoucherStatus {
  return approvedVoucherStatus(voucher?.startDate);
}

function RejectPopup({
  voucherCode,
  onConfirm,
  onCancel,
}: {
  voucherCode: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="voucher-reject-title">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-500">block</span>
        </div>
        <h3 id="voucher-reject-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Từ chối Voucher</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-4">
          Mã voucher <strong>{voucherCode}</strong> sẽ bị từ chối. Vui lòng nhập lý do.
        </p>
        <textarea
          value={reason}
          onChange={event => setReason(event?.target?.value)}
          rows={3}
          placeholder="Lý do không phê duyệt..."
          className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">
            Hủy bỏ
          </button>
          <button
            onClick={() => reason?.trim() && onConfirm(reason)}
            disabled={!reason?.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${
              reason?.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveConfirmPopup({
  voucherCode,
  onConfirm,
  onCancel,
}: {
  voucherCode: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="voucher-approve-title">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
        </div>
        <h3 id="voucher-approve-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Phê duyệt Voucher</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-6">
          Bạn có chắc muốn phê duyệt voucher <strong>{voucherCode}</strong>?
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

export default function ManagerVoucherApproval() {
  const [vouchers, setVouchers] = useState<Voucher[]>(PENDING_VOUCHERS);
  const [showRejectPopup, setShowRejectPopup] = useState<string | null>(null);
  const [showApprovePopup, setShowApprovePopup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = vouchers
    ?.filter(voucher =>
      voucher?.code?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      (voucher?.createdBy?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ?? false) ||
      voucher?.applicableTours?.some(tourId => getTourName(tourId)?.toLowerCase()?.includes(searchTerm?.toLowerCase()))
    )
    ?.sort((left, right) => left?.startDate?.localeCompare(right?.startDate));

  const handleApprove = (id: string) => {
    setVouchers(prev =>
      prev
        ?.map(voucher => voucher.id === id ? { ...voucher, status: approvedStatusFor(voucher) } : voucher)
        ?.filter(voucher => voucher?.id !== id),
    );
    setShowApprovePopup(null);
  };

  const handleReject = (id: string, reason: string) => {
    void reason;
    setVouchers(prev => prev?.filter(voucher => voucher?.id !== id));
    setShowRejectPopup(null);
  };

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#D4AF37] rounded-sm"></div>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Phê Duyệt Voucher</h1>
          </div>
          <p className="text-xs text-[#2A2421]/50 ml-4">Danh sách voucher đang chờ phê duyệt từ nhân viên kinh doanh.</p>
        </div>

        <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 flex items-center gap-3">
          <div className="flex items-center border border-[#D0C5AF]/40 focus-within:border-[#D4AF37] transition-colors flex-1">
            <span className="material-symbols-outlined text-[#2A2421]/40 text-[18px] pl-3">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={event => setSearchTerm(event?.target?.value)}
              placeholder="Tìm theo mã voucher, người tạo, tour áp dụng..."
              className="flex-1 pl-2 pr-4 py-2 text-sm outline-none bg-transparent"
            />
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-[#2A2421]/30 hover:text-[#2A2421]/60">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Mã Code</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Loại</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Giá trị</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Thời gian áp dụng</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Ghi chú</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Số lượng được dùng</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Tour áp dụng</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Người tạo</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Ngày gửi phê duyệt</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Trạng thái</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#D0C5AF]">inbox</span>
                    Không có voucher nào chờ phê duyệt
                  </td>
                </tr>
              )}
              {filtered?.map(voucher => (
                <tr key={voucher?.id} className="hover:bg-[#FAFAF5] transition-colors">
                  <td className="px-5 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{voucher?.code}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">
                    {voucher.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt'}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[#D4AF37]">{voucher?.value}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">
                    <div>{voucher?.startDate && voucher?.endDate ? `${voucher?.startDate} → ${voucher?.endDate}` : '—'}</div>
                    {hasStartWarning(voucher) && (
                      <div className="mt-1">
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                          title={MANAGER_APPROVAL_WARNING}
                          aria-label={MANAGER_APPROVAL_WARNING}
                        >
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#2A2421]/60 max-w-44 truncate" title={voucher?.description ?? '—'}>
                    {voucher?.description ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{voucher?.used} / {voucher?.limit}</td>
                  <td className="px-5 py-4">
                    {voucher?.applicableTours?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {voucher?.applicableTours?.slice(0, 2)?.map(tourId => (
                          <span
                            key={tourId}
                            className="px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded max-w-[180px] truncate"
                            title={getTourName(tourId)}
                          >
                            {getTourName(tourId)}
                          </span>
                        ))}
                        {voucher?.applicableTours?.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded">
                            +{voucher?.applicableTours?.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#2A2421]/40">Tất cả chương trình</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{voucher?.createdBy ?? '—'}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{voucher?.createdAt ?? '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${STATUS_STYLE[voucher?.status]}`}>
                      {STATUS_LABEL[voucher?.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowRejectPopup(voucher?.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">block</span>
                        Từ chối
                      </button>
                      <button
                        onClick={() => setShowApprovePopup(voucher?.id)}
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
          <p className="text-[11px] text-[#2A2421]/40">Hiển thị {filtered?.length} voucher chờ phê duyệt</p>
        </div>
      </div>

      {showRejectPopup && (() => {
        const voucher = vouchers?.find(item => item.id === showRejectPopup);
        return voucher ? (
          <RejectPopup
            voucherCode={voucher?.code}
            onConfirm={reason => handleReject(voucher?.id, reason)}
            onCancel={() => setShowRejectPopup(null)}
          />
        ) : null;
      })()}

      {showApprovePopup && (() => {
        const voucher = vouchers?.find(item => item.id === showApprovePopup);
        return voucher ? (
          <ApproveConfirmPopup
            voucherCode={voucher?.code}
            onConfirm={() => handleApprove(voucher?.id)}
            onCancel={() => setShowApprovePopup(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
