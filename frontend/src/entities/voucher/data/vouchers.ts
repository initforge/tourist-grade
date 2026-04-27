export type VoucherType = 'percent' | 'fixed';
export type VoucherStatus = 'draft' | 'pending_approval' | 'rejected' | 'upcoming' | 'active' | 'inactive';

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: string;
  startDate: string;
  endDate: string;
  expiryDate?: string;
  used: number;
  limit: number;
  applicableTours: string[];
  status: VoucherStatus;
  rejectionReason?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
}

export const VOUCHER_STATUS_LABEL: Record<VoucherStatus, string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ phê duyệt',
  rejected: 'Không được phê duyệt',
  upcoming: 'Sắp diễn ra',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu/Hết hạn',
};

export const VOUCHER_STATUS_STYLE: Record<VoucherStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border border-gray-300',
  pending_approval: 'bg-amber-100 text-amber-700 border border-amber-300',
  rejected: 'bg-red-100 text-red-700 border border-red-300',
  upcoming: 'bg-sky-100 text-sky-700 border border-sky-300',
  active: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
  inactive: 'bg-gray-100 text-gray-400 border border-gray-300',
};

