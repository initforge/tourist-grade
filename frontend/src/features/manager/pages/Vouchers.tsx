import { useState } from 'react';
import { Modal, message } from 'antd';
import { useAuthStore } from '@shared/store/useAuthStore';
import { mockVouchers, VOUCHER_STATUS_LABEL as STATUS_LABEL, VOUCHER_STATUS_STYLE as STATUS_STYLE } from '@entities/voucher/data/vouchers';
import type { Voucher, VoucherType, VoucherStatus } from '@entities/voucher/data/vouchers';
import { mockTours } from '@entities/tour/data/tours';

// ── Voucher Form Drawer ──────────────────────────────────────────────────────

interface VoucherFormDrawerProps {
  voucher: Voucher | null;
  onClose: () => void;
  onSave: (v: Voucher) => void;
  onSendApproval: (v: Voucher) => void;
}

function VoucherFormDrawer({ voucher, onClose, onSave, onSendApproval }: VoucherFormDrawerProps) {
  const [form, setForm] = useState<Partial<Voucher>>(
    voucher ?? { code: '', type: 'percent', value: '', expiryDate: '', limit: 100, applicableTours: [], status: 'draft', description: '' }
  );
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>(voucher?.applicableTours ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isEdit = !!voucher;

  const canEdit = !voucher || ['draft', 'rejected']?.includes(voucher?.status);
  const canSendApproval = isEdit && (form.status === 'draft' || form.status === 'rejected');

  const toggleTour = (id: string) => {
    setSelectedTourIds(prev =>
      prev?.includes(id) ? prev?.filter(t => t !== id) : [...prev, id]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form?.code?.trim()) e.code = 'Mã voucher không được trống';
    if (!form?.value?.trim()) e.value = 'Giá trị không được trống';
    if (!form?.expiryDate) e.expiryDate = 'Hạn sử dụng không được trống';
    setErrors(e);
    return Object.keys(e)?.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...(voucher ?? {}), ...form, applicableTours: selectedTourIds } as Voucher);
  };

  const handleSendApproval = () => {
    if (!validate()) return;
    onSendApproval({ ...(voucher ?? {}), ...form, applicableTours: selectedTourIds, status: 'pending_approval' } as Voucher);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute inset-y-0 right-0 max-w-lg w-full flex">
        <div className="w-full h-full bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#D0C5AF]/30 flex items-center justify-between shrink-0">
            <div>
              <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Voucher</p>
              <h2 className="font-['Noto_Serif'] text-xl text-[#2A2421]">
                {isEdit ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}
              </h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
              <span className="material-symbols-outlined text-[#2A2421]/60">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Status badge */}
            {isEdit && (
              <div>
                <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${STATUS_STYLE[form?.status ?? 'draft']}`}>
                  {STATUS_LABEL[form?.status ?? 'draft']}
                </span>
                {form.status === 'rejected' && form?.rejectionReason && (
                  <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 p-2">
                    Lý do từ chối: {form?.rejectionReason}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Mã Khuyến Mãi *</label>
              <input
                type="text"
                value={form?.code ?? ''}
                onChange={e => setForm({ ...form, code: e?.target?.value?.toUpperCase() })}
                disabled={!canEdit}
                className={`w-full border p-3 text-sm outline-none font-bold uppercase ${errors?.code ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'} ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="VD: SUMMER2026"
              />
              {errors?.code && <p className="text-red-500 text-xs mt-1">{errors?.code}</p>}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Loại chiết khấu</label>
                <select
                  value={form?.type ?? 'percent'}
                  onChange={e => setForm({ ...form, type: e?.target?.value as VoucherType })}
                  disabled={!canEdit}
                  className={`w-full border p-3 text-sm outline-none appearance-none ${errors?.type ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'} ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Tiền mặt trực tiếp</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Giá trị *</label>
                <input
                  type="text"
                  value={form?.value ?? ''}
                  onChange={e => setForm({ ...form, value: e?.target?.value })}
                  disabled={!canEdit}
                  className={`w-full border p-3 text-sm outline-none ${errors?.value ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'} ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="VD: 15% hoặc 500,000 đ"
                />
                {errors?.value && <p className="text-red-500 text-xs mt-1">{errors?.value}</p>}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Số lượng được dùng (Limit)</label>
              <input
                type="number"
                value={form?.limit ?? 100}
                onChange={e => setForm({ ...form, limit: parseInt(e?.target?.value) })}
                disabled={!canEdit}
                className={`w-full border p-3 text-sm outline-none ${errors?.limit ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'} ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Hạn sử dụng *</label>
              <input
                type="date"
                value={form?.expiryDate ?? ''}
                onChange={e => setForm({ ...form, expiryDate: e?.target?.value })}
                disabled={!canEdit}
                className={`w-full border p-3 text-sm outline-none ${errors?.expiryDate ? 'border-red-400' : 'border-[#D0C5AF]/40 focus:border-[#D4AF37]'} ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {errors?.expiryDate && <p className="text-red-500 text-xs mt-1">{errors?.expiryDate}</p>}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">
                Chương trình tour áp dụng
                <span className="font-normal text-[#2A2421]/40 ml-1">(để trống = áp dụng tất cả)</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => canEdit && setDropdownOpen(o => !o)}
                  disabled={!canEdit}
                  className={`w-full border p-3 text-sm text-left flex items-center justify-between ${errors?.applicableTours ? 'border-red-400' : 'border-[#D0C5AF]/40 focus-within:border-[#D4AF37]'} ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={selectedTourIds?.length > 0 ? 'text-[#2A2421]' : 'text-[#2A2421]/40'}>
                    {selectedTourIds?.length > 0
                      ? `${selectedTourIds?.length} chương trình đã chọn`
                      : 'Chọn chương trình tour...'}
                  </span>
                  <span className={`material-symbols-outlined text-[16px] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#D0C5AF]/40 shadow-lg max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setSelectedTourIds([]); setDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#D4AF37]/5 transition-colors border-b border-[#D0C5AF]/20"
                    >
                      <span className="text-[#D4AF37] font-medium">Áp dụng cho tất cả chương trình</span>
                      <span className="text-[10px] text-[#2A2421]/40 ml-2">(bỏ chọn tất cả)</span>
                    </button>
                    {mockTours?.map(tp => (
                      <button
                        key={tp?.id}
                        type="button"
                        onClick={() => { toggleTour(tp?.id); setDropdownOpen(false); }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#D4AF37]/5 transition-colors flex items-center gap-2 ${selectedTourIds?.includes(tp?.id) ? 'bg-[#D4AF37]/8' : ''}`}
                      >
                        <span className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${selectedTourIds?.includes(tp?.id) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-[#D0C5AF]/40'}`}>
                          {selectedTourIds?.includes(tp?.id) && (
                            <span className="material-symbols-outlined text-white text-[12px]">check</span>
                          )}
                        </span>
                        <span className="font-medium text-[#2A2421]/80">{tp?.title}</span>
                        <span className="text-[10px] text-[#2A2421]/40 ml-auto flex-shrink-0">{tp?.duration?.days}N{tp?.duration?.nights}Đ</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedTourIds?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedTourIds?.map(id => {
                    const tp = mockTours?.find(t => t.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded border border-[#D4AF37]/20">
                        {tp?.title ?? id}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setSelectedTourIds(prev => prev?.filter(t => t !== id))}
                            className="hover:text-red-500 ml-0.5"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ghi chú (tùy chọn)</label>
              <textarea
                value={form?.description ?? ''}
                onChange={e => setForm({ ...form, description: e?.target?.value })}
                disabled={!canEdit}
                rows={2}
                placeholder="Nhập mô tả ngắn..."
                className={`w-full border p-3 text-sm outline-none resize-none border-[#D0C5AF]/40 focus:border-[#D4AF37] ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#D0C5AF]/30 bg-[#FAFAF5] flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-white transition-colors"
            >
              Hủy bỏ
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#2A2421] text-white hover:bg-[#D4AF37] transition-colors"
              >
                Lưu
              </button>
            )}
            {canSendApproval && (
              <button
                onClick={handleSendApproval}
                className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-[#D4AF37] text-white hover:bg-[#C49B2F] transition-colors"
              >
                Gửi Phê Duyệt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function VoucherManagement() {
  const role = useAuthStore(s => s?.user?.role) ?? 'guest';

  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showFormDrawer, setShowFormDrawer] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Voucher | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = vouchers?.filter(v => {
    const matchSearch = v?.code?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = (v: Voucher) => {
    setVouchers(prev => {
      const idx = prev?.findIndex(x => x.id === v?.id);
      if (idx >= 0) return prev?.map(x => x.id === v?.id ? v : x);
      return [...prev, { ...v, id: `VOU-0${prev?.length + 1}` }];
    });
    setShowFormDrawer(false);
    setEditingVoucher(null);
  };

  const handleSendApproval = (v: Voucher) => {
    setVouchers(prev => {
      const idx = prev?.findIndex(x => x.id === v?.id);
      if (idx >= 0) return prev?.map(x => x.id === v?.id ? v : x);
      return [...prev, { ...v, id: `VOU-0${prev?.length + 1}` }];
    });
    setShowFormDrawer(false);
    setEditingVoucher(null);
    message?.success('Đã gửi phê duyệt thành công!');
  };

  const handleApprove = (v: Voucher) => {
    setVouchers(prev => prev?.map(x => x.id === v?.id ? { ...x, status: 'active' as VoucherStatus } : x));
    message?.success('Phê duyệt voucher thành công!');
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectReason?.trim()) return;
    setVouchers(prev => prev?.map(x => x.id === rejectTarget?.id ? { ...x, status: 'rejected' as VoucherStatus, rejectionReason: rejectReason?.trim() } : x));
    setRejectTarget(null);
    setRejectReason('');
  };

  const handleDelete = (v: Voucher) => {
    Modal?.confirm({
      title: 'Xóa Voucher',
      content: `Bạn có chắc muốn xóa voucher "${v?.code}" không?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        setVouchers(prev => prev?.filter(x => x?.id !== v?.id));
        message?.success('Đã xóa voucher thành công!');
      },
    });
  };

  const handleSendApprovalFromList = (v: Voucher) => {
    setVouchers(prev => prev?.map(x => x.id === v?.id ? { ...x, status: 'pending_approval' as VoucherStatus } : x));
    message?.success('Đã gửi phê duyệt thành công!');
  };

  const openCreate = () => {
    setEditingVoucher(null);
    setShowFormDrawer(true);
  };

  const openEdit = (v: Voucher) => {
    setEditingVoucher(v);
    setShowFormDrawer(true);
  };

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="space-y-1.5">
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Khuyến mãi</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421] leading-tight">Quản lý Voucher</h1>
            <p className="text-xs text-[#2A2421]/50">Tạo và quản lý các mã khuyến mãi cho chương trình tour?.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#2A2421] text-white px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tạo Voucher Mới
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex items-center border border-[#D0C5AF]/40 focus-within:border-[#D4AF37] transition-colors flex-1 min-w-48">
            <span className="material-symbols-outlined text-[#2A2421]/40 text-[18px] pl-3">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e?.target?.value)}
              placeholder="Tìm theo mã voucher..."
              className="flex-1 pl-2 pr-4 py-2 text-sm outline-none bg-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e?.target?.value)}
            className="px-4 py-2 border border-[#D0C5AF]/40 text-sm outline-none focus:border-[#D4AF37] cursor-pointer bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABEL)?.map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Mã Code</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Loại</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Giá trị</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Hạn SD</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Áp dụng</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Tour áp dụng</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Trạng thái</th>
                <th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#D0C5AF]">sell</span>
                    Khàng tìm thấy voucher
                  </td>
                </tr>
              )}
              {filtered?.map(v => (
                <tr key={v?.id} className="hover:bg-[#FAFAF5] transition-colors">
                  <td className="px-5 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{v?.code}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">
                    {v.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt'}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[#D4AF37]">{v?.value}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{v?.expiryDate}</td>
                  <td className="px-5 py-4 text-sm text-[#2A2421]/70">{v?.used} / {v?.limit}</td>
                  <td className="px-5 py-4">
                    {v?.applicableTours?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {v?.applicableTours?.slice(0, 2)?.map(t => {
                          const tp = mockTours?.find(p => p.id === t);
                          return (
                            <span key={t} className="px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded max-w-[80px] truncate" title={tp?.title ?? t}>
                              {tp?.title ?? t}
                            </span>
                          );
                        })}
                        {v?.applicableTours?.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded">+{v?.applicableTours?.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#2A2421]/40">Tất cả</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${STATUS_STYLE[v?.status]}`}>
                      {STATUS_LABEL[v?.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {role === 'manager' && v.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprove(v)}
                            className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold hover:bg-emerald-200 transition-colors"
                          >
                            Phê duyệt
                          </button>
                          <button
                            onClick={() => { setRejectTarget(v); setRejectReason(''); }}
                            className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold hover:bg-red-200 transition-colors"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {v.status === 'draft' && (
                        <button
                          onClick={() => handleSendApprovalFromList(v)}
                          className="px-2 py-1 bg-[#D4AF37] text-white text-[10px] font-bold hover:bg-[#C49B2F] transition-colors"
                        >
                          Gửi phê duyệt
                        </button>
                      )}
                      {['draft', 'rejected']?.includes(v?.status) && (
                        <button
                          onClick={() => openEdit(v)}
                          className="p-1.5 hover:bg-[#D4AF37]/10 transition-colors text-[#2A2421]/40 hover:text-[#D4AF37]"
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      )}
                      {['draft', 'rejected', 'inactive']?.includes(v?.status) && (
                        <button
                          onClick={() => handleDelete(v)}
                          className="p-1.5 hover:bg-red-50 transition-colors text-[#2A2421]/30 hover:text-red-500"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center">
          <p className="text-[11px] text-[#2A2421]/40">Hiển thị {filtered?.length} / {vouchers?.length} voucher</p>
        </div>
      </div>

      {/* Drawers */}
      {showFormDrawer && (
        <VoucherFormDrawer
          voucher={editingVoucher}
          onClose={() => { setShowFormDrawer(false); setEditingVoucher(null); }}
          onSave={handleSave}
          onSendApproval={handleSendApproval}
        />
      )}

      {/* Reject Popup Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={() => setRejectTarget(null)}></div>
          <div className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
            <h3 className="font-['Noto_Serif'] text-xl text-[#2A2421] mb-2">Từ chối Voucher</h3>
            <p className="text-xs text-[#2A2421]/60 mb-4">
              Voucher <strong>{rejectTarget?.code}</strong> — vui lòng nhập l? do từ chối?.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e?.target?.value)}
              rows={3}
              placeholder="Lý do từ chối..."
              className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectTarget(null)} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason?.trim()}
                className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${
                  rejectReason?.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

