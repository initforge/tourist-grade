import type { Voucher, VoucherStatus, VoucherType } from '@entities/voucher/data/vouchers';

export const VOUCHER_OVERDUE_REJECTION_REASON = 'Quá hạn gửi phê duyệt';
export const SALES_DRAFT_WARNING = 'Voucher sắp đến hạn gửi phê duyệt. Bạn nên gửi ngay để đảm bảo kịp thời gian xét duyệt.';
export const MANAGER_APPROVAL_WARNING = 'Voucher sắp đến hạn bắt đầu, cần phải phê duyệt ngay.';
export const VOUCHER_DATE_RULE_HELP = 'Nhập cách ít nhất 10 ngày để lưu, nhập cách ít nhất 7 ngày để gửi phê duyệt.';

export function voucherTodayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function voucherDaysUntil(startDate?: string, baseDate = voucherTodayIso()) {
  if (!startDate) return 999;
  const start = new Date(startDate);
  const base = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  base.setHours(0, 0, 0, 0);
  return Math.ceil((start.getTime() - base.getTime()) / 86400000);
}

export function canSaveVoucher(startDate?: string, today = voucherTodayIso()) {
  return voucherDaysUntil(startDate, today) >= 10;
}

export function canSendVoucherApproval(startDate?: string, today = voucherTodayIso()) {
  return voucherDaysUntil(startDate, today) >= 7;
}

export function hasSalesDraftWarning(startDate?: string, today = voucherTodayIso()) {
  const days = voucherDaysUntil(startDate, today);
  return days >= 7 && days <= 8;
}

export function hasManagerApprovalWarning(startDate?: string, today = voucherTodayIso()) {
  const days = voucherDaysUntil(startDate, today);
  return days >= 1 && days <= 2;
}

export function approvedVoucherStatus(startDate: string, today = voucherTodayIso()): VoucherStatus {
  return startDate > today ? 'upcoming' : 'active';
}

export function normalizeVoucherLifecycle(voucher: Voucher, today = voucherTodayIso()): Voucher {
  if (voucher.status === 'draft' && !canSendVoucherApproval(voucher.startDate, today)) {
    return {
      ...voucher,
      status: 'rejected',
      rejectionReason: voucher.rejectionReason ?? VOUCHER_OVERDUE_REJECTION_REASON,
    };
  }

  if (voucher.status === 'active' && voucher.startDate > today) {
    return { ...voucher, status: 'upcoming' };
  }

  return voucher;
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function isPositiveIntegerText(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0;
}

export function voucherValueInput(value: string) {
  return digitsOnly(value);
}

export function voucherValuePlaceholder(type: VoucherType) {
  return type === 'percent' ? 'VD: 15' : 'VD: 500000';
}

export function formatVoucherValue(voucher: Pick<Voucher, 'type' | 'value'>) {
  const value = digitsOnly(voucher.value);
  if (!value) return voucher.value;
  return voucher.type === 'percent' ? `${Number(value)}%` : `${Number(value).toLocaleString('vi-VN')} đ`;
}

export function isValidVoucherLimit(limit: number) {
  return Number.isInteger(limit) && limit > 0;
}
