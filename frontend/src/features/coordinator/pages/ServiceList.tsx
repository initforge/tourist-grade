import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@shared/store/useAuthStore';
import { PageSearchInput } from '@shared/ui/PageSearchInput';

type Category = 'Vận chuyển' | 'Lưu trú' | 'Vé tham quan' | 'Hướng dẫn viên' | 'Các dịch vụ khác';
type AddCategory = 'Vé tham quan' | 'Các dịch vụ khác';
type PriceMode = 'Báo giá' | 'Giá niêm yết';
type PriceSetup = 'Giá chung' | 'Theo độ tuổi' | '-';
type ServiceStatus = 'Hoạt động' | 'Dừng hoạt động';
type Province = 'Đà Nẵng' | 'Hà Nội' | 'Quảng Ninh' | 'Lào Cai' | 'Ninh Bình';
type CountFormulaOption = 'Theo ngày' | 'Giá trị mặc định' | 'Nhập tay';
type QuantityFormulaOption = 'Theo số người' | 'Giá trị mặc định' | 'Nhập tay';

interface PriceRow {
  id: string;
  unitPrice: number;
  note: string;
  effectiveDate: string;
  endDate: string;
  createdBy: string;
}

interface ServiceRow {
  id: string;
  name: string;
  category: Category;
  unit: string;
  priceMode: PriceMode;
  setup: PriceSetup;
  status: ServiceStatus;
  description: string;
  supplierName?: string;
  contactInfo?: string;
  province?: Province;
  formulaCount?: CountFormulaOption;
  formulaCountDefault?: string;
  formulaQuantity?: QuantityFormulaOption;
  formulaQuantityDefault?: string;
  prices: PriceRow[];
}

interface ServiceDraft {
  id?: string;
  name: string;
  category: Category;
  unit: string;
  priceMode: PriceMode;
  setup: PriceSetup;
  status: ServiceStatus;
  description: string;
  supplierName: string;
  contactInfo: string;
  unitPrice: string;
  province: Province;
  formulaCount: CountFormulaOption;
  formulaCountDefault: string;
  formulaQuantity: QuantityFormulaOption;
  formulaQuantityDefault: string;
}

const provinceOptions: Province[] = ['Đà Nẵng', 'Hà Nội', 'Quảng Ninh', 'Lào Cai', 'Ninh Bình'];
const lockedCategories = new Set<Category>(['Vận chuyển', 'Lưu trú', 'Hướng dẫn viên']);
const countFormulaOptions: CountFormulaOption[] = ['Theo ngày', 'Giá trị mặc định', 'Nhập tay'];
const quantityFormulaOptions: QuantityFormulaOption[] = ['Theo số người', 'Giá trị mặc định', 'Nhập tay'];

const createPrice = (
  id: string,
  unitPrice: number,
  effectiveDate: string,
  endDate: string,
  note: string,
  createdBy = 'Điều phối viên'
): PriceRow => ({ id, unitPrice, effectiveDate, endDate, note, createdBy });

const initialServices: ServiceRow[] = [
  {
    id: 'SV-HDV',
    name: 'Dịch vụ Hướng dẫn viên',
    category: 'Hướng dẫn viên',
    unit: 'ngày',
    priceMode: 'Giá niêm yết',
    setup: 'Giá chung',
    status: 'Hoạt động',
    description: 'Dùng cho hạng mục hướng dẫn viên trong dự toán tour.',
    prices: [createPrice('SV-HDV-P1', 400000, '2026-01-01', '2026-12-31', 'Áp dụng tour nội địa')],
  },
  {
    id: 'SV-SGL',
    name: 'Phòng đơn',
    category: 'Lưu trú',
    unit: 'phòng/đêm',
    priceMode: 'Giá niêm yết',
    setup: 'Giá chung',
    status: 'Hoạt động',
    description: 'Dịch vụ lưu trú phòng đơn.',
    prices: [createPrice('SV-SGL-P1', 1200000, '2026-01-01', '2026-12-31', 'Khách sạn 3 sao')],
  },
  {
    id: 'SV-BUS',
    name: 'Xe tham quan',
    category: 'Vận chuyển',
    unit: 'xe',
    priceMode: 'Báo giá',
    setup: '-',
    status: 'Hoạt động',
    description: 'Dịch vụ vận chuyển theo xe.',
    prices: [createPrice('SV-BUS-P1', 8100000, '2026-04-01', '2026-09-30', 'Xe 29 chỗ')],
  },
  {
    id: 'SV-TKT',
    name: 'Vé tham quan Sun World',
    category: 'Vé tham quan',
    unit: 'vé',
    priceMode: 'Giá niêm yết',
    setup: 'Theo độ tuổi',
    status: 'Hoạt động',
    description: 'Áp dụng cho các chương trình tham quan tại Đà Nẵng.',
    supplierName: 'Sun World Hạ Long',
    contactInfo: '024 3936 6666',
    province: 'Đà Nẵng',
    prices: [
      createPrice('SV-TKT-P1', 250000, '2026-01-01', '2026-06-30', 'Người lớn', 'Trưởng phòng điều phối'),
      createPrice('SV-TKT-P2', 180000, '2026-01-01', '2026-06-30', 'Trẻ em', 'Trưởng phòng điều phối'),
    ],
  },
  {
    id: 'SV-INS',
    name: 'Bảo hiểm du lịch',
    category: 'Các dịch vụ khác',
    unit: 'khách',
    priceMode: 'Giá niêm yết',
    setup: 'Giá chung',
    status: 'Hoạt động',
    description: 'Áp dụng trực tiếp vào chi phí khác.',
    supplierName: 'Bảo Việt Travel Care',
    contactInfo: 'hotro@baoviet.example',
    formulaCount: 'Giá trị mặc định',
    formulaCountDefault: '1',
    formulaQuantity: 'Theo số người',
    prices: [
      createPrice('SV-INS-P1', 40000, '2026-01-01', '2026-12-31', 'Bảo hiểm nội địa'),
      createPrice('SV-INS-P2', 50000, '2026-07-01', '2026-12-31', 'Điều chỉnh mùa cao điểm', 'Admin hệ thống'),
    ],
  },
];

const emptyDraft = (category: AddCategory): ServiceDraft => ({
  name: '',
  category,
  unit: category === 'Vé tham quan' ? 'vé' : 'khách',
  priceMode: 'Giá niêm yết',
  setup: category === 'Vé tham quan' ? 'Theo độ tuổi' : 'Giá chung',
  status: 'Hoạt động',
  description: '',
  supplierName: '',
  contactInfo: '',
  unitPrice: '',
  province: 'Đà Nẵng',
  formulaCount: 'Theo ngày',
  formulaCountDefault: '',
  formulaQuantity: 'Theo số người',
  formulaQuantityDefault: '',
});

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

function describeFormula(option?: CountFormulaOption | QuantityFormulaOption, defaultValue?: string) {
  if (!option) return '-';
  if (option === 'Giá trị mặc định' && defaultValue?.trim()) {
    return `${option}: ${defaultValue}`;
  }
  return option;
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
      <div className="absolute inset-0 bg-[#2A2421]/35 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
        className={`relative max-h-[92vh] overflow-y-auto bg-white shadow-2xl ${wide ? 'w-full max-w-6xl' : 'w-full max-w-3xl'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-8 py-6">
          <div>
            <h2 id="service-modal-title" className="font-serif text-3xl text-[#2A2421]">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-stone-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-stone-400 transition-colors hover:text-[#2A2421]" aria-label="Đóng">
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
    <div className="border border-stone-200 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">{label}</p>
      <div className="mt-2 text-sm text-[#2A2421]">{value}</div>
    </div>
  );
}

function StatusToggle({
  value,
  onToggle,
  disabled = false,
}: {
  value: ServiceStatus;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  const tone = value === 'Hoạt động'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-700';
  const dotTone = value === 'Hoạt động' ? 'bg-emerald-500' : 'bg-rose-500';

  if (!onToggle) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${tone}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${dotTone}`} />
        {value}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${tone}`}
      aria-label={`Chuyển trạng thái dịch vụ sang ${value === 'Hoạt động' ? 'Dừng hoạt động' : 'Hoạt động'}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotTone}`} />
      {value}
      <span className="material-symbols-outlined text-[14px]">sync_alt</span>
    </button>
  );
}

function PriceTable({
  rows,
  showAction = false,
  onEdit,
}: {
  rows: PriceRow[];
  showAction?: boolean;
  onEdit?: (priceId: string) => void;
}) {
  return (
    <div className="overflow-hidden border border-stone-200">
      <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">Bảng giá</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white">
            <tr className="border-b border-stone-200">
              {['Đơn giá', 'Ngày hiệu lực', 'Ngày hết hiệu lực', 'Ghi chú', 'Người tạo', ...(showAction ? ['Thao tác'] : [])].map(header => (
                <th key={header} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(price => (
              <tr key={price.id} className="border-b border-stone-100">
                <td className="px-5 py-4">{formatCurrency(price.unitPrice)}</td>
                <td className="px-5 py-4">{price.effectiveDate}</td>
                <td className="px-5 py-4">{price.endDate}</td>
                <td className="px-5 py-4">{price.note}</td>
                <td className="px-5 py-4">{price.createdBy}</td>
                {showAction && (
                  <td className="px-5 py-4">
                    <button onClick={() => onEdit?.(price.id)} className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
                      Chỉnh sửa
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ServiceList() {
  const role = useAuthStore(state => state?.user?.role || 'guest');
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [priceEditor, setPriceEditor] = useState<{ serviceId: string; priceId?: string } | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft('Vé tham quan'));
  const [nextCategory, setNextCategory] = useState<AddCategory>('Vé tham quan');

  const selectedService = useMemo(() => serviceRows.find(service => service.id === selectedServiceId) ?? null, [selectedServiceId, serviceRows]);
  const editingService = useMemo(() => serviceRows.find(service => service.id === editingServiceId) ?? null, [editingServiceId, serviceRows]);
  const activePriceService = useMemo(() => serviceRows.find(service => service.id === priceEditor?.serviceId) ?? null, [priceEditor, serviceRows]);
  const activePriceRow = useMemo(() => activePriceService?.prices.find(price => price.id === priceEditor?.priceId), [activePriceService, priceEditor]);

  const filteredServiceRows = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return serviceRows;
    return serviceRows.filter(service =>
      [service.id, service.name, service.category, service.unit, service.priceMode, service.setup, service.status, service.supplierName, service.contactInfo]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [searchQuery, serviceRows]);

  const updateDraft = <K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) => {
    setDraft(previous => ({ ...previous, [key]: value }));
  };

  const openCreateModal = () => {
    setNextCategory('Vé tham quan');
    setDraft(emptyDraft('Vé tham quan'));
    setIsCreateOpen(true);
  };

  const openEditModal = (service: ServiceRow) => {
    setDraft({
      id: service.id,
      name: service.name,
      category: service.category,
      unit: service.unit,
      priceMode: service.priceMode,
      setup: service.setup,
      status: service.status,
      description: service.description,
      supplierName: service.supplierName ?? '',
      contactInfo: service.contactInfo ?? '',
      unitPrice: String(service.prices.at(-1)?.unitPrice ?? ''),
      province: service.province ?? 'Đà Nẵng',
      formulaCount: service.formulaCount ?? 'Theo ngày',
      formulaCountDefault: service.formulaCountDefault ?? '',
      formulaQuantity: service.formulaQuantity ?? 'Theo số người',
      formulaQuantityDefault: service.formulaQuantityDefault ?? '',
    });
    setSelectedServiceId(null);
    setEditingServiceId(service.id);
  };

  const buildDraftPrices = (existingPrices: PriceRow[] = []) => {
    const nextUnitPrice = Number(draft.unitPrice || 0);
    const hasUnitPrice = draft.unitPrice.trim() !== '';

    if (existingPrices.length > 0) {
      if (!hasUnitPrice) return existingPrices;
      return existingPrices.map((price, index) => (
        index === existingPrices.length - 1
          ? { ...price, unitPrice: nextUnitPrice }
          : price
      ));
    }

    if (!hasUnitPrice) return [];

    return [
      createPrice(
        `PRICE-${Date.now()}`,
        nextUnitPrice,
        '2026-01-01',
        '2026-12-31',
        draft.supplierName ? `Bảng giá khởi tạo - ${draft.supplierName}` : 'Bảng giá khởi tạo',
      ),
    ];
  };

  const saveDraft = () => {
    if (editingServiceId) {
      setServiceRows(previous => previous.map(service => (
        service.id === editingServiceId
          ? {
              ...service,
              name: draft.name || service.name,
              unit: draft.unit,
              priceMode: draft.priceMode,
              setup: draft.setup,
              status: draft.status,
              description: draft.description,
              supplierName: draft.supplierName.trim() || undefined,
              contactInfo: draft.contactInfo.trim() || undefined,
              province: draft.category === 'Vé tham quan' ? draft.province : undefined,
              formulaCount: draft.category === 'Các dịch vụ khác' ? draft.formulaCount : undefined,
              formulaCountDefault: draft.category === 'Các dịch vụ khác' && draft.formulaCount === 'Giá trị mặc định'
                ? draft.formulaCountDefault
                : undefined,
              formulaQuantity: draft.category === 'Các dịch vụ khác' ? draft.formulaQuantity : undefined,
              formulaQuantityDefault: draft.category === 'Các dịch vụ khác' && draft.formulaQuantity === 'Giá trị mặc định'
                ? draft.formulaQuantityDefault
                : undefined,
              prices: buildDraftPrices(service.prices),
            }
          : service
      )));
      setEditingServiceId(null);
      return;
    }

    const nextId = `SV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setServiceRows(previous => [
      {
        id: nextId,
        name: draft.name || (draft.category === 'Vé tham quan' ? 'Vé tham quan mới' : 'Dịch vụ khác mới'),
        category: draft.category,
        unit: draft.unit,
        priceMode: draft.priceMode,
        setup: draft.setup,
        status: draft.status,
        description: draft.description || 'Chưa có mô tả.',
        supplierName: draft.supplierName.trim() || undefined,
        contactInfo: draft.contactInfo.trim() || undefined,
        province: draft.category === 'Vé tham quan' ? draft.province : undefined,
        formulaCount: draft.category === 'Các dịch vụ khác' ? draft.formulaCount : undefined,
        formulaCountDefault: draft.category === 'Các dịch vụ khác' && draft.formulaCount === 'Giá trị mặc định'
          ? draft.formulaCountDefault
          : undefined,
        formulaQuantity: draft.category === 'Các dịch vụ khác' ? draft.formulaQuantity : undefined,
        formulaQuantityDefault: draft.category === 'Các dịch vụ khác' && draft.formulaQuantity === 'Giá trị mặc định'
          ? draft.formulaQuantityDefault
          : undefined,
        prices: buildDraftPrices(),
      },
      ...previous,
    ]);
    setIsCreateOpen(false);
    setSelectedServiceId(null);
  };

  const removeService = (serviceId: string) => {
    setServiceRows(previous => previous.filter(service => service.id !== serviceId));
    setSelectedServiceId(null);
    setEditingServiceId(null);
  };

  const savePriceRow = (priceDraft: PriceRow) => {
    if (!activePriceService) return;
    setServiceRows(previous => previous.map(service => {
      if (service.id !== activePriceService.id) return service;
      const prices = activePriceRow
        ? service.prices.map(price => (price.id === activePriceRow.id ? { ...priceDraft, id: activePriceRow.id } : price))
        : [...service.prices, { ...priceDraft, id: `PRICE-${Date.now()}` }];
      return { ...service, prices };
    }));
    setPriceEditor(null);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-background)]">
      <main className="p-10">
        <Breadcrumb
          className="mb-6 text-xs"
          items={[
            { title: <Link to="/coordinator/services" className="text-[#D4AF37] hover:underline">Kho Dịch vụ</Link> },
            { title: <span className="text-[#2A2421]/30">Danh mục dịch vụ</span> },
          ]}
        />

        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Quản lý dịch vụ</span>
            <h1 className="font-serif text-4xl text-[#2A2421]">Danh mục dịch vụ</h1>
            <p className="mt-3 max-w-3xl text-sm text-[#2A2421]/55">
              Nhóm lưu trú, hướng dẫn viên và vận chuyển chỉ hiển thị thông tin chuẩn hóa. Vé tham quan và các dịch vụ khác giữ bảng giá để điều phối cập nhật trực tiếp.
            </p>
          </div>
          {role === 'coordinator' && (
            <button
              onClick={openCreateModal}
              className="border border-[#D4AF37] bg-[#D4AF37] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white shadow-lg transition-opacity hover:opacity-90"
            >
              Thêm dịch vụ
            </button>
          )}
        </div>

        <PageSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã dịch vụ, tên dịch vụ, phân loại..."
          className="mb-6"
        />

        <div className="overflow-hidden border border-[#D0C5AF]/20 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#D0C5AF]/30 bg-stone-50 text-stone-500">
                {['Dịch vụ', 'Phân loại', 'Đơn vị', 'Hình thức giá', 'Thiết lập giá', 'Trạng thái', 'Thao tác'].map(header => (
                  <th key={header} className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredServiceRows.map(service => (
                <tr key={service.id} className="transition-colors hover:bg-stone-50/60">
                  <td className="px-6 py-5">
                    <p className="font-serif text-base font-bold text-[#2A2421]">{service.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-stone-400">
                      <span className="font-mono">{service.id}</span>
                      {service.province && <span>{service.province}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="border border-[#D4AF37]/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-medium text-stone-600">{service.unit}</td>
                  <td className="px-6 py-5 text-xs text-stone-600">{service.priceMode}</td>
                  <td className="px-6 py-5 text-xs text-stone-600">{service.setup}</td>
                  <td className="px-6 py-5"><StatusToggle value={service.status} /></td>
                  <td className="px-6 py-5">
                    <button onClick={() => setSelectedServiceId(service.id)} className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {isCreateOpen && (
        <Modal title="Thêm dịch vụ" subtitle="Chỉ tạo dịch vụ cho Vé tham quan và Các dịch vụ khác." onClose={() => setIsCreateOpen(false)}>
          <div className="space-y-6">
            <label className="block space-y-2 text-sm font-medium text-[#2A2421]">
              <span>Phân loại</span>
              <select
                value={nextCategory}
                onChange={event => {
                  const value = event.target.value as AddCategory;
                  setNextCategory(value);
                  setDraft(emptyDraft(value));
                }}
                className="w-full border border-stone-200 px-4 py-3 text-sm outline-none"
              >
                <option>Vé tham quan</option>
                <option>Các dịch vụ khác</option>
              </select>
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Tên dịch vụ</span>
                <input value={draft.name} onChange={event => updateDraft('name', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Đơn vị</span>
                <input value={draft.unit} onChange={event => updateDraft('unit', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Tên nhà cung cấp</span>
                <input value={draft.supplierName} onChange={event => updateDraft('supplierName', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Thông tin liên hệ</span>
                <input value={draft.contactInfo} onChange={event => updateDraft('contactInfo', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" placeholder="Không bắt buộc" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421] md:col-span-2">
                <span>Đơn giá</span>
                <input value={draft.unitPrice} onChange={event => updateDraft('unitPrice', event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-[#2A2421]">
              <span>Mô tả</span>
              <textarea value={draft.description} onChange={event => updateDraft('description', event.target.value)} rows={3} className="w-full resize-none border border-stone-200 px-4 py-3 text-sm outline-none" />
            </label>

            {nextCategory === 'Vé tham quan' ? (
              <div className="grid grid-cols-1 gap-4 rounded-sm border border-stone-200 p-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Tỉnh thành</span>
                  <select value={draft.province} onChange={event => updateDraft('province', event.target.value as Province)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none">
                    {provinceOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Thiết lập giá</span>
                  <select value={draft.setup} onChange={event => updateDraft('setup', event.target.value as PriceSetup)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none">
                    <option>Giá chung</option>
                    <option>Theo độ tuổi</option>
                  </select>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 rounded-sm border border-stone-200 p-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lần</span>
                  <select
                    value={draft.formulaCount}
                    onChange={event => updateDraft('formulaCount', event.target.value as CountFormulaOption)}
                    className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white"
                  >
                    {countFormulaOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lượng</span>
                  <select
                    value={draft.formulaQuantity}
                    onChange={event => updateDraft('formulaQuantity', event.target.value as QuantityFormulaOption)}
                    className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white"
                  >
                    {quantityFormulaOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                {draft.formulaCount === 'Giá trị mặc định' && (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Số lần mặc định</span>
                    <input value={draft.formulaCountDefault} onChange={event => updateDraft('formulaCountDefault', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                  </label>
                )}
                {draft.formulaQuantity === 'Giá trị mặc định' && (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Số lượng mặc định</span>
                    <input value={draft.formulaQuantityDefault} onChange={event => updateDraft('formulaQuantityDefault', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                  </label>
                )}
              </div>
            )}

            <div className="flex gap-4 border-t border-stone-200 pt-6">
              <button onClick={() => setIsCreateOpen(false)} className="flex-1 border border-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
                Hủy bỏ
              </button>
              <button onClick={saveDraft} className="flex-1 bg-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                Lưu dịch vụ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selectedService && (
        <Modal
          title={`Chi tiết ${selectedService.name}`}
          subtitle={lockedCategories.has(selectedService.category) ? 'Nhóm dịch vụ hệ thống chỉ hiển thị thông tin chuẩn hóa.' : 'Nhóm dịch vụ điều phối có thể cập nhật bảng giá.'}
          onClose={() => setSelectedServiceId(null)}
          wide
        >
          <div className="space-y-6">
            {!lockedCategories.has(selectedService.category) && (
              <div className="flex flex-wrap justify-end gap-3">
                <button onClick={() => openEditModal(selectedService)} className="border border-[#2A2421] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
                  Sửa
                </button>
                <button onClick={() => removeService(selectedService.id)} className="border border-rose-200 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-rose-700">
                  Xóa
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Phân loại" value={selectedService.category} />
              <Field label="Đơn vị" value={selectedService.unit} />
              <Field label="Hình thức giá" value={selectedService.priceMode} />
              <Field label="Thiết lập giá" value={selectedService.setup} />
              <Field label="Trạng thái" value={<StatusToggle value={selectedService.status} />} />
              {!lockedCategories.has(selectedService.category) && <Field label="Mã dịch vụ" value={selectedService.id} />}
              {!lockedCategories.has(selectedService.category) && <Field label="Nhà cung cấp" value={selectedService.supplierName || '-'} />}
              {!lockedCategories.has(selectedService.category) && <Field label="Thông tin liên hệ" value={selectedService.contactInfo || '-'} />}
              {selectedService.category === 'Các dịch vụ khác' && (
                <Field label="Công thức tính số lần" value={describeFormula(selectedService.formulaCount, selectedService.formulaCountDefault)} />
              )}
              {selectedService.category === 'Các dịch vụ khác' && (
                <Field label="Công thức tính số lượng" value={describeFormula(selectedService.formulaQuantity, selectedService.formulaQuantityDefault)} />
              )}
            </div>

            {!lockedCategories.has(selectedService.category) && (
              <>
                <Field label="Mô tả" value={selectedService.description} />
                <PriceTable rows={selectedService.prices} />
              </>
            )}
          </div>
        </Modal>
      )}

      {editingService && (
        <Modal title={`Sửa dịch vụ - ${editingService.name}`} subtitle="Nhóm dịch vụ điều phối cho phép thêm mới bảng giá." onClose={() => setEditingServiceId(null)} wide>
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={() => setPriceEditor({ serviceId: editingService.id })} className="border border-[#D4AF37] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                Thêm mới bảng giá
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Tên dịch vụ</span>
                <input value={draft.name} onChange={event => updateDraft('name', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Đơn vị</span>
                <input value={draft.unit} onChange={event => updateDraft('unit', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Hình thức giá</span>
                <select value={draft.priceMode} onChange={event => updateDraft('priceMode', event.target.value as PriceMode)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                  <option>Báo giá</option>
                  <option>Giá niêm yết</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Thiết lập giá</span>
                <select value={draft.setup} onChange={event => updateDraft('setup', event.target.value as PriceSetup)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                  <option>Giá chung</option>
                  <option>Theo độ tuổi</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Trạng thái</span>
                <div className="pt-1">
                  <StatusToggle
                    value={draft.status}
                    onToggle={() => updateDraft('status', draft.status === 'Hoạt động' ? 'Dừng hoạt động' : 'Hoạt động')}
                  />
                </div>
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Tên nhà cung cấp</span>
                <input value={draft.supplierName} onChange={event => updateDraft('supplierName', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Thông tin liên hệ</span>
                <input value={draft.contactInfo} onChange={event => updateDraft('contactInfo', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Đơn giá hiện hành</span>
                <input value={draft.unitPrice} onChange={event => updateDraft('unitPrice', event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              {draft.category === 'Vé tham quan' && (
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Tỉnh thành</span>
                  <select value={draft.province} onChange={event => updateDraft('province', event.target.value as Province)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    {provinceOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
              )}
            </div>

            <label className="block space-y-2 text-sm font-medium text-[#2A2421]">
              <span>Mô tả</span>
              <textarea value={draft.description} onChange={event => updateDraft('description', event.target.value)} rows={3} className="w-full resize-none border border-stone-200 px-4 py-3 text-sm outline-none" />
            </label>

            {draft.category === 'Các dịch vụ khác' && (
              <div className="grid grid-cols-1 gap-4 rounded-sm border border-stone-200 p-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lần</span>
                  <select
                    value={draft.formulaCount}
                    onChange={event => updateDraft('formulaCount', event.target.value as CountFormulaOption)}
                    className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white"
                  >
                    {countFormulaOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lượng</span>
                  <select
                    value={draft.formulaQuantity}
                    onChange={event => updateDraft('formulaQuantity', event.target.value as QuantityFormulaOption)}
                    className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white"
                  >
                    {quantityFormulaOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                {draft.formulaCount === 'Giá trị mặc định' && (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Số lần mặc định</span>
                    <input value={draft.formulaCountDefault} onChange={event => updateDraft('formulaCountDefault', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                  </label>
                )}
                {draft.formulaQuantity === 'Giá trị mặc định' && (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Số lượng mặc định</span>
                    <input value={draft.formulaQuantityDefault} onChange={event => updateDraft('formulaQuantityDefault', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                  </label>
                )}
              </div>
            )}

            <PriceTable rows={editingService.prices} showAction onEdit={priceId => setPriceEditor({ serviceId: editingService.id, priceId })} />

            <div className="flex gap-4 border-t border-stone-200 pt-6">
              <button onClick={() => setEditingServiceId(null)} className="flex-1 border border-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
                Hủy bỏ
              </button>
              <button onClick={saveDraft} className="flex-1 bg-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                Lưu dịch vụ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {priceEditor && activePriceService && (
        <PriceEditorModal
          service={activePriceService}
          price={activePriceRow}
          onClose={() => setPriceEditor(null)}
          onSave={savePriceRow}
        />
      )}
    </div>
  );
}

function PriceEditorModal({
  service,
  price,
  onClose,
  onSave,
}: {
  service: ServiceRow;
  price?: PriceRow;
  onClose: () => void;
  onSave: (draft: PriceRow) => void;
}) {
  const [unitPrice, setUnitPrice] = useState(String(price?.unitPrice ?? ''));
  const [effectiveDate, setEffectiveDate] = useState(price?.effectiveDate ?? '2026-04-20');
  const [endDate, setEndDate] = useState(price?.endDate ?? '2026-12-31');
  const [note, setNote] = useState(price?.note ?? '');
  const [createdBy, setCreatedBy] = useState(price?.createdBy ?? 'Điều phối viên');

  return (
    <Modal title={price ? 'Chỉnh sửa bảng giá' : 'Thêm mới bảng giá'} subtitle={service.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Đơn giá</span>
            <input value={unitPrice} onChange={event => setUnitPrice(event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Người tạo</span>
            <input value={createdBy} onChange={event => setCreatedBy(event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Ngày hiệu lực</span>
            <input value={effectiveDate} onChange={event => setEffectiveDate(event.target.value)} type="date" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Ngày hết hiệu lực</span>
            <input value={endDate} onChange={event => setEndDate(event.target.value)} type="date" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-[#2A2421] block">
          <span>Ghi chú</span>
          <input value={note} onChange={event => setNote(event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
        </label>
        <div className="flex gap-4 border-t border-stone-200 pt-6">
          <button onClick={onClose} className="flex-1 border border-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
            Hủy bỏ
          </button>
          <button
            onClick={() => onSave({
              id: price?.id ?? '',
              unitPrice: Number(unitPrice || 0),
              effectiveDate,
              endDate,
              note,
              createdBy,
            })}
            className="flex-1 bg-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white"
          >
            Lưu bảng giá
          </button>
        </div>
      </div>
    </Modal>
  );
}
