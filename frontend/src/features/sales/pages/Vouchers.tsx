import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal, message } from 'antd';
import { useAuthStore } from '@shared/store/useAuthStore';
import { mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import { mockVouchers, VOUCHER_STATUS_LABEL, VOUCHER_STATUS_STYLE } from '@entities/voucher/data/vouchers';
import type { Voucher, VoucherStatus, VoucherType } from '@entities/voucher/data/vouchers';

const STORE_KEY = '__travela_sales_vouchers';
const DRAFT_WARNING = 'Voucher sắp đến hạn gửi phê duyệt. Bạn nên gửi ngay để đảm bảo kịp thời gian xét duyệt.';

type FormState = {
  id?: string; code: string; type: VoucherType; value: string; startDate: string; endDate: string;
  limit: string; applicableTours: string[]; description: string; status: VoucherStatus;
  createdAt: string; createdBy: string; rejectionReason?: string; used: number;
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const tourName = (id: string) => mockTourPrograms.find((tour) => tour.id === id)?.name ?? id;
const daysUntil = (start?: string, base = todayIso()) => !start ? 999 : Math.ceil((new Date(start).setHours(0,0,0,0) - new Date(base).setHours(0,0,0,0)) / 86400000);
const canSave = (start?: string, createdAt = todayIso()) => daysUntil(start, createdAt) >= 10;
const canSend = (start?: string) => daysUntil(start) >= 7;
const warnDraft = (start?: string) => { const d = daysUntil(start); return d >= 7 && d <= 8; };
const approvedStatusFor = (voucher: Voucher): VoucherStatus => voucher.startDate > todayIso() ? 'upcoming' : 'active';
const normalize = (voucher: Voucher): Voucher =>
  ['draft', 'pending_approval'].includes(voucher.status) && voucher.startDate <= todayIso()
    ? { ...voucher, status: 'rejected', rejectionReason: voucher.rejectionReason ?? 'Quá thời gian phê duyệt' }
    : voucher;

function loadVouchers() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return mockVouchers.map(normalize);
  try { return (JSON.parse(raw) as Voucher[]).map(normalize); } catch { return mockVouchers.map(normalize); }
}

function toForm(voucher: Voucher): FormState {
  return {
    id: voucher.id, code: voucher.code, type: voucher.type, value: voucher.value, startDate: voucher.startDate, endDate: voucher.endDate,
    limit: String(voucher.limit), applicableTours: [...voucher.applicableTours], description: voucher.description ?? '', status: voucher.status,
    createdAt: voucher.createdAt ?? todayIso(), createdBy: voucher.createdBy ?? 'Nhân viên kinh doanh', rejectionReason: voucher.rejectionReason, used: voucher.used,
  };
}

function emptyForm(createdBy: string): FormState {
  return { code: '', type: 'percent', value: '', startDate: '', endDate: '', limit: '', applicableTours: [], description: '', status: 'draft', createdAt: todayIso(), createdBy, used: 0 };
}

function fromForm(form: FormState, fallbackId: string): Voucher {
  return {
    id: form.id ?? fallbackId,
    code: form.code,
    type: form.type,
    value: form.value,
    startDate: form.startDate,
    endDate: form.endDate,
    used: form.used,
    limit: Number(form.limit),
    applicableTours: form.applicableTours,
    status: form.status,
    description: form.description,
    createdAt: form.createdAt,
    createdBy: form.createdBy,
    rejectionReason: form.rejectionReason,
  };
}

function isFormState(source: Voucher | FormState): source is FormState {
  return typeof source.limit === 'string';
}

function validate(form: FormState) {
  const errors: Record<string, string> = {};
  if (!form.code.trim()) errors.code = 'Mã voucher không được để trống';
  if (!form.value.trim()) errors.value = 'Giá trị không được để trống';
  if (!form.startDate) errors.startDate = 'Ngày bắt đầu không được để trống';
  if (!form.endDate) errors.endDate = 'Ngày kết thúc không được để trống';
  if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
  if (!form.limit.trim() || Number(form.limit) <= 0) errors.limit = 'Số lượng phải lớn hơn 0';
  if (form.startDate && !canSave(form.startDate, form.createdAt)) errors.startDate = 'Ngày bắt đầu phải cách ngày tạo ít nhất 10 ngày';
  return errors;
}

function FormDrawer({ form, setForm, onClose, onSave, onSend }: { form: FormState; setForm: (form: FormState) => void; onClose: () => void; onSave: () => void; onSend: () => void; }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const toggleTour = (id: string) => update('applicableTours', form.applicableTours.includes(id) ? form.applicableTours.filter((item) => item !== id) : [...form.applicableTours, id]);
  const saveAllowed = canSave(form.startDate, form.createdAt);
  const sendAllowed = canSend(form.startDate);
  const submitSave = () => { const next = validate(form); setErrors(next); if (!Object.keys(next).length) onSave(); };
  const submitSend = () => { const next = validate(form); if (!sendAllowed) next.startDate = 'Voucher phải được gửi phê duyệt trước ngày bắt đầu ít nhất 7 ngày'; setErrors(next); if (!Object.keys(next).length) onSend(); };
  return <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true"><div className="absolute inset-0 bg-[#2A2421]/50" onClick={onClose} /><div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col"><div className="px-6 py-5 border-b border-[#D0C5AF]/30 flex items-center justify-between"><div><p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Voucher</p><h2 className="font-['Noto_Serif'] text-xl text-[#2A2421]">{form.id ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}</h2></div><button onClick={onClose}><span className="material-symbols-outlined">close</span></button></div><div className="flex-1 overflow-y-auto p-6 space-y-5">{form.status === 'rejected' && form.rejectionReason && <div className="p-3 border border-red-200 bg-red-50 text-sm text-red-700">Lý do: {form.rejectionReason}</div>}<div><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Mã Khuyến Mãi *</label><input value={form.code} onChange={(e) => update('code', e.target.value.toUpperCase())} className="w-full border p-3 text-sm outline-none font-bold uppercase border-[#D0C5AF]/40" />{errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}</div><div className="flex gap-4"><div className="flex-1"><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Loại chiết khấu</label><select value={form.type} onChange={(e) => update('type', e.target.value as VoucherType)} className="w-full border p-3 text-sm outline-none border-[#D0C5AF]/40"><option value="percent">Phần trăm (%)</option><option value="fixed">Tiền mặt</option></select></div><div className="flex-1"><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Giá trị *</label><input value={form.value} onChange={(e) => update('value', e.target.value)} className="w-full border p-3 text-sm outline-none border-[#D0C5AF]/40" />{errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}</div></div><div><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Số lượng được dùng *</label><input type="number" min="1" value={form.limit} onChange={(e) => update('limit', e.target.value)} className="w-full border p-3 text-sm outline-none border-[#D0C5AF]/40" />{errors.limit && <p className="text-red-500 text-xs mt-1">{errors.limit}</p>}</div><div className="flex gap-4"><div className="flex-1"><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ngày bắt đầu *</label><input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className="w-full border p-3 text-sm outline-none border-[#D0C5AF]/40" />{errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}{!errors.startDate && !saveAllowed && <p className="text-amber-600 text-xs mt-1">Ngày bắt đầu phải cách ngày tạo ít nhất 10 ngày để được lưu.</p>}{!errors.startDate && saveAllowed && !sendAllowed && <p className="text-amber-600 text-xs mt-1">Voucher phải được gửi phê duyệt trước ngày bắt đầu ít nhất 7 ngày.</p>}</div><div className="flex-1"><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ngày kết thúc *</label><input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} className="w-full border p-3 text-sm outline-none border-[#D0C5AF]/40" />{errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}</div></div><div><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Chương trình tour áp dụng</label><button type="button" onClick={() => update('applicableTours', [])} className="text-sm text-[#D4AF37] font-medium mb-2">Áp dụng cho tất cả chương trình</button><div className="space-y-2 border border-[#D0C5AF]/40 p-3">{mockTourPrograms.map((tour) => <label key={tour.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.applicableTours.includes(tour.id)} onChange={() => toggleTour(tour.id)} /><span>{tour.name}</span></label>)}</div></div><div><label className="text-[10px] uppercase tracking-widest text-[#2A2421]/60 font-bold mb-2 block">Ghi chú</label><textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} className="w-full border p-3 text-sm outline-none resize-none border-[#D0C5AF]/40" /></div></div><div className="p-6 border-t border-[#D0C5AF]/30 bg-[#FAFAF5] flex gap-3"><button onClick={onClose} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20">Đóng</button><button onClick={submitSave} disabled={!saveAllowed} className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold ${saveAllowed ? 'bg-[#2A2421] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Lưu</button><button onClick={submitSend} disabled={!sendAllowed} className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold ${sendAllowed ? 'bg-[#D4AF37] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Gửi Phê Duyệt</button></div></div></div>;
}

function ListPage({ vouchers, onCreate, onEdit, onDelete, onSend }: { vouchers: Voucher[]; onCreate: () => void; onEdit: (voucher: Voucher) => void; onDelete: (voucher: Voucher) => void; onSend: (voucher: Voucher) => void; }) {
  const nav = useNavigate();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState<VoucherStatus | 'all'>('all');
  const filtered = useMemo(() => vouchers.filter((v) => (status === 'all' || v.status === status) && (`${v.code} ${v.description ?? ''} ${v.applicableTours.map(tourName).join(' ')}`.toLowerCase().includes(search.toLowerCase()))), [search, status, vouchers]);
  return <div className="w-full bg-[#F3F3F3] min-h-full"><div className="p-6 md:p-10"><div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4"><div className="space-y-1.5"><p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Khuyến mãi</p><h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421] leading-tight">Quản lý Voucher</h1><p className="text-xs text-[#2A2421]/50">Chi tiết voucher được điều hướng sang trang riêng thay vì popup.</p></div><button onClick={onCreate} className="flex items-center gap-2 bg-[#2A2421] text-white px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest"><span className="material-symbols-outlined text-[16px]">add</span>Tạo Voucher Mới</button></div><div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 flex flex-wrap gap-3"><div className="flex items-center border border-[#D0C5AF]/40 flex-1 min-w-48"><span className="material-symbols-outlined text-[#2A2421]/40 text-[18px] pl-3">search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã voucher..." className="flex-1 pl-2 pr-4 py-2 text-sm outline-none bg-transparent" /></div><select value={status} onChange={(e) => setStatus(e.target.value as VoucherStatus | 'all')} className="px-4 py-2 border border-[#D0C5AF]/40 text-sm outline-none bg-white">{['all','draft','pending_approval','rejected','upcoming','active','inactive'].map((key) => <option key={key} value={key}>{key === 'all' ? 'Tất cả trạng thái' : VOUCHER_STATUS_LABEL[key as VoucherStatus]}</option>)}</select></div><div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto"><table className="w-full text-left border-collapse min-w-[980px]"><thead><tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30"><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Mã Code</th><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Loại</th><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Giá trị</th><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Thời gian áp dụng</th><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Áp dụng</th><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Tour áp dụng</th><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">Trạng thái</th><th className="px-5 py-4 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-[#D0C5AF]/15">{filtered.length === 0 && <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">Không tìm thấy voucher</td></tr>}{filtered.map((v) => <tr key={v.id} className="hover:bg-[#FAFAF5] transition-colors cursor-pointer" onClick={() => nav(`/sales/vouchers/${v.id}`)}><td className="px-5 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{v.code}</td><td className="px-5 py-4 text-sm text-[#2A2421]/70">{v.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt'}</td><td className="px-5 py-4 text-sm font-bold text-[#D4AF37]">{v.value}</td><td className="px-5 py-4 text-sm text-[#2A2421]/70"><div>{v.startDate && v.endDate ? `${v.startDate} → ${v.endDate}` : '—'}</div>{v.status === 'draft' && warnDraft(v.startDate) && <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold" title={DRAFT_WARNING}><span className="material-symbols-outlined text-[12px]">warning</span>Sắp đến hạn gửi duyệt</div>}</td><td className="px-5 py-4 text-sm text-[#2A2421]/70">{v.used} / {v.limit}</td><td className="px-5 py-4">{v.applicableTours.length > 0 ? <div className="flex flex-wrap gap-1">{v.applicableTours.slice(0,2).map((id) => <span key={id} className="px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded">{tourName(id)}</span>)}</div> : <span className="text-[11px] text-[#2A2421]/40">Tất cả</span>}</td><td className="px-5 py-4"><span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${VOUCHER_STATUS_STYLE[v.status]}`}>{VOUCHER_STATUS_LABEL[v.status]}</span></td><td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-end gap-1">{(v.status === 'draft' || v.status === 'rejected') && <button onClick={() => onEdit(v)} className="px-2 py-1 border border-[#2A2421]/20 text-[#2A2421] text-[10px] font-bold">Sửa</button>}{v.status === 'draft' && <button onClick={() => onSend(v)} disabled={!canSend(v.startDate)} title={!canSend(v.startDate) ? 'Voucher phải được gửi phê duyệt trước ngày bắt đầu ít nhất 7 ngày.' : undefined} className={`px-2 py-1 text-[10px] font-bold ${canSend(v.startDate) ? 'bg-[#D4AF37] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Gửi phê duyệt</button>}{['draft','rejected','inactive'].includes(v.status) && <button onClick={() => onDelete(v)} className="p-1.5 text-[#2A2421]/30" title="Xóa"><span className="material-symbols-outlined text-[18px]">delete</span></button>}</div></td></tr>)}</tbody></table></div></div></div>;
}

function DetailPage({ voucher, onEdit, onDelete, onSend }: { voucher: Voucher; onEdit: (voucher: Voucher) => void; onDelete: (voucher: Voucher) => void; onSend: (voucher: Voucher) => void; }) {
  const nav = useNavigate(); const canDelete = ['draft','rejected','inactive'].includes(voucher.status); const canEdit = ['draft','rejected'].includes(voucher.status);
  return <div className="w-full bg-[#F3F3F3] min-h-full"><div className="p-6 md:p-10 space-y-6"><div className="flex items-center gap-2 text-xs text-[#2A2421]/50"><Link to="/sales/vouchers" className="text-[#D4AF37] hover:underline">Voucher</Link><span>/</span><span>Chi tiết</span></div><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Chi tiết Voucher</p><h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">{voucher.code}</h1></div><div className="flex flex-wrap gap-2">{canEdit && <button onClick={() => onEdit(voucher)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-[#2A2421]/20">Chỉnh sửa</button>}{voucher.status === 'draft' && <button onClick={() => onSend(voucher)} disabled={!canSend(voucher.startDate)} title={!canSend(voucher.startDate) ? 'Voucher phải được gửi phê duyệt trước ngày bắt đầu ít nhất 7 ngày.' : undefined} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${canSend(voucher.startDate) ? 'bg-[#D4AF37] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Gửi phê duyệt</button>}{canDelete && <button onClick={() => onDelete(voucher)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-red-300 text-red-600">Xóa</button>}<button onClick={() => nav('/sales/vouchers')} className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-[#2A2421]/20">Về danh sách</button></div></div><div className="bg-white border border-[#D0C5AF]/20 p-6">{voucher.status === 'rejected' && voucher.rejectionReason && <div className="mb-6 p-3 border border-red-200 bg-red-50 text-sm text-red-700">Lý do: {voucher.rejectionReason}</div>}<div className="flex items-center justify-between mb-6"><span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${VOUCHER_STATUS_STYLE[voucher.status]}`}>{VOUCHER_STATUS_LABEL[voucher.status]}</span>{voucher.status === 'draft' && warnDraft(voucher.startDate) && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold" title={DRAFT_WARNING}><span className="material-symbols-outlined text-[12px]">warning</span>Sắp đến hạn gửi duyệt</span>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[{ label: 'Loại giảm giá', value: voucher.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt' }, { label: 'Giá trị', value: voucher.value }, { label: 'Số lượng được dùng', value: `${voucher.used} / ${voucher.limit}` }, { label: 'Thời gian áp dụng', value: voucher.startDate && voucher.endDate ? `${voucher.startDate} → ${voucher.endDate}` : '—' }, { label: 'Người tạo', value: voucher.createdBy ?? 'Nhân viên kinh doanh' }, { label: 'Ngày tạo', value: voucher.createdAt ?? '—' }].map((item) => <div key={item.label}><p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">{item.label}</p><p className="text-sm font-medium text-[#2A2421]">{item.value}</p></div>)}</div><div className="mt-6"><p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-2">Chương trình tour áp dụng</p>{voucher.applicableTours.length > 0 ? <div className="flex flex-wrap gap-2">{voucher.applicableTours.map((id) => <span key={id} className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold rounded-full border border-[#D4AF37]/20">{tourName(id)}</span>)}</div> : <p className="text-sm text-[#2A2421]/50">Áp dụng cho tất cả chương trình tour</p>}</div>{voucher.description && <div className="mt-6"><p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-2">Ghi chú</p><p className="text-sm text-[#2A2421]/70 bg-[#FAFAF5] p-3 border border-[#D0C5AF]/20">{voucher.description}</p></div>}</div></div></div>;
}

export default function SalesVoucherManagement() {
  const { id } = useParams<{ id?: string }>(); const nav = useNavigate(); const user = useAuthStore((state) => state.user);
  const [vouchers, setVouchers] = useState<Voucher[]>(() => loadVouchers()); const [form, setForm] = useState<FormState | null>(null);
  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(vouchers)); }, [vouchers]);
  const selected = useMemo(() => vouchers.find((voucher) => voucher.id === id), [id, vouchers]);
  const upsert = (voucher: Voucher) => setVouchers((prev) => prev.some((item) => item.id === voucher.id) ? prev.map((item) => item.id === voucher.id ? normalize(voucher) : item) : [...prev, normalize(voucher)]);
  const nextVoucherId = () => `VOU-${String(vouchers.length + 1).padStart(2, '0')}`;
  const save = () => { if (!form) return; const next = fromForm({ ...form, status: form.status === 'rejected' ? 'draft' : form.status }, nextVoucherId()); upsert(next); setForm(null); message.success('Lưu voucher thành công!'); if (id) nav(`/sales/vouchers/${next.id}`); };
  const send = (source: Voucher | FormState) => { const next: Voucher = isFormState(source) ? { ...fromForm(source, nextVoucherId()), status: 'pending_approval' } : { ...source, status: 'pending_approval' }; Modal.confirm({ title: 'Gửi phê duyệt voucher', content: `Bạn có chắc muốn gửi voucher "${next.code}" lên quản lý phê duyệt không?`, okText: 'Gửi phê duyệt', cancelText: 'Hủy', onOk: () => { upsert(next); setForm(null); message.success('Đã gửi phê duyệt thành công!'); if (id) nav(`/sales/vouchers/${next.id}`); } }); };
  const remove = (voucher: Voucher) => Modal.confirm({ title: 'Xóa Voucher', content: `Bạn có chắc muốn xóa voucher "${voucher.code}" không?`, okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true }, onOk: () => { setVouchers((prev) => prev.filter((item) => item.id !== voucher.id)); if (id === voucher.id) nav('/sales/vouchers'); message.success('Đã xóa voucher thành công!'); } });
  if (id && !selected) return <div className="p-10"><p className="text-sm text-[#2A2421]/50">Không tìm thấy voucher.</p><Link to="/sales/vouchers" className="text-sm text-[#D4AF37] hover:underline">Quay về danh sách</Link></div>;
  return <>{selected ? <DetailPage voucher={selected} onEdit={(voucher) => setForm(toForm(voucher))} onDelete={remove} onSend={send} /> : <ListPage vouchers={vouchers} onCreate={() => setForm(emptyForm(user?.name ?? 'Nhân viên kinh doanh'))} onEdit={(voucher) => setForm(toForm(voucher))} onDelete={remove} onSend={send} />}{form && <FormDrawer form={form} setForm={setForm} onClose={() => setForm(null)} onSave={save} onSend={() => send(form)} />}</>;
}
