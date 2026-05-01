import { useMemo, useState, type ReactNode } from 'react';
import { Breadcrumb, message } from 'antd';
import { Link } from 'react-router-dom';
import { addServicePrice, createService, deleteService, patchService, patchServicePrice, type ServicePayload } from '@shared/lib/api/services';
import { useAuthStore } from '@shared/store/useAuthStore';
import { PageSearchInput } from '@shared/ui/PageSearchInput';
import { useAppDataStore, type ServicePriceRow, type ServiceRow } from '@shared/store/useAppDataStore';

type Category = 'Vận chuyển' | 'Lưu trú' | 'Vé tham quan' | 'Hướng dẫn viên' | 'Các dịch vụ khác';
type AddCategory = 'Vé tham quan' | 'Các dịch vụ khác';
type PriceMode = 'Báo giá' | 'Giá niêm yết';
type PriceSetup = 'Giá chung' | 'Theo độ tuổi' | '-';
type ServiceStatus = 'Hoạt động' | 'Dừng hoạt động';
type Province = string;
type CountFormulaOption = 'Theo ngày' | 'Giá trị mặc định' | 'Nhập tay';
type QuantityFormulaOption = 'Theo số người' | 'Giá trị mặc định' | 'Nhập tay';

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
  generalPrice: string;
  adultPrice: string;
  childPrice: string;
  province: Province;
  formulaCount: CountFormulaOption;
  formulaCountDefault: string;
  formulaQuantity: QuantityFormulaOption;
  formulaQuantityDefault: string;
}

type DraftErrors = Partial<Record<keyof ServiceDraft | 'price', string>>;

const lockedCategories = new Set<Category>(['Vận chuyển', 'Lưu trú', 'Hướng dẫn viên']);
const countFormulaOptions: CountFormulaOption[] = ['Theo ngày', 'Giá trị mặc định', 'Nhập tay'];
const quantityFormulaOptions: QuantityFormulaOption[] = ['Theo số người', 'Giá trị mặc định', 'Nhập tay'];
const addableCategories: AddCategory[] = ['Vé tham quan', 'Các dịch vụ khác'];

const todayKey = () => new Date().toISOString().slice(0, 10);
const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

function createPrice(
  id: string,
  unitPrice: number,
  effectiveDate: string,
  endDate: string,
  note: string,
  createdBy: string,
): ServicePriceRow {
  return { id, unitPrice, effectiveDate, endDate, note, createdBy };
}

const initialServices: ServiceRow[] = [
  {
    id: 'SV-HDV',
    name: 'Dịch vụ Hướng dẫn viên',
    category: 'Hướng dẫn viên',
    unit: 'đ',
    priceMode: 'Giá niêm yết',
    setup: 'Giá chung',
    status: 'Hoạt động',
    description: 'Dùng cho hạng mục hướng dẫn viên trong dự toán tour.',
    prices: [createPrice('SV-HDV-P1', 400000, '2026-01-01', '', 'Áp dụng tour nội địa', 'Điều phối viên')],
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
    prices: [createPrice('SV-SGL-P1', 1200000, '2026-01-01', '', 'Khách sạn 3 sao', 'Điều phối viên')],
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
    prices: [createPrice('SV-BUS-P1', 8100000, '2026-04-01', '', 'Xe 29 chỗ', 'Điều phối viên')],
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
    formulaCount: 'Giá trị mặc định',
    formulaCountDefault: '1',
    formulaQuantity: 'Theo số người',
    prices: [
      createPrice('SV-TKT-P1', 250000, '2026-01-01', '', 'Người lớn', 'Trưởng phòng điều phối'),
      createPrice('SV-TKT-P2', 180000, '2026-01-01', '', 'Trẻ em', 'Trưởng phòng điều phối'),
    ],
  },
  {
    id: 'SV-INS',
    name: 'Bảo hiểm du lịch',
    category: 'Các dịch vụ khác',
    unit: 'người',
    priceMode: 'Giá niêm yết',
    setup: 'Giá chung',
    status: 'Hoạt động',
    description: 'Áp dụng trực tiếp vào chi phí khác.',
    supplierName: 'Bảo Việt Travel Care',
    contactInfo: 'hotro@baoviet.example',
    formulaCount: 'Giá trị mặc định',
    formulaCountDefault: '1',
    formulaQuantity: 'Theo số người',
    prices: [createPrice('SV-INS-P1', 40000, '2026-01-01', '', 'Bảo hiểm nội địa', 'Điều phối viên')],
  },
];

function emptyDraft(category: AddCategory, province: Province = 'Đà Nẵng'): ServiceDraft {
  return {
    name: '',
    category,
    unit: category === 'Vé tham quan' ? 'Vé' : '',
    priceMode: 'Giá niêm yết',
    setup: category === 'Vé tham quan' ? 'Theo độ tuổi' : 'Giá chung',
    status: 'Hoạt động',
    description: '',
    supplierName: '',
    contactInfo: '',
    generalPrice: '',
    adultPrice: '',
    childPrice: '',
    province,
    formulaCount: category === 'Vé tham quan' ? 'Giá trị mặc định' : 'Theo ngày',
    formulaCountDefault: category === 'Vé tham quan' ? '1' : '',
    formulaQuantity: category === 'Vé tham quan' ? 'Theo số người' : 'Theo số người',
    formulaQuantityDefault: '',
  };
}

function describeFormula(option?: string, defaultValue?: string) {
  if (!option) return '-';
  if (option === 'Giá trị mặc định' && defaultValue?.trim()) return `${option}: ${defaultValue}`;
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
      <div role="dialog" aria-modal="true" className={`relative max-h-[92vh] overflow-y-auto bg-white shadow-2xl ${wide ? 'w-full max-w-6xl' : 'w-full max-w-3xl'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-8 py-6">
          <div>
            <h2 className="font-serif text-3xl text-[#2A2421]">{title}</h2>
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

function StatusToggle({ value }: { value: ServiceStatus }) {
  const tone = value === 'Hoạt động'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-rose-200 bg-rose-50 text-rose-700';
  const dotTone = value === 'Hoạt động' ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${tone}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dotTone}`} />
      {value}
    </div>
  );
}

function validateDraft(draft: ServiceDraft, requirePrices = true): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.name.trim()) errors.name = 'Cần nhập tên dịch vụ';
  if (draft.category !== 'Vé tham quan' && !draft.unit.trim()) errors.unit = 'Cần nhập đơn vị';
  if (!draft.description.trim()) errors.description = 'Cần nhập mô tả';

  if (requirePrices && draft.priceMode !== 'Báo giá' && draft.category === 'Vé tham quan') {
    if (draft.setup === 'Theo độ tuổi') {
      if (!draft.adultPrice.trim() || Number(draft.adultPrice) <= 0) errors.adultPrice = 'Cần nhập đơn giá người lớn';
      if (!draft.childPrice.trim() || Number(draft.childPrice) <= 0) errors.childPrice = 'Cần nhập đơn giá trẻ em';
    } else if (!draft.generalPrice.trim() || Number(draft.generalPrice) <= 0) {
      errors.generalPrice = 'Cần nhập đơn giá';
    }
  }

  if (draft.category === 'Các dịch vụ khác') {
    if (requirePrices && draft.priceMode !== 'Báo giá' && (!draft.generalPrice.trim() || Number(draft.generalPrice) <= 0)) errors.generalPrice = 'Cần nhập đơn giá';
    if (draft.formulaCount === 'Giá trị mặc định' && (!draft.formulaCountDefault.trim() || Number(draft.formulaCountDefault) <= 0)) {
      errors.formulaCountDefault = 'Cần nhập số lần mặc định';
    }
    if (draft.formulaQuantity === 'Giá trị mặc định' && (!draft.formulaQuantityDefault.trim() || Number(draft.formulaQuantityDefault) <= 0)) {
      errors.formulaQuantityDefault = 'Cần nhập số lượng mặc định';
    }
  }

  return errors;
}

function buildPricesFromDraft(draft: ServiceDraft, createdBy: string, existingPrices: ServicePriceRow[] = []) {
  if (draft.priceMode === 'Báo giá') return [];

  const effectiveDate = todayKey();
  if (draft.category === 'Vé tham quan' && draft.setup === 'Theo độ tuổi') {
    return [
      createPrice(`PRICE-${Date.now()}-adult`, Number(draft.adultPrice || 0), effectiveDate, '', 'Người lớn', createdBy),
      createPrice(`PRICE-${Date.now()}-child`, Number(draft.childPrice || 0), effectiveDate, '', 'Trẻ em', createdBy),
    ];
  }

  const unitPrice = Number(draft.generalPrice || 0);
  if (existingPrices.length > 0) {
    return existingPrices.map((price, index) => (
      index === existingPrices.length - 1
        ? { ...price, unitPrice }
        : price
    ));
  }

  return [createPrice(`PRICE-${Date.now()}`, unitPrice, effectiveDate, '', 'Bảng giá khởi tạo', createdBy)];
}

function toApiCategory(category: Category): ServicePayload['category'] {
  return category === 'Vé tham quan' ? 'ATTRACTION_TICKET' : 'OTHER';
}

function toApiPriceMode(priceMode: PriceMode): ServicePayload['priceMode'] {
  return priceMode === 'Báo giá' ? 'QUOTED' : 'LISTED';
}

function toApiPriceSetup(setup: PriceSetup): ServicePayload['priceSetup'] {
  if (setup === 'Theo độ tuổi') return 'BY_AGE';
  if (setup === '-') return 'NONE';
  return 'COMMON';
}

function toApiStatus(status: ServiceStatus): ServicePayload['status'] {
  return status === 'Hoạt động' ? 'ACTIVE' : 'INACTIVE';
}

function toApiFormula(option?: CountFormulaOption | QuantityFormulaOption) {
  if (option === 'Theo ngày') return 'BY_DAY';
  if (option === 'Giá trị mặc định') return 'DEFAULT_VALUE';
  if (option === 'Nhập tay') return 'MANUAL';
  return null;
}

export default function ServiceList() {
  const provinces = useAppDataStore(state => state.provinces);
  const role = useAuthStore(state => state?.user?.role || 'guest');
  const token = useAuthStore(state => state?.accessToken);
  const currentUser = useAuthStore(state => state?.user?.name || 'Điều phối viên');
  const services = useAppDataStore(state => state.services);
  const initializeProtected = useAppDataStore(state => state.initializeProtected);
  const setServices = useAppDataStore(state => state.setServices);
  const provinceOptions = useMemo(
    () => (provinces.length > 0 ? provinces.map((province) => province.name as Province) : ['Đà Nẵng', 'Hà Nội', 'Quảng Ninh', 'Lào Cai', 'Ninh Bình']),
    [provinces],
  );
  const defaultProvince = provinceOptions[0] ?? 'Đà Nẵng';

  const serviceRows = services.length > 0 ? services : initialServices;

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [priceEditor, setPriceEditor] = useState<{ serviceId: string; priceId?: string } | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft('Vé tham quan', defaultProvince));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [nextCategory, setNextCategory] = useState<AddCategory>('Vé tham quan');

  const selectedService = useMemo(() => serviceRows.find(service => service.id === selectedServiceId) ?? null, [selectedServiceId, serviceRows]);
  const editingService = useMemo(() => serviceRows.find(service => service.id === editingServiceId) ?? null, [editingServiceId, serviceRows]);
  const activePriceService = useMemo(() => serviceRows.find(service => service.id === priceEditor?.serviceId) ?? null, [priceEditor, serviceRows]);
  const activePriceRow = useMemo(() => activePriceService?.prices.find(price => price.id === priceEditor?.priceId), [activePriceService, priceEditor]);

  const filteredServiceRows = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return serviceRows;
    return serviceRows.filter(service =>
      [
        service.id,
        service.name,
        service.category,
        service.unit,
        service.priceMode,
        service.setup,
        service.status,
        service.supplierName,
        service.contactInfo,
      ].join(' ').toLowerCase().includes(keyword),
    );
  }, [searchQuery, serviceRows]);

  const updateDraft = <K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) => {
    setDraft(previous => {
      const next = { ...previous, [key]: value };
      if (key === 'category' && value === 'Vé tham quan') {
        next.unit = 'Vé';
        next.priceMode = 'Giá niêm yết';
      }
      return next;
    });
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };

  const openCreateModal = () => {
    setNextCategory('Vé tham quan');
    setDraft(emptyDraft('Vé tham quan', defaultProvince));
    setErrors({});
    setIsCreateOpen(true);
  };

  const openEditModal = (service: ServiceRow) => {
    const adultPrice = service.prices.find(price => price.note.toLowerCase().includes('người lớn'))?.unitPrice ?? 0;
    const childPrice = service.prices.find(price => price.note.toLowerCase().includes('trẻ em'))?.unitPrice ?? 0;
    setDraft({
      id: service.id,
      name: service.name,
      category: service.category as Category,
      unit: service.unit,
      priceMode: service.priceMode as PriceMode,
      setup: service.setup as PriceSetup,
      status: service.status as ServiceStatus,
      description: service.description,
      supplierName: service.supplierName ?? '',
      contactInfo: service.contactInfo ?? '',
      generalPrice: String(service.prices.at(-1)?.unitPrice ?? ''),
      adultPrice: adultPrice ? String(adultPrice) : '',
      childPrice: childPrice ? String(childPrice) : '',
      province: (service.province as Province) ?? defaultProvince,
      formulaCount: (service.formulaCount as CountFormulaOption) ?? 'Theo ngày',
      formulaCountDefault: service.formulaCountDefault ?? '',
      formulaQuantity: (service.formulaQuantity as QuantityFormulaOption) ?? 'Theo số người',
      formulaQuantityDefault: service.formulaQuantityDefault ?? '',
    });
    setErrors({});
    setEditingServiceId(service.id);
    setSelectedServiceId(null);
  };

  const persistRows = (rows: ServiceRow[]) => {
    setServices(rows);
  };

  const saveDraft = () => {
    const nextErrors = validateDraft(draft, !editingServiceId);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      message.error('Cần nhập đầy đủ thông tin dịch vụ trước khi lưu');
      return;
    }

    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể lưu dịch vụ.');
      return;
    }

    {
      const apiPayload: ServicePayload = {
        code: draft.id,
        name: draft.name.trim(),
        category: toApiCategory(draft.category),
        unit: draft.category === 'Vé tham quan' ? 'Vé' : draft.unit.trim(),
        priceMode: draft.category === 'Vé tham quan' ? 'LISTED' : toApiPriceMode(draft.priceMode),
        priceSetup: toApiPriceSetup(draft.setup),
        status: editingServiceId ? toApiStatus(draft.status) : 'ACTIVE',
        description: draft.description.trim(),
        supplierName: draft.supplierName.trim() || undefined,
        contactInfo: draft.contactInfo.trim() || undefined,
        province: draft.category === 'Vé tham quan' ? draft.province : undefined,
        formulaCount: draft.category === 'Vé tham quan' ? 'DEFAULT_VALUE' : toApiFormula(draft.formulaCount),
        formulaCountDefault: draft.category === 'Vé tham quan' ? '1' : (draft.formulaCount === 'Giá trị mặc định' ? draft.formulaCountDefault : undefined),
        formulaQuantity: draft.category === 'Vé tham quan' ? 'DEFAULT_VALUE' : toApiFormula(draft.formulaQuantity),
        formulaQuantityDefault: draft.formulaQuantity === 'Giá trị mặc định' ? draft.formulaQuantityDefault : undefined,
        prices: buildPricesFromDraft(
          draft,
          currentUser,
          editingServiceId ? (serviceRows.find(service => service.id === editingServiceId)?.prices ?? []) : [],
        ),
      };

      void (async () => {
        try {
          if (editingServiceId) {
            const response = await patchService(token, editingServiceId, apiPayload);
            persistRows(serviceRows.map(service => service.id === editingServiceId ? response.service : service));
            setEditingServiceId(null);
            message.success('Đã cập nhật dịch vụ');
            return;
          }

          const response = await createService(token, apiPayload);
          persistRows([response.service, ...serviceRows]);
          setIsCreateOpen(false);
          message.success('Đã thêm dịch vụ');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể lưu dịch vụ');
        }
      })();
      return;
    }

    /* local fallback removed: coordinator writes must persist through backend */
    const nextRowBase: Omit<ServiceRow, 'id'> = {
      name: draft.name.trim(),
      category: draft.category,
      unit: draft.unit.trim(),
      priceMode: draft.category === 'Vé tham quan' ? 'Giá niêm yết' : draft.priceMode,
      setup: draft.setup,
      status: editingServiceId ? draft.status : 'Hoạt động',
      description: draft.description.trim(),
      supplierName: draft.supplierName.trim() || undefined,
      contactInfo: draft.contactInfo.trim() || undefined,
      province: draft.category === 'Vé tham quan' ? draft.province : undefined,
      formulaCount: draft.category === 'Vé tham quan' ? 'Giá trị mặc định' : draft.formulaCount,
      formulaCountDefault: draft.category === 'Vé tham quan' ? '1' : (draft.formulaCount === 'Giá trị mặc định' ? draft.formulaCountDefault : undefined),
      formulaQuantity: draft.category === 'Vé tham quan' ? 'Theo số người' : draft.formulaQuantity,
      formulaQuantityDefault: draft.formulaQuantity === 'Giá trị mặc định' ? draft.formulaQuantityDefault : undefined,
      prices: [],
    };

    if (editingServiceId) {
      persistRows(serviceRows.map(service => (
        service.id === editingServiceId
          ? { ...service, ...nextRowBase, prices: buildPricesFromDraft(draft, currentUser, service.prices) }
          : service
      )));
      setEditingServiceId(null);
      message.success('Đã cập nhật dịch vụ');
      return;
    }

    const nextId = `SV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    persistRows([
      {
        id: nextId,
        ...nextRowBase,
        prices: buildPricesFromDraft(draft, currentUser),
      },
      ...serviceRows,
    ]);
    setIsCreateOpen(false);
    message.success('Đã thêm dịch vụ');
  };

  const removeService = (serviceId: string) => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể xóa dịch vụ.');
      return;
    }

    {
      void (async () => {
        try {
          await deleteService(token, serviceId);
          persistRows(serviceRows.filter(service => service.id !== serviceId));
          setSelectedServiceId(null);
          setEditingServiceId(null);
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể xóa dịch vụ');
        }
      })();
      return;
    }

    persistRows(serviceRows.filter(service => service.id !== serviceId));
    setSelectedServiceId(null);
    setEditingServiceId(null);
  };

  const savePriceRow = (priceDraft: ServicePriceRow) => {
    const priceService = activePriceService;
    if (!priceService) return;
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể cập nhật bảng giá.');
      return;
    }

    {
      void (async () => {
        try {
          if (activePriceRow) {
            await patchServicePrice(token, activePriceService.id, activePriceRow.id, priceDraft);
          } else {
            await addServicePrice(token, activePriceService.id, priceDraft);
          }
          await initializeProtected();
          setPriceEditor(null);
          message.success('Đã cập nhật bảng giá');
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Không thể cập nhật bảng giá');
        }
      })();
      return;
    }

    const nextRows = serviceRows.map(service => {
      if (service.id !== priceService!.id) return service;
      let prices = [...service.prices];
      if (activePriceRow) {
        prices = prices.map(price => (price.id === activePriceRow.id ? { ...priceDraft, id: activePriceRow.id } : price));
      } else {
        if (!priceDraft.endDate) {
          prices = prices.map(price => (!price.endDate ? { ...price, endDate: priceDraft.effectiveDate } : price));
        }
        prices = [...prices, { ...priceDraft, id: `PRICE-${Date.now()}` }];
      }
      return { ...service, prices };
    });
    persistRows(nextRows);
    setPriceEditor(null);
    message.success('Đã cập nhật bảng giá');
  };

  const renderFieldError = (key: keyof DraftErrors) => {
    const error = errors[key];
    if (!error) return null;
    return <p className="text-xs text-red-600 mt-1">{error}</p>;
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
            <button onClick={openCreateModal} className="border border-[#D4AF37] bg-[#D4AF37] px-8 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white shadow-lg transition-opacity hover:opacity-90">
              Thêm dịch vụ
            </button>
          )}
        </div>

        <PageSearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo mã dịch vụ, tên dịch vụ, phân loại..." className="mb-6" />

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
                  <td className="px-6 py-5"><span className="border border-[#D4AF37]/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">{service.category}</span></td>
                  <td className="px-6 py-5 text-xs font-medium text-stone-600">{service.unit}</td>
                  <td className="px-6 py-5 text-xs text-stone-600">{service.priceMode}</td>
                  <td className="px-6 py-5 text-xs text-stone-600">{service.setup}</td>
                  <td className="px-6 py-5"><StatusToggle value={service.status as ServiceStatus} /></td>
                  <td className="px-6 py-5"><button onClick={() => setSelectedServiceId(service.id)} className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">Xem</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {(isCreateOpen || editingService) && (
        <Modal
          title={editingService ? `Sửa dịch vụ - ${editingService.name}` : 'Thêm dịch vụ'}
          subtitle={editingService ? 'Nhóm dịch vụ điều phối cho phép thêm mới bảng giá.' : 'Chỉ tạo dịch vụ cho Vé tham quan và Các dịch vụ khác.'}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingServiceId(null);
            setErrors({});
          }}
          wide
        >
          <div className="space-y-6">
            {!editingService && (
              <label className="block space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Phân loại</span>
                <select
                  value={nextCategory}
                  onChange={event => {
                    const category = event.target.value as AddCategory;
                    setNextCategory(category);
                    setDraft(emptyDraft(category, defaultProvince));
                    setErrors({});
                  }}
                  className="w-full border border-stone-200 px-4 py-3 text-sm outline-none"
                >
                  {addableCategories.map(category => <option key={category}>{category}</option>)}
                </select>
              </label>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Tên dịch vụ</span>
                <input value={draft.name} onChange={event => updateDraft('name', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                {renderFieldError('name')}
              </label>
              {draft.category !== 'Vé tham quan' && (
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Đơn vị</span>
                  <input value={draft.unit} onChange={event => updateDraft('unit', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                  {renderFieldError('unit')}
                </label>
              )}
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Tên nhà cung cấp</span>
                <input value={draft.supplierName} onChange={event => updateDraft('supplierName', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Thông tin liên hệ</span>
                <input value={draft.contactInfo} onChange={event => updateDraft('contactInfo', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
              {editingService && (
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Trạng thái</span>
                  <select value={draft.status} onChange={event => updateDraft('status', event.target.value as ServiceStatus)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    <option>Hoạt động</option>
                    <option>Dừng hoạt động</option>
                  </select>
                </label>
              )}
              {draft.category !== 'Vé tham quan' && (
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Hình thức giá</span>
                  <select value={draft.priceMode} onChange={event => updateDraft('priceMode', event.target.value as PriceMode)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    <option>Giá niêm yết</option>
                    <option>Báo giá</option>
                  </select>
                </label>
              )}
            </div>

            <label className="block space-y-2 text-sm font-medium text-[#2A2421]">
              <span>Mô tả</span>
              <textarea value={draft.description} onChange={event => updateDraft('description', event.target.value)} rows={3} className="w-full resize-none border border-stone-200 px-4 py-3 text-sm outline-none" />
              {renderFieldError('description')}
            </label>

            {draft.category === 'Vé tham quan' && (
              <div className="grid grid-cols-1 gap-4 rounded-sm border border-stone-200 p-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Tỉnh thành</span>
                  <select value={draft.province} onChange={event => updateDraft('province', event.target.value as Province)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    {provinceOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Thiết lập giá</span>
                  <select value={draft.setup} onChange={event => updateDraft('setup', event.target.value as PriceSetup)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    <option>Giá chung</option>
                    <option>Theo độ tuổi</option>
                  </select>
                </label>
                {!editingService && draft.priceMode !== 'Báo giá' && draft.setup === 'Theo độ tuổi' ? (
                  <>
                    <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                      <span>Đơn giá người lớn</span>
                      <input value={draft.adultPrice} onChange={event => updateDraft('adultPrice', event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                      {renderFieldError('adultPrice')}
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                      <span>Đơn giá trẻ em</span>
                      <input value={draft.childPrice} onChange={event => updateDraft('childPrice', event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                      {renderFieldError('childPrice')}
                    </label>
                  </>
                ) : !editingService && draft.priceMode !== 'Báo giá' ? (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421] md:col-span-2">
                    <span>Đơn giá</span>
                    <input value={draft.generalPrice} onChange={event => updateDraft('generalPrice', event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                    {renderFieldError('generalPrice')}
                  </label>
                ) : null}
              </div>
            )}

            {draft.category === 'Các dịch vụ khác' && (
              <div className="grid grid-cols-1 gap-4 rounded-sm border border-stone-200 p-4 md:grid-cols-2">
                {!editingService && draft.priceMode !== 'Báo giá' && (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421] md:col-span-2">
                    <span>Đơn giá</span>
                    <input value={draft.generalPrice} onChange={event => updateDraft('generalPrice', event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                    {renderFieldError('generalPrice')}
                  </label>
                )}
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lần</span>
                  <select value={draft.formulaCount} onChange={event => updateDraft('formulaCount', event.target.value as CountFormulaOption)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    {countFormulaOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lượng</span>
                  <select value={draft.formulaQuantity} onChange={event => updateDraft('formulaQuantity', event.target.value as QuantityFormulaOption)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    {quantityFormulaOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                {draft.formulaCount === 'Giá trị mặc định' && (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Số lần mặc định</span>
                    <input value={draft.formulaCountDefault} onChange={event => updateDraft('formulaCountDefault', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                    {renderFieldError('formulaCountDefault')}
                  </label>
                )}
                {draft.formulaQuantity === 'Giá trị mặc định' && (
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Số lượng mặc định</span>
                    <input value={draft.formulaQuantityDefault} onChange={event => updateDraft('formulaQuantityDefault', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
                    {renderFieldError('formulaQuantityDefault')}
                  </label>
                )}
              </div>
            )}

            {editingService && editingService.priceMode !== 'Báo giá' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">Bảng giá</p>
                  <button onClick={() => setPriceEditor({ serviceId: editingService.id })} className="border border-[#D4AF37] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                    Thêm mới bảng giá
                  </button>
                </div>
                <div className="overflow-x-auto border border-stone-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50">
                      <tr>
                        {['Đơn giá', 'Ngày hiệu lực', 'Ngày hết hiệu lực', 'Ghi chú', 'Người tạo', 'Thao tác'].map(header => (
                          <th key={header} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {editingService.prices.map(price => (
                        <tr key={price.id} className="border-t border-stone-100">
                          <td className="px-5 py-4">{formatCurrency(price.unitPrice)}</td>
                          <td className="px-5 py-4">{price.effectiveDate}</td>
                          <td className="px-5 py-4">{price.endDate || 'Đang áp dụng'}</td>
                          <td className="px-5 py-4">{price.note}</td>
                          <td className="px-5 py-4">{price.createdBy}</td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => setPriceEditor({ serviceId: editingService.id, priceId: price.id })}
                              className="inline-flex h-9 w-9 items-center justify-center border border-stone-200 text-[#2A2421] hover:border-[#D4AF37] hover:text-[#D4AF37]"
                              aria-label={`Sửa bảng giá ${price.note || price.id}`}
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-4 border-t border-stone-200 pt-6">
              <button onClick={() => { setIsCreateOpen(false); setEditingServiceId(null); }} className="flex-1 border border-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
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
        <Modal title={`Chi tiết ${selectedService.name}`} subtitle={lockedCategories.has(selectedService.category as Category) ? 'Nhóm dịch vụ hệ thống chỉ hiển thị thông tin chuẩn hóa.' : 'Nhóm dịch vụ điều phối có thể cập nhật bảng giá.'} onClose={() => setSelectedServiceId(null)} wide>
          <div className="space-y-6">
            {!lockedCategories.has(selectedService.category as Category) && (
              <div className="flex flex-wrap justify-end gap-3">
                <button onClick={() => openEditModal(selectedService)} className="border border-[#2A2421] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">Sửa</button>
                <button onClick={() => removeService(selectedService.id)} className="border border-rose-200 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-rose-700">Xóa</button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Phân loại" value={selectedService.category} />
              {selectedService.category !== 'Vé tham quan' && <Field label="Đơn vị" value={selectedService.unit} />}
              {selectedService.category !== 'Vé tham quan' && <Field label="Hình thức giá" value={selectedService.priceMode} />}
              <Field label="Thiết lập giá" value={selectedService.setup} />
              <Field label="Trạng thái" value={<StatusToggle value={selectedService.status as ServiceStatus} />} />
              <Field label="Mã dịch vụ" value={selectedService.id} />
              <Field label="Nhà cung cấp" value={selectedService.supplierName || '-'} />
              <Field label="Thông tin liên hệ" value={selectedService.contactInfo || '-'} />
              {selectedService.category === 'Vé tham quan' && <Field label="Tỉnh thành" value={selectedService.province || '-'} />}
              <Field label="Công thức tính số lần" value={describeFormula(selectedService.formulaCount, selectedService.formulaCountDefault)} />
              <Field label="Công thức tính số lượng" value={describeFormula(selectedService.formulaQuantity, selectedService.formulaQuantityDefault)} />
            </div>

            <Field label="Mô tả" value={selectedService.description} />

            {selectedService.priceMode !== 'Báo giá' && (
            <div className="overflow-hidden border border-stone-200">
              <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">Bảng giá</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white">
                    <tr className="border-b border-stone-200">
                      {['Đơn giá', 'Ngày hiệu lực', 'Ngày hết hiệu lực', 'Ghi chú', 'Người tạo'].map(header => (
                        <th key={header} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedService.prices.map(price => (
                      <tr key={price.id} className="border-b border-stone-100">
                        <td className="px-5 py-4">{formatCurrency(price.unitPrice)}</td>
                        <td className="px-5 py-4">{price.effectiveDate}</td>
                        <td className="px-5 py-4">{price.endDate || 'Đang áp dụng'}</td>
                        <td className="px-5 py-4">{price.note}</td>
                        <td className="px-5 py-4">{price.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
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
  price?: ServicePriceRow;
  onClose: () => void;
  onSave: (draft: ServicePriceRow) => void;
}) {
  const currentUser = useAuthStore(state => state?.user?.name || 'Điều phối viên');
  const [unitPrice, setUnitPrice] = useState(String(price?.unitPrice ?? ''));
  const [effectiveDate, setEffectiveDate] = useState(price?.effectiveDate ?? todayKey());
  const [endDate, setEndDate] = useState(price?.endDate ?? '');
  const [note, setNote] = useState(price?.note ?? '');
  const today = todayKey();
  const effectiveDateError = !effectiveDate
    ? 'Cần nhập ngày hiệu lực'
    : effectiveDate < today
      ? 'Ngày hiệu lực phải lớn hơn hoặc bằng ngày hiện tại'
      : '';
  const endDateError = endDate && endDate < effectiveDate
    ? 'Ngày hết hiệu lực phải lớn hơn hoặc bằng ngày hiệu lực'
    : '';

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
            <input value={currentUser} readOnly className="w-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Ngày hiệu lực</span>
            <input
              value={effectiveDate}
              min={today}
              onChange={event => {
                const nextDate = event.target.value;
                setEffectiveDate(nextDate);
                if (endDate && nextDate && nextDate > endDate) setEndDate('');
              }}
              type="date"
              className="w-full border border-stone-200 px-4 py-3 text-sm outline-none"
            />
            {effectiveDateError && <p className="text-xs text-red-600">{effectiveDateError}</p>}
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Ngày hết hiệu lực</span>
            <input
              value={endDate}
              min={effectiveDate || today}
              disabled={Boolean(effectiveDateError)}
              onChange={event => setEndDate(event.target.value)}
              type="date"
              className="w-full border border-stone-200 px-4 py-3 text-sm outline-none disabled:bg-stone-100 disabled:text-stone-400"
              placeholder="Có thể để trống"
            />
            {endDateError && <p className="text-xs text-red-600">{endDateError}</p>}
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-[#2A2421] block">
          <span>Ghi chú</span>
          <input value={note} onChange={event => setNote(event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
        </label>
        <div className="flex gap-4 border-t border-stone-200 pt-6">
          <button onClick={onClose} className="flex-1 border border-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">Hủy bỏ</button>
          <button
            onClick={() => {
              if (!unitPrice.trim() || Number(unitPrice) <= 0) {
                message.error('Đơn giá phải lớn hơn 0');
                return;
              }
              if (effectiveDateError || endDateError) {
                message.error(effectiveDateError || endDateError);
                return;
              }
              onSave({
                id: price?.id ?? '',
                unitPrice: Number(unitPrice || 0),
                effectiveDate,
                endDate,
                note: note || 'Bảng giá cập nhật',
                createdBy: currentUser,
              });
            }}
            className="flex-1 bg-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white"
          >
            Lưu bảng giá
          </button>
        </div>
      </div>
    </Modal>
  );
}
