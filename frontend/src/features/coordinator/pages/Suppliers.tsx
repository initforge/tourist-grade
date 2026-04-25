import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@shared/store/useAuthStore';

type SupplierCategory = 'Khách sạn' | 'Nhà hàng' | 'Vận chuyển' | 'Vé tham quan' | 'Các dịch vụ khác';
type SupplierStatus = 'Hoạt động' | 'Dừng hoạt động';
type TransportType = 'Xe' | 'Máy bay';
type LanguageOption = 'Tiếng Anh' | 'Tiếng Trung' | 'Tiếng Nhật' | 'Tiếng Hàn';

interface SupplierPrice {
  id: string;
  fromDate: string;
  toDate: string;
  unitPrice: number;
  note: string;
  createdBy: string;
}

interface SupplierServiceLine {
  id: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  capacity?: number;
  transportType?: TransportType;
  priceMode?: 'Báo giá' | 'Niêm yết';
  menu?: string;
  note?: string;
  prices: SupplierPrice[];
}

interface SupplierRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: SupplierCategory;
  service: string;
  operatingArea: string;
  status: SupplierStatus;
  address: string;
  establishedYear: string;
  description: string;
  services: SupplierServiceLine[];
  mealServices: SupplierServiceLine[];
}

interface GuideRow {
  id: string;
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

interface SupplierFormState {
  category: 'Khách sạn' | 'Nhà hàng' | 'Vận chuyển';
  name: string;
  phone: string;
  email: string;
  address: string;
  establishedYear: string;
  description: string;
  operatingArea: string;
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
  kind: 'add' | 'edit';
  serviceId?: string;
  mealService?: boolean;
};

const languageOptions: LanguageOption[] = ['Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn'];

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

const createPrice = (id: string, unitPrice: number, note = 'Không có'): SupplierPrice => ({
  id,
  fromDate: '2026-01-01',
  toDate: '2026-12-31',
  unitPrice,
  note,
  createdBy: 'Tên điều phối',
});

function createServiceDraft(category: SupplierFormState['category'], transportType: TransportType, index: number, kind: 'main' | 'meal' = 'main'): SupplierServiceLine {
  if (category === 'Vận chuyển') {
    return {
      id: `draft-transport-${index}`,
      transportType,
      name: transportType === 'Xe' ? 'Xe 16 chỗ' : 'Vé máy bay đoàn',
      description: transportType === 'Xe' ? 'Đồng hành suốt hành trình' : 'Dịch vụ vận chuyển theo lượt',
      unit: transportType === 'Xe' ? 'Xe' : 'Khách',
      quantity: 1,
      capacity: transportType === 'Xe' ? 16 : undefined,
      priceMode: 'Báo giá',
      prices: [createPrice(`draft-price-${index}`, transportType === 'Xe' ? 8100000 : 320000)],
    };
  }

  if (category === 'Khách sạn' && kind === 'meal') {
    return {
      id: `draft-hotel-meal-${index}`,
      name: 'Bữa sáng buffet',
      description: '',
      unit: 'Bữa',
      quantity: 1,
      menu: 'Buffet sáng 20 món',
      note: 'Phục vụ tại nhà hàng khách sạn',
      prices: [createPrice(`draft-price-${index}`, 180000)],
    };
  }

  if (category === 'Nhà hàng') {
    return {
      id: `draft-restaurant-${index}`,
      name: `Set menu ${index + 1}`,
      description: 'Phục vụ theo đoàn',
      unit: 'Bàn',
      quantity: 1,
      menu: '6 món + 1 tráng miệng',
      note: 'Không cay',
      prices: [createPrice(`draft-price-${index}`, 1800000)],
    };
  }

  return {
    id: `draft-hotel-${index}`,
    name: `Phòng ${index + 1}`,
    description: 'Phòng tiêu chuẩn hướng phố',
    unit: 'Phòng',
    quantity: 1,
    prices: [createPrice(`draft-price-${index}`, 1300000)],
  };
}

const createInitialSupplierForm = (): SupplierFormState => ({
  category: 'Khách sạn',
  name: '',
  phone: '',
  email: '',
  address: '',
  establishedYear: '',
  description: '',
  operatingArea: '',
  status: 'Hoạt động',
  service: 'Lưu trú',
  transportType: 'Xe',
  includeMealService: false,
  services: [createServiceDraft('Khách sạn', 'Xe', 0)],
  mealServices: [],
});

const createInitialGuideForm = (): GuideFormState => ({
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
});

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
    address: '12 Bãi Chảy, Hạ Long',
    establishedYear: '2016',
    description: 'Khách sạn 4 sao phục vụ khách đoàn, có nhà hàng nội khu.',
    services: [
      { id: 'SUP001-S1', name: 'Phòng đôi', description: 'Phòng tiêu chuẩn hướng phố', unit: 'Phòng', quantity: 1, prices: [createPrice('P1', 1300000)] },
      { id: 'SUP001-S2', name: 'Phòng đơn', description: 'Phòng tiêu chuẩn giường lớn', unit: 'Phòng', quantity: 1, prices: [createPrice('P2', 1200000)] },
    ],
    mealServices: [
      { id: 'SUP001-M1', name: 'Buffet sáng', description: '', unit: 'Bữa', quantity: 1, menu: 'Buffet 20 món + nước ép', note: 'Phục vụ từ 06:00-09:30', prices: [createPrice('P1M', 180000)] },
    ],
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
    description: 'Nhà xe chuyên tour ghép và tour riêng, có đội xe 16-45 chỗ.',
    services: [
      { id: 'SUP002-S1', transportType: 'Xe', name: 'Xe 16 chỗ', description: 'Đồng hành suốt hành trình', unit: 'Xe', quantity: 1, capacity: 16, priceMode: 'Báo giá', prices: [createPrice('P2', 8100000)] },
      { id: 'SUP002-S2', transportType: 'Xe', name: 'Xe 25 chỗ', description: 'Phương án dự phòng', unit: 'Xe', quantity: 1, capacity: 25, priceMode: 'Báo giá', prices: [createPrice('P3', 9600000), createPrice('P4', 10200000, 'Mùa cao điểm')] },
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
    description: 'Nhà hàng chuyên set menu cho khách du lịch đoàn 10-60 khách.',
    services: [
      { id: 'SUP004-S1', name: 'Set menu đoàn', description: 'Phục vụ bàn tròn 10 người', unit: 'Bàn', quantity: 1, menu: '6 món + canh + tráng miệng', note: 'Có menu chay theo yêu cầu', prices: [createPrice('P9', 1800000)] },
    ],
    mealServices: [],
  },
];

const initialGuides: GuideRow[] = [
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
  },
];

function createSupplierSummary(category: SupplierFormState['category']) {
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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        className={`relative max-h-[92vh] overflow-y-auto bg-white shadow-2xl ${wide ? 'w-full max-w-6xl' : 'w-full max-w-3xl'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-8 py-6">
          <div>
            <h2 id="detail-title" className="font-serif text-3xl text-primary">{title}</h2>
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

function ServicePriceTable({
  rows,
  showEditAction = false,
  onEdit,
}: {
  rows: SupplierPrice[];
  showEditAction?: boolean;
  onEdit?: (priceId: string) => void;
}) {
  return (
    <div className="overflow-x-auto border border-outline-variant/20">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-container-low">
          <tr>
            {['Từ ngày', 'Đến ngày', 'Đơn giá', 'Ghi chú', 'Người tạo', ...(showEditAction ? ['Thao tác'] : [])].map(header => (
              <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(price => (
            <tr key={price.id} className="border-t border-outline-variant/10">
              <td className="px-4 py-3">{price.fromDate}</td>
              <td className="px-4 py-3">{price.toDate}</td>
              <td className="px-4 py-3">{formatCurrency(price.unitPrice)}</td>
              <td className="px-4 py-3">{price.note}</td>
              <td className="px-4 py-3">{price.createdBy}</td>
              {showEditAction && (
                <td className="px-4 py-3">
                  <button onClick={() => onEdit?.(price.id)} className="text-xs font-bold uppercase tracking-widest text-secondary">
                    Chỉnh sửa
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SupplierServicesReadOnly({ supplier }: { supplier: SupplierRow }) {
  const renderBlock = (title: string, services: SupplierServiceLine[], hotelMeal = false) => (
    <div className="space-y-3 border border-outline-variant/20 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-primary/60">{title}</p>
        <span className="text-xs text-primary/40">{services.length} dịch vụ</span>
      </div>
      <div className="overflow-x-auto border border-outline-variant/20">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              {(supplier.category === 'Vận chuyển'
                ? ['Loại phương tiện', 'Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Hình thức giá']
                : supplier.category === 'Nhà hàng' || hotelMeal
                  ? ['Tên dịch vụ', 'Mô tả', 'Menu', 'Ghi chú']
                  : ['Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Số lượng']
              ).map(header => (
                <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} className="border-t border-outline-variant/10 align-top">
                {supplier.category === 'Vận chuyển' ? (
                  <>
                    <td className="px-4 py-3">{service.transportType}</td>
                    <td className="px-4 py-3 font-medium text-primary">{service.name}</td>
                    <td className="px-4 py-3">{service.description}</td>
                    <td className="px-4 py-3">{service.unit}</td>
                    <td className="px-4 py-3">{service.priceMode}</td>
                  </>
                ) : supplier.category === 'Nhà hàng' || hotelMeal ? (
                  <>
                    <td className="px-4 py-3 font-medium text-primary">{service.name}</td>
                    <td className="px-4 py-3">{service.description}</td>
                    <td className="px-4 py-3">{service.menu || '-'}</td>
                    <td className="px-4 py-3">{service.note || '-'}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-primary">{service.name}</td>
                    <td className="px-4 py-3">{service.description}</td>
                    <td className="px-4 py-3">{service.unit}</td>
                    <td className="px-4 py-3">{service.quantity}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {services.map(service => (
        <div key={`${service.id}-prices`} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-primary/40">Bảng giá - {service.name}</p>
          <ServicePriceTable rows={service.prices} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {renderBlock(supplier.category === 'Khách sạn' ? 'Dịch vụ lưu trú' : 'Dịch vụ chính', supplier.services)}
      {supplier.category === 'Khách sạn' && supplier.mealServices.length > 0 && renderBlock('Dịch vụ ăn kèm', supplier.mealServices, true)}
    </div>
  );
}

export default function AdminSuppliers() {
  const role = useAuthStore(state => state?.user?.role || 'guest');
  const [activeTab, setActiveTab] = useState<'suppliers' | 'guides'>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierRows, setSupplierRows] = useState<SupplierRow[]>(initialSuppliers);
  const [guideRows, setGuideRows] = useState<GuideRow[]>(initialGuides);
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [detailGuideId, setDetailGuideId] = useState<string | null>(null);
  const [supplierEditorId, setSupplierEditorId] = useState<string | 'new' | null>(null);
  const [guideEditorId, setGuideEditorId] = useState<string | 'new' | null>(null);
  const [quotePopup, setQuotePopup] = useState<QuotePopupState | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(createInitialSupplierForm());
  const [guideForm, setGuideForm] = useState<GuideFormState>(createInitialGuideForm());
  const filteredSupplierRows = useMemo(() => {
    const keyword = searchQuery?.trim()?.toLowerCase();
    if (!keyword) return supplierRows;
    return supplierRows?.filter((supplier) =>
      [
        supplier?.id,
        supplier?.name,
        supplier?.phone,
        supplier?.email,
        supplier?.category,
        supplier?.service,
        supplier?.operatingArea,
        supplier?.status,
      ]?.join(' ')?.toLowerCase()?.includes(keyword),
    );
  }, [searchQuery, supplierRows]);
  const filteredGuideRows = useMemo(() => {
    const keyword = searchQuery?.trim()?.toLowerCase();
    if (!keyword) return guideRows;
    return guideRows?.filter((guide) =>
      [
        guide?.id,
        guide?.name,
        guide?.gender,
        guide?.phone,
        guide?.email,
        guide?.operatingArea,
      ]?.join(' ')?.toLowerCase()?.includes(keyword),
    );
  }, [guideRows, searchQuery]);

  const detailSupplier = useMemo(
    () => supplierRows.find(supplier => supplier.id === detailSupplierId) ?? null,
    [detailSupplierId, supplierRows],
  );
  const editingSupplier = useMemo(
    () => supplierRows.find(supplier => supplier.id === supplierEditorId) ?? null,
    [supplierEditorId, supplierRows],
  );
  const detailGuide = useMemo(
    () => guideRows.find(guide => guide.id === detailGuideId) ?? null,
    [detailGuideId, guideRows],
  );
  const editingGuide = useMemo(
    () => guideRows.find(guide => guide.id === guideEditorId) ?? null,
    [guideEditorId, guideRows],
  );
  const quoteSupplier = useMemo(
    () => supplierRows.find(supplier => supplier.id === quotePopup?.supplierId) ?? null,
    [quotePopup, supplierRows],
  );

  const updateSupplierForm = <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) => {
    setSupplierForm(previous => {
      if (key !== 'category') {
        if (key === 'transportType') {
          const nextTransportType = value as TransportType;
          return {
            ...previous,
            transportType: nextTransportType,
            services: nextTransportType === 'Máy bay'
              ? []
              : previous.services.length > 0
                ? previous.services.map((service, index) => ({
                    ...service,
                    transportType: 'Xe',
                    name: service.name || `Xe ${16 + index * 9} chỗ`,
                    capacity: service.capacity ?? 16 + index * 9,
                    unit: 'Xe',
                    priceMode: 'Báo giá',
                  }))
                : [createServiceDraft(previous.category, 'Xe', 0)],
          };
        }
        return { ...previous, [key]: value };
      }

      const nextCategory = value as SupplierFormState['category'];
      const nextBase = createInitialSupplierForm();
      return {
        ...nextBase,
        category: nextCategory,
        service: createSupplierSummary(nextCategory),
        services: nextCategory === 'Vận chuyển' && nextBase.transportType === 'Máy bay'
          ? []
          : [createServiceDraft(nextCategory, nextBase.transportType, 0)],
        mealServices: [],
      };
    });
  };

  const updateGuideForm = <K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) => {
    setGuideForm(previous => ({ ...previous, [key]: value }));
  };

  const updateDraftService = (serviceId: string, changes: Partial<SupplierServiceLine>, kind: 'main' | 'meal' = 'main') => {
    setSupplierForm(previous => ({
      ...previous,
      [kind === 'main' ? 'services' : 'mealServices']: previous[kind === 'main' ? 'services' : 'mealServices'].map(service => (
        service.id === serviceId ? { ...service, ...changes } : service
      )),
    }));
  };

  const addDraftService = (kind: 'main' | 'meal' = 'main') => {
    setSupplierForm(previous => {
      if (previous.category === 'Vận chuyển' && previous.transportType === 'Máy bay' && kind === 'main') {
        return previous;
      }
      const targetKey = kind === 'main' ? 'services' : 'mealServices';
      const nextIndex = previous[targetKey].length;
      const nextService = createServiceDraft(previous.category, previous.transportType, nextIndex, kind);
      return { ...previous, [targetKey]: [...previous[targetKey], nextService] };
    });
  };

  const resetSupplierEditor = () => {
    setSupplierEditorId(null);
    setSupplierForm(createInitialSupplierForm());
    setQuotePopup(null);
  };

  const resetGuideEditor = () => {
    setGuideEditorId(null);
    setGuideForm(createInitialGuideForm());
  };

  const openCreateSupplier = () => {
    setSupplierForm(createInitialSupplierForm());
    setSupplierEditorId('new');
  };

  const openEditSupplier = (supplier: SupplierRow) => {
    setSupplierForm({
      category: supplier.category === 'Khách sạn' || supplier.category === 'Nhà hàng' || supplier.category === 'Vận chuyển' ? supplier.category : 'Vận chuyển',
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      establishedYear: supplier.establishedYear,
      description: supplier.description,
      operatingArea: supplier.operatingArea,
      status: supplier.status,
      service: supplier.service,
      transportType: supplier.category === 'Vận chuyển' && supplier.services.length === 0 ? 'Máy bay' : supplier.services[0]?.transportType ?? 'Xe',
      includeMealService: supplier.mealServices.length > 0,
      services: supplier.services.map(service => ({ ...service, prices: service.prices.map(price => ({ ...price })) })),
      mealServices: supplier.mealServices.map(service => ({ ...service, prices: service.prices.map(price => ({ ...price })) })),
    });
    setSupplierEditorId(supplier.id);
    setDetailSupplierId(null);
  };

  const saveSupplier = () => {
    if (supplierEditorId === 'new') {
      const maxSupplierIndex = Math.max(0, ...supplierRows.map(supplier => Number(supplier.id.replace(/\D/g, '')) || 0));
      const nextId = `SUP${String(maxSupplierIndex + 1).padStart(3, '0')}`;
      const nextSupplier: SupplierRow = {
        id: nextId,
        name: supplierForm.name || `Nhà cung cấp ${nextId}`,
        phone: supplierForm.phone || 'Chưa cập nhật',
        email: supplierForm.email || 'Chưa cập nhật',
        category: supplierForm.category,
        service: supplierForm.service || createSupplierSummary(supplierForm.category),
        operatingArea: supplierForm.operatingArea || '-',
        status: supplierForm.status,
        address: supplierForm.address || 'Chưa cập nhật',
        establishedYear: supplierForm.establishedYear || 'N/A',
        description: supplierForm.description || 'Chưa có mô tả.',
        services: supplierForm.services,
        mealServices: supplierForm.includeMealService ? supplierForm.mealServices : [],
      };
      setSupplierRows(previous => [nextSupplier, ...previous]);
      setDetailSupplierId(nextId);
      resetSupplierEditor();
      return;
    }

    if (!editingSupplier) return;

    setSupplierRows(previous => previous.map(supplier => (
      supplier.id === editingSupplier.id
        ? {
          ...supplier,
          name: supplierForm.name,
          phone: supplierForm.phone,
          email: supplierForm.email,
          address: supplierForm.address,
          establishedYear: supplierForm.establishedYear,
          description: supplierForm.description,
          operatingArea: supplierForm.operatingArea,
          status: supplierForm.status,
          service: supplierForm.service,
          category: supplierForm.category,
          services: supplierForm.services,
          mealServices: supplierForm.includeMealService ? supplierForm.mealServices : [],
        }
        : supplier
    )));
    setDetailSupplierId(editingSupplier.id);
    resetSupplierEditor();
  };

  const deleteSupplier = (supplierId: string) => {
    setSupplierRows(previous => previous.filter(supplier => supplier.id !== supplierId));
    setDetailSupplierId(null);
    if (supplierEditorId === supplierId) resetSupplierEditor();
  };

  const openCreateGuide = () => {
    setGuideForm(createInitialGuideForm());
    setGuideEditorId('new');
  };

  const openEditGuide = (guide: GuideRow) => {
    setGuideForm({
      name: guide.name,
      gender: guide.gender,
      dob: guide.dob,
      phone: guide.phone,
      email: guide.email,
      address: guide.address,
      operatingArea: guide.operatingArea,
      guideCardNumber: guide.guideCardNumber,
      issueDate: guide.issueDate,
      expiryDate: guide.expiryDate,
      issuePlace: guide.issuePlace,
      note: guide.note,
      languages: [...guide.languages],
    });
    setGuideEditorId(guide.id);
    setDetailGuideId(null);
  };

  const saveGuide = () => {
    if (guideEditorId === 'new') {
      const maxGuideIndex = Math.max(0, ...guideRows.map(guide => Number(guide.id.replace(/\D/g, '')) || 0));
      const nextId = `HDV${String(maxGuideIndex + 1).padStart(3, '0')}`;
      const nextGuide: GuideRow = {
        id: nextId,
        name: guideForm.name || `Hướng dẫn viên ${nextId}`,
        gender: guideForm.gender,
        dob: guideForm.dob || '1990-01-01',
        phone: guideForm.phone || 'Chưa cập nhật',
        email: guideForm.email || 'Chưa cập nhật',
        address: guideForm.address || 'Chưa cập nhật',
        operatingArea: guideForm.operatingArea || 'Chưa cập nhật',
        guideCardNumber: guideForm.guideCardNumber || 'Chưa cập nhật',
        issueDate: guideForm.issueDate || '2026-01-01',
        expiryDate: guideForm.expiryDate || '2031-01-01',
        issuePlace: guideForm.issuePlace || 'Chưa cập nhật',
        note: guideForm.note,
        languages: guideForm.languages,
      };
      setGuideRows(previous => [nextGuide, ...previous]);
      setDetailGuideId(nextId);
      resetGuideEditor();
      return;
    }

    if (!editingGuide) return;

    setGuideRows(previous => previous.map(guide => (
      guide.id === editingGuide.id
        ? {
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
        }
        : guide
    )));
    setDetailGuideId(editingGuide.id);
    resetGuideEditor();
  };

  const deleteGuide = (guideId: string) => {
    setGuideRows(previous => previous.filter(guide => guide.id !== guideId));
    setDetailGuideId(null);
    if (guideEditorId === guideId) resetGuideEditor();
  };

  const applyQuoteChanges = (priceMap: Record<string, number>, reason: string, fromDate: string, toDate: string) => {
    if (!quoteSupplier) return;
    setSupplierRows(previous => previous.map(supplier => {
      if (supplier.id !== quoteSupplier.id) return supplier;

      const applyToLines = (lines: SupplierServiceLine[], mealService = false) => lines.map(service => {
        const key = `${mealService ? 'meal' : 'main'}:${service.id}`;
        const nextValue = priceMap[key];
        if (!nextValue) return service;
        return {
          ...service,
          prices: [
            ...service.prices,
            {
              id: `${service.id}-${Date.now()}`,
              fromDate,
              toDate,
              unitPrice: nextValue,
              note: reason || 'Cập nhật báo giá',
              createdBy: 'Tên điều phối',
            },
          ],
        };
      });

      return {
        ...supplier,
        services: applyToLines(supplier.services),
        mealServices: applyToLines(supplier.mealServices, true),
      };
    }));
    setQuotePopup(null);
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
              <p className="mt-3 max-w-2xl text-primary/55">
                Quản lý hồ sơ nhà cung cấp dịch vụ và hướng dẫn viên theo từng nhóm nghiệp vụ.
              </p>
            </div>
            {role === 'coordinator' && (
              <button
                onClick={() => (activeTab === 'suppliers' ? openCreateSupplier() : openCreateGuide())}
                className="border border-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-white"
              >
                {activeTab === 'suppliers' ? 'Thêm nhà cung cấp' : 'Thêm HDV'}
              </button>
            )}
          </div>

          <div className="flex gap-3 border-b border-outline-variant/30">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`border-b-2 px-5 py-3 text-sm font-bold uppercase tracking-widest ${activeTab === 'suppliers' ? 'border-secondary text-primary' : 'border-transparent text-primary/45'}`}
            >
              Nhà cung cấp dịch vụ
            </button>
            <button
              onClick={() => setActiveTab('guides')}
              className={`border-b-2 px-5 py-3 text-sm font-bold uppercase tracking-widest ${activeTab === 'guides' ? 'border-secondary text-primary' : 'border-transparent text-primary/45'}`}
            >
              Hướng dẫn viên
            </button>
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
                  {supplierRows.map(supplier => (
                    <tr key={supplier.id} className="border-t border-outline-variant/15">
                      <td className="px-5 py-4 font-mono text-xs">{supplier.id}</td>
                      <td className="px-5 py-4 font-medium text-primary">{supplier.name}</td>
                      <td className="px-5 py-4">{supplier.category}</td>
                      <td className="px-5 py-4">{supplier.service}</td>
                      <td className="px-5 py-4">{supplier.operatingArea}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${supplier.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => setDetailSupplierId(supplier.id)} className="text-xs font-bold uppercase tracking-widest text-secondary">
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                  {supplierRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-14 text-center text-sm text-primary/40">
                        Chưa có nhà cung cấp nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto border border-outline-variant/30 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    {['Mã HDV', 'Tên hướng dẫn viên', 'Giới tính', 'Ngày sinh', 'Số điện thoại', 'Email', 'Khu vực hoạt động', 'Ngoại ngữ', 'Thao tác'].map(header => (
                      <th key={header} className="px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guideRows.map(guide => (
                    <tr key={guide.id} className="border-t border-outline-variant/15">
                      <td className="px-5 py-4 font-mono text-xs">{guide.id}</td>
                      <td className="px-5 py-4 font-medium text-primary">{guide.name}</td>
                      <td className="px-5 py-4">{guide.gender}</td>
                      <td className="px-5 py-4">{guide.dob}</td>
                      <td className="px-5 py-4">{guide.phone}</td>
                      <td className="px-5 py-4">{guide.email}</td>
                      <td className="px-5 py-4">{guide.operatingArea}</td>
                      <td className="px-5 py-4">{guide.languages.length > 0 ? guide.languages.join(', ') : '-'}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => setDetailGuideId(guide.id)} className="text-xs font-bold uppercase tracking-widest text-secondary">
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                  {guideRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-14 text-center text-sm text-primary/40">
                        Chưa có hướng dẫn viên nào
                      </td>
                    </tr>
                  )}
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
              <button onClick={() => openEditSupplier(detailSupplier)} className="border border-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary">
                Sửa
              </button>
              <button onClick={() => deleteSupplier(detailSupplier.id)} className="border border-rose-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-rose-700">
                Xóa
              </button>
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
            </div>
            <Field label="Mô tả" value={detailSupplier.description} />
            <SupplierServicesReadOnly supplier={detailSupplier} />
          </div>
        </Modal>
      )}

      {supplierEditorId && (
        <Modal
          title={supplierEditorId === 'new' ? 'Thêm nhà cung cấp' : `Sửa nhà cung cấp - ${editingSupplier?.name ?? ''}`}
          subtitle={supplierEditorId === 'new' ? 'Thêm mới chỉ khai báo bảng dịch vụ. Bảng giá sẽ được bổ sung ở bước chỉnh sửa.' : 'Bảng giá của khách sạn và nhà hàng được thêm ở ngoài bảng dịch vụ; phần mở rộng chỉ dùng để xem chi tiết bảng giá.'}
          onClose={resetSupplierEditor}
          wide
        >
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Phân loại</span>
                <select value={supplierForm.category} onChange={event => updateSupplierForm('category', event.target.value as SupplierFormState['category'])} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" aria-label="Phân loại">
                  <option>Khách sạn</option>
                  <option>Nhà hàng</option>
                  <option>Vận chuyển</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Dịch vụ chính</span>
                <input value={supplierForm.service} onChange={event => updateSupplierForm('service', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Tên nhà cung cấp</span>
                <input value={supplierForm.name} onChange={event => updateSupplierForm('name', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" aria-label="Tên nhà cung cấp" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Khu vực hoạt động</span>
                <input value={supplierForm.operatingArea} onChange={event => updateSupplierForm('operatingArea', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" aria-label="Khu vực hoạt động" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Số điện thoại</span>
                <input value={supplierForm.phone} onChange={event => updateSupplierForm('phone', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" aria-label="Số điện thoại" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Email</span>
                <input value={supplierForm.email} onChange={event => updateSupplierForm('email', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" aria-label="Email" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Năm thành lập</span>
                <input value={supplierForm.establishedYear} onChange={event => updateSupplierForm('establishedYear', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" aria-label="Năm thành lập" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Trạng thái</span>
                <select value={supplierForm.status} onChange={event => updateSupplierForm('status', event.target.value as SupplierStatus)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                  <option>Hoạt động</option>
                  <option>Dừng hoạt động</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-primary md:col-span-2">
                <span>Địa chỉ</span>
                <input value={supplierForm.address} onChange={event => updateSupplierForm('address', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" aria-label="Địa chỉ" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary md:col-span-2">
                <span>Mô tả</span>
                <textarea value={supplierForm.description} onChange={event => updateSupplierForm('description', event.target.value)} className="min-h-24 w-full border border-outline-variant/50 px-4 py-3" aria-label="Mô tả" />
              </label>
            </div>

            {supplierForm.category === 'Vận chuyển' && (
              <label className="block space-y-2 text-sm font-medium text-primary">
                <span>Loại phương tiện</span>
                <select value={supplierForm.transportType} onChange={event => updateSupplierForm('transportType', event.target.value as TransportType)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" aria-label="Loại phương tiện">
                  <option>Xe</option>
                  <option>Máy bay</option>
                </select>
              </label>
            )}

            {supplierForm.category === 'Khách sạn' && (
              <label className="flex items-center gap-3 text-sm font-medium text-primary">
                <input
                  type="checkbox"
                  checked={supplierForm.includeMealService}
                  onChange={event => {
                    const checked = event.target.checked;
                    updateSupplierForm('includeMealService', checked);
                    if (checked && supplierForm.mealServices.length === 0) addDraftService('meal');
                  }}
                />
                Có kèm dịch vụ ăn
              </label>
            )}

            <SupplierEditorSections
              mode={supplierEditorId === 'new' ? 'create' : 'edit'}
              supplierForm={supplierForm}
              addDraftService={addDraftService}
              updateDraftService={updateDraftService}
              onAddPrice={(serviceId, mealService) => {
                const supplierId = String(supplierEditorId);
                setQuotePopup({ supplierId, kind: serviceId ? 'edit' : 'add', serviceId, mealService });
              }}
            />

            <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-6">
              <button onClick={resetSupplierEditor} className="border border-outline-variant/50 px-5 py-3 text-primary/70">Hủy bỏ</button>
              <button onClick={saveSupplier} className="bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-white">Lưu nhà cung cấp</button>
            </div>
          </div>
        </Modal>
      )}

      {detailGuide && (
        <Modal title={`Chi tiết ${detailGuide.name}`} subtitle="Thông tin chuyên môn có thêm Ngoại ngữ." onClose={() => setDetailGuideId(null)}>
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={() => openEditGuide(detailGuide)} className="border border-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary">
                Sửa
              </button>
              <button onClick={() => deleteGuide(detailGuide.id)} className="border border-rose-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-rose-700">
                Xóa
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Mã HDV" value={detailGuide.id} />
              <Field label="Giới tính" value={detailGuide.gender} />
              <Field label="Ngày sinh" value={detailGuide.dob} />
              <Field label="Số điện thoại" value={detailGuide.phone} />
              <Field label="Email" value={detailGuide.email} />
              <Field label="Địa chỉ" value={detailGuide.address} />
              <Field label="Khu vực hoạt động" value={detailGuide.operatingArea} />
              <Field label="Số thẻ hướng dẫn viên" value={detailGuide.guideCardNumber} />
              <Field label="Ngày cấp" value={detailGuide.issueDate} />
              <Field label="Ngày hết hạn" value={detailGuide.expiryDate} />
              <Field label="Nơi cấp" value={detailGuide.issuePlace} />
              <Field label="Ngoại ngữ" value={detailGuide.languages.length > 0 ? detailGuide.languages.join(', ') : '-'} />
            </div>
            <Field label="Ghi chú" value={detailGuide.note || '-'} />
          </div>
        </Modal>
      )}

      {guideEditorId && (
        <GuideEditorModal
          guideForm={guideForm}
          onChange={updateGuideForm}
          onClose={resetGuideEditor}
          onSave={saveGuide}
          title={guideEditorId === 'new' ? 'Thêm hướng dẫn viên' : `Sửa hướng dẫn viên - ${editingGuide?.name ?? ''}`}
        />
      )}

      {quotePopup && (
        <QuotePopupModal
          quotePopup={quotePopup}
          supplier={quoteSupplier}
          onClose={() => setQuotePopup(null)}
          onApply={applyQuoteChanges}
        />
      )}
    </div>
  );
}

function SupplierEditorSections({
  mode,
  supplierForm,
  addDraftService,
  updateDraftService,
  onAddPrice,
}: {
  mode: 'create' | 'edit';
  supplierForm: SupplierFormState;
  addDraftService: (kind?: 'main' | 'meal') => void;
  updateDraftService: (serviceId: string, changes: Partial<SupplierServiceLine>, kind?: 'main' | 'meal') => void;
  onAddPrice: (serviceId?: string, mealService?: boolean) => void;
}) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const showExternalAddPrice = mode === 'edit' && supplierForm.category !== 'Vận chuyển';

  const updateLatestPrice = (service: SupplierServiceLine, value: number, kind: 'main' | 'meal') => {
    const prices = service.prices.length > 0
      ? service.prices.map((price, index) => index === service.prices.length - 1 ? { ...price, unitPrice: value } : price)
      : [createPrice(`${service.id}-draft`, value)];
    updateDraftService(service.id, { prices }, kind);
  };

  const renderHeader = (title: string, kind: 'main' | 'meal') => (
    <div className="flex items-center justify-between">
      <h3 className="font-serif text-xl text-primary">{title}</h3>
      <div className="flex flex-wrap justify-end gap-3">
        {showExternalAddPrice && kind === 'main' && (
          <button onClick={() => onAddPrice()} className="border border-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary">
            Thêm bảng giá
          </button>
        )}
        {!(supplierForm.category === 'Vận chuyển' && supplierForm.transportType === 'Máy bay' && kind === 'main') && (
          <button onClick={() => addDraftService(kind)} className="border border-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary">
            Thêm dịch vụ
          </button>
        )}
      </div>
    </div>
  );

  const renderCreateTable = (title: string, services: SupplierServiceLine[], kind: 'main' | 'meal' = 'main') => (
    <div className="space-y-4 border border-outline-variant/20 p-4">
      {renderHeader(title, kind)}
      {supplierForm.category === 'Vận chuyển' && supplierForm.transportType === 'Máy bay' && kind === 'main' ? (
        <div className="border border-dashed border-outline-variant/40 p-5 text-sm text-primary/50">
          Loại vận chuyển máy bay không có bảng dịch vụ riêng ở bước thêm mới.
        </div>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                {(supplierForm.category === 'Khách sạn' && kind === 'main'
                  ? ['Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Số lượng', 'Đơn giá']
                  : supplierForm.category === 'Khách sạn' && kind === 'meal'
                    ? ['Tên dịch vụ', 'Menu', 'Ghi chú', 'Đơn giá']
                    : supplierForm.category === 'Nhà hàng'
                      ? ['Tên dịch vụ', 'Mô tả', 'Menu', 'Ghi chú', 'Đơn giá']
                      : ['Tên dịch vụ', 'Số chỗ']
                ).map(header => (
                  <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id} className="border-t border-outline-variant/10">
                  {supplierForm.category === 'Khách sạn' && kind === 'main' ? (
                    <>
                      <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input value={service.description} onChange={event => updateDraftService(service.id, { description: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input value={service.unit} onChange={event => updateDraftService(service.id, { unit: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input type="number" value={service.quantity} onChange={event => updateDraftService(service.id, { quantity: Number(event.target.value || 0) }, kind)} className="w-24 border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input type="number" value={service.prices.at(-1)?.unitPrice ?? 0} onChange={event => updateLatestPrice(service, Number(event.target.value || 0), kind)} className="w-32 border border-outline-variant/40 px-3 py-2" /></td>
                    </>
                  ) : supplierForm.category === 'Khách sạn' && kind === 'meal' ? (
                    <>
                      <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input value={service.menu ?? ''} onChange={event => updateDraftService(service.id, { menu: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input value={service.note ?? ''} onChange={event => updateDraftService(service.id, { note: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input type="number" value={service.prices.at(-1)?.unitPrice ?? 0} onChange={event => updateLatestPrice(service, Number(event.target.value || 0), kind)} className="w-32 border border-outline-variant/40 px-3 py-2" /></td>
                    </>
                  ) : supplierForm.category === 'Nhà hàng' ? (
                    <>
                      <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input value={service.description} onChange={event => updateDraftService(service.id, { description: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input value={service.menu ?? ''} onChange={event => updateDraftService(service.id, { menu: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input value={service.note ?? ''} onChange={event => updateDraftService(service.id, { note: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input type="number" value={service.prices.at(-1)?.unitPrice ?? 0} onChange={event => updateLatestPrice(service, Number(event.target.value || 0), kind)} className="w-32 border border-outline-variant/40 px-3 py-2" /></td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                      <td className="px-4 py-3"><input type="number" value={service.capacity ?? 16} onChange={event => updateDraftService(service.id, { capacity: Number(event.target.value || 0), name: `Xe ${Number(event.target.value || 0)} chỗ` }, kind)} className="w-24 border border-outline-variant/40 px-3 py-2" /></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderEditTable = (title: string, services: SupplierServiceLine[], kind: 'main' | 'meal' = 'main') => (
    <div className="space-y-4 border border-outline-variant/20 p-4">
      {renderHeader(title, kind)}
      {supplierForm.category === 'Vận chuyển' && supplierForm.transportType === 'Máy bay' && kind === 'main' ? (
        <div className="border border-dashed border-outline-variant/40 p-5 text-sm text-primary/50">
          Loại vận chuyển máy bay không có bảng dịch vụ riêng.
        </div>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                {(supplierForm.category === 'Khách sạn' && kind === 'main'
                  ? ['Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Số lượng', '']
                  : supplierForm.category === 'Khách sạn' && kind === 'meal'
                    ? ['Tên dịch vụ', 'Menu', 'Ghi chú', '']
                    : supplierForm.category === 'Nhà hàng'
                      ? ['Tên dịch vụ', 'Mô tả', 'Menu', 'Ghi chú', '']
                      : ['Tên dịch vụ', 'Số chỗ', '']
                ).map(header => (
                  <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map(service => {
                const expandedKey = `${kind}:${service.id}`;
                const isExpanded = Boolean(expandedRows[expandedKey]);
                return (
                  <Fragment key={service.id}>
                    <tr className="border-t border-outline-variant/10">
                      {supplierForm.category === 'Khách sạn' && kind === 'main' ? (
                        <>
                          <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input value={service.description} onChange={event => updateDraftService(service.id, { description: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input value={service.unit} onChange={event => updateDraftService(service.id, { unit: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input type="number" value={service.quantity} onChange={event => updateDraftService(service.id, { quantity: Number(event.target.value || 0) }, kind)} className="w-24 border border-outline-variant/40 px-3 py-2" /></td>
                        </>
                      ) : supplierForm.category === 'Khách sạn' && kind === 'meal' ? (
                        <>
                          <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input value={service.menu ?? ''} onChange={event => updateDraftService(service.id, { menu: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input value={service.note ?? ''} onChange={event => updateDraftService(service.id, { note: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                        </>
                      ) : supplierForm.category === 'Nhà hàng' ? (
                        <>
                          <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input value={service.description} onChange={event => updateDraftService(service.id, { description: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input value={service.menu ?? ''} onChange={event => updateDraftService(service.id, { menu: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input value={service.note ?? ''} onChange={event => updateDraftService(service.id, { note: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3"><input value={service.name} onChange={event => updateDraftService(service.id, { name: event.target.value }, kind)} className="w-full border border-outline-variant/40 px-3 py-2" /></td>
                          <td className="px-4 py-3"><input type="number" value={service.capacity ?? 16} onChange={event => updateDraftService(service.id, { capacity: Number(event.target.value || 0), name: `Xe ${Number(event.target.value || 0)} chỗ` }, kind)} className="w-24 border border-outline-variant/40 px-3 py-2" /></td>
                        </>
                      )}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setExpandedRows(previous => ({ ...previous, [expandedKey]: !isExpanded }))}
                          className="text-xs font-bold uppercase tracking-widest text-secondary"
                          aria-label={`${isExpanded ? 'Thu gọn' : 'Mở rộng'} bảng giá ${service.name}`}
                        >
                          {isExpanded ? 'Thu gọn bảng giá' : 'Mở rộng bảng giá'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-outline-variant/10 bg-surface-container-low/20">
                        <td colSpan={supplierForm.category === 'Khách sạn' && kind === 'main' ? 5 : supplierForm.category === 'Nhà hàng' || kind === 'meal' ? 5 : 3} className="px-4 py-4">
                          <div className="space-y-3">
                            {supplierForm.category === 'Vận chuyển' && (
                              <div className="flex justify-end">
                                <button onClick={() => onAddPrice(service.id, kind === 'meal')} className="border border-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary">
                                  Thêm bảng giá
                                </button>
                              </div>
                            )}
                            <ServicePriceTable rows={service.prices} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {mode === 'create'
        ? renderCreateTable(supplierForm.category === 'Khách sạn' ? 'Dịch vụ lưu trú' : 'Bảng dịch vụ', supplierForm.services)
        : renderEditTable(supplierForm.category === 'Khách sạn' ? 'Dịch vụ lưu trú' : 'Bảng dịch vụ', supplierForm.services)}
      {supplierForm.category === 'Khách sạn' && supplierForm.includeMealService && (
        mode === 'create'
          ? renderCreateTable('Dịch vụ ăn kèm', supplierForm.mealServices, 'meal')
          : renderEditTable('Dịch vụ ăn kèm', supplierForm.mealServices, 'meal')
      )}
    </div>
  );
}

function GuideEditorModal({
  guideForm,
  onChange,
  onClose,
  onSave,
  title,
}: {
  guideForm: GuideFormState;
  onChange: <K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) => void;
  onClose: () => void;
  onSave: () => void;
  title: string;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-8">
        <div className="space-y-5">
          <div className="border-b border-outline-variant/30 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Thông tin chung</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <input value={guideForm.name} onChange={event => onChange('name', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Họ và Tên" />
            <select value={guideForm.gender} onChange={event => onChange('gender', event.target.value as GuideFormState['gender'])} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" aria-label="Giới tính">
              <option>Nam</option>
              <option>Nữ</option>
            </select>
            <input value={guideForm.dob} onChange={event => onChange('dob', event.target.value)} type="date" className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Ngày sinh" />
            <input value={guideForm.phone} onChange={event => onChange('phone', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Số điện thoại" />
            <input value={guideForm.email} onChange={event => onChange('email', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Email" />
            <input value={guideForm.address} onChange={event => onChange('address', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Địa chỉ" />
            <input value={guideForm.operatingArea} onChange={event => onChange('operatingArea', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Khu vực hoạt động" />
          </div>
        </div>

        <div className="space-y-5">
          <div className="border-b border-outline-variant/30 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Thông tin chuyên môn</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <input value={guideForm.guideCardNumber} onChange={event => onChange('guideCardNumber', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Số thẻ hướng dẫn viên" />
            <input value={guideForm.issueDate} onChange={event => onChange('issueDate', event.target.value)} type="date" className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Ngày cấp" />
            <input value={guideForm.expiryDate} onChange={event => onChange('expiryDate', event.target.value)} type="date" className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Ngày hết hạn" />
            <input value={guideForm.issuePlace} onChange={event => onChange('issuePlace', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Nơi cấp" />
            <div className="space-y-3 border border-outline-variant/30 px-4 py-3">
              <p className="text-sm font-medium text-primary">Ngoại ngữ</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {languageOptions.map(language => (
                  <label key={language} className="flex items-center gap-3 text-sm text-primary">
                    <input
                      type="checkbox"
                      checked={guideForm.languages.includes(language)}
                      onChange={event => {
                        if (event.target.checked) {
                          onChange('languages', [...guideForm.languages, language]);
                        } else {
                          onChange('languages', guideForm.languages.filter(value => value !== language));
                        }
                      }}
                    />
                    {language}
                  </label>
                ))}
              </div>
            </div>
            <input value={guideForm.note} onChange={event => onChange('note', event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" placeholder="Ghi chú" />
          </div>
        </div>

        <div className="flex gap-4 border-t border-outline-variant/20 pt-6">
          <button onClick={onClose} className="flex-1 border border-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            Hủy
          </button>
          <button onClick={onSave} className="flex-1 bg-primary py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
            {title.startsWith('Thêm') ? 'Thêm mới' : 'Lưu'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function QuotePopupModal({
  quotePopup,
  supplier,
  onClose,
  onApply,
}: {
  quotePopup: QuotePopupState;
  supplier: SupplierRow | null;
  onClose: () => void;
  onApply: (priceMap: Record<string, number>, reason: string, fromDate: string, toDate: string) => void;
}) {
  const [fromDate, setFromDate] = useState('2026-04-20');
  const [toDate, setToDate] = useState('2026-12-31');
  const [reason, setReason] = useState('Cập nhật báo giá');
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  if (!supplier) return null;

  const rows = [
    ...supplier.services.map(service => ({ ...service, mealService: false })),
    ...(supplier.category === 'Khách sạn' ? supplier.mealServices.map(service => ({ ...service, mealService: true })) : []),
  ].filter(service => (
    quotePopup.kind === 'add'
      ? true
      : service.id === quotePopup.serviceId && Boolean(quotePopup.mealService) === service.mealService
  ));

  return (
    <Modal title={`Thêm báo giá - ${supplier.name}`} subtitle="Popup báo giá hiển thị đơn giá hiện tại và đơn giá mới." onClose={onClose} wide>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Từ ngày</span>
            <input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-primary">
            <span>Đến ngày</span>
            <input type="date" value={toDate} onChange={event => setToDate(event.target.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
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
                {(supplier.category === 'Vận chuyển'
                  ? ['Loại phương tiện', 'Tên dịch vụ', 'Đơn vị', 'Hình thức giá', 'Đơn giá hiện tại', 'Đơn giá mới']
                  : supplier.category === 'Nhà hàng'
                    ? ['Tên dịch vụ', 'Mô tả', 'Menu', 'Ghi chú', 'Đơn giá hiện tại', 'Đơn giá mới']
                    : ['Nhóm dịch vụ', 'Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Đơn giá hiện tại', 'Đơn giá mới']
                ).map(header => (
                  <th key={header} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-primary/50">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(service => {
                const currentPrice = service.prices[service.prices.length - 1]?.unitPrice ?? 0;
                const mapKey = `${service.mealService ? 'meal' : 'main'}:${service.id}`;

                return (
                  <tr key={service.id} className="border-t border-outline-variant/10">
                    {supplier.category === 'Vận chuyển' ? (
                      <>
                        <td className="px-4 py-3">{service.transportType}</td>
                        <td className="px-4 py-3 font-medium">{service.name}</td>
                        <td className="px-4 py-3">{service.unit}</td>
                        <td className="px-4 py-3">{service.priceMode}</td>
                        <td className="px-4 py-3">{formatCurrency(currentPrice)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={priceMap[mapKey] ?? ''}
                            onChange={event => setPriceMap(previous => ({ ...previous, [mapKey]: Number(event.target.value || 0) }))}
                            className="w-36 border border-outline-variant/50 px-3 py-2"
                            aria-label={`Đơn giá mới ${service.name}`}
                          />
                        </td>
                      </>
                    ) : supplier.category === 'Nhà hàng' ? (
                      <>
                        <td className="px-4 py-3 font-medium">{service.name}</td>
                        <td className="px-4 py-3">{service.description}</td>
                        <td className="px-4 py-3">{service.menu || '-'}</td>
                        <td className="px-4 py-3">{service.note || '-'}</td>
                        <td className="px-4 py-3">{formatCurrency(currentPrice)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={priceMap[mapKey] ?? ''}
                            onChange={event => setPriceMap(previous => ({ ...previous, [mapKey]: Number(event.target.value || 0) }))}
                            className="w-36 border border-outline-variant/50 px-3 py-2"
                            aria-label={`Đơn giá mới ${service.name}`}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{service.mealService ? 'Ăn uống' : 'Lưu trú'}</td>
                        <td className="px-4 py-3 font-medium">{service.name}</td>
                        <td className="px-4 py-3">{service.description}</td>
                        <td className="px-4 py-3">{service.unit}</td>
                        <td className="px-4 py-3">{formatCurrency(currentPrice)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={priceMap[mapKey] ?? ''}
                            onChange={event => setPriceMap(previous => ({ ...previous, [mapKey]: Number(event.target.value || 0) }))}
                            className="w-36 border border-outline-variant/50 px-3 py-2"
                            aria-label={`Đơn giá mới ${service.name}`}
                          />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-6">
          <button onClick={onClose} className="border border-outline-variant/50 px-5 py-3 text-primary/70">
            Hủy bỏ
          </button>
          <button onClick={() => onApply(priceMap, reason, fromDate, toDate)} className="bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-white">
            Lưu báo giá
          </button>
        </div>
      </div>
    </Modal>
  );
}
