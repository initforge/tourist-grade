// ============================================================
// Tour Program & Instance Types — Coordinator scope
// ============================================================

// --- Chương trình tour (template) ---
export interface TourProgram {
  id: string;
  name: string;
  departurePoint: string;
  sightseeingSpots: string[];
  duration: { days: number; nights: number };
  lodgingStandard?: '2 sao' | '3 sao' | '4 sao' | '5 sao';
  transport: 'xe' | 'maybay';
  arrivalPoint?: string;
  tourType: 'mua_le' | 'quanh_nam';
  routeDescription?: string;
  priceIncludes?: string;
  priceExcludes?: string;
  image?: string;
  gallery?: string[];
  holiday?: string;
  selectedDates?: string[];
  weekdays?: string[];
  yearRoundStartDate?: string;
  yearRoundEndDate?: string;
  coverageMonths?: number;
  bookingDeadline: number;
  status: 'draft' | 'active' | 'inactive';
  inactiveReason?: string;
  rejectionReason?: string;
  approvalStatus?: 'pending' | 'rejected' | 'approved';
  itinerary: ProgramItineraryDay[];
  pricingConfig: PricingConfig;
  draftPricingTables?: TourProgramPricingTablesState;
  draftManualPricing?: TourProgramManualPricingState;
  draftPricingOverrides?: TourProgramPricingOverrides;
  draftPreviewRows?: TourProgramPreviewRow[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  coverageWarningStatus?: 'ok' | 'warning';
  coverageWarningDate?: string | null;
  coveragePreviousStatus?: 'ok' | 'warning';
}

export interface ProgramItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: ('breakfast' | 'lunch' | 'dinner')[];
  accommodationPoint?: string;
}

export interface TourProgramSelection {
  optionId: string;
  isDefault?: boolean;
  manualPrice?: number;
  occurrences?: number | '';
  note?: string;
}

export interface TourProgramPricingTablesState {
  transport: TourProgramSelection[];
  flight: TourProgramSelection[];
  hotels: Record<string, TourProgramSelection[]>;
  meals: Record<string, TourProgramSelection[]>;
  attractions: Record<string, TourProgramSelection[]>;
  otherCosts: TourProgramSelection[];
}

export interface TourProgramManualPricingState {
  adult: boolean;
  child: boolean;
  infant: boolean;
  singleSupplement: boolean;
}

export interface TourProgramPricingOverrides {
  adult: number;
  child: number;
  infant: number;
  singleSupplement: number;
}

export interface TourProgramPreviewRow {
  id: string;
  departureDate: string;
  endDate: string;
  dayType: string;
  expectedGuests: number;
  costPerAdult: number;
  sellPrice: number;
  profitPercent: number;
  bookingDeadline: string;
  conflictLabel: string;
  conflictDetails: string[];
  checked: boolean;
}

export interface SpecialDay {
  id: string;
  name: string;
  occasion: string;
  startDate: string;
  endDate: string;
  note?: string;
}

// --- Tour instance (sinh ra từ chương trình) ---
export type TourInstanceStatus =
  | 'cho_duyet_ban'
  | 'yeu_cau_chinh_sua'
  | 'tu_choi_ban'
  | 'dang_mo_ban'
  | 'chua_du_kien'
  | 'da_huy'
  | 'cho_nhan_dieu_hanh'
  | 'cho_du_toan'
  | 'cho_duyet_du_toan'
  | 'san_sang_trien_khai'
  | 'dang_trien_khai'
  | 'cho_quyet_toan'
  | 'hoan_thanh';

export const TOUR_INSTANCE_STATUS_LABEL: Record<TourInstanceStatus, string> = {
  cho_duyet_ban: 'Chờ duyệt bán',
  yeu_cau_chinh_sua: 'Yêu cầu chỉnh sửa',
  tu_choi_ban: 'Từ chối bán',
  dang_mo_ban: 'Đang mở bán',
  chua_du_kien: 'Chưa đủ điều kiện',
  da_huy: 'Đã hủy',
  cho_nhan_dieu_hanh: 'Chờ nhận điều hành',
  cho_du_toan: 'Chờ dự toán',
  cho_duyet_du_toan: 'Chờ duyệt dự toán',
  san_sang_trien_khai: 'Sẵn sàng triển khai',
  dang_trien_khai: 'Đang triển khai',
  cho_quyet_toan: 'Chờ quyết toán',
  hoan_thanh: 'Hoàn thành',
};

export const TOUR_INSTANCE_STATUS_STYLE: Record<TourInstanceStatus, string> = {
  cho_duyet_ban: 'bg-amber-100 text-amber-700 border-amber-300',
  yeu_cau_chinh_sua: 'bg-orange-100 text-orange-700 border-orange-300',
  tu_choi_ban: 'bg-red-100 text-red-700 border-red-300',
  dang_mo_ban: 'bg-blue-100 text-blue-700 border-blue-300',
  chua_du_kien: 'bg-red-50 text-red-600 border-red-200',
  da_huy: 'bg-gray-100 text-gray-600 border-gray-300',
  cho_nhan_dieu_hanh: 'bg-purple-100 text-purple-700 border-purple-300',
  cho_du_toan: 'bg-teal-100 text-teal-700 border-teal-300',
  cho_duyet_du_toan: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  san_sang_trien_khai: 'bg-green-100 text-green-700 border-green-300',
  dang_trien_khai: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  cho_quyet_toan: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  hoan_thanh: 'bg-green-200 text-green-800 border-green-400',
};

export interface TourInstance {
  id: string;
  programId: string;
  programName: string;
  departureDate: string;
  status: TourInstanceStatus;
  departurePoint: string;
  sightseeingSpots: string[];
  transport: 'xe' | 'maybay';
  arrivalPoint?: string;
  expectedGuests: number;
  priceAdult: number;
  priceChild: number;
  priceInfant?: number;
  minParticipants: number;
  bookingDeadline: string;
  saleRequest?: {
    id: string;
    code?: string;
    createdAt?: string;
    totalRows?: number;
    selectedRows?: number;
    unselectedRows?: number;
  };
  warningState?: Record<string, unknown>;
  costEstimate?: CostEstimate;
  settlement?: SettlementData;
  assignedCoordinatorId?: string;
  assignedGuide?: { id: string; name: string; email?: string };
  createdBy: string;
  createdAt: string;
  // Véng đời timestamps
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  openedAt?: string;
  closedAt?: string;
  receivedAt?: string;
  receivedBy?: string;
  estimatedAt?: string;
  estimateApprovedAt?: string;
  estimateApprovedBy?: string;
  readyAt?: string;
  startedAt?: string;
  endedAt?: string;
  settledAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  refundTotal?: number;
  // Báo cáo / thanh toán
  warningDate?: string;   // Ngày cảnh báo (mãa lễ)
}

// --- Cost structure (Dự toán / Quyết toán) ---
export type CostCategoryId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export const COST_CATEGORY_LABEL: Record<CostCategoryId, string> = {
  A: 'Vận chuyển',
  B: 'Khách sạn',
  C: 'Chi phí ăn',
  D: 'Vé thắng cảnh',
  E: 'Hướng dẫn viên',
  F: 'Chi phí khác',
};

export interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  serviceVariant: string;
  quotedPrice: number;
  notes?: string;
  isPrimary: boolean;
}

export interface CostItem {
  id: number;
  name: string;
  unit: string;
  target: 'all' | 'adult' | 'child' | 'infant';
  quantity: number;
  nightsOrRuns?: number;
  unitPrice: number;
  total: number;
  suppliers: SupplierQuote[];
  primarySupplierId?: string;
}

export interface CostCategory {
  id: CostCategoryId;
  name: string;
  items: CostItem[];
  subtotal: number;
  isFixed: boolean; // true cho vận chuyển (fixed) và HDV
}

export interface PricingConfig {
  expectedGuests?: number;
  profitMargin: number;
  taxRate: number;
  otherCostFactor: number;
  netPrice: number;
  sellPriceAdult: number;
  sellPriceChild: number;
  sellPriceInfant: number;
  minParticipants: number;
  maxGuests?: number;
  guideUnitPrice?: number;
}

export interface CostEstimate {
  categories: CostCategory[];
  totalFixedCost: number;
  totalVariableCost: number;
  totalCost: number;
  pricingConfig: PricingConfig;
  estimatedGuests: number;
}

export interface SettlementData {
  revenue: number;
  actualCosts: CostCategory[];
  totalActualCost: number;
  profit: number;
  profitPercent: number;
}

// --- Supplier ---
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: 'transport' | 'hotel' | 'restaurant' | 'attraction' | 'guide' | 'other';
  serviceVariants: ServiceVariant[];
  rating?: number;
  collaborationCount?: number;
  lastCollaboration?: string;
  coverage?: string[]; // Các tỉnh/thành hoạt động
  standards?: string[]; // Tiêu chuẩn lưu trú
}

export interface ServiceVariant {
  id: string;
  name: string;
  unit: string;
  description?: string;
  basePrice: number;
}

// --- HDV ---
export interface TourGuide {
  id: string;
  name: string;
  phone: string;
  experienceYears: number;
  tourGuidedCount: number;
  languages: string[];
  avatar?: string;
  gender?: 'Nam' | 'Nữ';
  dob?: string;
  email?: string;
  address?: string;
  operatingArea?: string;
  guideCardNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuePlace?: string;
  note?: string;
}

// --- Holiday ---
export interface Holiday {
  id: string;
  name: string;
  date: string;
  durationDays: number;
}

// ============================================================
// MOCK DATA — Coordinator
// ============================================================

export const HOLIDAYS: Holiday[] = [
  { id: 'H001', name: 'Tết Nguyên Đán 2026', date: '2026-02-17', durationDays: 7 },
  { id: 'H002', name: 'Giỗ Tổ Hùng Vương', date: '2026-04-06', durationDays: 1 },
  { id: 'H003', name: 'Giải phóng Miền Nam', date: '2026-04-30', durationDays: 1 },
  { id: 'H004', name: 'Quốc tế Lao động', date: '2026-05-01', durationDays: 1 },
  { id: 'H005', name: 'Quốc khành', date: '2026-09-02', durationDays: 1 },
  { id: 'H006', name: 'Mãa thu Nhật Bản', date: '2026-10-15', durationDays: 14 },
  { id: 'H007', name: 'Giá Sinh', date: '2026-12-25', durationDays: 1 },
];

export const VIETNAM_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Hải Dương', 'Nam Định',
  'Thái Bánh', 'Nghệ An', 'Thanh Hóa', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế',
  'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khành Hóa', 'Ninh Thuận', 'Bình Thuận',
  'Làm Đồng', 'Đắk Lắk', 'Đắk Nẵng', 'Gia Lai', 'Kon Tum', 'Tây Ninh', 'Bánh Dương',
  'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh',
  'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu',
  'Cà Mau', 'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Tuyên Quang', 'Lào Cai', 'Y?n Bãi',
  'Thái Nguyên', 'Lạng Sơn', 'Quảng Ninh', 'Bắc Giang', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh',
  'Hưng Yên', 'Hà Nam', 'Sơn La', 'Điện Biển', 'Lai Châu', 'Dễ Nẵng',
] as const;

export const PROVINCES_WITH_AIRPORT = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Hải Dương', 'Nam Định',
  'Thái Bánh', 'Nghệ An', 'Thanh Hóa', 'Hà Tĩnh', 'Quảng Bình', 'Thừa Thiên Huế',
  'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khành Hóa', 'Ninh Thuận', 'Bình Thuận',
  'Làm Đồng', 'Gia Lai', 'Kon Tum', 'Tây Ninh', 'Bánh Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu',
  'Long An', 'An Giang', 'Kiên Giang', 'Cà Mau', 'Hà Giang', 'Cao Bằng', 'Lào Cai',
  'Thái Nguyên', 'Lạng Sơn', 'Quảng Ninh', 'Bắc Giang', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh',
  'Hưng Yên', 'Hà Nam', 'Sơn La', 'Điện Biển', 'Lai Châu',
] as const;

export type VietnamProvince = typeof VIETNAM_PROVINCES[number];

export const WEEKDAYS = [
  { value: 't2', label: 'T2' },
  { value: 't3', label: 'T3' },
  { value: 't4', label: 'T4' },
  { value: 't5', label: 'T5' },
  { value: 't6', label: 'T6' },
  { value: 't7', label: 'T7' },
  { value: 'cn', label: 'CN' },
] as const;

export const MEAL_LABELS: Record<'breakfast' | 'lunch' | 'dinner', string> = {
  breakfast: 'Bữa sáng',
  lunch: 'Bữa trưa',
  dinner: 'Bữa tối',
};



