import { useMemo, useState, type ReactNode } from 'react';
import { Breadcrumb, message } from 'antd';
import { Link } from 'react-router-dom';
import {
  addSupplierBulkPrices,
  addSupplierServicePrice,
  createGuide,
  createSupplier,
  deleteGuide as deleteGuideRequest,
  deleteSupplier as deleteSupplierRequest,
  patchGuide,
  patchSupplier,
  patchSupplierServicePrice,
  type GuidePayload,
  type SupplierPayload,
} from '@shared/lib/api/suppliers';
import { useAuthStore } from '@shared/store/useAuthStore';
import { useAppDataStore, type SupplierPriceRow, type SupplierRow, type SupplierServiceLine } from '@shared/store/useAppDataStore';
import type { TourGuide } from '@entities/tour-program/data/tourProgram';
import { PageSearchInput } from '@shared/ui/PageSearchInput';

type SupplierCategory = 'Khách sạn' | 'Nhà hàng' | 'Vận chuyển';
type SupplierStatus = 'Hoạt động' | 'Dừng hoạt động';
type TransportType = 'Xe' | 'Máy bay';
type LanguageOption = 'Tiếng Anh' | 'Tiếng Trung' | 'Tiếng Nhật' | 'Tiếng Hàn';

interface SupplierFormState {
  category: SupplierCategory;
  name: string;
  phone: string;
  email: string;
  address: string;
  establishedYear: string;
  description: string;
  operatingArea: string;
  standards: string[];
  status: SupplierStatus;
  service: string;
  transportType: TransportType;
  includeMealService: boolean;
  services: SupplierServiceLine[];
  mealServices: SupplierServiceLine[];
}

interface GuideFormState {
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  phone: string;
  email: string;
  address: string;
  operatingArea: string;
  guideCardNumber: string;
  issueDate: string;
  expiryDate: string;
  issuePlace: string;
  note: string;
  languages: LanguageOption[];
}

type QuotePopupState = {
  supplierId: string;
};

type SupplierPriceEditorState = {
  supplierId: string;
  serviceId: string;
  priceId?: string;
};

type SupplierErrors = Record<string, string>;

const languageOptions: LanguageOption[] = ['Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn'];
const hotelStandardOptions = ['3 sao', '4 sao', '5 sao'];
const todayKey = () => new Date().toISOString().slice(0, 10);
const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const createPrice = (
  id: string,
  unitPrice: number,
  fromDate = todayKey(),
  toDate = '',
  note = 'Không có',
  createdBy = 'Điều phối viên',
): SupplierPriceRow => ({
  id,
  fromDate,
  toDate,
  unitPrice,
  note,
  createdBy,
});

function createHotelServices(): SupplierServiceLine[] {
  return [
    { id: 'hotel-single', name: 'Phòng đơn', description: '', unit: 'Phòng', quantity: 1, prices: [createPrice('hotel-single-p1', 1200000)] },
    { id: 'hotel-double', name: 'Phòng đôi', description: '', unit: 'Phòng', quantity: 1, prices: [createPrice('hotel-double-p1', 1300000)] },
    { id: 'hotel-triple', name: 'Phòng ba', description: '', unit: 'Phòng', quantity: 1, prices: [createPrice('hotel-triple-p1', 1500000)] },
  ];
}

function createRestaurantService(index: number): SupplierServiceLine {
  return {
    id: `restaurant-${Date.now()}-${index}`,
    name: '',
    description: '',
    unit: 'Bàn',
    quantity: 1,
    menu: '',
    note: '',
    formulaCount: 'Giá trị mặc định',
    formulaCountDefault: '1',
    formulaQuantity: 'Theo số người',
    prices: [createPrice(`restaurant-price-${Date.now()}-${index}`, 0)],
  };
}

function createTransportService(index: number, type: TransportType): SupplierServiceLine {
  return {
    id: `transport-${Date.now()}-${index}`,
    name: type === 'Xe' ? '' : 'Vé máy bay đoàn',
    description: '',
    unit: type === 'Xe' ? 'Xe' : 'Khách',
    quantity: 1,
    capacity: type === 'Xe' ? 0 : undefined,
    transportType: type,
    priceMode: 'Báo giá',
    prices: [],
  };
}

function createMealService(index: number): SupplierServiceLine {
  return {
    id: `meal-${Date.now()}-${index}`,
    name: '',
    description: '',
    unit: 'Bữa',
    quantity: 1,
    menu: '',
    note: '',
    formulaCount: 'Giá trị mặc định',
    formulaCountDefault: '1',
    formulaQuantity: 'Theo số người',
    prices: [createPrice(`meal-price-${Date.now()}-${index}`, 0)],
  };
}

const initialSuppliers: SupplierRow[] = [
  {
    id: 'SUP001',
    name: 'Khách sạn Di Sản Việt',
    phone: '024 3939 8888',
    email: 'contact@heritage.vn',
    category: 'Khách sạn',
    service: 'Lưu trú',
    operatingArea: 'Hạ Long',
    status: 'Hoạt động',
    address: '12 Bãi Cháy, Hạ Long',
    establishedYear: '2016',
    description: 'Khách sạn 4 sao phục vụ khách đoàn, có nhà hàng nội khu.',
    standards: ['4 sao'],
    services: createHotelServices(),
    mealServices: [createMealService(0)],
  },
  {
    id: 'SUP002',
    name: 'Vận tải Xuyên Việt',
    phone: '0901 234 567',
    email: 'ops@vantaiviet.vn',
    category: 'Vận chuyển',
    service: 'Xe tham quan',
    operatingArea: 'Hà Nội, Quảng Ninh, Ninh Bình',
    status: 'Hoạt động',
    address: '31 Trần Quang Khải, Hà Nội',
    establishedYear: '2014',
    description: 'Nhà xe chuyên tour ghép và tour riêng.',
    services: [
      { ...createTransportService(0, 'Xe'), name: 'Xe 16 chỗ', capacity: 16 },
      { ...createTransportService(1, 'Xe'), name: 'Xe 25 chỗ', capacity: 25 },
    ],
    mealServices: [],
  },
  {
    id: 'SUP004',
    name: 'The Lotus Dining Room',
    phone: '024 3888 7777',
    email: 'reserve@lotus.vn',
    category: 'Nhà hàng',
    service: 'Bữa ăn đoàn',
    operatingArea: 'Hà Nội',
    status: 'Dừng hoạt động',
    address: '88 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    establishedYear: '2011',
    description: 'Nhà hàng chuyên set menu cho khách đoàn.',
    services: [
      { ...createRestaurantService(0), name: 'Set menu đoàn', description: 'Phục vụ bàn tròn 10 người', menu: '6 món + canh + tráng miệng', note: 'Có menu chay theo yêu cầu', prices: [createPrice('P9', 1800000)] },
    ],
    mealServices: [],
  },
];

const initialGuides: TourGuide[] = [
  {
    id: 'HDV001',
    name: 'Trần Minh Hoàng',
    gender: 'Nam',
    dob: '1986-04-12',
    phone: '0901 111 222',
    email: 'hoang.hdv@travela.vn',
    address: '25 Nguyễn Chí Thanh, Hà Nội',
    operatingArea: 'Miền Bắc',
    guideCardNumber: 'HDV-001-2020',
    issueDate: '2020-03-20',
    expiryDate: '2030-03-20',
    issuePlace: 'Tổng cục Du lịch',
    note: 'Phụ trách tour nội địa miền Bắc',
    languages: ['Tiếng Anh'],
    experienceYears: 8,
    tourGuidedCount: 32,
  },
  {
    id: 'HDV002',
    name: 'Lê Thu Hà',
    gender: 'Nữ',
    dob: '1992-08-21',
    phone: '0902 333 444',
    email: 'ha.hdv@travela.vn',
    address: '15 Lý Thường Kiệt, Hà Nội',
    operatingArea: 'Nhật Bản',
    guideCardNumber: 'HDV-002-2021',
    issueDate: '2021-05-11',
    expiryDate: '2031-05-11',
    issuePlace: 'Sở Du lịch Hà Nội',
    note: 'Ưu tiên tour inbound Nhật Bản',
    languages: ['Tiếng Nhật', 'Tiếng Anh'],
    experienceYears: 5,
    tourGuidedCount: 21,
  },
];

function createInitialSupplierForm(): SupplierFormState {
  return {
    category: 'Khách sạn',
    name: '',
    phone: '',
    email: '',
    address: '',
    establishedYear: '',
    description: '',
    operatingArea: '',
    standards: ['4 sao'],
    status: 'Hoạt động',
    service: 'Lưu trú',
    transportType: 'Xe',
    includeMealService: false,
    services: createHotelServices(),
    mealServices: [],
  };
}

function createInitialGuideForm(): GuideFormState {
  return {
    name: '',
    gender: 'Nam',
    dob: '',
    phone: '',
    email: '',
    address: '',
    operatingArea: '',
    guideCardNumber: '',
    issueDate: '',
    expiryDate: '',
    issuePlace: '',
    note: '',
    languages: [],
  };
}

function createSupplierSummary(category: SupplierCategory) {
  if (category === 'Khách sạn') return 'Lưu trú';
  if (category === 'Nhà hàng') return 'Bữa ăn đoàn';
  return 'Vận chuyển';
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={`relative max-h-[92vh] overflow-y-auto bg-white shadow-2xl ${wide ? 'w-full max-w-6xl' : 'w-full max-w-3xl'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-8 py-6">
          <div>
            <h2 className="font-serif text-3xl text-primary">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-primary/55">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-primary/50 hover:text-primary" aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-outline-variant/20 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/45">{label}</p>
      <div className="mt-2 text-sm text-primary">{value}</div>
    </div>
  );
}

function SupplierServicesTable({
  supplier,
  onEditPrice,
}: {
  supplier: SupplierRow;
  onEditPrice?: (serviceId: string, priceId: string) => void;
}) {
  const rows = [...supplier.services, ...supplier.mealServices];

  return (
    <div className="overflow-x-auto border border-outline-variant/20">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-container-low">
          <tr>
            {['Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Hình thức giá', 'Bảng giá'].map(header => (
              <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-primary/45">Chưa có dịch vụ</td>
            </tr>
          )}
          {rows.map(service => (
            <tr key={service.id} className="border-t border-outline-variant/10 align-top">
              <td className="px-4 py-3 font-medium text-primary">{service.name || '-'}</td>
              <td className="px-4 py-3 text-primary/65">{service.description || service.menu || service.note || '-'}</td>
              <td className="px-4 py-3">{service.unit}</td>
              <td className="px-4 py-3">{service.priceMode || '-'}</td>
              <td className="px-4 py-3">
                {service.prices.length === 0 ? (
                  <span className="text-primary/40">-</span>
                ) : (
                  <div className="space-y-2">
                    {service.prices.map(price => (
                      <div key={price.id} className="flex items-center justify-between gap-3 border-b border-outline-variant/10 pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-medium">{formatCurrency(price.unitPrice)}</p>
                          <p className="text-xs text-primary/50">{price.fromDate} - {price.toDate || 'Đang áp dụng'} · {price.note || 'Không có'}</p>
                        </div>
                        {onEditPrice && (
                          <button
                            onClick={() => onEditPrice(service.id, price.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-outline-variant/40 text-primary hover:border-secondary hover:text-secondary"
                            aria-label={`Sửa bảng giá ${service.name}`}
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function closeOpenEndedPrices(rows: SupplierPriceRow[], newFromDate: string) {
  return rows.map(price => (!price.toDate ? { ...price, toDate: newFromDate } : price));
}

function openEndedKey(value?: string) {
  return value || '9999-12-31';
}

function getIntersectingSupplierPrices(prices: SupplierPriceRow[], fromDate: string, toDate?: string) {
  if (!fromDate) return [];
  const rangeEnd = openEndedKey(toDate);
  return prices.filter(price => price.fromDate <= rangeEnd && openEndedKey(price.toDate) >= fromDate);
}

function validateSupplierForm(form: SupplierFormState) {
  const errors: SupplierErrors = {};
  if (!form.name.trim()) errors.name = 'Cần nhập tên nhà cung cấp';
  if (!form.phone.trim()) errors.phone = 'Cần nhập số điện thoại';
  if (!form.email.trim()) errors.email = 'Cần nhập email';
  if (!form.address.trim()) errors.address = 'Cần nhập địa chỉ';
  if (!(form.category === 'Vận chuyển' && form.transportType === 'Máy bay') && !form.operatingArea.trim()) {
    errors.operatingArea = 'Cần nhập khu vực hoạt động';
  }

  if (form.category === 'Khách sạn') {
    if (!form.standards.length) errors.standards = 'Cần chọn hạng sao';
    if (form.services.length !== 3) errors.services = 'Khách sạn phải có đủ phòng đơn, phòng đôi và phòng ba';
    form.services.forEach((service) => {
      if (service.quantity <= 0) errors[`quantity-${service.id}`] = 'Số lượng phải lớn hơn 0';
      if ((service.prices.at(-1)?.unitPrice ?? 0) <= 0) errors[`price-${service.id}`] = 'Đơn giá phải lớn hơn 0';
    });
  }

  if (form.category === 'Nhà hàng') {
    form.services.forEach((service) => {
      if (!service.name.trim()) errors[`name-${service.id}`] = 'Cần nhập tên dịch vụ';
      if ((service.prices.at(-1)?.unitPrice ?? 0) <= 0) errors[`price-${service.id}`] = 'Cần nhập đơn giá';
    });
  }

  if (form.category === 'Vận chuyển') {
    const capacities = new Set<number>();
    form.services.forEach((service) => {
      if (form.transportType === 'Xe') {
        const capacity = service.capacity ?? 0;
        if (capacity <= 0) errors[`capacity-${service.id}`] = 'Số chỗ phải lớn hơn 0';
        if (capacities.has(capacity)) errors[`capacity-${service.id}`] = 'Không được trùng số chỗ giữa các dịch vụ xe';
        capacities.add(capacity);
      }
    });
  }

  return errors;
}

function validateGuideForm(form: GuideFormState) {
  const errors: SupplierErrors = {};
  if (!form.name.trim()) errors.guideName = 'Cần nhập tên hướng dẫn viên';
  if (!form.phone.trim()) errors.guidePhone = 'Cần nhập số điện thoại';
  if (!form.email.trim()) errors.guideEmail = 'Cần nhập email';
  if (!form.address.trim()) errors.guideAddress = 'Cần nhập địa chỉ';
  if (!form.operatingArea.trim()) errors.guideOperatingArea = 'Cần nhập khu vực hoạt động';
  if (!form.guideCardNumber.trim()) errors.guideCardNumber = 'Cần nhập số thẻ hướng dẫn viên';
  if (!form.issueDate.trim()) errors.guideIssueDate = 'Cần nhập ngày cấp';
  if (!form.expiryDate.trim()) errors.guideExpiryDate = 'Cần nhập ngày hết hạn';
  if (!form.issuePlace.trim()) errors.guideIssuePlace = 'Cần nhập nơi cấp';
  if (!form.dob.trim()) errors.guideDob = 'Cần nhập ngày sinh';
  if (form.issueDate && form.expiryDate && form.expiryDate < form.issueDate) {
    errors.guideExpiryDate = 'Ngày hết hạn phải lớn hơn hoặc bằng ngày cấp';
  }
  if (!form.languages.length) errors.guideLanguages = 'Cần chọn ít nhất một ngoại ngữ';
  return errors;
}

function toApiSupplierType(category: SupplierCategory): SupplierPayload['type'] {
  if (category === 'Khách sạn') return 'HOTEL';
  if (category === 'Nhà hàng') return 'RESTAURANT';
  return 'TRANSPORT';
}

function toApiGuidePayload(form: GuideFormState): GuidePayload {
  return {
    name: form.name,
    gender: form.gender,
    dob: form.dob,
    phone: form.phone,
    email: form.email,
    address: form.address,
    operatingArea: form.operatingArea,
    guideCardNumber: form.guideCardNumber,
    issueDate: form.issueDate,
    expiryDate: form.expiryDate,
    issuePlace: form.issuePlace,
    note: form.note,
    languages: form.languages,
    active: true,
  };
}

function SupplierServiceEditor({
  form,
  errors,
  onChange,
  onAddLine,
}: {
  form: SupplierFormState;
  errors: SupplierErrors;
  onChange: (serviceId: string, changes: Partial<SupplierServiceLine>, meal?: boolean) => void;
  onAddLine: (meal?: boolean) => void;
}) {
  const renderError = (key: string) => errors[key] ? <p className="text-xs text-red-600 mt-1">{errors[key]}</p> : null;

  const renderPriceCell = (service: SupplierServiceLine, meal = false) => (
    <td className="px-4 py-3">
      <input
        type="number"
        value={service.prices.at(-1)?.unitPrice ?? 0}
        onChange={event => onChange(service.id, { prices: [createPrice(`p-${service.id}`, Number(event.target.value || 0), service.prices.at(-1)?.fromDate ?? todayKey(), service.prices.at(-1)?.toDate ?? '', service.prices.at(-1)?.note ?? 'Khởi tạo')] }, meal)}
        className="w-32 border border-outline-variant/40 px-3 py-2"
      />
      {renderError(`price-${service.id}`)}
    </td>
  );

  return (
    <div className="space-y-6">
      {form.category === 'Khách sạn' && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Dịch vụ lưu trú cố định</p>
          <div className="overflow-x-auto border border-outline-variant/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Tên dịch vụ', 'Số lượng', 'Đơn giá'].map(header => (
                    <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.services.map(service => (
                  <tr key={service.id} className="border-t border-outline-variant/10">
                    <td className="px-4 py-3 font-medium">{service.name}</td>
                    <td className="px-4 py-3">
                      <input type="number" value={service.quantity} onChange={event => onChange(service.id, { quantity: Number(event.target.value || 0) })} className="w-24 border border-outline-variant/40 px-3 py-2" />
                      {renderError(`quantity-${service.id}`)}
                    </td>
                    {renderPriceCell(service)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {form.includeMealService && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Dịch vụ ăn kèm</p>
                <button onClick={() => onAddLine(true)} className="text-xs font-bold uppercase tracking-widest text-secondary">Thêm dòng</button>
              </div>
              <div className="overflow-x-auto border border-outline-variant/20">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low">
                    <tr>
                      {['Tên dịch vụ', 'Menu', 'Ghi chú', 'Đơn giá'].map(header => (
                        <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.mealServices.map(service => (
                      <tr key={service.id} className="border-t border-outline-variant/10">
                        <td className="px-4 py-3"><input value={service.name} onChange={event => onChange(service.id, { name: event.target.value }, true)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                        <td className="px-4 py-3"><input value={service.menu ?? ''} onChange={event => onChange(service.id, { menu: event.target.value }, true)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                        <td className="px-4 py-3"><input value={service.note ?? ''} onChange={event => onChange(service.id, { note: event.target.value }, true)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                        {renderPriceCell(service, true)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {form.category === 'Nhà hàng' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Dịch vụ ăn uống</p>
            <button onClick={() => onAddLine(false)} className="text-xs font-bold uppercase tracking-widest text-secondary">Thêm dòng rỗng</button>
          </div>
          <div className="overflow-x-auto border border-outline-variant/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Tên dịch vụ', 'Mô tả', 'Menu', 'Ghi chú', 'Đơn giá'].map(header => (
                    <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.services.map(service => (
                  <tr key={service.id} className="border-t border-outline-variant/10">
                    <td className="px-4 py-3">
                      <input value={service.name} onChange={event => onChange(service.id, { name: event.target.value })} className="w-full border border-outline-variant/40 px-3 py-2" />
                      {renderError(`name-${service.id}`)}
                    </td>
                    <td className="px-4 py-3"><input value={service.description} onChange={event => onChange(service.id, { description: event.target.value })} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                    <td className="px-4 py-3"><input value={service.menu ?? ''} onChange={event => onChange(service.id, { menu: event.target.value })} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                    <td className="px-4 py-3"><input value={service.note ?? ''} onChange={event => onChange(service.id, { note: event.target.value })} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                    {renderPriceCell(service)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {form.category === 'Vận chuyển' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Dịch vụ vận chuyển</p>
            {form.transportType === 'Xe' && <button onClick={() => onAddLine(false)} className="text-xs font-bold uppercase tracking-widest text-secondary">Thêm dòng</button>}
          </div>
          <div className="overflow-x-auto border border-outline-variant/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {(form.transportType === 'Xe'
                    ? ['Tên dịch vụ', 'Số chỗ']
                    : ['Tên dịch vụ']
                  ).map(header => (
                    <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.services.map(service => (
                  <tr key={service.id} className="border-t border-outline-variant/10">
                    <td className="px-4 py-3">
                      <input value={service.name} onChange={event => onChange(service.id, { name: event.target.value })} className="w-full border border-outline-variant/40 px-3 py-2" />
                    </td>
                    {form.transportType === 'Xe' && (
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={service.capacity ?? 0}
                          onChange={event => onChange(service.id, { capacity: Number(event.target.value || 0), name: `Xe ${Number(event.target.value || 0)} chỗ` })}
                          className="w-24 border border-outline-variant/40 px-3 py-2"
                        />
                        {renderError(`capacity-${service.id}`)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSuppliers() {
  const role = useAuthStore(state => state?.user?.role || 'guest');
  const token = useAuthStore(state => state?.accessToken);
  const currentUser = useAuthStore(state => state?.user?.name || 'Điều phối viên');
  const provinces = useAppDataStore(state => state.provinces);
  const suppliersStore = useAppDataStore(state => state.suppliers);
  const setSuppliers = useAppDataStore(state => state.setSuppliers);
  const guidesStore = useAppDataStore(state => state.guides);
  const setGuides = useAppDataStore(state => state.setGuides);
  const initializeProtected = useAppDataStore(state => state.initializeProtected);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'guides'>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [detailGuideId, setDetailGuideId] = useState<string | null>(null);
  const [supplierEditorId, setSupplierEditorId] = useState<string | 'new' | null>(null);
  const [guideEditorId, setGuideEditorId] = useState<string | 'new' | null>(null);
  const [quotePopup, setQuotePopup] = useState<QuotePopupState | null>(null);
  const [supplierPriceEditor, setSupplierPriceEditor] = useState<SupplierPriceEditorState | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(createInitialSupplierForm());
  const [guideForm, setGuideForm] = useState<GuideFormState>(createInitialGuideForm());
  const [errors, setErrors] = useState<SupplierErrors>({});

  const supplierRows = suppliersStore.length > 0 ? suppliersStore : initialSuppliers;
  const guideRows = guidesStore.length > 0 ? guidesStore : initialGuides;
  const provinceOptions = provinces.length > 0 ? provinces.map(province => province.name) : ['Hà Nội', 'Quảng Ninh', 'Ninh Bình', 'Đà Nẵng', 'Thành phố Hồ Chí Minh'];

  const filteredSupplierRows = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return supplierRows;
    return supplierRows.filter((supplier) => [supplier.id, supplier.name, supplier.phone, supplier.email, supplier.category, supplier.service, supplier.operatingArea, supplier.status].join(' ').toLowerCase().includes(keyword));
  }, [searchQuery, supplierRows]);

  const filteredGuideRows = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return guideRows;
    return guideRows.filter((guide) => [guide.id, guide.name, guide.phone, guide.email, guide.operatingArea, guide.languages.join(' ')].join(' ').toLowerCase().includes(keyword));
  }, [guideRows, searchQuery]);

  const detailSupplier = supplierRows.find(supplier => supplier.id === detailSupplierId) ?? null;
  const detailGuide = guideRows.find(guide => guide.id === detailGuideId) ?? null;
  const editingSupplier = supplierRows.find(supplier => supplier.id === supplierEditorId) ?? null;
  const editingGuide = guideRows.find(guide => guide.id === guideEditorId) ?? null;
  const quoteSupplier = supplierRows.find(supplier => supplier.id === quotePopup?.supplierId) ?? null;
  const activePriceSupplier = supplierRows.find(supplier => supplier.id === supplierPriceEditor?.supplierId) ?? null;
  const activePriceService = activePriceSupplier
    ? [...activePriceSupplier.services, ...activePriceSupplier.mealServices].find(service => service.id === supplierPriceEditor?.serviceId) ?? null
    : null;
  const activeSupplierPrice = activePriceService?.prices.find(price => price.id === supplierPriceEditor?.priceId);

  const persistSuppliers = (rows: SupplierRow[]) => setSuppliers(rows);
  const persistGuides = (rows: TourGuide[]) => setGuides(rows);

  const updateSupplierForm = <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) => {
    setSupplierForm(previous => {
      if (key === 'category') {
        const category = value as SupplierCategory;
        return {
          ...createInitialSupplierForm(),
          category,
          standards: category === 'Khách sạn' ? ['4 sao'] : [],
          service: createSupplierSummary(category),
          services: category === 'Khách sạn' ? createHotelServices() : category === 'Nhà hàng' ? [createRestaurantService(0)] : [createTransportService(0, 'Xe')],
        };
      }
      if (key === 'transportType') {
        const type = value as TransportType;
        return {
          ...previous,
          transportType: type,
          operatingArea: type === 'Máy bay' ? '' : previous.operatingArea,
          services: [createTransportService(0, type)],
        };
      }
      return { ...previous, [key]: value };
    });
    setErrors(previous => ({ ...previous, [String(key)]: '' }));
  };

  const updateGuideForm = <K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) => {
    setGuideForm(previous => ({ ...previous, [key]: value }));
  };

  const updateDraftService = (serviceId: string, changes: Partial<SupplierServiceLine>, meal = false) => {
    const targetKey = meal ? 'mealServices' : 'services';
    setSupplierForm(previous => ({
      ...previous,
      [targetKey]: previous[targetKey].map(service => service.id === serviceId ? { ...service, ...changes } : service),
    }));
  };

  const addDraftService = (meal = false) => {
    setSupplierForm(previous => {
      if (meal) {
        return { ...previous, mealServices: [...previous.mealServices, createMealService(previous.mealServices.length)] };
      }
      if (previous.category === 'Nhà hàng') {
        return { ...previous, services: [...previous.services, createRestaurantService(previous.services.length)] };
      }
      if (previous.category === 'Vận chuyển' && previous.transportType === 'Xe') {
        return { ...previous, services: [...previous.services, createTransportService(previous.services.length, 'Xe')] };
      }
      return previous;
    });
  };

  const resetSupplierEditor = () => {
    setSupplierEditorId(null);
    setSupplierForm(createInitialSupplierForm());
    setErrors({});
  };

  const resetGuideEditor = () => {
    setGuideEditorId(null);
    setGuideForm(createInitialGuideForm());
    setErrors({});
  };

  const openCreateSupplier = () => {
    setSupplierForm(createInitialSupplierForm());
    setSupplierEditorId('new');
    setErrors({});
  };

  const openEditSupplier = (supplier: SupplierRow) => {
    setSupplierForm({
      category: supplier.category as SupplierCategory,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      establishedYear: supplier.establishedYear,
      description: supplier.description,
      operatingArea: supplier.operatingArea,
      standards: supplier.standards ?? [],
      status: supplier.status as SupplierStatus,
      service: supplier.service,
      transportType: supplier.category === 'Vận chuyển' && supplier.services[0]?.transportType === 'Máy bay' ? 'Máy bay' : 'Xe',
      includeMealService: supplier.mealServices.length > 0,
      services: supplier.services.map(service => ({ ...service, prices: [...service.prices] })),
      mealServices: supplier.mealServices.map(service => ({ ...service, prices: [...service.prices] })),
    });
    setSupplierEditorId(supplier.id);
    setDetailSupplierId(null);
    setErrors({});
  };

  const saveSupplier = () => {
    const nextErrors = validateSupplierForm(supplierForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      message.error('Cần hoàn thiện dữ liệu nhà cung cấp trước khi lưu');
      return;
    }

    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể lưu nhà cung cấp.');
      return;
    }

    {
      const payload: SupplierPayload = {
        name: supplierForm.name,
        phone: supplierForm.phone,
        email: supplierForm.email,
        address: supplierForm.address,
        type: toApiSupplierType(supplierForm.category),
        serviceSummary: supplierForm.service || createSupplierSummary(supplierForm.category),
        operatingArea: supplierForm.category === 'Vận chuyển' && supplierForm.transportType === 'Máy bay' ? '' : supplierForm.operatingArea,
        standards: supplierForm.category === 'Khách sạn' ? supplierForm.standards : [],
        establishedYear: supplierForm.establishedYear ? Number(supplierForm.establishedYear) : null,
        description: supplierForm.description,
        isActive: supplierForm.status === 'Hoạt động',
        services: supplierForm.services.map(service => ({
          ...service,
          transportType: service.transportType === 'Máy bay' ? 'MAYBAY' : service.transportType === 'Xe' ? 'XE' : undefined,
          priceMode: service.priceMode === 'Báo giá' ? 'QUOTED' : service.priceMode === 'Niêm yết' ? 'LISTED' : undefined,
        })),
        mealServices: supplierForm.includeMealService
          ? supplierForm.mealServices.map(service => ({
              ...service,
              transportType: undefined,
              priceMode: service.priceMode === 'Báo giá' ? 'QUOTED' : service.priceMode === 'Niêm yết' ? 'LISTED' : undefined,
            }))
          : [],
      };

      void (async () => {
        try {
          if (supplierEditorId === 'new') {
            const response = await createSupplier(token, payload);
            persistSuppliers([response.supplier, ...supplierRows]);
            resetSupplierEditor();
            message.success('Đã thêm nhà cung cấp');
            return;
          }

          if (!editingSupplier) return;
          const response = await patchSupplier(token, editingSupplier.id, payload);
          persistSuppliers(supplierRows.map(supplier => supplier.id === editingSupplier.id ? response.supplier : supplier));
          resetSupplierEditor();
          message.success('Đã cập nhật nhà cung cấp');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể lưu nhà cung cấp');
        }
      })();
      return;
    }

    if (supplierEditorId === 'new') {
      const maxSupplierIndex = Math.max(0, ...supplierRows.map(supplier => Number(supplier.id.replace(/\D/g, '')) || 0));
      const nextId = `SUP${String(maxSupplierIndex + 1).padStart(3, '0')}`;
      const nextSupplier: SupplierRow = {
        id: nextId,
        name: supplierForm.name,
        phone: supplierForm.phone,
        email: supplierForm.email,
        category: supplierForm.category,
        service: supplierForm.service || createSupplierSummary(supplierForm.category),
        operatingArea: supplierForm.operatingArea,
        standards: supplierForm.category === 'Khách sạn' ? supplierForm.standards : [],
        status: supplierForm.status,
        address: supplierForm.address,
        establishedYear: supplierForm.establishedYear,
        description: supplierForm.description,
        services: supplierForm.services.map(service => ({ ...service, prices: service.prices.map((price, index) => index === service.prices.length - 1 ? { ...price, fromDate: todayKey(), toDate: '', createdBy: currentUser } : price) })),
        mealServices: supplierForm.includeMealService ? supplierForm.mealServices.map(service => ({ ...service, prices: service.prices.map((price, index) => index === service.prices.length - 1 ? { ...price, fromDate: todayKey(), toDate: '', createdBy: currentUser } : price) })) : [],
      };
      persistSuppliers([nextSupplier, ...supplierRows]);
      resetSupplierEditor();
      message.success('Đã thêm nhà cung cấp');
      return;
    }

    const currentEditingSupplier = editingSupplier;
    if (!currentEditingSupplier) return;
    persistSuppliers(supplierRows.map(supplier => supplier.id === currentEditingSupplier!.id ? {
      ...supplier,
      name: supplierForm.name,
      phone: supplierForm.phone,
      email: supplierForm.email,
      address: supplierForm.address,
      establishedYear: supplierForm.establishedYear,
      description: supplierForm.description,
      operatingArea: supplierForm.operatingArea,
      standards: supplierForm.category === 'Khách sạn' ? supplierForm.standards : [],
      status: supplierForm.status,
      service: supplierForm.service,
      category: supplierForm.category,
      services: supplierForm.services,
      mealServices: supplierForm.includeMealService ? supplierForm.mealServices : [],
    } : supplier));
    resetSupplierEditor();
    message.success('Đã cập nhật nhà cung cấp');
  };

  const deleteSupplier = (supplierId: string) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể xóa nhà cung cấp.');
      return;
    }

    {
      void (async () => {
        try {
          await deleteSupplierRequest(token, supplierId);
          persistSuppliers(supplierRows.filter(supplier => supplier.id !== supplierId));
          setDetailSupplierId(null);
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể xóa nhà cung cấp');
        }
      })();
      return;
    }

    persistSuppliers(supplierRows.filter(supplier => supplier.id !== supplierId));
    setDetailSupplierId(null);
  };

  const openCreateGuide = () => {
    setGuideForm(createInitialGuideForm());
    setGuideEditorId('new');
    setErrors({});
  };

  const openEditGuide = (guide: TourGuide) => {
    setGuideForm({
      name: guide.name,
      gender: guide.gender ?? 'Nam',
      dob: guide.dob ?? '',
      phone: guide.phone,
      email: guide.email ?? '',
      address: guide.address ?? '',
      operatingArea: guide.operatingArea ?? '',
      guideCardNumber: guide.guideCardNumber ?? '',
      issueDate: guide.issueDate ?? '',
      expiryDate: guide.expiryDate ?? '',
      issuePlace: guide.issuePlace ?? '',
      note: guide.note ?? '',
      languages: guide.languages as LanguageOption[],
    });
    setGuideEditorId(guide.id);
    setDetailGuideId(null);
  };

  const saveGuide = () => {
    const nextErrors = validateGuideForm(guideForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      message.error('Cần hoàn thiện dữ liệu hướng dẫn viên trước khi lưu');
      return;
    }

    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể lưu hướng dẫn viên.');
      return;
    }

    {
      const payload = toApiGuidePayload(guideForm);
      void (async () => {
        try {
          if (guideEditorId === 'new') {
            const response = await createGuide(token, payload);
            persistGuides([response.guide, ...guideRows]);
            resetGuideEditor();
            message.success('Đã thêm hướng dẫn viên');
            return;
          }

          if (!editingGuide) return;
          const response = await patchGuide(token, editingGuide.id, payload);
          persistGuides(guideRows.map(guide => guide.id === editingGuide.id ? response.guide : guide));
          resetGuideEditor();
          message.success('Đã cập nhật hướng dẫn viên');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể lưu hướng dẫn viên');
        }
      })();
      return;
    }

    if (guideEditorId === 'new') {
      const maxGuideIndex = Math.max(0, ...guideRows.map(guide => Number(guide.id.replace(/\D/g, '')) || 0));
      const nextId = `HDV${String(maxGuideIndex + 1).padStart(3, '0')}`;
      persistGuides([
        {
          id: nextId,
          name: guideForm.name,
          gender: guideForm.gender,
          dob: guideForm.dob,
          phone: guideForm.phone,
          email: guideForm.email,
          address: guideForm.address,
          operatingArea: guideForm.operatingArea,
          guideCardNumber: guideForm.guideCardNumber,
          issueDate: guideForm.issueDate,
          expiryDate: guideForm.expiryDate,
          issuePlace: guideForm.issuePlace,
          note: guideForm.note,
          languages: guideForm.languages,
          experienceYears: 1,
          tourGuidedCount: 0,
        },
        ...guideRows,
      ]);
      resetGuideEditor();
      message.success('Đã thêm hướng dẫn viên');
      return;
    }

    const currentEditingGuide = editingGuide;
    if (!currentEditingGuide) return;
    persistGuides(guideRows.map(guide => guide.id === currentEditingGuide!.id ? {
      ...guide,
      name: guideForm.name,
      gender: guideForm.gender,
      dob: guideForm.dob,
      phone: guideForm.phone,
      email: guideForm.email,
      address: guideForm.address,
      operatingArea: guideForm.operatingArea,
      guideCardNumber: guideForm.guideCardNumber,
      issueDate: guideForm.issueDate,
      expiryDate: guideForm.expiryDate,
      issuePlace: guideForm.issuePlace,
      note: guideForm.note,
      languages: guideForm.languages,
    } : guide));
    resetGuideEditor();
    message.success('Đã cập nhật hướng dẫn viên');
  };

  const deleteGuide = (guideId: string) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể xóa hướng dẫn viên.');
      return;
    }

    {
      void (async () => {
        try {
          await deleteGuideRequest(token, guideId);
          persistGuides(guideRows.filter(guide => guide.id !== guideId));
          setDetailGuideId(null);
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể xóa hướng dẫn viên');
        }
      })();
      return;
    }

    persistGuides(guideRows.filter(guide => guide.id !== guideId));
    setDetailGuideId(null);
  };

  const applyQuoteChanges = (priceMap: Record<string, number>, reason: string, fromDate: string, toDate: string) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể cập nhật bảng giá nhà cung cấp.');
      return;
    }

    if (quoteSupplier) {
      void (async () => {
        try {
          const response = await addSupplierBulkPrices(token, quoteSupplier.id, {
            fromDate,
            toDate,
            note: reason || 'Cập nhật báo giá',
            createdBy: currentUser,
            priceMap,
          });
          persistSuppliers(supplierRows.map(supplier => supplier.id === quoteSupplier.id ? response.supplier : supplier));
          setQuotePopup(null);
          message.success('Đã cập nhật bảng giá nhà cung cấp');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể cập nhật bảng giá nhà cung cấp');
        }
      })();
      return;
    }

    const quoteSupplierId = '';
    if (!quoteSupplierId) return;
    persistSuppliers(supplierRows.map(supplier => {
      if (supplier.id !== quoteSupplierId) return supplier;
      const applyToLines = (lines: SupplierServiceLine[]) => lines.map((service: SupplierServiceLine) => {
        const nextValue = priceMap[service.id];
        if (!nextValue || nextValue <= 0) return service;
        const existingPrices = !toDate ? closeOpenEndedPrices(service.prices, fromDate) : service.prices;
        return {
          ...service,
          prices: [
            ...existingPrices,
            {
              id: `${service.id}-${Date.now()}`,
              fromDate,
              toDate,
              unitPrice: nextValue,
              note: reason || 'Cập nhật báo giá',
              createdBy: currentUser,
            },
          ],
        };
      });
      return {
        ...supplier,
        services: applyToLines(supplier.services),
        mealServices: applyToLines(supplier.mealServices),
      };
    }));
    setQuotePopup(null);
    message.success('Đã cập nhật bảng giá nhà cung cấp');
  };

  const saveSupplierPriceRow = (priceDraft: SupplierPriceRow) => {
    if (!token || !activePriceSupplier || !activePriceService) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể cập nhật bảng giá nhà cung cấp.');
      return;
    }

    void (async () => {
      try {
        if (activeSupplierPrice) {
          await patchSupplierServicePrice(token, activePriceSupplier.id, activePriceService.id, activeSupplierPrice.id, priceDraft);
        } else {
          await addSupplierServicePrice(token, activePriceSupplier.id, activePriceService.id, priceDraft);
        }
        await initializeProtected();
        setSupplierPriceEditor(null);
        message.success('Đã cập nhật bảng giá nhà cung cấp');
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Không thể cập nhật bảng giá nhà cung cấp');
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main className="flex-1 p-10">
        <Breadcrumb
          className="mb-6 text-xs"
          items={[
            { title: <Link to="/coordinator/suppliers" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Đối tác (NCC)</Link> },
            { title: <span className="text-[var(--color-primary)]/30">Danh sách</span> },
          ]}
        />

        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-secondary">Danh mục đối tác</p>
              <h1 className="font-serif text-4xl text-primary">Nhà cung cấp</h1>
              <p className="mt-3 max-w-2xl text-primary/55">Quản lý hồ sơ nhà cung cấp dịch vụ và hướng dẫn viên theo từng nhóm nghiệp vụ.</p>
            </div>
            {role === 'coordinator' && (
              <button onClick={() => (activeTab === 'suppliers' ? openCreateSupplier() : openCreateGuide())} className="border border-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-white">
                {activeTab === 'suppliers' ? 'Thêm nhà cung cấp' : 'Thêm HDV'}
              </button>
            )}
          </div>

          <PageSearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo mã, tên, email, khu vực hoạt động..." />

          <div className="flex gap-3 border-b border-outline-variant/30">
            <button onClick={() => setActiveTab('suppliers')} className={`border-b-2 px-5 py-3 text-sm font-bold uppercase tracking-widest ${activeTab === 'suppliers' ? 'border-secondary text-primary' : 'border-transparent text-primary/45'}`}>Nhà cung cấp dịch vụ</button>
            <button onClick={() => setActiveTab('guides')} className={`border-b-2 px-5 py-3 text-sm font-bold uppercase tracking-widest ${activeTab === 'guides' ? 'border-secondary text-primary' : 'border-transparent text-primary/45'}`}>Hướng dẫn viên</button>
          </div>

          {activeTab === 'suppliers' ? (
            <div className="overflow-x-auto border border-outline-variant/30 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    {['Mã NCC', 'Tên nhà cung cấp', 'Phân loại', 'Dịch vụ chính', 'Khu vực hoạt động', 'Trạng thái', 'Thao tác'].map(header => (
                      <th key={header} className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSupplierRows.map(supplier => (
                    <tr key={supplier.id} className="border-t border-outline-variant/15">
                      <td className="px-5 py-4 font-mono text-xs">{supplier.id}</td>
                      <td className="px-5 py-4 font-medium text-primary">{supplier.name}</td>
                      <td className="px-5 py-4">{supplier.category}</td>
                      <td className="px-5 py-4">{supplier.service}</td>
                      <td className="px-5 py-4">{supplier.operatingArea}</td>
                      <td className="px-5 py-4"><span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${supplier.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{supplier.status}</span></td>
                      <td className="px-5 py-4"><button onClick={() => setDetailSupplierId(supplier.id)} className="text-xs font-bold uppercase tracking-widest text-secondary">Xem</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto border border-outline-variant/30 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    {['Mã HDV', 'Tên hướng dẫn viên', 'Số điện thoại', 'Email', 'Khu vực hoạt động', 'Ngoại ngữ', 'Thao tác'].map(header => (
                      <th key={header} className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGuideRows.map(guide => (
                    <tr key={guide.id} className="border-t border-outline-variant/15">
                      <td className="px-5 py-4 font-mono text-xs">{guide.id}</td>
                      <td className="px-5 py-4 font-medium text-primary">{guide.name}</td>
                      <td className="px-5 py-4">{guide.phone}</td>
                      <td className="px-5 py-4">{guide.email ?? '-'}</td>
                      <td className="px-5 py-4">{guide.operatingArea ?? '-'}</td>
                      <td className="px-5 py-4">{guide.languages.length > 0 ? guide.languages.join(', ') : '-'}</td>
                      <td className="px-5 py-4"><button onClick={() => setDetailGuideId(guide.id)} className="text-xs font-bold uppercase tracking-widest text-secondary">Xem</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {detailSupplier && (
        <Modal title={`Chi tiết ${detailSupplier.name}`} subtitle="Màn xem chi tiết chỉ có Sửa và Xóa." onClose={() => setDetailSupplierId(null)} wide>
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={() => openEditSupplier(detailSupplier)} className="border border-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary">Sửa</button>
              <button onClick={() => deleteSupplier(detailSupplier.id)} className="border border-rose-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-rose-700">Xóa</button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Mã NCC" value={detailSupplier.id} />
              <Field label="Phân loại" value={detailSupplier.category} />
              <Field label="Dịch vụ chính" value={detailSupplier.service} />
              <Field label="Khu vực hoạt động" value={detailSupplier.operatingArea} />
              <Field label="Số điện thoại" value={detailSupplier.phone} />
              <Field label="Email" value={detailSupplier.email} />
              <Field label="Địa chỉ" value={detailSupplier.address} />
              <Field label="Năm thành lập" value={detailSupplier.establishedYear} />
              <Field label="Trạng thái" value={detailSupplier.status} />
              {detailSupplier.category === 'Khách sạn' && <Field label="Hạng sao" value={(detailSupplier.standards ?? []).join(', ') || '-'} />}
            </div>
            <Field label="Mô tả" value={detailSupplier.description} />
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Danh sách dịch vụ</p>
              <SupplierServicesTable supplier={detailSupplier} />
            </div>
          </div>
        </Modal>
      )}

      {detailGuide && (
        <Modal title={`Chi tiết ${detailGuide.name}`} onClose={() => setDetailGuideId(null)}>
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={() => openEditGuide(detailGuide)} className="border border-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary">Sửa</button>
              <button onClick={() => deleteGuide(detailGuide.id)} className="border border-rose-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-rose-700">Xóa</button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Mã HDV" value={detailGuide.id} />
              <Field label="Điện thoại" value={detailGuide.phone} />
              <Field label="Email" value={detailGuide.email ?? '-'} />
              <Field label="Ngoại ngữ" value={detailGuide.languages.join(', ') || '-'} />
              <Field label="Khu vực hoạt động" value={detailGuide.operatingArea ?? '-'} />
              <Field label="Số thẻ HDV" value={detailGuide.guideCardNumber ?? '-'} />
            </div>
          </div>
        </Modal>
      )}

      {(supplierEditorId === 'new' || editingSupplier) && (
        <Modal title={supplierEditorId === 'new' ? 'Thêm nhà cung cấp' : `Sửa ${editingSupplier?.name}`} onClose={resetSupplierEditor} wide>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Phân loại</span>
                <select value={supplierForm.category} onChange={event => updateSupplierForm('category', event.target.value as SupplierCategory)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                  <option>Khách sạn</option>
                  <option>Nhà hàng</option>
                  <option>Vận chuyển</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Tên nhà cung cấp</span>
                <input value={supplierForm.name} onChange={event => updateSupplierForm('name', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
              </label>
              {!(supplierForm.category === 'Vận chuyển' && supplierForm.transportType === 'Máy bay') && (
                <label className="space-y-2 text-sm font-medium text-primary">
                  <span>Khu vực hoạt động</span>
                  {supplierForm.category === 'Khách sạn' || supplierForm.category === 'Nhà hàng' ? (
                    <select value={supplierForm.operatingArea} onChange={event => updateSupplierForm('operatingArea', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                      <option value="">Chọn tỉnh thành</option>
                      {provinceOptions.map(province => <option key={province}>{province}</option>)}
                    </select>
                  ) : (
                    <input value={supplierForm.operatingArea} onChange={event => updateSupplierForm('operatingArea', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                  )}
                  {errors.operatingArea && <p className="text-xs text-red-600">{errors.operatingArea}</p>}
                </label>
              )}
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Số điện thoại</span>
                <input value={supplierForm.phone} onChange={event => updateSupplierForm('phone', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Email</span>
                <input value={supplierForm.email} onChange={event => updateSupplierForm('email', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Năm thành lập</span>
                <input value={supplierForm.establishedYear} onChange={event => updateSupplierForm('establishedYear', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary md:col-span-2">
                <span>Địa chỉ</span>
                <input value={supplierForm.address} onChange={event => updateSupplierForm('address', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                {errors.address && <p className="text-xs text-red-600">{errors.address}</p>}
              </label>
              {supplierEditorId !== 'new' && (
                <label className="space-y-2 text-sm font-medium text-primary">
                  <span>Trạng thái</span>
                  <select value={supplierForm.status} onChange={event => updateSupplierForm('status', event.target.value as SupplierStatus)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                    <option>Hoạt động</option>
                    <option>Dừng hoạt động</option>
                  </select>
                </label>
              )}
            </div>

            {supplierForm.category === 'Khách sạn' && (
              <div className="space-y-3 rounded-sm border border-outline-variant/20 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Hạng sao khách sạn</p>
                <div className="flex flex-wrap gap-4">
                  {hotelStandardOptions.map(option => (
                    <label key={option} className="flex items-center gap-2 text-sm text-primary">
                      <input
                        type="checkbox"
                        checked={supplierForm.standards.includes(option)}
                        onChange={event => {
                          const nextStandards = event.target.checked
                            ? [...supplierForm.standards, option]
                            : supplierForm.standards.filter(item => item !== option);
                          updateSupplierForm('standards', nextStandards);
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {errors.standards && <p className="text-xs text-red-600">{errors.standards}</p>}
              </div>
            )}

            <label className="block space-y-2 text-sm font-medium text-primary">
              <span>Mô tả</span>
              <textarea value={supplierForm.description} onChange={event => updateSupplierForm('description', event.target.value)} className="min-h-24 w-full border border-outline-variant/50 px-4 py-3" />
            </label>

            {supplierForm.category === 'Vận chuyển' && (
              <label className="space-y-2 text-sm font-medium text-primary block">
                <span>Loại phương tiện</span>
                <select value={supplierForm.transportType} onChange={event => updateSupplierForm('transportType', event.target.value as TransportType)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                  <option>Xe</option>
                  <option>Máy bay</option>
                </select>
              </label>
            )}

            {supplierForm.category === 'Khách sạn' && (
              <label className="flex items-center gap-3 text-sm text-primary">
                <input type="checkbox" checked={supplierForm.includeMealService} onChange={event => updateSupplierForm('includeMealService', event.target.checked)} />
                Có dịch vụ ăn kèm
              </label>
            )}

            <SupplierServiceEditor form={supplierForm} errors={errors} onChange={updateDraftService} onAddLine={addDraftService} />
            {errors.services && <p className="text-xs text-red-600">{errors.services}</p>}

            {editingSupplier && editingSupplier.category !== 'Vận chuyển' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Bảng giá</p>
                  <button onClick={() => setQuotePopup({ supplierId: editingSupplier.id })} className="border border-secondary px-5 py-3 text-xs font-bold uppercase tracking-widest text-secondary">Thêm mới bảng giá</button>
                </div>
                <SupplierServicesTable
                  supplier={editingSupplier}
                  onEditPrice={(serviceId, priceId) => setSupplierPriceEditor({ supplierId: editingSupplier.id, serviceId, priceId })}
                />
              </div>
            )}

            <div className="flex gap-4 border-t border-outline-variant/20 pt-6">
              <button onClick={resetSupplierEditor} className="flex-1 border border-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Hủy</button>
              <button onClick={saveSupplier} className="flex-1 bg-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white">Lưu</button>
            </div>
          </div>
        </Modal>
      )}

      {(guideEditorId === 'new' || editingGuide) && (
        <Modal title={guideEditorId === 'new' ? 'Thêm hướng dẫn viên' : `Sửa ${editingGuide?.name}`} onClose={resetGuideEditor}>
          <div className="space-y-4">
            <input value={guideForm.name} onChange={event => updateGuideForm('name', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Họ và tên" />
            {errors.guideName && <p className="text-xs text-red-600">{errors.guideName}</p>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select value={guideForm.gender} onChange={event => updateGuideForm('gender', event.target.value as GuideFormState['gender'])} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
              <div>
                <input type="date" value={guideForm.dob} onChange={event => updateGuideForm('dob', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                {errors.guideDob && <p className="text-xs text-red-600">{errors.guideDob}</p>}
              </div>
            </div>
            <input value={guideForm.phone} onChange={event => updateGuideForm('phone', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Số điện thoại" />
            {errors.guidePhone && <p className="text-xs text-red-600">{errors.guidePhone}</p>}
            <input value={guideForm.email} onChange={event => updateGuideForm('email', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Email" />
            {errors.guideEmail && <p className="text-xs text-red-600">{errors.guideEmail}</p>}
            <input value={guideForm.address} onChange={event => updateGuideForm('address', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Địa chỉ" />
            {errors.guideAddress && <p className="text-xs text-red-600">{errors.guideAddress}</p>}
            <input value={guideForm.operatingArea} onChange={event => updateGuideForm('operatingArea', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Khu vực hoạt động" />
            {errors.guideOperatingArea && <p className="text-xs text-red-600">{errors.guideOperatingArea}</p>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <input value={guideForm.guideCardNumber} onChange={event => updateGuideForm('guideCardNumber', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Số thẻ HDV" />
                {errors.guideCardNumber && <p className="text-xs text-red-600">{errors.guideCardNumber}</p>}
              </div>
              <div>
                <input value={guideForm.issuePlace} onChange={event => updateGuideForm('issuePlace', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Nơi cấp" />
                {errors.guideIssuePlace && <p className="text-xs text-red-600">{errors.guideIssuePlace}</p>}
              </div>
              <div>
                <input type="date" value={guideForm.issueDate} onChange={event => updateGuideForm('issueDate', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                {errors.guideIssueDate && <p className="text-xs text-red-600">{errors.guideIssueDate}</p>}
              </div>
              <div>
                <input type="date" value={guideForm.expiryDate} onChange={event => updateGuideForm('expiryDate', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
                {errors.guideExpiryDate && <p className="text-xs text-red-600">{errors.guideExpiryDate}</p>}
              </div>
            </div>
            <div className="space-y-3 border border-outline-variant/30 px-4 py-3">
              <p className="text-sm font-medium text-primary">Ngoại ngữ</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {languageOptions.map(language => (
                  <label key={language} className="flex items-center gap-3 text-sm text-primary">
                    <input
                      type="checkbox"
                      checked={guideForm.languages.includes(language)}
                      onChange={event => {
                        if (event.target.checked) updateGuideForm('languages', [...guideForm.languages, language]);
                        else updateGuideForm('languages', guideForm.languages.filter(value => value !== language));
                      }}
                    />
                    {language}
                  </label>
                ))}
              </div>
              {errors.guideLanguages && <p className="text-xs text-red-600">{errors.guideLanguages}</p>}
            </div>
            <textarea value={guideForm.note} onChange={event => updateGuideForm('note', event.target.value)} className="min-h-24 w-full border border-outline-variant/50 px-4 py-3" placeholder="Ghi chú" />
            <div className="flex gap-4 border-t border-outline-variant/20 pt-6">
              <button onClick={resetGuideEditor} className="flex-1 border border-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Hủy</button>
              <button onClick={saveGuide} className="flex-1 bg-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white">Lưu</button>
            </div>
          </div>
        </Modal>
      )}

      {quotePopup && quoteSupplier && (
        <QuotePopupModal supplier={quoteSupplier} onClose={() => setQuotePopup(null)} onApply={applyQuoteChanges} />
      )}

      {supplierPriceEditor && activePriceService && (
        <SupplierPriceEditorModal
          service={activePriceService}
          price={activeSupplierPrice}
          onClose={() => setSupplierPriceEditor(null)}
          onSave={saveSupplierPriceRow}
        />
      )}
    </div>
  );
}

function QuotePopupModal({
  supplier,
  onClose,
  onApply,
}: {
  supplier: SupplierRow;
  onClose: () => void;
  onApply: (priceMap: Record<string, number>, reason: string, fromDate: string, toDate: string) => void;
}) {
  const [fromDate, setFromDate] = useState(todayKey());
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('Cập nhật báo giá');
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const today = todayKey();
  const fromDateError = !fromDate
    ? 'Cần nhập ngày hiệu lực'
    : fromDate < today
      ? 'Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại'
      : '';
  const toDateError = toDate && toDate < fromDate
    ? 'Ngày hết hiệu lực phải lớn hơn hoặc bằng ngày hiệu lực'
    : '';

  const rows = [
    ...supplier.services,
    ...supplier.mealServices,
  ];

  return (
    <Modal title={`Thêm báo giá - ${supplier.name}`} subtitle="Cập nhật đơn giá cho tất cả các dịch vụ của nhà cung cấp." onClose={onClose} wide>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              min={today}
              onChange={event => {
                const nextDate = event.target.value;
                setFromDate(nextDate);
                if (toDate && nextDate && nextDate > toDate) setToDate('');
              }}
              className="w-full border border-outline-variant/50 px-4 py-3"
            />
            {fromDateError && <p className="text-xs text-red-600">{fromDateError}</p>}
          </label>
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Đến ngày</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || today}
              disabled={Boolean(fromDateError)}
              onChange={event => setToDate(event.target.value)}
              className="w-full border border-outline-variant/50 px-4 py-3 disabled:bg-surface-container-low disabled:text-primary/35"
            />
            {toDateError && <p className="text-xs text-red-600">{toDateError}</p>}
          </label>
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Lý do</span>
            <input value={reason} onChange={event => setReason(event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
          </label>
        </div>

        <div className="overflow-x-auto border border-outline-variant/25">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                {['Tên dịch vụ', 'Đơn giá hiện tại', 'Đơn giá mới'].map(header => (
                  <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(service => {
                const currentPrices = getIntersectingSupplierPrices(service.prices, fromDate, toDate);
                return (
                  <tr key={service.id} className="border-t border-outline-variant/10">
                    <td className="px-4 py-3 font-medium">{service.name}</td>
                    <td className="px-4 py-3">
                      {currentPrices.length > 0 ? (
                        <div className="space-y-1">
                          {currentPrices.map(price => (
                            <p key={price.id}>{price.fromDate} - {price.toDate || 'Đang áp dụng'}: {formatCurrency(price.unitPrice)}</p>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={priceMap[service.id] ?? ''}
                        onChange={event => setPriceMap(previous => ({ ...previous, [service.id]: Number(event.target.value || 0) }))}
                        className="w-36 border border-outline-variant/50 px-3 py-2"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-6">
          <button onClick={onClose} className="border border-outline-variant/50 px-5 py-3 text-primary/70">Hủy bỏ</button>
          <button
            onClick={() => {
              if (fromDateError || toDateError) {
                message.error(fromDateError || toDateError);
                return;
              }
              onApply(priceMap, reason, fromDate, toDate);
            }}
            className="bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-white"
          >
            Lưu báo giá
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SupplierPriceEditorModal({
  service,
  price,
  onClose,
  onSave,
}: {
  service: SupplierServiceLine;
  price?: SupplierPriceRow;
  onClose: () => void;
  onSave: (price: SupplierPriceRow) => void;
}) {
  const currentUser = useAuthStore(state => state?.user?.name || 'Điều phối viên');
  const [fromDate, setFromDate] = useState(price?.fromDate ?? todayKey());
  const [toDate, setToDate] = useState(price?.toDate ?? '');
  const [unitPrice, setUnitPrice] = useState(String(price?.unitPrice ?? ''));
  const [note, setNote] = useState(price?.note ?? '');
  const today = todayKey();
  const fromDateError = !fromDate
    ? 'Cần nhập ngày hiệu lực'
    : fromDate < today
      ? 'Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại'
      : '';
  const toDateError = toDate && toDate < fromDate
    ? 'Ngày hết hiệu lực phải lớn hơn hoặc bằng ngày hiệu lực'
    : '';

  return (
    <Modal title={price ? 'Chỉnh sửa bảng giá' : 'Thêm mới bảng giá'} subtitle={service.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Từ ngày</span>
            <input
              type="date"
              value={fromDate}
              min={today}
              onChange={event => {
                const nextDate = event.target.value;
                setFromDate(nextDate);
                if (toDate && nextDate && nextDate > toDate) setToDate('');
              }}
              className="w-full border border-outline-variant/50 px-4 py-3"
            />
            {fromDateError && <p className="text-xs text-red-600">{fromDateError}</p>}
          </label>
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Đến ngày</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || today}
              disabled={Boolean(fromDateError)}
              onChange={event => setToDate(event.target.value)}
              className="w-full border border-outline-variant/50 px-4 py-3 disabled:bg-surface-container-low disabled:text-primary/35"
            />
            {toDateError && <p className="text-xs text-red-600">{toDateError}</p>}
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Đơn giá</span>
            <input type="number" value={unitPrice} onChange={event => setUnitPrice(event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Người tạo</span>
            <input value={currentUser} readOnly className="w-full border border-outline-variant/50 bg-surface-container-low px-4 py-3" />
          </label>
        </div>
        <label className="block space-y-2 text-sm font-medium text-primary">
          <span>Ghi chú</span>
          <input value={note} onChange={event => setNote(event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
        </label>
        <div className="flex gap-4 border-t border-outline-variant/20 pt-6">
          <button onClick={onClose} className="flex-1 border border-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Hủy</button>
          <button
            onClick={() => {
              if (!unitPrice.trim() || Number(unitPrice) <= 0) {
                message.error('Đơn giá phải lớn hơn 0');
                return;
              }
              if (fromDateError || toDateError) {
                message.error(fromDateError || toDateError);
                return;
              }
              onSave({
                id: price?.id ?? '',
                fromDate,
                toDate,
                unitPrice: Number(unitPrice),
                note: note || 'Bảng giá cập nhật',
                createdBy: currentUser,
              });
            }}
            className="flex-1 bg-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white"
          >
            Lưu bảng giá
          </button>
        </div>
      </div>
    </Modal>
  );
}
