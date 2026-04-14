import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { useAuthStore } from '@shared/store/useAuthStore';
import { mockTourInstances, mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import { mockBookings } from '@entities/booking/data/bookings';
import type { Booking } from '@entities/booking/data/bookings';

type EstimateSupplierRow = {
  rowId: string;
  categoryId: string;
  categoryName: string;
  itemId: number;
  itemName: string;
  unit: string;
  quantity: number;
  supplierId: string;
  supplierName: string;
  serviceVariant: string;
  unitPrice: number;
  total: number;
  note: string;
  isPrimary: boolean;
};

function formatCurrency(value: number) {
  return `${value?.toLocaleString('vi-VN')} đ`;
}

function getUsageMetric(unit: string, quantity: number) {
  const normalizedUnit = unit?.toLowerCase();
  if (normalizedUnit?.includes('đêm')) return `${quantity} đêm`;
  if (normalizedUnit?.includes('bữa') || normalizedUnit?.includes('bàn')) return `${quantity} bữa`;
  if (normalizedUnit?.includes('lượt') || normalizedUnit?.includes('chuyến')) return `${quantity} lượt`;
  return `${quantity} lượt`;
}

export default function TourEstimate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location?.pathname?.startsWith('/manager') ? '/manager' : '/coordinator';
  const user = useAuthStore(s => s?.user);
  const role = user?.role || 'guest';

  const instance = mockTourInstances?.find(i => i.id === id);
  const program = instance ? mockTourPrograms?.find(p => p.id === instance?.programId) : undefined;

  if (!instance || !program) {
    return (
      <div className="p-8 bg-[var(--color-background)] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-[var(--color-primary)]/20">calculate</span>
          <h1 className="font-serif text-2xl text-[var(--color-primary)]">Chưa có dữ liệu dự toán</h1>
          <p className="text-sm text-[var(--color-primary)]/50">
            API tour instance và tour program chưa được kết nối hoặc chưa có dữ liệu khả dụng?.
          </p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'itinerary' | 'estimate'>('overview');
  const [guestPopup, setGuestPopup] = useState<Booking | null>(null);
  const [pricePopup, setPricePopup] = useState<{ rowId: string; itemName: string; supplierName: string; systemPrice: number } | null>(null);
  const [updateSystemPrice, setUpdateSystemPrice] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const [estimateRows, setEstimateRows] = useState<EstimateSupplierRow[]>(() => {
    if (!instance?.costEstimate) {
      return [
        {
          rowId: 'A-1-SUP001',
          categoryId: 'A',
          categoryName: 'Vận chuyển',
          itemId: 1,
          itemName: 'Xe vận chuyển',
          unit: 'chuyến',
          quantity: 1,
          supplierId: 'SUP001',
          supplierName: 'Nhà xe đối tác',
          serviceVariant: 'Xe 29 chỗ',
          unitPrice: 0,
          total: 0,
          note: '',
          isPrimary: true,
        },
        {
          rowId: 'A-1-SUP002',
          categoryId: 'A',
          categoryName: 'Vận chuyển',
          itemId: 1,
          itemName: 'Xe vận chuyển',
          unit: 'chuyến',
          quantity: 1,
          supplierId: 'SUP002',
          supplierName: 'Vận tải Xuyên Việt',
          serviceVariant: 'Xe 35 chỗ',
          unitPrice: 5200000,
          total: 5200000,
          note: 'Phương án dự phòng',
          isPrimary: false,
        },
        {
          rowId: 'E-1-SUP003',
          categoryId: 'E',
          categoryName: 'Hướng dẫn viên',
          itemId: 1,
          itemName: 'Hướng dẫn viên',
          unit: 'ngày',
          quantity: program?.duration?.days ?? 1,
          supplierId: 'SUP003',
          supplierName: 'HDV nội địa',
          serviceVariant: 'HDV tiếng Việt',
          unitPrice: 1500000,
          total: 1500000 * (program?.duration?.days ?? 1),
          note: '',
          isPrimary: true,
        },
      ];
    }

    return instance?.costEstimate?.categories?.flatMap(category =>
      category?.items?.flatMap(item =>
        item?.suppliers?.map(supplier => ({
          rowId: `${category?.id}-${item?.id}-${supplier?.supplierId}`,
          categoryId: category?.id,
          categoryName: category?.name,
          itemId: item?.id,
          itemName: item?.name,
          unit: item?.unit,
          quantity: item?.quantity,
          supplierId: supplier?.supplierId,
          supplierName: supplier?.supplierName,
          serviceVariant: supplier?.serviceVariant,
          unitPrice: supplier?.quotedPrice,
          total: supplier?.quotedPrice * item?.quantity,
          note: supplier?.notes ?? '',
          isPrimary: supplier?.isPrimary,
        })),
      ),
    );
  });

  const updateSupplierRow = (rowId: string, changes: Partial<EstimateSupplierRow>) => {
    setEstimateRows(previous => previous?.map(row => {
      if (row?.rowId !== rowId) return row;
      const next = { ...row, ...changes };
      return { ...next, total: next?.quantity * next?.unitPrice };
    }));
  };

  const setPrimarySupplier = (rowId: string) => {
    const selected = estimateRows?.find(row => row.rowId === rowId);
    if (!selected) return;
    setEstimateRows(previous => previous?.map(row => {
      if (row.categoryId === selected?.categoryId && row.itemId === selected?.itemId) {
        return { ...row, isPrimary: row.rowId === rowId };
      }
      return row;
    }));
  };

  const toggleExpandedItem = (itemKey: string) => {
    setExpandedItems(previous => ({ ...previous, [itemKey]: !previous[itemKey] }));
  };

  const groupedRows = useMemo(() => {
    const byCategory = new Map<string, { categoryId: string; categoryName: string; items: Array<{ itemId: number; itemName: string; unit: string; quantity: number; rows: EstimateSupplierRow[] }> }>();
    estimateRows?.forEach(row => {
      if (!byCategory?.has(row?.categoryId)) {
        byCategory?.set(row?.categoryId, { categoryId: row?.categoryId, categoryName: row?.categoryName, items: [] });
      }
      const category = byCategory?.get(row?.categoryId)!;
      let item = category?.items?.find(entry => entry.itemId === row?.itemId);
      if (!item) {
        item = { itemId: row?.itemId, itemName: row?.itemName, unit: row?.unit, quantity: row?.quantity, rows: [] };
        category?.items?.push(item);
      }
      item?.rows?.push(row);
    });
    return Array.from(byCategory?.values());
  }, [estimateRows]);

  const totalCost = estimateRows?.reduce((sum, row) => sum + row?.total, 0);
  const expectedRevenue = instance?.priceAdult * instance?.expectedGuests;
  const profit = expectedRevenue - totalCost;
  const margin = expectedRevenue > 0 ? (profit / expectedRevenue) * 100 : 0;

  const tourBookings = mockBookings?.filter((booking: Booking) =>
    booking?.tourName?.toLowerCase()?.includes(instance?.programName?.toLowerCase()?.split(' ')[0]),
  );

  const tabs = [
    { key: 'overview' as const, label: 'Tổng quan' },
    { key: 'guests' as const, label: 'Danh sách khách hàng', badge: tourBookings?.length || null },
    { key: 'itinerary' as const, label: 'Lịch trình' },
    { key: 'estimate' as const, label: 'Dự toán' },
  ];

  return (
    <div className="p-8 bg-[var(--color-background)] min-h-screen">
      <Breadcrumb
        className="mb-4 text-xs"
        items={[
          { title: <Link to={`${basePrefix}/tours`} className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Điều hành tour</Link> },
          { title: <span className="text-[var(--color-primary)]/30">Dự toán</span> },
        ]}
      />

      <div className="mb-8 flex justify-between items-end">
        <div>
          <nav
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-primary)]/50 mb-4 cursor-pointer"
            onClick={() => navigate(`${basePrefix}/tours`)}
          >
            <span>Quản lý Tour</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[var(--color-primary)] font-bold">{id ?? instance?.id}</span>
          </nav>
          <h1 className="font-serif text-3xl text-[var(--color-primary)]">Lập Dự Toán Chi Ph?</h1>
          <p className="text-sm text-[var(--color-primary)]/50 mt-1">{instance?.programName} ? {instance?.departureDate}</p>
        </div>
        <div className="flex gap-4">
          {role === 'manager' ? (
            <>
              <button onClick={() => navigate(`${basePrefix}/tours`)} className="px-6 py-2 border border-red-500 text-red-600 hover:bg-red-50 text-sm uppercase tracking-widest transition-colors font-medium">
                Từ Chối
              </button>
              <button onClick={() => navigate(`${basePrefix}/tours`)} className="px-6 py-2 bg-[#2C5545] text-white hover:bg-[#1a382b] text-sm uppercase tracking-widest transition-colors font-medium shadow-md">
                Phê Duyệt Dự Toán
              </button>
            </>
          ) : (
            <>
              <button className="px-6 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-black/5 text-sm uppercase tracking-widest transition-colors font-medium">
                Lưu Nháp
              </button>
              <button className="px-6 py-2 bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90 text-sm uppercase tracking-widest transition-colors font-medium shadow-md">
                Gửi Phê Duyệt
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-8 mb-8 border-b border-[#D0C5AF]/40">
        {tabs?.map(tab => (
          <button
            key={tab?.key}
            onClick={() => setActiveTab(tab?.key)}
            className={`pb-4 px-2 text-sm uppercase tracking-widest font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab?.key
                ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]'
                : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
            }`}
          >
            {tab?.label}
            {tab?.badge != null && (
              <span className="bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {tab?.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white border border-[#D0C5AF]/40 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 border-b border-[#D0C5AF]/30 pb-4">
              <div>
                <h3 className="font-serif text-lg text-[var(--color-primary)]">Thông tin Tour</h3>
                <p className="text-xs text-[var(--color-primary)]/50 mt-1">Tab tổng quan chỉ giữ thông tin vận hành cốt lõi, không lặp lại dữ liệu giá và nhà cung cấp?.</p>
              </div>
              <span className="px-3 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-[10px] uppercase tracking-widest font-bold">
                {instance.transport === 'xe' ? 'Tour xe' : 'Tour máy bay'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
              {[
                ['Mã tour', instance?.id],
                ['Tên chương trình', instance?.programName],
                ['Thời lượng tour', `${program?.duration?.days} ngày ${program?.duration?.nights} đêm`],
                ['Ngày khởi hành', new Date(instance?.departureDate)?.toLocaleDateString('vi-VN')],
                ['Điểm khởi hành', instance?.departurePoint],
                ['Điểm tham quan', instance?.sightseeingSpots?.join(', ')],
                ['Phương tiện', instance.transport === 'xe' ? 'Xe' : 'Máy bay'],
                ['Người tạo chương trình', program?.createdBy],
                ['Mô tả', program?.itinerary[0]?.description ?? '-'],
              ]?.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 text-sm border-b border-[#D0C5AF]/15 pb-3">
                  <span className="text-[var(--color-primary)]/50">{label}</span>
                  <span className="font-medium text-[var(--color-primary)] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'guests' && (
        <div className="bg-white border border-[#D0C5AF]/40 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-surface)] border-b border-[#D0C5AF]/40 text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50">
                  <th className="py-4 px-6 font-bold">STT</th>
                  <th className="py-4 px-6 font-bold">Họ và tên</th>
                  <th className="py-4 px-6 font-bold">Giới tính</th>
                  <th className="py-4 px-6 font-bold">Ngày sinh</th>
                  <th className="py-4 px-6 font-bold">CCCD / GKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/20 text-sm">
                {tourBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--color-primary)]/40 text-sm">
                      Chưa có booking nào cho tour này
                    </td>
                  </tr>
                ) : (
                  tourBookings?.flatMap(booking => [
                    <tr key={`${booking?.id}-group`} className="bg-[var(--color-surface)] text-[var(--color-primary)] font-medium">
                      <td colSpan={5} className="py-3 px-6">
                        Nhóm khách [{booking?.id}] - Mã đơn{' '}
                        <button onClick={() => setGuestPopup(booking)} className="font-mono text-[var(--color-secondary)] hover:underline">
                          [{booking?.bookingCode}]
                        </button>
                      </td>
                    </tr>,
                    ...booking?.passengers?.map((passenger, index) => (
                      <tr key={`${booking?.id}-${index}`} className="bg-white">
                        <td className="py-3 px-6">{index + 1}</td>
                        <td className="py-3 px-6">{passenger?.name}</td>
                        <td className="py-3 px-6">{passenger.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                        <td className="py-3 px-6">{passenger?.dob}</td>
                        <td className="py-3 px-6">{passenger?.cccd ?? '-'}</td>
                      </tr>
                    )),
                  ])
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'itinerary' && (
        <div className="space-y-0 animate-in fade-in duration-300">
          {program?.itinerary?.map((day, index) => (
            <div key={index} className="flex gap-0 border-b border-[#D0C5AF]/20">
              <div className="w-20 shrink-0 flex flex-col items-center pt-6 pb-6 bg-[var(--color-surface)] border-r border-[#D0C5AF]/20">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/40 font-bold">Ngày</span>
                <span className="text-2xl font-serif font-bold text-[var(--color-secondary)]">{day?.day}</span>
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-medium text-[var(--color-primary)]">{day?.title}</h4>
                  <div className="flex gap-2 shrink-0">
                    {day?.meals?.map(meal => (
                      <span key={meal} className="text-[10px] px-2 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded font-medium">
                        {{ breakfast: 'Sáng', lunch: 'Trưa', dinner: 'Tối' }[meal]}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[var(--color-primary)]/60 leading-relaxed">{day?.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'estimate' && (
        <>
          <div className="sticky top-0 z-10 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Tổng chi phí dự toán', value: formatCurrency(totalCost) },
              { label: 'Doanh thu dự kiến', value: formatCurrency(expectedRevenue) },
              { label: 'Lợi nhuận dự kiến', value: formatCurrency(profit) },
              { label: 'Tỷ suất lợi nhuận', value: `${margin?.toFixed(1)}%` },
            ]?.map(card => (
              <div key={card?.label} className="bg-[#D4AF37] text-white border border-[#D4AF37] shadow-sm px-5 py-4">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">{card?.label}</p>
                <p className="font-serif text-xl mt-1">{card?.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#D0C5AF]/40 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#D4AF37] text-white shadow-sm">
                    {['Khoản mục', 'Dịch vụ', 'Nhà cung cấp', 'Đơn vị', 'Đêm/Lượt/Bữa', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Ghi chú', 'Sửa giá']?.map(header => (
                      <th key={header} className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {groupedRows?.map(category => (
                    <React.Fragment key={category?.categoryId}>
                      <tr className="bg-[var(--color-surface)] border-t border-[#D0C5AF]/30">
                        <td colSpan={10} className="px-6 py-3 font-bold text-[var(--color-primary)]">
                          {category?.categoryId}. {category?.categoryName}
                        </td>
                      </tr>
                      {category?.items?.map(item => {
                        const itemKey = `${category?.categoryId}-${item?.itemId}`;
                        const visibleRows = expandedItems[itemKey] ? item?.rows : item?.rows?.slice(0, 1);
                        const hasMoreRows = item?.rows?.length > 1;

                        return (
                        <React.Fragment key={`${category?.categoryId}-${item?.itemId}`}>
                          {visibleRows?.map((row, rowIndex) => (
                            <tr key={row?.rowId} className={`border-t border-[#D0C5AF]/10 ${row?.isPrimary ? 'bg-emerald-50/40' : 'bg-white'}`}>
                              <td className="px-6 py-3 text-sm font-medium">{rowIndex === 0 ? row?.itemName : ''}</td>
                              <td className="px-6 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span>{row?.serviceVariant}</span>
                                  {rowIndex === 0 && hasMoreRows && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandedItem(itemKey)}
                                      className="text-[10px] uppercase tracking-widest text-[var(--color-secondary)] font-bold"
                                    >
                                      {expandedItems[itemKey] ? 'Thu gọn' : `Mở rộng (${item?.rows?.length})`}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`${category?.categoryId}-${item?.itemId}-primary`}
                                    checked={row?.isPrimary}
                                    onChange={() => setPrimarySupplier(row?.rowId)}
                                  />
                                  <span>{row?.supplierName}</span>
                                </label>
                              </td>
                              <td className="px-6 py-3">{row?.unit}</td>
                              <td className="px-6 py-3 whitespace-nowrap">{getUsageMetric(row?.unit, row?.quantity)}</td>
                              <td className="px-6 py-3">{row?.quantity}</td>
                              <td className="px-6 py-3 text-right">{formatCurrency(row?.unitPrice)}</td>
                              <td className="px-6 py-3 text-right font-bold">{formatCurrency(row?.total)}</td>
                              <td className="px-6 py-3">{row?.note || '-'}</td>
                              <td className="px-6 py-3 text-center">
                                <button
                                  onClick={() => setPricePopup({ rowId: row?.rowId, itemName: row?.itemName, supplierName: row?.supplierName, systemPrice: row?.unitPrice })}
                                  className="text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                                  aria-label={`Chỉnh sửa giá ${row?.itemName}`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      )})}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--color-surface)]">
                  <tr className="border-t-2 border-[#D0C5AF]/50">
                    <td colSpan={7} className="py-5 px-6 font-bold text-[11px] uppercase tracking-widest text-right text-[var(--color-primary)]">
                      Tổng dự chi:
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[var(--color-primary)] text-right">
                      {formatCurrency(totalCost)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {guestPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--color-primary)]/40 backdrop-blur-sm" onClick={() => setGuestPopup(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="booking-guest-title" className="relative w-full max-w-2xl bg-white shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="booking-guest-title" className="font-serif text-2xl text-[var(--color-primary)]">Thông tin khách hàng đặt tour</h3>
                <p className="text-xs text-[var(--color-primary)]/50 font-mono mt-1">{guestPopup?.bookingCode}</p>
              </div>
              <button onClick={() => setGuestPopup(null)} className="text-[var(--color-primary)]/40 hover:text-[var(--color-primary)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--color-primary)]/50">Tên liên hệ:</span> <strong>{guestPopup?.contactInfo?.name}</strong></div>
              <div><span className="text-[var(--color-primary)]/50">Số điện thoại:</span> <strong>{guestPopup?.contactInfo?.phone}</strong></div>
              <div><span className="text-[var(--color-primary)]/50">Email:</span> <strong>{guestPopup?.contactInfo?.email}</strong></div>
              <div><span className="text-[var(--color-primary)]/50">Tổng tiền:</span> <strong>{formatCurrency(guestPopup?.totalAmount)}</strong></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#D0C5AF]/30 p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 font-bold">Ghi chú booking</p>
                <p className="text-sm text-[var(--color-primary)]/70 leading-relaxed">
                  {guestPopup?.contactInfo?.note?.trim() || 'Không có ghi chú bổ sung từ khách hàng?.'}
                </p>
              </div>
              <div className="border border-[#D0C5AF]/30 p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 font-bold">Cơ cấu phòng</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {[
                    ['Phòng đơn', guestPopup?.roomCounts?.single ?? 0],
                    ['Phòng đôi', guestPopup?.roomCounts?.double ?? 0],
                    ['Phòng ba', guestPopup?.roomCounts?.triple ?? 0],
                  ]?.map(([label, value]) => (
                    <div key={label} className="bg-[var(--color-surface)] px-3 py-3 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/45">{label}</p>
                      <p className="font-serif text-xl text-[var(--color-primary)] mt-1">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-primary)]/45">Tổng hành khách: {guestPopup?.passengers?.length} người</p>
              </div>
            </div>
            <div className="border border-[#D0C5AF]/30 p-4 bg-[var(--color-surface)]/40">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 font-bold mb-2">Tóm tắt hành khách</p>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--color-primary)]/70">
                {[
                  ['Người lớn', guestPopup?.passengers?.filter(passenger => passenger.type === 'adult')?.length],
                  ['Trẻ em', guestPopup?.passengers?.filter(passenger => passenger.type === 'child')?.length],
                  ['Em bé', guestPopup?.passengers?.filter(passenger => passenger.type === 'infant')?.length],
                ]?.map(([label, value]) => (
                  <span key={label} className="px-3 py-1 bg-white border border-[#D0C5AF]/25 rounded-full">
                    {label}: <strong>{value}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {pricePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--color-primary)]/40 backdrop-blur-sm" onClick={() => setPricePopup(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="edit-price-title" className="relative w-full max-w-2xl bg-white shadow-2xl p-6 space-y-5">
            <div>
              <h3 id="edit-price-title" className="font-serif text-2xl text-[var(--color-primary)]">Chỉnh sửa giá</h3>
              <p className="text-xs text-[var(--color-primary)]/50 mt-1">Cập nhật giá áp dụng cho hạng mục đang chọn</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--color-primary)]/50">Dịch vụ:</span> <strong>{pricePopup?.itemName}</strong></div>
              <div><span className="text-[var(--color-primary)]/50">Nhà cung cấp:</span> <strong>{pricePopup?.supplierName}</strong></div>
            </div>
            <div className="border border-[#D0C5AF]/30 p-4 space-y-3">
              <p className="text-sm font-medium text-[var(--color-primary)]">Thông tin giá đang áp dụng</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-[var(--color-primary)]/50">Giá đang áp dụng:</span> <strong>{formatCurrency(pricePopup?.systemPrice)}</strong></div>
                <div><span className="text-[var(--color-primary)]/50">Ngày hiệu lực:</span> <strong>01/01/2026</strong></div>
                <div><span className="text-[var(--color-primary)]/50">Ngày hết hiệu lực:</span> <strong>31/12/2026</strong></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="block text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 mb-1">Đơn giá mới</span>
                <input
                  type="number"
                  defaultValue={pricePopup?.systemPrice}
                  className="w-full border border-[#D0C5AF]/50 px-4 py-3 text-sm outline-none"
                  onChange={event => updateSupplierRow(pricePopup?.rowId, { unitPrice: Math.max(0, parseInt(event?.target?.value, 10) || 0) })}
                />
              </label>
              <label className="text-sm">
                <span className="block text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 mb-1">Lý do</span>
                <input type="text" className="w-full border border-[#D0C5AF]/50 px-4 py-3 text-sm outline-none" placeholder="Nhập l? do" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--color-primary)]/70">
              <input type="checkbox" checked={updateSystemPrice} onChange={event => setUpdateSystemPrice(event?.target?.checked)} aria-label="Cập nhật vào bảng giá hệ thống" />
              Cập nhật vào bảng giá hệ thống
            </label>
            {updateSystemPrice && (
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="border border-[#D0C5AF]/50 px-3 py-2 text-sm" aria-label="Ngày hiệu lực" />
                <input type="date" className="border border-[#D0C5AF]/50 px-3 py-2 text-sm" aria-label="Ngày hết hiệu lực" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setPricePopup(null)} className="flex-1 py-3 border border-[#D0C5AF]/50 text-xs uppercase tracking-widest">Đóng</button>
              <button onClick={() => setPricePopup(null)} className="flex-1 py-3 bg-[var(--color-primary)] text-white text-xs uppercase tracking-widest">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

