import { Fragment, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import {
  mockTourInstances,
  mockTourPrograms,
  type TourInstance,
} from '@entities/tour-program/data/tourProgram';
import { mockBookings } from '@entities/booking/data/bookings';
import { mockUsers } from '@entities/user/data/users';
import type { Booking } from '@entities/booking/data/bookings';

type Tab = 'tong_quan' | 'ds_kh' | 'lichtrinh' | 'dutoan';

type ReceiveEstimateRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  supplierName: string;
  serviceVariant: string;
  note: string;
};

function formatCurrency(value: number) {
  return `${value?.toLocaleString('vi-VN')} đ`;
}

function cleanText(value?: string) {
  return (value ?? '-').replace(/\?\./g, '.').replace(/\s+\?/g, '');
}

function getUsageMetric(unit: string, quantity: number) {
  const normalizedUnit = unit?.toLowerCase();
  if (normalizedUnit?.includes('đêm')) return `${quantity} đêm`;
  if (normalizedUnit?.includes('bữa') || normalizedUnit?.includes('bàn')) return `${quantity} bữa`;
  if (normalizedUnit?.includes('lượt') || normalizedUnit?.includes('chuyến')) return `${quantity} lượt`;
  return `${quantity} lượt`;
}

function getTargetLabel(itemName: string) {
  const normalized = itemName?.toLowerCase();
  if (normalized?.includes('trẻ em')) return 'Trẻ em';
  if (normalized?.includes('sơ sinh')) return 'Trẻ sơ sinh';
  if (normalized?.includes('người lớn')) return 'Người lớn';
  return 'Tất cả';
}

export default function TourReceiveDispatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('tong_quan');
  const [isReceived, setIsReceived] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const instance: TourInstance | undefined = mockTourInstances?.find(i => i.id === id);
  const program = instance ? mockTourPrograms?.find(p => p.id === instance?.programId) : undefined;
  const bookings = mockBookings?.filter((b: Booking) => b?.tourName?.includes(instance?.programName ?? ''));
  const createdByName = mockUsers?.find(u => u.id === program?.createdBy)?.name ?? program?.createdBy ?? '-';

  if (!instance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-primary/50">Tour không tồn tại</p>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'tong_quan', label: 'Tổng quan' },
    { key: 'ds_kh', label: 'Danh sách booking' },
    { key: 'lichtrinh', label: 'Lịch trình' },
    { key: 'dutoan', label: 'Dự toán' },
  ];

  const estimateRows = useMemo<ReceiveEstimateRow[]>(() => {
    if (instance?.costEstimate) {
      return instance?.costEstimate?.categories?.flatMap(category =>
        category?.items?.flatMap(item =>
          item?.suppliers
            ?.filter(supplier => supplier?.isPrimary)
            ?.map(supplier => ({
              id: `${category?.id}-${item?.id}-${supplier?.supplierId}`,
              categoryId: category?.id,
              categoryName: category?.name,
              itemName: item?.name,
              unit: item?.unit,
              quantity: item?.quantity,
              unitPrice: supplier?.quotedPrice,
              total: supplier?.quotedPrice * item?.quantity,
              supplierName: supplier?.supplierName,
              serviceVariant: supplier?.serviceVariant,
              note: supplier?.notes ?? '',
            })),
        ),
      );
    }

    return [
      { id: 'A-1', categoryId: 'A', categoryName: 'Vận chuyển', itemName: 'Xe tham quan', unit: 'Xe', quantity: 1, unitPrice: 8100000, total: 8100000, supplierName: 'NCC A', serviceVariant: 'Xe 29 chỗ', note: 'Không có' },
      { id: 'B-1', categoryId: 'B', categoryName: 'Khách sạn', itemName: 'Phòng đôi - Đêm 1, Đêm 2', unit: 'Phòng', quantity: 9, unitPrice: 1300000, total: 23400000, supplierName: 'Khách sạn A', serviceVariant: 'Phòng đôi', note: 'Kế thừa từ dự toán chương trình' },
      { id: 'C-1', categoryId: 'C', categoryName: 'Chi phí ăn', itemName: 'Ngày 1 - Bữa trưa', unit: 'Người', quantity: instance?.expectedGuests ?? 1, unitPrice: 120000, total: (instance?.expectedGuests ?? 1) * 120000, supplierName: 'Nhà hàng A', serviceVariant: 'Set 1', note: '' },
      { id: 'D-1', categoryId: 'D', categoryName: 'Vé thắng cảnh', itemName: 'Ngày 1 - Vé tham quan Sunworld', unit: 'Người', quantity: instance?.expectedGuests ?? 1, unitPrice: 250000, total: (instance?.expectedGuests ?? 1) * 250000, supplierName: 'NCC A', serviceVariant: 'Vé tham quan', note: '' },
      { id: 'E-1', categoryId: 'E', categoryName: 'Hướng dẫn viên', itemName: 'Hướng dẫn viên', unit: 'Ngày', quantity: program?.duration?.days ?? 1, unitPrice: 400000, total: (program?.duration?.days ?? 1) * 400000, supplierName: 'HDV nội địa', serviceVariant: 'Hướng dẫn viên', note: '' },
      { id: 'F-1', categoryId: 'F', categoryName: 'Chi phí khác', itemName: 'Bảo hiểm du lịch', unit: 'Người', quantity: instance?.expectedGuests ?? 1, unitPrice: 200000, total: (instance?.expectedGuests ?? 1) * 200000, supplierName: 'NCC V', serviceVariant: 'Bảo hiểm du lịch', note: '' },
    ];
  }, [instance, program]);

  const groupedEstimateRows = useMemo(() => {
    const byCategory = new Map<string, { categoryId: string; categoryName: string; rows: ReceiveEstimateRow[] }>();
    estimateRows?.forEach(row => {
      if (!byCategory?.has(row?.categoryId)) {
        byCategory?.set(row?.categoryId, { categoryId: row?.categoryId, categoryName: row?.categoryName, rows: [] });
      }
      byCategory?.get(row?.categoryId)?.rows?.push(row);
    });
    return Array.from(byCategory?.values());
  }, [estimateRows]);

  const totalEstimate = estimateRows?.reduce((sum, row) => sum + row?.total, 0);

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-32">
      <main className="p-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Breadcrumb
              className="mb-4 text-xs"
              items={[
                { title: <Link to="/coordinator/tours" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Điều hành tour</Link> },
                { title: <span className="text-[var(--color-primary)]/30">Nhận điều hành</span> },
              ]}
            />
            <h1 className="font-serif text-2xl text-primary">{instance?.programName}</h1>
            <p className="text-xs text-primary/50 mt-1">
              Mã tour: <span className="font-mono">{instance?.id}</span> ·{' '}
              {new Date(instance?.departureDate)?.toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Receive button — only show if not yet received */}
          {!isReceived && (
            <button
              onClick={() => {
                setIsReceived(true);
                navigate('/coordinator/tours', { state: { tab: 'cho_du_toan' } });
              }}
              className="px-8 py-3.5 bg-purple-600 text-white font-sans uppercase tracking-widest text-[11px] font-bold hover:bg-purple-700 transition-colors shadow-md"
            >
              Nhận điều hành
            </button>
          )}
          {isReceived && (
            <span className="flex items-center gap-2 px-5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Đã nhận điều hành
            </span>
          )}
        </div>

        {/* 4 Tabs */}
        <div className="flex border-b border-outline-variant/30 bg-white mb-0">
          {TABS?.map(t => (
            <button
              key={t?.key}
              onClick={() => setActiveTab(t?.key)}
              className={`px-6 py-3 text-[11px] font-medium border-b-2 transition-colors ${
                activeTab === t?.key
                  ? 'border-[var(--color-secondary)] text-[var(--color-secondary)]'
                  : 'border-transparent text-primary/40 hover:text-primary/70'
              }`}
            >
              {t?.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white border border-t-0 border-outline-variant/30 p-8">

          {/* TAB 1: Tổng quan */}
          {activeTab === 'tong_quan' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Mã tour', value: instance?.id, mono: true },
                  { label: 'Tên chương trình', value: instance?.programName },
                  { label: 'Thời lượng', value: program ? `${program?.duration?.days} ngày ${program?.duration?.nights} đêm` : '—' },
                  { label: 'Ngày khởi hành', value: new Date(instance?.departureDate)?.toLocaleDateString('vi-VN') },
                  { label: 'Ngày kết thúc', value: program ? new Date(new Date(instance?.departureDate)?.getTime() + program?.duration?.days * 86400000)?.toLocaleDateString('vi-VN') : '—' },
                  { label: 'Điểm khởi hành', value: instance?.departurePoint },
                  { label: 'Điểm tham quan', value: instance?.sightseeingSpots?.join(', ') },
                  { label: 'Phương tiện', value: instance.transport === 'xe' ? 'Xe du lịch' : 'Máy bay' },
                  { label: 'Số khách dự kiến', value: `${instance?.expectedGuests} người` },
                { label: 'Người tạo chương trình', value: createdByName },
              ]?.map(item => (
                  <div key={item?.label} className="bg-[var(--color-surface)] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-1">{item?.label}</p>
                    <p className={`text-sm font-medium text-primary ${item?.mono ? 'font-mono' : ''}`}>
                      {item?.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-[var(--color-surface)] p-5">
                <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-1">Mô tả</p>
                <p className="text-sm text-primary/70">
                  {program ? `Chương trình tour ${program?.duration?.days} ngày ${program?.duration?.nights} đêm khởi hành từ ${instance?.departurePoint} đến ${instance?.sightseeingSpots?.join(', ')}. Phương tiện: ${instance.transport === 'xe' ? 'Xe du lịch' : 'Máy bay'}.` : '-'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Danh sách booking */}
          {activeTab === 'ds_kh' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-headline text-lg text-primary">Danh sách booking</h3>
                <span className="text-xs bg-[var(--color-surface)] px-3 py-1 text-primary/60 font-mono">
                  {bookings?.length} đơn đặt
                </span>
              </div>
              {bookings.length === 0 ? (
                <div className="text-center py-16 text-primary/40">
                  <span className="material-symbols-outlined text-5xl block mb-3">person_off</span>
                  <p className="text-sm">Chưa có khách đặt tour này</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                        {['Mã đơn', 'Khách đặt', 'Liên hệ', 'Hành khách', 'Tổng tiền', 'Trạng thái']?.map(h => (
                          <th key={h} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings?.map((b: Booking) => (
                        <tr key={b?.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs">{b?.bookingCode}</td>
                          <td className="px-4 py-3.5 text-sm">{b?.contactInfo?.name}</td>
                          <td className="px-4 py-3.5 text-xs text-primary/60">{b?.contactInfo?.phone}</td>
                          <td className="px-4 py-3.5 text-xs">{b?.passengers?.length} người</td>
                          <td className="px-4 py-3.5 text-sm font-medium">{b?.totalAmount?.toLocaleString('vi-VN')}đ</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-[10px] px-2 py-1 border font-label uppercase tracking-wider ${
                              b.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              b.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {b.paymentStatus === 'paid' ? 'Đã TT' : b.paymentStatus === 'partial' ? 'Còn nợ' : 'Chưa TT'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Lịch trình */}
          {activeTab === 'lichtrinh' && (
            <div className="space-y-6">
              <h3 className="font-headline text-lg text-primary">Lịch trình tour</h3>
              {program?.itinerary?.map(day => (
                <div key={day?.day} className="flex gap-6 pb-5 border-b border-outline-variant/20 last:border-0">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center shrink-0">
                    <span className="font-headline font-bold text-[var(--color-secondary)]">{day?.day}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-primary text-base">{day?.title}</h4>
                      {day?.meals?.length > 0 && (
                        <div className="flex gap-1">
                          {day?.meals?.map(m => (
                            <span key={m} className="text-[10px] bg-[var(--color-surface)] px-2 py-0.5 text-primary/50 font-label uppercase">
                              {m === 'breakfast' ? 'Sáng' : m === 'lunch' ? 'Trưa' : 'Tối'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-primary/60">{cleanText(day?.description)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Dự toán */}
          {activeTab === 'dutoan' && (
            <div>
              <h3 className="font-headline text-lg text-primary mb-5">Dự toán chi phí tour</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {[
                  ['Giá bán người lớn', formatCurrency(instance?.priceAdult)],
                  ['Giá bán trẻ em', formatCurrency(instance?.priceChild)],
                  ['Tổng dự toán', formatCurrency(totalEstimate)],
                ]?.map(([label, value]) => (
                  <div key={label} className="bg-[var(--color-surface)] border border-outline-variant/20 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-primary/50">{label}</p>
                    <p className="font-serif text-xl text-primary mt-1">{value}</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto border border-outline-variant/30">
                <table className="w-full min-w-[1080px] text-left">
                  <thead>
                    <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                      {['STT', 'Khoản mục', 'Đơn vị', 'Đối tượng', 'Số lượng', 'Đêm/Lượt/Bữa', 'Đơn giá áp dụng', 'Thành tiền', 'Thao tác']?.map(header => (
                        <th key={header} className="px-4 py-3 text-[10px] uppercase tracking-widest text-primary/50 font-medium">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedEstimateRows?.map(category => (
                      <Fragment key={category?.categoryId}>
                        <tr key={`${category?.categoryId}-header`} className="bg-blue-50 border-t border-outline-variant/20">
                          <td colSpan={9} className="px-4 py-2 font-bold text-primary">{category?.categoryId}. {category?.categoryName}</td>
                        </tr>
                        {category?.rows?.map((row, index) => (
                          <Fragment key={row?.id}>
                            <tr key={row?.id} className="border-t border-outline-variant/15">
                              <td className="px-4 py-3 text-primary/50">{index + 1}</td>
                              <td className="px-4 py-3 font-medium">{row?.itemName}</td>
                              <td className="px-4 py-3">{row?.unit}</td>
                              <td className="px-4 py-3">{getTargetLabel(row?.itemName)}</td>
                              <td className="px-4 py-3">{row?.quantity}</td>
                              <td className="px-4 py-3">{getUsageMetric(row?.unit, row?.quantity)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(row?.unitPrice)}</td>
                              <td className="px-4 py-3 text-right font-bold">{formatCurrency(row?.total)}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setExpandedItems(previous => ({ ...previous, [row?.id]: !previous[row?.id] }))}
                                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-bold"
                                  aria-label={`${expandedItems[row?.id] ? 'Thu gọn' : 'Mở rộng'} ${row?.itemName}`}
                                >
                                  <span className="material-symbols-outlined text-base">{expandedItems[row?.id] ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                                  {expandedItems[row?.id] ? 'Thu gọn' : 'Mở rộng'}
                                </button>
                              </td>
                            </tr>
                            {expandedItems[row?.id] && (
                              <tr key={`${row?.id}-price`} className="bg-[#FBFBFB] border-t border-outline-variant/15">
                                <td colSpan={9} className="px-4 py-4">
                                  <div className="border border-outline-variant/25 bg-white">
                                    <p className="px-4 py-3 border-b border-outline-variant/20 text-[10px] uppercase tracking-widest text-primary/50 font-bold">Bảng giá đang áp dụng</p>
                                    <table className="w-full text-sm">
                                      <thead className="bg-[var(--color-surface)] text-primary/50">
                                        <tr>
                                          {['Nhà cung cấp', 'Dịch vụ', 'Đơn giá', 'Ghi chú', 'Sử dụng']?.map(header => (
                                            <th key={header} className="px-4 py-2 text-left text-[10px] uppercase tracking-widest">{header}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td className="px-4 py-3">{row?.supplierName}</td>
                                          <td className="px-4 py-3">{row?.serviceVariant}</td>
                                          <td className="px-4 py-3 text-right">{formatCurrency(row?.unitPrice)}</td>
                                          <td className="px-4 py-3">{row?.note || '-'}</td>
                                          <td className="px-4 py-3"><input type="checkbox" checked readOnly /></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

