// ============================================================
// Voucher Types — Sales + Manager scope
// ============================================================

export type VoucherType = 'percent' | 'fixed';
export type VoucherStatus = 'draft' | 'pending_approval' | 'rejected' | 'upcoming' | 'active' | 'inactive';

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: string;
  /** Ngày bắt đầu áp dụng */
  startDate: string;
  /** Ngày kết thức áp dụng */
  endDate: string;
  /** Alias for endDate (used in UI pages) */
  expiryDate?: string;
  used: number;
  limit: number;
  /** Danh sách id chương trình tour được áp dụng (empty = tất cả) */
  applicableTours: string[];
  status: VoucherStatus;
  rejectionReason?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
}

// Canonical mock data
export const mockVouchers: Voucher[] = [
  {
    id: 'VOU-01',
    code: 'SUMMER2024',
    type: 'percent',
    value: '15%',
    startDate: '2024-06-01',
    endDate: '2026-08-31',
    used: 45,
    limit: 100,
    applicableTours: [],
    status: 'active',
    description: 'Khuyến mãi mùa hè 2024',
  },
  {
    id: 'VOU-02',
    code: 'LUXURY500K',
    type: 'fixed',
    value: '500,000 đ',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    used: 12,
    limit: 50,
    applicableTours: [],
    status: 'active',
    description: 'Giảm 500K cho đơn hàng cao cấp',
  },
  {
    id: 'VOU-03',
    code: 'FLASHWINTER',
    type: 'percent',
    value: '20%',
    startDate: '2024-01-01',
    endDate: '2024-02-28',
    used: 100,
    limit: 100,
    applicableTours: [],
    status: 'inactive',
    description: 'Flash sale mùa đông',
  },
  {
    id: 'VOU-04',
    code: 'SUMMER2026',
    type: 'percent',
    value: '20%',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    used: 0,
    limit: 200,
    applicableTours: [],
    status: 'draft',
    description: 'Khuyến mãi mùa hè 2026',
  },
  {
    id: 'VOU-09',
    code: 'NATIONALDAY2026',
    type: 'fixed',
    value: '250,000 đ',
    startDate: '2026-09-01',
    endDate: '2026-09-05',
    used: 0,
    limit: 120,
    applicableTours: [],
    status: 'upcoming',
    createdBy: 'Nguyễn Văn Sales',
    createdAt: '2026-04-10',
    description: 'Ưu đãi Quốc khành chưa đến thời gian áp dụng',
  },
  {
    id: 'VOU-05',
    code: 'PROMO10PCT',
    type: 'percent',
    value: '10%',
    startDate: '2026-04-20',
    endDate: '2026-12-31',
    used: 15,
    limit: 100,
    applicableTours: ['TP001'],
    status: 'pending_approval',
    createdBy: 'Nguyễn Văn Sales',
    createdAt: '2026-03-28',
    description: 'Giảm 10% cho tất cả tour',
  },
  {
    id: 'VOU-06',
    code: 'VIP50PCT',
    type: 'percent',
    value: '50%',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    used: 0,
    limit: 10,
    applicableTours: [],
    status: 'rejected',
    rejectionReason: 'Giá trị giảm quá cao, vui lòng giảm xuống 30%?.',
    description: 'VIP khách hàng thân thiết',
  },
  {
    id: 'VOU-07',
    code: 'AUTUMN20',
    type: 'percent',
    value: '20%',
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    used: 0,
    limit: 150,
    applicableTours: ['TP002'],
    status: 'pending_approval',
    createdBy: 'Trần Thị E',
    createdAt: '2026-03-29',
    description: 'Giảm 20% mùa thu',
  },
  {
    id: 'VOU-08',
    code: 'VIPONLY30',
    type: 'fixed',
    value: '300,000 đ',
    startDate: '2026-05-01',
    endDate: '2026-09-30',
    used: 2,
    limit: 50,
    applicableTours: [],
    status: 'pending_approval',
    createdBy: 'Lê Văn G',
    createdAt: '2026-03-30',
    description: 'Giảm 300K cho tour VIP',
  },
];

// Labels
export const VOUCHER_STATUS_LABEL: Record<VoucherStatus, string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ phê duyệt',
  rejected: 'Không được phê duyệt',
  upcoming: 'Chưa diễn ra',
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
