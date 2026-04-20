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

interface PriceRow {
  id: string;
  label: string;
  unitPrice: number;
  note: string;
  effectiveDate: string;
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
  province?: Province;
  formulaCount?: string;
  formulaQuantity?: string;
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
  province: Province;
  formulaCount: string;
  formulaQuantity: string;
}

const provinceOptions: Province[] = ['Đà Nẵng', 'Hà Nội', 'Quảng Ninh', 'Lào Cai', 'Ninh Bình'];

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
    prices: [{ id: 'SV-HDV-P1', label: 'Giá chuẩn', unitPrice: 400000, note: 'Áp dụng tour nội địa', effectiveDate: '2026-01-01' }],
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
    prices: [{ id: 'SV-SGL-P1', label: 'Giá chuẩn', unitPrice: 1200000, note: 'Khách sạn 3 sao', effectiveDate: '2026-01-01' }],
  },
  {
    id: 'SV-BUS',
    name: 'Xe tham quan',
    category: 'Vận chuyển',
    unit: 'xe',
    priceMode: 'Báo giá',
    setup: '-',
    status: 'Hoạt động',
    description: 'Dịch vụ vận chuyển theo xe, không tạo mới từ kho dịch vụ.',
    prices: [{ id: 'SV-BUS-P1', label: 'Báo giá quý II', unitPrice: 8100000, note: 'Xe 29 chỗ', effectiveDate: '2026-04-01' }],
  },
  {
    id: 'SV-AIR',
    name: 'Vé máy bay',
    category: 'Vận chuyển',
    unit: 'khách',
    priceMode: 'Báo giá',
    setup: 'Theo độ tuổi',
    status: 'Hoạt động',
    description: 'Dịch vụ vé máy bay đoàn.',
    prices: [
      { id: 'SV-AIR-P1', label: 'Người lớn', unitPrice: 4400000, note: 'Khứ hồi', effectiveDate: '2026-04-01' },
      { id: 'SV-AIR-P2', label: 'Trẻ em', unitPrice: 4200000, note: 'Khứ hồi', effectiveDate: '2026-04-01' },
    ],
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
    province: 'Đà Nẵng',
    prices: [
      { id: 'SV-TKT-P1', label: 'Người lớn', unitPrice: 250000, note: 'Giá cổng', effectiveDate: '2026-01-01' },
      { id: 'SV-TKT-P2', label: 'Trẻ em', unitPrice: 180000, note: 'Cao từ 1m - 1m4', effectiveDate: '2026-01-01' },
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
    formulaCount: 'Giá trị mặc định',
    formulaQuantity: 'Theo người',
    prices: [{ id: 'SV-INS-P1', label: 'Giá chuẩn', unitPrice: 40000, note: 'Bảo hiểm nội địa', effectiveDate: '2026-01-01' }],
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
  province: 'Đà Nẵng',
  formulaCount: 'Không có',
  formulaQuantity: 'Không có',
});

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')} đ`;

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

  const selectedService = useMemo(
    () => serviceRows.find(service => service.id === selectedServiceId) ?? null,
    [selectedServiceId, serviceRows],
  );
  const editingService = useMemo(
    () => serviceRows.find(service => service.id === editingServiceId) ?? null,
    [editingServiceId, serviceRows],
  );
  const activePriceService = useMemo(
    () => serviceRows.find(service => service.id === priceEditor?.serviceId) ?? null,
    [priceEditor, serviceRows],
  );
  const activePriceRow = useMemo(
    () => activePriceService?.prices.find(price => price.id === priceEditor?.priceId),
    [activePriceService, priceEditor],
  );
  const filteredServiceRows = useMemo(() => {
    const keyword = searchQuery?.trim()?.toLowerCase();
    if (!keyword) return serviceRows;
    return serviceRows?.filter(service =>
      [
        service?.id,
        service?.name,
        service?.category,
        service?.unit,
        service?.priceMode,
        service?.setup,
        service?.status,
        service?.province,
      ]?.join(' ')?.toLowerCase()?.includes(keyword),
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

  const saveDraft = () => {
    if (editingServiceId) {
      setServiceRows(previous =>
        previous.map(service => (
          service.id === editingServiceId
            ? {
              ...service,
              name: draft.name || service.name,
              category: draft.category,
              unit: draft.unit,
              priceMode: draft.priceMode,
              setup: draft.setup,
              status: draft.status,
              description: draft.description,
              province: draft.category === 'Vé tham quan' ? draft.province : undefined,
              formulaCount: draft.category === 'Các dịch vụ khác' ? draft.formulaCount : undefined,
              formulaQuantity: draft.category === 'Các dịch vụ khác' ? draft.formulaQuantity : undefined,
            }
            : service
        )),
      );
      setEditingServiceId(null);
      return;
    }

    const nextId = `SV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const nextService: ServiceRow = {
      id: nextId,
      name: draft.name || (draft.category === 'Vé tham quan' ? 'Vé tham quan mới' : 'Dịch vụ khác mới'),
      category: draft.category,
      unit: draft.unit,
      priceMode: draft.priceMode,
      setup: draft.setup,
      status: draft.status,
      description: draft.description || 'Chưa có mô tả.',
      province: draft.category === 'Vé tham quan' ? draft.province : undefined,
      formulaCount: draft.category === 'Các dịch vụ khác' ? draft.formulaCount : undefined,
      formulaQuantity: draft.category === 'Các dịch vụ khác' ? draft.formulaQuantity : undefined,
      prices: [],
    };
    setServiceRows(previous => [nextService, ...previous]);
    setSelectedServiceId(nextId);
    setIsCreateOpen(false);
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
      province: service.province ?? 'Đà Nẵng',
      formulaCount: service.formulaCount ?? 'Không có',
      formulaQuantity: service.formulaQuantity ?? 'Không có',
    });
    setEditingServiceId(service.id);
    setSelectedServiceId(null);
  };

  const removeService = (serviceId: string) => {
    setServiceRows(previous => previous.filter(service => service.id !== serviceId));
    setSelectedServiceId(null);
    setEditingServiceId(null);
  };

  const savePriceRow = (priceDraft: PriceRow) => {
    if (!activePriceService) return;

    setServiceRows(previous =>
      previous.map(service => {
        if (service.id !== activePriceService.id) return service;
        const nextPrices = activePriceRow
          ? service.prices.map(price => (price.id === activePriceRow.id ? { ...priceDraft, id: activePriceRow.id } : price))
          : [...service.prices, { ...priceDraft, id: `PRICE-${Date.now()}` }];
        return { ...service, prices: nextPrices };
      }),
    );
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
              Kho dịch vụ chỉ tạo mới cho Vé tham quan và Các dịch vụ khác. Vận chuyển vẫn được quản lý như dịch vụ hệ thống có sẵn,
              không phát sinh thêm từ màn này.
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
          placeholder="Tìm theo mã dịch vụ, tên dịch vụ, phân loại, tỉnh thành..."
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
                  <td className="px-6 py-5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">{service.status}</td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => setSelectedServiceId(service.id)}
                      className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
              {filteredServiceRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-sm text-stone-400">
                    Không có dịch vụ phù hợp với từ khóa tìm kiếm
                  </td>
                </tr>
              )}
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
                aria-label="Phân loại"
              >
                <option>Vé tham quan</option>
                <option>Các dịch vụ khác</option>
              </select>
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Tên dịch vụ</span>
                <input
                  value={draft.name}
                  onChange={event => updateDraft('name', event.target.value)}
                  className="w-full border border-stone-200 px-4 py-3 text-sm outline-none"
                  placeholder="Nhập tên dịch vụ"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                <span>Đơn vị</span>
                <input value={draft.unit} onChange={event => updateDraft('unit', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-[#2A2421]">
              <span>Mô tả</span>
              <textarea
                value={draft.description}
                onChange={event => updateDraft('description', event.target.value)}
                rows={3}
                className="w-full resize-none border border-stone-200 px-4 py-3 text-sm outline-none"
                placeholder="Mô tả ngắn cho dịch vụ"
              />
            </label>

            {nextCategory === 'Vé tham quan' ? (
              <div className="grid grid-cols-1 gap-4 rounded-sm border border-stone-200 p-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Tỉnh thành</span>
                  <select value={draft.province} onChange={event => updateDraft('province', event.target.value as Province)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Tỉnh thành">
                    {provinceOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Thiết lập giá</span>
                  <select value={draft.setup} onChange={event => updateDraft('setup', event.target.value as PriceSetup)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Thiết lập giá">
                    <option>Giá chung</option>
                    <option>Theo độ tuổi</option>
                  </select>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 rounded-sm border border-stone-200 p-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lần</span>
                  <select value={draft.formulaCount} onChange={event => updateDraft('formulaCount', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Công thức tính số lần">
                    <option>Không có</option>
                    <option>Giá trị mặc định</option>
                    <option>Theo ngày</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Công thức tính số lượng</span>
                  <select value={draft.formulaQuantity} onChange={event => updateDraft('formulaQuantity', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" aria-label="Công thức tính số lượng">
                    <option>Không có</option>
                    <option>Giá trị mặc định</option>
                    <option>Theo người</option>
                  </select>
                </label>
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
        <Modal title={`Chi tiết ${selectedService.name}`} subtitle="Màn xem chi tiết chỉ có Sửa và Xóa." onClose={() => setSelectedServiceId(null)} wide>
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => openEditModal(selectedService)}
                className="border border-[#2A2421] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]"
              >
                Sửa
              </button>
              <button
                onClick={() => removeService(selectedService.id)}
                className="border border-rose-200 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-rose-700"
              >
                Xóa
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Mã dịch vụ" value={selectedService.id} />
              <Field label="Phân loại" value={selectedService.category} />
              <Field label="Trạng thái" value={selectedService.status} />
              <Field label="Đơn vị" value={selectedService.unit} />
              <Field label="Hình thức giá" value={selectedService.priceMode} />
              <Field label="Thiết lập giá" value={selectedService.setup} />
              <Field label="Tỉnh thành" value={selectedService.province ?? '-'} />
              <Field label="Công thức số lần" value={selectedService.formulaCount ?? '-'} />
              <Field label="Công thức số lượng" value={selectedService.formulaQuantity ?? '-'} />
            </div>

            <Field label="Mô tả" value={selectedService.description} />

            <div className="overflow-hidden border border-stone-200">
              <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">Bảng giá hiện có</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white">
                    <tr className="border-b border-stone-200">
                      {['Mức giá', 'Đơn giá', 'Ngày hiệu lực', 'Ghi chú'].map(header => (
                        <th key={header} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedService.prices.map(price => (
                      <tr key={price.id} className="border-b border-stone-100">
                        <td className="px-5 py-4 font-medium text-[#2A2421]">{price.label}</td>
                        <td className="px-5 py-4">{formatCurrency(price.unitPrice)}</td>
                        <td className="px-5 py-4">{price.effectiveDate}</td>
                        <td className="px-5 py-4">{price.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {editingService && (
        <Modal title={`Sửa dịch vụ - ${editingService.name}`} subtitle="Màn sửa có Thêm bảng giá và chỉnh sửa từng dòng giá." onClose={() => setEditingServiceId(null)} wide>
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              {(editingService.category === 'Vé tham quan' || editingService.category === 'Các dịch vụ khác') && (
                <button
                  onClick={() => setPriceEditor({ serviceId: editingService.id })}
                  className="border border-[#D4AF37] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]"
                >
                  Thêm bảng giá
                </button>
              )}
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
              {editingService.category !== 'Vận chuyển' && (
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Thiết lập giá</span>
                  <select value={draft.setup} onChange={event => updateDraft('setup', event.target.value as PriceSetup)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white">
                    <option>Giá chung</option>
                    <option>Theo độ tuổi</option>
                  </select>
                </label>
              )}
              {editingService.category === 'Vé tham quan' && (
                <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                  <span>Tỉnh thành</span>
                  <select value={draft.province} onChange={event => updateDraft('province', event.target.value as Province)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white" aria-label="Tỉnh thành">
                    {provinceOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
              )}
              {editingService.category === 'Các dịch vụ khác' && (
                <>
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Công thức tính số lần</span>
                    <select value={draft.formulaCount} onChange={event => updateDraft('formulaCount', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white" aria-label="Công thức tính số lần">
                      <option>Không có</option>
                      <option>Giá trị mặc định</option>
                      <option>Theo ngày</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-[#2A2421]">
                    <span>Công thức tính số lượng</span>
                    <select value={draft.formulaQuantity} onChange={event => updateDraft('formulaQuantity', event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none bg-white" aria-label="Công thức tính số lượng">
                      <option>Không có</option>
                      <option>Giá trị mặc định</option>
                      <option>Theo người</option>
                    </select>
                  </label>
                </>
              )}
            </div>

            <label className="block space-y-2 text-sm font-medium text-[#2A2421]">
              <span>Mô tả</span>
              <textarea value={draft.description} onChange={event => updateDraft('description', event.target.value)} rows={3} className="w-full resize-none border border-stone-200 px-4 py-3 text-sm outline-none" />
            </label>

            <div className="overflow-hidden border border-stone-200">
              <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">Danh sách bảng giá</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white">
                    <tr className="border-b border-stone-200">
                      {['Mức giá', 'Đơn giá', 'Ngày hiệu lực', 'Ghi chú', 'Thao tác'].map(header => (
                        <th key={header} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editingService.prices.map(price => (
                      <tr key={price.id} className="border-b border-stone-100">
                        <td className="px-5 py-4 font-medium text-[#2A2421]">{price.label}</td>
                        <td className="px-5 py-4">{formatCurrency(price.unitPrice)}</td>
                        <td className="px-5 py-4">{price.effectiveDate}</td>
                        <td className="px-5 py-4">{price.note}</td>
                        <td className="px-5 py-4">
                          <button onClick={() => setPriceEditor({ serviceId: editingService.id, priceId: price.id })} className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
                            Chỉnh sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
  const [label, setLabel] = useState(price?.label ?? (service.setup === 'Theo độ tuổi' ? 'Người lớn' : 'Giá chuẩn'));
  const [unitPrice, setUnitPrice] = useState(String(price?.unitPrice ?? ''));
  const [effectiveDate, setEffectiveDate] = useState(price?.effectiveDate ?? '2026-04-20');
  const [note, setNote] = useState(price?.note ?? '');

  return (
    <Modal title={price ? 'Chỉnh sửa bảng giá' : 'Thêm bảng giá'} subtitle={service.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Mức giá</span>
            <input value={label} onChange={event => setLabel(event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Đơn giá</span>
            <input value={unitPrice} onChange={event => setUnitPrice(event.target.value)} type="number" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Ngày hiệu lực</span>
            <input value={effectiveDate} onChange={event => setEffectiveDate(event.target.value)} type="date" className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
          <label className="space-y-2 text-sm font-medium text-[#2A2421]">
            <span>Ghi chú</span>
            <input value={note} onChange={event => setNote(event.target.value)} className="w-full border border-stone-200 px-4 py-3 text-sm outline-none" />
          </label>
        </div>
        <div className="flex gap-4 border-t border-stone-200 pt-6">
          <button onClick={onClose} className="flex-1 border border-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#2A2421]">
            Hủy bỏ
          </button>
          <button
            onClick={() => onSave({ id: price?.id ?? '', label, unitPrice: Number(unitPrice || 0), note, effectiveDate })}
            className="flex-1 bg-[#2A2421] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white"
          >
            Lưu bảng giá
          </button>
        </div>
      </div>
    </Modal>
  );
}
