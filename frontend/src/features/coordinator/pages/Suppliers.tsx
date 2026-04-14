import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { useAuthStore } from '@shared/store/useAuthStore';

type SupplierCategory = 'Khách sạn' | 'Nhà hàng' | 'Vận chuyển' | 'Vé thắng cảnh' | 'Các dịch vụ khác';
type SupplierStatus = 'Hoạt động' | 'Dừng hoạt động';
type TransportType = 'Xe' | 'Máy bay' | 'Thuyền' | 'Cano';

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
  transportType?: TransportType;
  priceMode?: string;
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
  operatingArea: string;
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
      name: transportType === 'Xe' ? 'Xe tham quan' : transportType === 'Máy bay' ? 'Vé máy bay đoàn' : `${transportType} tham quan`,
      description: transportType === 'Xe' ? 'Đồng hành suốt hành trình' : 'Dịch vụ vận chuyển theo lượt',
      unit: transportType === 'Xe' ? 'Xe' : 'Người',
      quantity: 1,
      priceMode: transportType === 'Xe' || transportType === 'Máy bay' ? 'Báo giá' : 'Niêm yết',
      prices: [createPrice(`draft-price-${index}`, transportType === 'Xe' ? 0 : 320000)],
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
      unit: 'Bán',
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
    services: [{ id: 'SUP001-S1', name: 'Phòng đôi', description: 'Phòng tiêu chuẩn hướng phố', unit: 'Phòng', quantity: 1, prices: [createPrice('P1', 1300000)] }],
    mealServices: [{ id: 'SUP001-M1', name: 'Buffet sáng', description: '', unit: 'Bữa', quantity: 1, menu: 'Buffet 20 món + nước ép', note: 'Phục vụ từ 06:00-09:30', prices: [createPrice('P1M', 180000)] }],
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
      { id: 'SUP002-S1', transportType: 'Xe', name: 'Xe tham quan', description: 'Đồng hành suốt hành trình', unit: 'Xe', quantity: 1, priceMode: 'Báo giá', prices: [createPrice('P2', 0)] },
      { id: 'SUP002-S2', transportType: 'Thuyền', name: 'Thuyền tre Hội An', description: 'Mô tả ...', unit: 'Người', quantity: 1, priceMode: 'Niêm yết', prices: [createPrice('P3', 320000), createPrice('P4', 350000, 'Mùa cao điểm')] },
      { id: 'SUP002-S3', transportType: 'Cano', name: 'Cano tham quan', description: 'Mô tả ...', unit: 'Người', quantity: 1, priceMode: 'Niêm yết', prices: [createPrice('P5', 480000), createPrice('P6', 520000, 'Mùa hè'), createPrice('P7', 560000, 'Lễ cuối năm')] },
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
    services: [{ id: 'SUP004-S1', name: 'Set menu đoàn', description: 'Phục vụ bàn tròn 10 người', unit: 'Bàn', quantity: 1, menu: '6 món + canh + tráng miệng', note: 'Có menu chay theo yêu cầu', prices: [createPrice('P9', 1800000)] }],
    mealServices: [],
  },
];

const guides: GuideRow[] = [
  { id: 'HDV001', name: 'Trần Minh Hoàng', gender: 'Nam', dob: '1986-04-12', phone: '0901 111 222', email: 'hoang.hdv@travela.vn', operatingArea: 'Miền Bắc' },
  { id: 'HDV002', name: 'Lê Thu Hà', gender: 'Nữ', dob: '1992-08-21', phone: '0902 333 444', email: 'ha.hdv@travela.vn', operatingArea: 'Nhật Bản' },
  { id: 'HDV003', name: 'Nguyễn Đình Phong', gender: 'Nam', dob: '1982-12-02', phone: '0903 555 666', email: 'phong.hdv@travela.vn', operatingArea: 'Miền Trung' },
];

function createSupplierSummary(category: SupplierFormState['category']) {
  if (category === 'Khách sạn') return 'Lưu trú';
  if (category === 'Nhà hàng') return 'Bữa ăn đoàn';
  return 'Vận chuyển';
}

function DetailModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="detail-title" className="relative bg-white max-w-6xl w-full shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4">
          <h3 id="detail-title" className="font-serif text-2xl text-primary">{title}</h3>
          <button onClick={onClose} className="text-primary/50 hover:text-primary"><span className="material-symbols-outlined">close</span></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ServiceFragment({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function AdminSuppliers() {
  const role = useAuthStore(s => s?.user?.role || 'guest');
  const [activeTab, setActiveTab] = useState<'suppliers' | 'guides'>('suppliers');
  const [open, setOpen] = useState(false);
  const [detailGuide, setDetailGuide] = useState<GuideRow | null>(null);
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [quotePopupId, setQuotePopupId] = useState<string | null>(null);
  const [supplierRows, setSupplierRows] = useState<SupplierRow[]>(initialSuppliers);
  const [expandedServiceIds, setExpandedServiceIds] = useState<Record<string, boolean>>({});
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(createInitialSupplierForm());

  const detailSupplier = supplierRows?.find(supplier => supplier.id === detailSupplierId) ?? null;
  const quotePopupSupplier = supplierRows?.find(supplier => supplier.id === quotePopupId) ?? null;

  const updateSupplierForm = <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) => {
    setSupplierForm(previous => {
      if (key !== 'category') {
        return { ...previous, [key]: value };
      }

      const nextCategory = value as SupplierFormState['category'];
      const nextBase = createInitialSupplierForm();
      return {
        ...nextBase,
        category: nextCategory,
        service: createSupplierSummary(nextCategory),
        services: [createServiceDraft(nextCategory, nextBase?.transportType, 0)],
        mealServices: [],
      };
    });
  };

  const updateDraftService = (serviceId: string, changes: Partial<SupplierServiceLine>, kind: 'main' | 'meal' = 'main') => {
    setSupplierForm(previous => ({
      ...previous,
      [kind === 'main' ? 'services' : 'mealServices']: previous[kind === 'main' ? 'services' : 'mealServices']?.map(service =>
        service.id === serviceId ? { ...service, ...changes } : service,
      ),
    }));
  };

  const addDraftService = (kind: 'main' | 'meal' = 'main') => {
    setSupplierForm(previous => {
      const targetKey = kind === 'main' ? 'services' : 'mealServices';
      const nextIndex = previous[targetKey]?.length;
      const service = createServiceDraft(previous?.category, previous?.transportType, nextIndex, kind);
      return { ...previous, [targetKey]: [...previous[targetKey], service] };
    });
  };

  const toggleExpanded = (serviceId: string) => {
    setExpandedServiceIds(previous => ({ ...previous, [serviceId]: !previous[serviceId] }));
  };

  const updateSupplierById = (supplierId: string, updater: (supplier: SupplierRow) => SupplierRow) => {
    setSupplierRows(previous => previous?.map(supplier => supplier.id === supplierId ? updater(supplier) : supplier));
  };

  const addServiceToSupplier = (supplierId: string, kind: 'main' | 'meal' = 'main') => {
    updateSupplierById(supplierId, supplier => {
      const index = (kind === 'main' ? supplier?.services : supplier?.mealServices)?.length;
      const nextService = createServiceDraft(
        supplier.category === 'Khách sạn' || supplier.category === 'Nhà hàng' || supplier.category === 'Vận chuyển'
          ? supplier?.category
          : 'Vận chuyển',
        supplier?.services[0]?.transportType ?? 'Xe',
        index,
        kind,
      );

      return kind === 'main'
        ? { ...supplier, services: [...supplier?.services, nextService] }
        : { ...supplier, mealServices: [...supplier?.mealServices, nextService] };
    });
  };

  const resetDrawer = () => {
    setSupplierForm(createInitialSupplierForm());
    setOpen(false);
  };

  const handleCreateSupplier = () => {
    const maxSupplierIndex = Math.max(
      0,
      ...supplierRows?.map(supplier => Number(supplier?.id?.replace(/\D/g, '')) || 0),
    );
    const nextId = `SUP${String(maxSupplierIndex + 1)?.padStart(3, '0')}`;
    const nextSupplier: SupplierRow = {
      id: nextId,
      name: supplierForm?.name || `Nhà cung cấp ${nextId}`,
      phone: supplierForm?.phone || 'Chưa cập nhật',
      email: supplierForm?.email || 'Chưa cập nhật',
      category: supplierForm?.category,
      service: supplierForm?.service || createSupplierSummary(supplierForm?.category),
      operatingArea: supplierForm?.operatingArea || '-',
      status: supplierForm?.status,
      address: supplierForm?.address || 'Chưa cập nhật',
      establishedYear: supplierForm?.establishedYear || 'N/A',
      description: supplierForm?.description || 'Chưa có mô tả.',
      services: supplierForm?.services,
      mealServices: supplierForm?.includeMealService ? supplierForm?.mealServices : [],
    };

    setSupplierRows(previous => [nextSupplier, ...previous]);
    setDetailSupplierId(nextId);
    resetDrawer();
  };

  const renderSupplierServiceTable = (supplier: SupplierRow) => {
    if (supplier.category === 'Khách sạn') {
      return (
        <>
          <div className="border border-outline-variant/30 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-surface-container-low border-b border-outline-variant/30">
              <p className="text-xs uppercase tracking-widest font-bold text-primary/60">Dịch vụ lưu trú</p>
              <div className="flex gap-3">
                <button onClick={() => addServiceToSupplier(supplier?.id, 'main')} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm dịch vụ</button>
                <button onClick={() => setQuotePopupId(supplier?.id)} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm báo giá</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-white">
                    {['Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Số lượng', 'Đơn giá']?.map(header => (
                      <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-primary/50 font-semibold">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supplier?.services?.map(service => (
                    <tr key={service?.id} className="border-b border-outline-variant/10">
                      <td className="px-4 py-3 font-medium">{service?.name}</td>
                      <td className="px-4 py-3">{service?.description}</td>
                      <td className="px-4 py-3">{service?.unit}</td>
                      <td className="px-4 py-3">{service?.quantity}</td>
                      <td className="px-4 py-3">{service?.prices[0] ? `${service?.prices[0]?.unitPrice?.toLocaleString('vi-VN')} đ` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {supplier?.mealServices?.length > 0 && (
            <div className="border border-outline-variant/30 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-surface-container-low border-b border-outline-variant/30">
                <p className="text-xs uppercase tracking-widest font-bold text-primary/60">Dịch vụ ăn kèm</p>
                <button onClick={() => addServiceToSupplier(supplier?.id, 'meal')} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm dịch vụ</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-white">
                      {['Tên dịch vụ', 'Menu', 'Ghi chú']?.map(header => (
                        <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-primary/50 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {supplier?.mealServices?.map(service => (
                      <tr key={service?.id} className="border-b border-outline-variant/10">
                        <td className="px-4 py-3 font-medium">{service?.name}</td>
                        <td className="px-4 py-3">{service?.menu || '-'}</td>
                        <td className="px-4 py-3">{service?.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      );
    }

    if (supplier.category === 'Nhà hàng') {
      return (
        <div className="border border-outline-variant/30 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-surface-container-low border-b border-outline-variant/30">
            <p className="text-xs uppercase tracking-widest font-bold text-primary/60">Dịch vụ & bảng giá</p>
            <div className="flex gap-3">
              <button onClick={() => addServiceToSupplier(supplier?.id, 'main')} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm dịch vụ</button>
              <button onClick={() => setQuotePopupId(supplier?.id)} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm báo giá</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-white">
                  {['Tên dịch vụ', 'Mô tả', 'Menu', 'Ghi chú']?.map(header => (
                    <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-primary/50 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplier?.services?.map(service => (
                  <tr key={service?.id} className="border-b border-outline-variant/10">
                    <td className="px-4 py-3 font-medium">{service?.name}</td>
                    <td className="px-4 py-3">{service?.description}</td>
                    <td className="px-4 py-3">{service?.menu || '-'}</td>
                    <td className="px-4 py-3">{service?.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-outline-variant/30 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-surface-container-low border-b border-outline-variant/30">
          <p className="text-xs uppercase tracking-widest font-bold text-primary/60">Dịch vụ & bảng giá</p>
          <div className="flex gap-3">
            <button onClick={() => addServiceToSupplier(supplier?.id, 'main')} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm dịch vụ</button>
            <button onClick={() => setQuotePopupId(supplier?.id)} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm báo giá</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-white">
                {['Loại phương tiện', 'Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Hình thức giá', 'Bảng giá']?.map(header => (
                  <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-primary/50 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supplier?.services?.map(service => {
                const expanded = Boolean(expandedServiceIds[service?.id]);
                return (
                  <ServiceFragment key={service?.id}>
                    <tr className="border-b border-outline-variant/10">
                      <td className="px-4 py-3">{service?.transportType}</td>
                      <td className="px-4 py-3 font-medium">{service?.name}</td>
                      <td className="px-4 py-3">{service?.description}</td>
                      <td className="px-4 py-3">{service?.unit}</td>
                      <td className="px-4 py-3">{service?.priceMode}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleExpanded(service?.id)} className="text-secondary font-medium">
                          {service?.prices?.length} bảng giá {expanded ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-[var(--color-surface)]/40">
                        <td colSpan={6} className="px-4 py-4">
                          <table className="w-full text-left text-xs border border-outline-variant/20">
                            <thead className="bg-white">
                              <tr>
                                {['Từ ngày', 'Đến ngày', 'Đơn giá', 'Ghi chú', 'Người tạo']?.map(header => (
                                  <th key={header} className="px-3 py-2 text-[10px] uppercase tracking-widest text-primary/45">{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {service?.prices?.map(price => (
                                <tr key={price?.id} className="border-t border-outline-variant/10">
                                  <td className="px-3 py-2">{price?.fromDate}</td>
                                  <td className="px-3 py-2">{price?.toDate}</td>
                                  <td className="px-3 py-2">{price?.unitPrice ? `${price?.unitPrice?.toLocaleString('vi-VN')} đ` : '-'}</td>
                                  <td className="px-3 py-2">{price?.note}</td>
                                  <td className="px-3 py-2">{price?.createdBy}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </ServiceFragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen relative">
      <main className="min-h-screen flex flex-col pb-20">
        <div className="p-10 flex-1">
          <Breadcrumb className="mb-6 text-xs" items={[
            { title: <Link to="/coordinator/suppliers" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Đối tác (NCC)</Link> },
            { title: <span className="text-[var(--color-primary)]/30">Danh sách</span> },
          ]} />

          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-secondary font-bold mb-3">Danh mục đối tác</p>
                <h1 className="font-serif text-4xl text-primary">Nhà cung cấp</h1>
                <p className="text-primary/55 mt-3 max-w-2xl">
                  Quản lý hồ sơ nhà cung cấp dịch vụ và hướng dẫn viên theo từng nhóm nghiệp vụ.
                </p>
              </div>
              <button
                onClick={() => {
                  setSupplierForm(createInitialSupplierForm());
                  setOpen(true);
                }}
                className="px-6 py-3 border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm uppercase tracking-widest font-bold"
              >
                Thêm nhà cung cấp
              </button>
            </div>

            <div className="flex gap-3 border-b border-outline-variant/30">
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`px-5 py-3 text-sm uppercase tracking-widest font-bold border-b-2 ${activeTab === 'suppliers' ? 'border-secondary text-primary' : 'border-transparent text-primary/45'}`}
              >
                Nhà cung cấp dịch vụ
              </button>
              <button
                onClick={() => setActiveTab('guides')}
                className={`px-5 py-3 text-sm uppercase tracking-widest font-bold border-b-2 ${activeTab === 'guides' ? 'border-secondary text-primary' : 'border-transparent text-primary/45'}`}
              >
                Hướng dẫn viên
              </button>
            </div>

            {activeTab === 'suppliers' ? (
              <div className="bg-white border border-outline-variant/30 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low">
                    <tr>
                      {['Mã NCC', 'Tên nhà cung cấp', 'Phân loại', 'Dịch vụ chính', 'Khu vực hoạt động', 'Trạng thái', 'Thao tác']?.map(header => (
                        <th key={header} className="px-5 py-4 text-[10px] uppercase tracking-widest text-primary/50 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {supplierRows?.map(supplier => (
                      <tr key={supplier?.id} className="border-t border-outline-variant/15">
                        <td className="px-5 py-4 font-mono text-xs">{supplier?.id}</td>
                        <td className="px-5 py-4 font-medium text-primary">{supplier?.name}</td>
                        <td className="px-5 py-4">{supplier?.category}</td>
                        <td className="px-5 py-4">{supplier?.service}</td>
                        <td className="px-5 py-4">{supplier?.operatingArea}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold ${supplier.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {supplier?.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => setDetailSupplierId(supplier?.id)} className="text-secondary font-bold text-xs uppercase tracking-widest">Xem</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white border border-outline-variant/30 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low">
                    <tr>
                      {['Mã HDV', 'Tên hướng dẫn viên', 'Giới tính', 'Ngày sinh', 'Số điện thoại', 'Email', 'Khu vực hoạt động', 'Thao tác']?.map(header => (
                        <th key={header} className="px-5 py-4 text-[10px] uppercase tracking-widest text-primary/50 font-semibold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guides?.map(guide => (
                      <tr key={guide?.id} className="border-t border-outline-variant/15">
                        <td className="px-5 py-4 font-mono text-xs">{guide?.id}</td>
                        <td className="px-5 py-4 font-medium text-primary">{guide?.name}</td>
                        <td className="px-5 py-4">{guide?.gender}</td>
                        <td className="px-5 py-4">{guide?.dob}</td>
                        <td className="px-5 py-4">{guide?.phone}</td>
                        <td className="px-5 py-4">{guide?.email}</td>
                        <td className="px-5 py-4">{guide?.operatingArea}</td>
                        <td className="px-5 py-4">
                          <button onClick={() => setDetailGuide(guide)} className="text-secondary font-bold text-xs uppercase tracking-widest">Xem</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {open && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-primary/25" onClick={resetDrawer} />
          <div className="relative w-full max-w-3xl bg-white shadow-2xl h-full overflow-y-auto p-8">
            <div className="flex justify-between gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-secondary font-bold mb-2">Tạo mới</p>
                <h2 className="font-serif text-3xl text-primary">Thêm nhà cung cấp</h2>
              </div>
              <button onClick={resetDrawer} className="text-primary/50 hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Phân loại</span>
                <select value={supplierForm?.category} onChange={event => updateSupplierForm('category', event?.target?.value as SupplierFormState['category'])} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                  <option>Khách sạn</option>
                  <option>Nhà hàng</option>
                  <option>Vận chuyển</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Dịch vụ chính</span>
                <input value={supplierForm?.service} onChange={event => updateSupplierForm('service', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Tên nhà cung cấp</span>
                <input value={supplierForm?.name} onChange={event => updateSupplierForm('name', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Khu vực hoạt động</span>
                <input value={supplierForm?.operatingArea} onChange={event => updateSupplierForm('operatingArea', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Số điện thoại</span>
                <input value={supplierForm?.phone} onChange={event => updateSupplierForm('phone', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Email</span>
                <input value={supplierForm?.email} onChange={event => updateSupplierForm('email', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Năm thành lập</span>
                <input value={supplierForm?.establishedYear} onChange={event => updateSupplierForm('establishedYear', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary">
                <span>Trạng thái</span>
                <select value={supplierForm?.status} onChange={event => updateSupplierForm('status', event?.target?.value as SupplierStatus)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                  <option>Hoạt động</option>
                  <option>Dừng hoạt động</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-primary md:col-span-2">
                <span>Địa chỉ</span>
                <input value={supplierForm?.address} onChange={event => updateSupplierForm('address', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary md:col-span-2">
                <span>Mô tả</span>
                <textarea value={supplierForm?.description} onChange={event => updateSupplierForm('description', event?.target?.value)} className="w-full border border-outline-variant/50 px-4 py-3 min-h-24" />
              </label>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-xl text-primary">Dịch vụ</h3>
                <button onClick={() => addDraftService('main')} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm dịch vụ</button>
              </div>
              {supplierForm.category === 'Vận chuyển' && (
                <label className="space-y-2 text-sm font-medium text-primary block">
                  <span>Loại phương tiện</span>
                  <select value={supplierForm?.transportType} onChange={event => updateSupplierForm('transportType', event?.target?.value as TransportType)} className="w-full border border-outline-variant/50 px-4 py-3 bg-white">
                    <option>Xe</option>
                    <option>Máy bay</option>
                    <option>Thuyền</option>
                    <option>Cano</option>
                  </select>
                </label>
              )}

              <div className="space-y-4">
                {supplierForm?.services?.map((service, index) => (
                  <div key={service?.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-outline-variant/25 p-4 bg-surface-container-low/40">
                    <label className="space-y-2 text-sm font-medium text-primary">
                      <span>Tên dịch vụ {index + 1}</span>
                      <input value={service?.name} onChange={event => updateDraftService(service?.id, { name: event?.target?.value })} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-primary">
                      <span>Mô tả</span>
                      <input value={service?.description} onChange={event => updateDraftService(service?.id, { description: event?.target?.value })} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" />
                    </label>
                    {supplierForm.category === 'Nhà hàng' && (
                      <>
                        <label className="space-y-2 text-sm font-medium text-primary">
                          <span>Menu</span>
                          <input value={service?.menu ?? ''} onChange={event => updateDraftService(service?.id, { menu: event?.target?.value })} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" />
                        </label>
                        <label className="space-y-2 text-sm font-medium text-primary">
                          <span>Ghi chú</span>
                          <input value={service?.note ?? ''} onChange={event => updateDraftService(service?.id, { note: event?.target?.value })} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" />
                        </label>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {supplierForm.category === 'Khách sạn' && (
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-sm font-medium text-primary">
                    <input
                      type="checkbox"
                      checked={supplierForm?.includeMealService}
                      onChange={event => {
                        updateSupplierForm('includeMealService', event?.target?.checked);
                        if (event?.target?.checked && supplierForm?.mealServices.length === 0) addDraftService('meal');
                      }}
                    />
                    Có kèm dịch vụ ăn
                  </label>
                  {supplierForm?.includeMealService && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm uppercase tracking-widest font-bold text-primary/60">Dịch vụ ăn kèm</h4>
                        <button onClick={() => addDraftService('meal')} className="text-xs uppercase tracking-widest font-bold text-secondary">Thêm dịch vụ</button>
                      </div>
                      {supplierForm?.mealServices?.map((service, index) => (
                        <div key={service?.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-outline-variant/25 p-4 bg-surface-container-low/40">
                          <label className="space-y-2 text-sm font-medium text-primary">
                            <span>Tên dịch vụ ăn {index + 1}</span>
                            <input value={service?.name} onChange={event => updateDraftService(service?.id, { name: event?.target?.value }, 'meal')} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" />
                          </label>
                          <label className="space-y-2 text-sm font-medium text-primary">
                            <span>Menu</span>
                            <input value={service?.menu ?? ''} onChange={event => updateDraftService(service?.id, { menu: event?.target?.value }, 'meal')} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" />
                          </label>
                          <label className="space-y-2 text-sm font-medium text-primary">
                            <span>Ghi chú</span>
                            <input value={service?.note ?? ''} onChange={event => updateDraftService(service?.id, { note: event?.target?.value }, 'meal')} className="w-full border border-outline-variant/50 px-4 py-3 bg-white" />
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={resetDrawer} className="px-5 py-3 border border-outline-variant/50 text-primary/70">Hủy bỏ</button>
              <button onClick={handleCreateSupplier} className="px-6 py-3 bg-primary text-white font-bold uppercase tracking-widest text-xs">Lưu nhà cung cấp</button>
            </div>
          </div>
        </div>
      )}

      {detailSupplier && (
        <DetailModal title={`Chi tiết ${detailSupplier?.name}`} onClose={() => setDetailSupplierId(null)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['Mã NCC', detailSupplier?.id],
              ['Phân loại', detailSupplier?.category],
              ['Dịch vụ chính', detailSupplier?.service],
              ['Khu vực hoạt động', detailSupplier?.operatingArea],
              ['Số điện thoại', detailSupplier?.phone],
              ['Email', detailSupplier?.email],
              ['Địa chỉ', detailSupplier?.address],
              ['Năm thành lập', detailSupplier?.establishedYear],
              ['Trạng thái', detailSupplier?.status],
            ]?.map(([label, value]) => (
              <div key={label} className="border border-outline-variant/20 p-4">
                <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold">{label}</p>
                <p className="mt-2 text-primary">{value}</p>
              </div>
            ))}
            <div className="border border-outline-variant/20 p-4 md:col-span-3">
              <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold">Mô tả</p>
              <p className="mt-2 text-primary">{detailSupplier?.description}</p>
            </div>
          </div>
          {renderSupplierServiceTable(detailSupplier)}
        </DetailModal>
      )}

      {detailGuide && (
        <DetailModal title={`Chi tiết ${detailGuide?.name}`} onClose={() => setDetailGuide(null)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['Mã HDV', detailGuide?.id],
              ['Giới tính', detailGuide?.gender],
              ['Ngày sinh', detailGuide?.dob],
              ['Số điện thoại', detailGuide?.phone],
              ['Email', detailGuide?.email],
              ['Khu vực hoạt động', detailGuide?.operatingArea],
            ]?.map(([label, value]) => (
              <div key={label} className="border border-outline-variant/20 p-4">
                <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold">{label}</p>
                <p className="mt-2 text-primary">{value}</p>
              </div>
            ))}
          </div>
        </DetailModal>
      )}

      {quotePopupSupplier && (
        <DetailModal title={`Thêm báo giá - ${quotePopupSupplier?.name}`} onClose={() => setQuotePopupId(null)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-2 text-sm font-medium text-primary">
              <span>Từ ngày</span>
              <input type="date" className="w-full border border-outline-variant/50 px-4 py-3" />
            </label>
            <label className="space-y-2 text-sm font-medium text-primary">
              <span>Đến ngày</span>
              <input type="date" className="w-full border border-outline-variant/50 px-4 py-3" />
            </label>
            <label className="space-y-2 text-sm font-medium text-primary">
              <span>Lý do</span>
              <input placeholder="Cập nhật báo giá" className="w-full border border-outline-variant/50 px-4 py-3" />
            </label>
          </div>
          <div className="overflow-x-auto border border-outline-variant/25">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {(quotePopupSupplier.category === 'Vận chuyển'
                    ? ['Loại phương tiện', 'Tên dịch vụ', 'Đơn vị', 'Hình thức giá', 'Đơn giá']
                    : quotePopupSupplier.category === 'Nhà hàng'
                      ? ['Tên dịch vụ', 'Mô tả', 'Menu', 'Ghi chú']
                      : ['Tên dịch vụ', 'Mô tả', 'Đơn vị', 'Số lượng', 'Đơn giá']
                  )?.map(header => (
                    <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-primary/50 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotePopupSupplier?.services?.map(service => (
                  <tr key={service?.id} className="border-t border-outline-variant/10">
                    {quotePopupSupplier.category === 'Vận chuyển' ? (
                      <>
                        <td className="px-4 py-3">{service?.transportType}</td>
                        <td className="px-4 py-3 font-medium">{service?.name}</td>
                        <td className="px-4 py-3">{service?.unit}</td>
                        <td className="px-4 py-3">{service?.priceMode}</td>
                        <td className="px-4 py-3">{(service?.prices[0]?.unitPrice ?? 0)?.toLocaleString('vi-VN')}</td>
                      </>
                    ) : quotePopupSupplier.category === 'Nhà hàng' ? (
                      <>
                        <td className="px-4 py-3 font-medium">{service?.name}</td>
                        <td className="px-4 py-3">{service?.description}</td>
                        <td className="px-4 py-3">{service?.menu}</td>
                        <td className="px-4 py-3">{service?.note}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium">{service?.name}</td>
                        <td className="px-4 py-3">{service?.description}</td>
                        <td className="px-4 py-3">{service?.unit}</td>
                        <td className="px-4 py-3">{service?.quantity}</td>
                        <td className="px-4 py-3">{(service?.prices[0]?.unitPrice ?? 0)?.toLocaleString('vi-VN')}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
