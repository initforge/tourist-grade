import { useMemo, useState } from 'react';
import { Modal, message } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { TourProgram } from '@entities/tour-program/data/tourProgram';
import { VOUCHER_STATUS_LABEL, VOUCHER_STATUS_STYLE } from '@entities/voucher/data/vouchers';
import type { Voucher, VoucherStatus, VoucherType } from '@entities/voucher/data/vouchers';
import {
  SALES_DRAFT_WARNING,
  VOUCHER_DATE_RULE_HELP,
  canSaveVoucher,
  canSendVoucherApproval,
  digitsOnly,
  formatVoucherValue,
  hasSalesDraftWarning,
  isPositiveIntegerText,
  normalizeVoucherLifecycle,
  voucherTodayIso,
  voucherValueInput,
  voucherValuePlaceholder,
} from '@entities/voucher/lib/voucherRules';
import { createVoucher, deleteVoucher, updateVoucher } from '@shared/lib/api/vouchers';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { useAuthStore } from '@shared/store/useAuthStore';

type FormState = {
  id?: string;
  code: string;
  type: VoucherType;
  value: string;
  startDate: string;
  endDate: string;
  limit: string;
  applicableTours: string[];
  description: string;
  status: VoucherStatus;
  createdAt: string;
  createdBy: string;
  rejectionReason?: string;
  used: number;
};

function emptyForm(createdBy: string): FormState {
  return {
    code: '',
    type: 'percent',
    value: '',
    startDate: '',
    endDate: '',
    limit: '',
    applicableTours: [],
    description: '',
    status: 'draft',
    createdAt: voucherTodayIso(),
    createdBy,
    used: 0,
  };
}

function toForm(voucher: Voucher): FormState {
  return {
    id: voucher.id,
    code: voucher.code,
    type: voucher.type,
    value: voucherValueInput(voucher.value),
    startDate: voucher.startDate,
    endDate: voucher.endDate,
    limit: String(voucher.limit),
    applicableTours: [...voucher.applicableTours],
    description: voucher.description ?? '',
    status: voucher.status,
    createdAt: voucher.createdAt ?? voucherTodayIso(),
    createdBy: voucher.createdBy ?? 'Nhân viên kinh doanh',
    rejectionReason: voucher.rejectionReason,
    used: voucher.used,
  };
}

function fromForm(form: FormState, fallbackId: string): Voucher {
  const value = String(Number(form.value));
  return {
    id: form.id ?? fallbackId,
    code: form.code.trim().toUpperCase(),
    type: form.type,
    value: form.type === 'percent' ? `${value}%` : `${Number(value).toLocaleString('vi-VN')} đ`,
    startDate: form.startDate,
    endDate: form.endDate,
    expiryDate: form.endDate,
    used: form.used,
    limit: Number(form.limit),
    applicableTours: form.applicableTours,
    status: form.status,
    description: form.description.trim(),
    createdAt: form.createdAt,
    createdBy: form.createdBy,
    rejectionReason: form.rejectionReason,
  };
}

function validateFields(form: FormState) {
  const errors: Record<string, string> = {};

  if (!form.code.trim()) errors.code = 'Mã voucher không được để trống';
  if (!form.value.trim()) errors.value = 'Giá trị không được để trống';
  else if (!isPositiveIntegerText(form.value)) errors.value = 'Giá trị phải là số nguyên dương';
  if (!form.startDate) errors.startDate = 'Ngày bắt đầu không được để trống';
  if (!form.endDate) errors.endDate = 'Ngày kết thúc không được để trống';
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
  }
  if (!form.limit.trim() || !isPositiveIntegerText(form.limit)) {
    errors.limit = 'Số lượng phải là số nguyên dương';
  }

  return errors;
}

function validate(form: FormState, action: 'save' | 'send') {
  const errors = validateFields(form);

  if (form.startDate && action === 'save' && !canSaveVoucher(form.startDate)) {
    errors.startDate = 'Ngày bắt đầu phải cách ngày hiện tại ít nhất 10 ngày';
  }
  if (form.startDate && action === 'send' && !canSendVoucherApproval(form.startDate)) {
    errors.startDate = 'Voucher phải được gửi phê duyệt trước ngày bắt đầu ít nhất 7 ngày';
  }

  return errors;
}

function WarningIcon({ title }: { title: string }) {
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700"
      title={title}
      aria-label={title}
    >
      <span className="material-symbols-outlined text-[14px]">warning</span>
    </span>
  );
}

function FormDrawer({
  form,
  setForm,
  onClose,
  onSave,
  onSend,
  tourPrograms,
}: {
  form: FormState;
  setForm: (form: FormState) => void;
  onClose: () => void;
  onSave: () => void;
  onSend: () => void;
  tourPrograms: TourProgram[];
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTourMenu, setShowTourMenu] = useState(false);
  const fieldErrors = validateFields(form);
  const saveAllowed = Object.keys(fieldErrors).length === 0 && canSaveVoucher(form.startDate);
  const sendAllowed = Object.keys(fieldErrors).length === 0 && canSendVoucherApproval(form.startDate);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const toggleTour = (id: string) => {
    update(
      'applicableTours',
      form.applicableTours.includes(id)
        ? form.applicableTours.filter((item) => item !== id)
        : [...form.applicableTours, id],
    );
  };

  const selectedTourLabel = form.applicableTours.length === 0
    ? 'Áp dụng cho tất cả chương trình'
    : form.applicableTours.length === 1
      ? (tourPrograms.find((tour) => tour.id === form.applicableTours[0])?.name ?? form.applicableTours[0])
      : `${form.applicableTours.length} chương trình đã chọn`;

  const submit = (action: 'save' | 'send') => {
    const next = validate(form, action);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (action === 'save') onSave();
    else onSend();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#2A2421]/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#D0C5AF]/30 px-6 py-5">
          <div>
            <p className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Voucher</p>
            <h2 className="font-['Noto_Serif'] text-xl text-[#2A2421]">{form.id ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {form.status === 'rejected' && form.rejectionReason && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">Lý do: {form.rejectionReason}</div>
          )}

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Mã khuyến mãi *</label>
            <input
              value={form.code}
              onChange={(event) => update('code', event.target.value.toUpperCase())}
              className="w-full border border-[#D0C5AF]/40 p-3 text-sm font-bold uppercase outline-none"
            />
            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Loại chiết khấu</label>
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as VoucherType, value: digitsOnly(form.value) })}
                className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none"
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Tiền mặt</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Giá trị *</label>
              <input
                inputMode="numeric"
                value={form.value}
                onChange={(event) => update('value', digitsOnly(event.target.value))}
                placeholder={voucherValuePlaceholder(form.type)}
                className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none"
              />
              {errors.value && <p className="mt-1 text-xs text-red-500">{errors.value}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Số lượng được dùng *</label>
            <input
              inputMode="numeric"
              value={form.limit}
              onChange={(event) => update('limit', digitsOnly(event.target.value))}
              className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none"
            />
            {errors.limit && <p className="mt-1 text-xs text-red-500">{errors.limit}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Ngày bắt đầu *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => update('startDate', event.target.value)}
                className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none"
              />
              <p className="mt-1 text-xs italic text-[#2A2421]/45">{VOUCHER_DATE_RULE_HELP}</p>
              {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Ngày kết thúc *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => update('endDate', event.target.value)}
                className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none"
              />
              {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Chương trình tour áp dụng</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTourMenu((open) => !open)}
                className="flex w-full items-center justify-between border border-[#D0C5AF]/40 p-3 text-left text-sm"
              >
                <span className="truncate">{selectedTourLabel}</span>
                <span className="material-symbols-outlined text-[18px] text-[#2A2421]/50">arrow_drop_down</span>
              </button>
              {showTourMenu && (
                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto border border-[#D0C5AF]/30 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      update('applicableTours', []);
                      setShowTourMenu(false);
                    }}
                    className="flex w-full items-center justify-between border-b border-[#D0C5AF]/15 px-3 py-2 text-sm hover:bg-[#FAFAF5]"
                  >
                    <span>Áp dụng cho tất cả chương trình</span>
                    {form.applicableTours.length === 0 && (
                      <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">check</span>
                    )}
                  </button>
                  {tourPrograms.map((tour) => (
                    <label key={tour.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-[#FAFAF5]">
                      <input
                        type="checkbox"
                        checked={form.applicableTours.includes(tour.id)}
                        onChange={() => toggleTour(tour.id)}
                      />
                      <span className="min-w-0 flex-1 truncate">{tour.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/60">Ghi chú</label>
            <textarea
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              rows={3}
              className="w-full resize-none border border-[#D0C5AF]/40 p-3 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#D0C5AF]/30 bg-[#FAFAF5] p-6">
          <button onClick={onClose} className="flex-1 border border-[#2A2421]/20 py-3 font-['Inter'] text-xs uppercase tracking-widest">Hủy</button>
          <button
            onClick={() => submit('save')}
            disabled={!saveAllowed}
            className={`flex-1 py-3 font-['Inter'] text-xs font-bold uppercase tracking-widest ${saveAllowed ? 'bg-[#2A2421] text-white' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}
          >
            Lưu
          </button>
          <button
            onClick={() => submit('send')}
            disabled={!sendAllowed}
            className={`flex-1 py-3 font-['Inter'] text-xs font-bold uppercase tracking-widest ${sendAllowed ? 'bg-[#D4AF37] text-white' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}
          >
            Gửi phê duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

function ListPage({
  vouchers,
  onCreate,
  onEdit,
  onDelete,
  onSend,
  getTourName,
}: {
  vouchers: Voucher[];
  onCreate: () => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  onSend: (voucher: Voucher) => void;
  getTourName: (id: string) => string;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VoucherStatus | 'all'>('all');

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return vouchers.filter((voucher) => {
      if (status !== 'all' && voucher.status !== status) return false;
      if (!keyword) return true;
      return `${voucher.code} ${voucher.description ?? ''} ${voucher.applicableTours.map(getTourName).join(' ')}`.toLowerCase().includes(keyword);
    });
  }, [getTourName, search, status, vouchers]);

  return (
    <div className="min-h-full w-full bg-[#F3F3F3]">
      <div className="p-6 md:p-10">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-1.5">
            <p className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Khuyến mãi</p>
            <h1 className="font-['Noto_Serif'] text-3xl leading-tight text-[#2A2421]">Quản lý Voucher</h1>
            <p className="text-xs text-[#2A2421]/50">Chi tiết voucher được điều hướng sang trang riêng thay vì popup.</p>
          </div>
          <button onClick={onCreate} className="flex items-center gap-2 bg-[#2A2421] px-5 py-2.5 font-['Inter'] text-xs uppercase tracking-widest text-white">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Tạo Voucher Mới
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 border border-[#D0C5AF]/20 bg-white p-4">
          <div className="flex min-w-48 flex-1 items-center border border-[#D0C5AF]/40">
            <span className="material-symbols-outlined pl-3 text-[18px] text-[#2A2421]/40">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã voucher..."
              className="flex-1 bg-transparent py-2 pl-2 pr-4 text-sm outline-none"
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as VoucherStatus | 'all')} className="border border-[#D0C5AF]/40 bg-white px-4 py-2 text-sm outline-none">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(VOUCHER_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto border border-[#D0C5AF]/20 bg-white shadow-sm">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#D0C5AF]/30 bg-[#FAFAF5]">
                {['Mã Code', 'Loại', 'Giá trị', 'Thời gian áp dụng', 'Áp dụng', 'Tour áp dụng', 'Trạng thái', 'Thao tác'].map((header) => (
                  <th key={header} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#2A2421]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/20">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-[#2A2421]/50">
                    Không có voucher phù hợp với bộ lọc hiện tại
                  </td>
                </tr>
              )}
              {filtered.map((voucher) => (
                <tr key={voucher.id} onClick={() => navigate(`/sales/vouchers/${voucher.id}`)} className="cursor-pointer hover:bg-[#FAFAF5]">
                  <td className="px-5 py-4 font-mono text-sm font-bold">{voucher.code}</td>
                  <td className="px-5 py-4 text-sm">{voucher.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt'}</td>
                  <td className="px-5 py-4 text-sm font-semibold">{formatVoucherValue(voucher)}</td>
                  <td className="px-5 py-4 text-xs">{voucher.startDate} → {voucher.endDate}</td>
                  <td className="px-5 py-4 text-sm">{voucher.used} / {voucher.limit}</td>
                  <td className="px-5 py-4 text-sm">{voucher.applicableTours.length ? voucher.applicableTours.map(getTourName).join(', ') : 'Tất cả'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {voucher.status === 'draft' && hasSalesDraftWarning(voucher.startDate) && <WarningIcon title={SALES_DRAFT_WARNING} />}
                      <span className={`inline-block rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${VOUCHER_STATUS_STYLE[voucher.status]}`}>{VOUCHER_STATUS_LABEL[voucher.status]}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                      {['draft', 'rejected'].includes(voucher.status) && (
                        <button onClick={() => onEdit(voucher)} className="text-xs font-bold text-[#D4AF37]">Chỉnh sửa</button>
                      )}
                      {voucher.status === 'draft' && (
                        <button onClick={() => onSend(voucher)} className="text-xs font-bold text-[#2A2421]">Gửi phê duyệt</button>
                      )}
                      {['draft', 'rejected', 'inactive'].includes(voucher.status) && (
                        <button onClick={() => onDelete(voucher)} title="Xóa" aria-label="Xóa">
                          <span className="material-symbols-outlined text-[18px] text-red-500">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailPage({
  voucher,
  onBack,
  onEdit,
  onDelete,
  getTourName,
}: {
  voucher: Voucher;
  onBack: () => void;
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  getTourName: (id: string) => string;
}) {
  const readOnly = !['draft', 'rejected'].includes(voucher.status);

  return (
    <div className="min-h-full w-full bg-[#F3F3F3] p-6 md:p-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to="/sales/vouchers" className="text-[#D4AF37]">Voucher</Link>
        <span>/</span>
        <span>{voucher.code}</span>
      </div>
      <div className="border border-[#D0C5AF]/20 bg-white p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="font-['Inter'] text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Chi tiết voucher</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">{voucher.code}</h1>
            <span className={`mt-3 inline-block rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${VOUCHER_STATUS_STYLE[voucher.status]}`}>{VOUCHER_STATUS_LABEL[voucher.status]}</span>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <button onClick={() => onEdit(voucher)} className="border border-[#D0C5AF]/40 px-4 py-2 text-xs font-bold uppercase tracking-widest">Chỉnh sửa</button>
              <button onClick={() => onDelete(voucher)} className="border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600">Xóa</button>
            </div>
          )}
        </div>
        {voucher.rejectionReason && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">Lý do: {voucher.rejectionReason}</div>
        )}
        <dl className="grid gap-6 md:grid-cols-2">
          <div><dt className="text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/50">Loại</dt><dd className="mt-1">{voucher.type === 'percent' ? 'Phần trăm (%)' : 'Tiền mặt'}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/50">Giá trị</dt><dd className="mt-1">{formatVoucherValue(voucher)}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/50">Thời gian áp dụng</dt><dd className="mt-1">{voucher.startDate} → {voucher.endDate}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/50">Tour áp dụng</dt><dd className="mt-1">{voucher.applicableTours.length ? voucher.applicableTours.map(getTourName).join(', ') : 'Tất cả'}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/50">Số lượt dùng</dt><dd className="mt-1">{voucher.used} / {voucher.limit}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-widest text-[#2A2421]/50">Ghi chú</dt><dd className="mt-1">{voucher.description || '—'}</dd></div>
        </dl>
      </div>
      <button onClick={onBack} className="mt-6 text-sm font-bold text-[#D4AF37]">Quay lại danh sách</button>
    </div>
  );
}

export default function SalesVoucherManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const tourPrograms = useAppDataStore((state) => state.tourPrograms);
  const storeVouchers = useAppDataStore((state) => state.vouchers);
  const upsertVoucher = useAppDataStore((state) => state.upsertVoucher);
  const removeVoucher = useAppDataStore((state) => state.removeVoucher);
  const [form, setForm] = useState<FormState | null>(null);
  const vouchers = useMemo(() => storeVouchers.map((voucher) => normalizeVoucherLifecycle(voucher)), [storeVouchers]);
  const activeTourPrograms = useMemo(
    () => tourPrograms.filter((tour) => tour.status === 'active'),
    [tourPrograms],
  );
  const current = useMemo(() => vouchers.find((voucher) => voucher.id === id), [id, vouchers]);
  const getTourName = (tourId: string) => tourPrograms.find((tour) => tour.id === tourId)?.name ?? tourId;

  const persist = async (next: Voucher) => {
    upsertVoucher(next);
    if (!token) return;

    const response = next.id.startsWith('tmp-')
      ? await createVoucher(token, next)
      : await updateVoucher(token, next.id, next);

    upsertVoucher(response.voucher);
  };

  const handleSave = () => {
    if (!form) return;
    void persist(fromForm(form, `tmp-${Date.now()}`)).then(() => setForm(null));
  };

  const handleSend = () => {
    if (!form) return;
    const next = { ...fromForm(form, `tmp-${Date.now()}`), status: 'pending_approval' as VoucherStatus };
    Modal.confirm({
      title: 'Gửi phê duyệt voucher',
      content: `Gửi voucher ${next.code} cho quản lý phê duyệt?`,
      okText: 'Gửi phê duyệt',
      cancelText: 'Hủy',
      onOk: () => persist(next).then(() => {
        setForm(null);
        message.success('Gửi phê duyệt thành công.');
      }),
    });
  };

  const handleDelete = (voucher: Voucher) => {
    Modal.confirm({
      title: 'Xóa voucher',
      content: `Xóa voucher ${voucher.code}?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        removeVoucher(voucher.id);
        if (token) await deleteVoucher(token, voucher.id).catch(() => null);
        if (id === voucher.id) navigate('/sales/vouchers');
        message.success('Đã xóa voucher.');
      },
    });
  };

  const handleSendExisting = (voucher: Voucher) => {
    const next = { ...voucher, status: 'pending_approval' as VoucherStatus };
    Modal.confirm({
      title: 'Gửi phê duyệt voucher',
      content: `Gửi voucher ${voucher.code} cho quản lý phê duyệt?`,
      okText: 'Gửi phê duyệt',
      cancelText: 'Hủy',
      onOk: () => persist(next).then(() => {
        message.success('Gửi phê duyệt thành công.');
      }),
    });
  };

  return (
    <>
      {current ? (
        <DetailPage
          voucher={current}
          onBack={() => navigate('/sales/vouchers')}
          onEdit={(voucher) => setForm(toForm(voucher))}
          onDelete={handleDelete}
          getTourName={getTourName}
        />
      ) : (
        <ListPage
          vouchers={vouchers}
          onCreate={() => setForm(emptyForm(user?.name ?? 'Nhân viên kinh doanh'))}
          onEdit={(voucher) => setForm(toForm(voucher))}
          onDelete={handleDelete}
          onSend={handleSendExisting}
          getTourName={getTourName}
        />
      )}
      {form && (
        <FormDrawer
          form={form}
          setForm={setForm}
          onClose={() => setForm(null)}
          onSave={handleSave}
          onSend={handleSend}
          tourPrograms={activeTourPrograms}
        />
      )}
    </>
  );
}
