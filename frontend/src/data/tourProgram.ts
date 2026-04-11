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
  transport: 'xe' | 'maybay';
  arrivalPoint?: string;
  tourType: 'mua_le' | 'quanh_nam';
  holiday?: string;
  bookingDeadline: number;
  status: 'draft' | 'active' | 'inactive';
  itinerary: ProgramItineraryDay[];
  pricingConfig: PricingConfig;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: ('breakfast' | 'lunch' | 'dinner')[];
}

// --- Tour instance (sinh ra từ chương trình) ---
export type TourInstanceStatus =
  | 'cho_duyet_ban'
  | 'yeu_cau_chinh_sua'
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
  costEstimate?: CostEstimate;
  settlement?: SettlementData;
  assignedCoordinatorId?: string;
  assignedGuide?: { id: string; name: string };
  createdBy: string;
  createdAt: string;
  // Vòng đời timestamps
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
  warningDate?: string;   // Ngày cảnh báo (mùa lễ)
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
  profitMargin: number;
  taxRate: number;
  otherCostFactor: number;
  netPrice: number;
  sellPriceAdult: number;
  sellPriceChild: number;
  sellPriceInfant: number;
  minParticipants: number;
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

export const mockHolidays: Holiday[] = [
  { id: 'H001', name: 'Tết Nguyên Đán 2026', date: '2026-02-17', durationDays: 7 },
  { id: 'H002', name: 'Giỗ Tổ Hùng Vương', date: '2026-04-06', durationDays: 1 },
  { id: 'H003', name: 'Giải phóng Miền Nam', date: '2026-04-30', durationDays: 1 },
  { id: 'H004', name: 'Quốc tế Lao động', date: '2026-05-01', durationDays: 1 },
  { id: 'H005', name: 'Quốc khánh', date: '2026-09-02', durationDays: 1 },
  { id: 'H006', name: 'Mùa thu Nhật Bản', date: '2026-10-15', durationDays: 14 },
  { id: 'H007', name: 'Giáng Sinh', date: '2026-12-25', durationDays: 1 },
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Limousine Hạ Long',
    phone: '0901 234 567',
    address: 'Tuần Châu, Hạ Long, Quảng Ninh',
    type: 'transport',
    coverage: ['Quảng Ninh'],
    serviceVariants: [
      { id: 'SV001', name: 'Xe 16 chỗ', unit: 'chuyến', basePrice: 3500000 },
      { id: 'SV002', name: 'Xe 29 chỗ', unit: 'chuyến', basePrice: 5000000 },
      { id: 'SV003', name: 'Xe 45 chỗ', unit: 'chuyến', basePrice: 6500000 },
    ],
    collaborationCount: 12,
    lastCollaboration: '2026-03-15',
  },
  {
    id: 'SUP002',
    name: 'Du thuyền Ambassador',
    phone: '0203 384 5678',
    address: 'Cảng Tuần Châu, Quảng Ninh',
    type: 'transport',
    coverage: ['Quảng Ninh'],
    serviceVariants: [
      { id: 'SV004', name: 'Cabin Suite', unit: 'phòng', description: 'Suite với ban công riêng', basePrice: 8500000 },
    ],
    collaborationCount: 8,
    lastCollaboration: '2026-02-20',
  },
  {
    id: 'SUP003',
    name: 'Khách sạn Ninh Bình Riverside',
    phone: '0229 384 5678',
    address: 'Ninh Bình',
    type: 'hotel',
    coverage: ['Ninh Bình'],
    standards: ['3 sao', '4 sao'],
    serviceVariants: [
      { id: 'SV005', name: 'Phòng Standard', unit: 'đêm', basePrice: 1200000 },
      { id: 'SV006', name: 'Phòng Superior', unit: 'đêm', basePrice: 1800000 },
    ],
    collaborationCount: 6,
    lastCollaboration: '2026-01-10',
  },
];

export const mockTourGuides: TourGuide[] = [
  { id: 'HDV001', name: 'Trần Minh Hoàng', phone: '0901 111 222', experienceYears: 8, tourGuidedCount: 45, languages: ['Tiếng Việt', 'English'] },
  { id: 'HDV002', name: 'Lê Thu Hà', phone: '0902 333 444', experienceYears: 5, tourGuidedCount: 28, languages: ['Tiếng Việt', 'English', '日本語'] },
  { id: 'HDV003', name: 'Nguyễn Đình Phong', phone: '0903 555 666', experienceYears: 12, tourGuidedCount: 67, languages: ['Tiếng Việt', 'English', '中文'] },
  { id: 'HDV004', name: 'Phạm Thị Lan', phone: '0904 777 888', experienceYears: 3, tourGuidedCount: 12, languages: ['Tiếng Việt'] },
];

// Mock Tour Programs (AdminTourProgramWizard)
export const mockTourPrograms: TourProgram[] = [
  {
    id: 'TP001',
    name: 'Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    duration: { days: 3, nights: 2 },
    transport: 'xe',
    tourType: 'quanh_nam',
    bookingDeadline: 7,
    status: 'active',
    itinerary: [
      { day: 1, title: 'Hà Nội - Vịnh Hạ Long', description: 'Đón khách và di chuyển xuống cảng Tuần Châu. Check-in du thuyền và thưởng thức welcome drink.', meals: ['lunch', 'dinner'] },
      { day: 2, title: 'Khám Phá Hang Sửng Sốt', description: 'Thăm hang động và tắm biển tại bãi Ti Tốp.', meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 3, title: 'Hạ Long - Hà Nội', description: 'Ngắm bình minh, brunch và trở về Hà Nội.', meals: ['breakfast', 'lunch'] },
    ],
    pricingConfig: {
      profitMargin: 20,
      taxRate: 10,
      otherCostFactor: 0.05,
      netPrice: 0,
      sellPriceAdult: 4500000,
      sellPriceChild: 2250000,
      sellPriceInfant: 0,
      minParticipants: 8,
    },
    createdBy: 'U003',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'TP002',
    name: 'Mùa Thu Kyoto & Osaka',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
    duration: { days: 6, nights: 5 },
    transport: 'maybay',
    arrivalPoint: 'Osaka',
    tourType: 'mua_le',
    holiday: 'Mùa thu Nhật Bản',
    bookingDeadline: 21,
    status: 'active',
    itinerary: [
      { day: 1, title: 'Hà Nội - Osaka', description: 'Bay đến Osaka Kansai. Đón và đưa về khách sạn trung tâm Namba.', meals: ['lunch'] },
      { day: 2, title: 'Khám phá Osaka', description: 'Thăm Lâu đài Osaka và khu phố Dotonbori. Thưởng thức Takoyaki đích thực.', meals: ['breakfast', 'dinner'] },
      { day: 3, title: 'Cố đô Kyoto', description: 'Thăm Chùa Vàng (Kinkakuji), chụp ảnh với Kimono truyền thống, trải nghiệm trà đạo.', meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 4, title: 'Rừng trúc Arashiyama', description: 'Đi dạo trong rừng trúc huyền thoại. Thưởng thức bữa tối Kaiseki cao cấp.', meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 5, title: 'Nara', description: 'Thăm công viên hươu Nara và chùa Todaiji. Tự do mua sắm tại Shinsaibashi.', meals: ['breakfast', 'lunch'] },
      { day: 6, title: 'Osaka - Hà Nội', description: 'Tắm Onsen buổi sáng. Di chuyển ra sân bay Kansai và kết thúc hành trình.', meals: ['breakfast'] },
    ],
    pricingConfig: {
      profitMargin: 18,
      taxRate: 10,
      otherCostFactor: 0.08,
      netPrice: 0,
      sellPriceAdult: 32000000,
      sellPriceChild: 26000000,
      sellPriceInfant: 8000000,
      minParticipants: 10,
    },
    createdBy: 'U003',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 'TP003',
    name: 'Hạ Long - Kỳ quan Thế giới 3N2Đ',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    duration: { days: 3, nights: 2 },
    transport: 'xe',
    tourType: 'quanh_nam',
    bookingDeadline: 7,
    status: 'draft',
    itinerary: [
      { day: 1, title: 'Hà Nội - Vịnh Hạ Long', description: 'Đón khách tại Hà Nội, di chuyển ra cảng Tuần Châu. Check-in du thuyền 5 sao, thưởng thức welcome drink và bữa tối buffet trên tàu.', meals: ['lunch', 'dinner'] },
      { day: 2, title: 'Khám Phá Hang Sửng Sốt & Bãi Tắm Ti Tốp', description: 'Thăm hang động lớn nhất vịnh, tắm biển tại bãi Ti Tốp, tham gia lớp nấu ăn truyền thống trên du thuyền.', meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 3, title: 'Vịnh Hạ Long - Hà Nội', description: 'Ngắm bình minh trên vịnh, tập Thái Cực Quyền trên boong tàu, brunch và trở về Hà Nội.', meals: ['breakfast', 'lunch'] },
    ],
    pricingConfig: {
      profitMargin: 20,
      taxRate: 10,
      otherCostFactor: 0.05,
      netPrice: 0,
      sellPriceAdult: 4500000,
      sellPriceChild: 2250000,
      sellPriceInfant: 0,
      minParticipants: 8,
    },
    createdBy: 'Nguyễn Văn Điều Phối',
    createdAt: '2026-03-28T09:15:00Z',
    updatedAt: '2026-03-28T09:15:00Z',
  },
  {
    id: 'TP004',
    name: 'Sapa - Ruộng Bậc Thang Mùa Hạ 2N1Đ',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Sapa', 'Bản Cát Cát', 'Núi Hàm Rồng'],
    duration: { days: 2, nights: 1 },
    transport: 'xe',
    tourType: 'quanh_nam',
    bookingDeadline: 10,
    status: 'draft',
    itinerary: [
      { day: 1, title: 'Hà Nội - Sapa', description: 'Xe Limousine đón khách từ Hà Nội, khởi hành sáng sớm. Đến Sapa, thăm bản Cát Cát, cầu Mây và thác Bạc.', meals: ['lunch', 'dinner'] },
      { day: 2, title: 'Sapa - Hà Nội', description: 'Buổi sáng trekking Fansipan (hoặc ngắm cảnh núi từ cáp treo), thăm chợ Sapa, trở về Hà Nội buổi tối.', meals: ['breakfast', 'lunch'] },
    ],
    pricingConfig: {
      profitMargin: 18,
      taxRate: 10,
      otherCostFactor: 0.05,
      netPrice: 0,
      sellPriceAdult: 2200000,
      sellPriceChild: 1600000,
      sellPriceInfant: 0,
      minParticipants: 10,
    },
    createdBy: 'Trần Thị Điều Phối',
    createdAt: '2026-03-29T14:30:00Z',
    updatedAt: '2026-03-29T14:30:00Z',
  },
];

// Mock Tour Instances (vòng đời tour)
export const mockTourInstances: TourInstance[] = [
  {
    id: 'TI001',
    programId: 'TP001',
    programName: 'Khám Phá Vịnh Hạ Long',
    departureDate: '2026-04-10',
    status: 'dang_trien_khai',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    expectedGuests: 10,
    priceAdult: 4500000,
    priceChild: 2250000,
    minParticipants: 8,
    bookingDeadline: '2026-04-03',
    assignedCoordinatorId: 'U003',
    createdBy: 'U003',
    createdAt: '2026-03-20T10:00:00Z',
    openedAt: '2026-03-25T00:00:00Z',
    startedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: 'TI002',
    programId: 'TP002',
    programName: 'Mùa Thu Kyoto & Osaka',
    departureDate: '2026-10-15',
    status: 'dang_mo_ban',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
    transport: 'maybay',
    arrivalPoint: 'Osaka',
    expectedGuests: 15,
    priceAdult: 32000000,
    priceChild: 26000000,
    priceInfant: 8000000,
    minParticipants: 10,
    bookingDeadline: '2026-09-24',
    createdBy: 'U003',
    createdAt: '2026-03-15T10:00:00Z',
    submittedAt: '2026-03-16T10:00:00Z',
    approvedAt: '2026-03-17T10:00:00Z',
    approvedBy: 'U002',
    openedAt: '2026-03-18T00:00:00Z',
    warningDate: '2026-10-10',
  },
  {
    id: 'TI003',
    programId: 'TP001',
    programName: 'Khám Phá Vịnh Hạ Long',
    departureDate: '2026-05-15',
    status: 'cho_duyet_ban',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    expectedGuests: 0,
    priceAdult: 4700000,
    priceChild: 2350000,
    minParticipants: 8,
    bookingDeadline: '2026-05-08',
    createdBy: 'U003',
    createdAt: '2026-03-28T10:00:00Z',
    submittedAt: '2026-03-29T10:00:00Z',
  },
  {
    id: 'TI004',
    programId: 'TP001',
    programName: 'Khám Phá Vịnh Hạ Long',
    departureDate: '2026-04-17',
    status: 'cho_quyet_toan',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    expectedGuests: 8,
    priceAdult: 4500000,
    priceChild: 2250000,
    minParticipants: 8,
    bookingDeadline: '2026-04-10',
    assignedCoordinatorId: 'U003',
    createdBy: 'U003',
    createdAt: '2026-03-10T10:00:00Z',
    openedAt: '2026-03-12T00:00:00Z',
    closedAt: '2026-04-14T00:00:00Z',
    receivedAt: '2026-04-14T10:00:00Z',
    receivedBy: 'U003',
    readyAt: '2026-04-15T10:00:00Z',
    startedAt: '2026-04-17T06:00:00Z',
    endedAt: '2026-04-19T18:00:00Z',
  },
  {
    id: 'TI005',
    programId: 'TP001',
    programName: 'Khám Phá Vịnh Hạ Long',
    departureDate: '2026-03-01',
    status: 'hoan_thanh',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    expectedGuests: 10,
    priceAdult: 4500000,
    priceChild: 2250000,
    minParticipants: 8,
    bookingDeadline: '2026-02-22',
    assignedCoordinatorId: 'U003',
    createdBy: 'U003',
    createdAt: '2026-02-01T10:00:00Z',
    openedAt: '2026-02-05T00:00:00Z',
    closedAt: '2026-02-28T00:00:00Z',
    receivedAt: '2026-02-28T10:00:00Z',
    receivedBy: 'U003',
    readyAt: '2026-03-01T08:00:00Z',
    startedAt: '2026-03-01T06:00:00Z',
    endedAt: '2026-03-03T18:00:00Z',
    settledAt: '2026-03-10T14:00:00Z',
    settlement: {
      revenue: 45000000,
      actualCosts: [],
      totalActualCost: 36000000,
      profit: 9000000,
      profitPercent: 25,
    },
  },
  {
    id: 'TI006',
    programId: 'TP001',
    programName: 'Khám Phá Vịnh Hạ Long',
    departureDate: '2026-03-20',
    status: 'da_huy',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    expectedGuests: 5,
    priceAdult: 4500000,
    priceChild: 2250000,
    minParticipants: 8,
    bookingDeadline: '2026-03-13',
    createdBy: 'U003',
    createdAt: '2026-03-01T10:00:00Z',
    openedAt: '2026-03-05T00:00:00Z',
    closedAt: '2026-03-17T00:00:00Z',
    cancelledAt: '2026-03-17T12:00:00Z',
    cancelReason: 'Không đủ khách tối thiểu (chỉ có 5/8)',
    refundTotal: 11250000,
  },
  {
    id: 'TI007',
    programId: 'TP002',
    programName: 'Mùa Thu Kyoto & Osaka',
    departureDate: '2026-10-20',
    status: 'dang_mo_ban',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
    transport: 'maybay',
    arrivalPoint: 'Osaka',
    expectedGuests: 18,
    priceAdult: 32000000,
    priceChild: 26000000,
    priceInfant: 8000000,
    minParticipants: 10,
    bookingDeadline: '2026-09-29',
    createdBy: 'U003',
    createdAt: '2026-03-25T10:00:00Z',
    submittedAt: '2026-03-26T10:00:00Z',
    approvedAt: '2026-03-27T10:00:00Z',
    approvedBy: 'U002',
    openedAt: '2026-03-28T00:00:00Z',
    warningDate: '2026-10-15',
  },
  {
    id: 'TI008',
    programId: 'TP001',
    programName: 'Khám Phá Vịnh Hạ Long',
    departureDate: '2026-04-24',
    status: 'cho_nhan_dieu_hanh',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    expectedGuests: 12,
    priceAdult: 4500000,
    priceChild: 2250000,
    minParticipants: 8,
    bookingDeadline: '2026-04-17',
    assignedCoordinatorId: 'U003',
    createdBy: 'U003',
    createdAt: '2026-03-15T10:00:00Z',
    openedAt: '2026-03-18T00:00:00Z',
    closedAt: '2026-04-21T00:00:00Z',
  },
  {
    id: 'TI009',
    programId: 'TP001',
    programName: 'Khám Phá Vịnh Hạ Long',
    departureDate: '2026-05-22',
    status: 'cho_du_toan',
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    expectedGuests: 10,
    priceAdult: 4700000,
    priceChild: 2350000,
    minParticipants: 8,
    bookingDeadline: '2026-05-15',
    assignedCoordinatorId: 'U003',
    createdBy: 'U003',
    createdAt: '2026-03-20T10:00:00Z',
    openedAt: '2026-03-22T00:00:00Z',
    closedAt: '2026-05-18T00:00:00Z',
    receivedAt: '2026-05-18T10:00:00Z',
    receivedBy: 'U003',
  },
];

// Provinces for dropdowns
export const VIETNAM_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Hải Dương', 'Nam Định',
  'Thái Bình', 'Nghệ An', 'Thanh Hóa', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế',
  'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận',
  'Lâm Đồng', 'Đắk Lắk', 'Đắk Nông', 'Gia Lai', 'Kon Tum', 'Tây Ninh', 'Bình Dương',
  'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh',
  'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu',
  'Cà Mau', 'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Tuyên Quang', 'Lào Cai', 'Yên Bái',
  'Thái Nguyên', 'Lạng Sơn', 'Quảng Ninh', 'Bắc Giang', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh',
  'Hưng Yên', 'Hà Nam', 'Sơn La', 'Điện Biên', 'Lai Châu', 'Dà Nẵng',
] as const;

export const PROVINCES_WITH_AIRPORT = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Hải Dương', 'Nam Định',
  'Thái Bình', 'Nghệ An', 'Thanh Hóa', 'Hà Tĩnh', 'Quảng Bình', 'Thừa Thiên Huế',
  'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận',
  'Lâm Đồng', 'Gia Lai', 'Kon Tum', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu',
  'Long An', 'An Giang', 'Kiên Giang', 'Cà Mau', 'Hà Giang', 'Cao Bằng', 'Lào Cai',
  'Thái Nguyên', 'Lạng Sơn', 'Quảng Ninh', 'Bắc Giang', 'Phú Thọ', 'Vĩnh Phúc', 'Bắc Ninh',
  'Hưng Yên', 'Hà Nam', 'Sơn La', 'Điện Biên', 'Lai Châu',
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
