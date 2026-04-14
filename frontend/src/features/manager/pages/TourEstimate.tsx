import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@shared/store/useAuthStore';
import { mockTourInstances, mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import { mockBookings } from '@entities/booking/data/bookings';
import type { Booking } from '@entities/booking/data/bookings';

export default function TourEstimate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location?.pathname?.startsWith('/manager') ? '/manager' : '/coordinator';
  const user = useAuthStore(s => s?.user);
  const role = user?.role || 'guest';

  // Load instance & program data
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

  // Tab state: 'overview' | 'guests' | 'itinerary' | 'estimate'
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'itinerary' | 'estimate'>('overview');

  // Estimate items (editable)
  const [items, setItems] = useState(() => {
    const cost = instance?.costEstimate;
    if (!cost) return [
      { id: '1', category: 'Vận chuyển', supplier: '', quantity: 1, unitPrice: 0, note: '' },
    ];
    return cost?.categories?.flatMap(cat =>
      cat?.items?.map(item => ({
        id: `${cat?.id}-${item?.id}`,
        category: `${cat?.id}. ${cat?.name}`,
        supplier: item?.suppliers[0]?.supplierName ?? '',
        quantity: item?.quantity,
        unitPrice: item?.unitPrice,
        note: item?.suppliers[0]?.notes ?? '',
      }))
    );
  });

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now()?.toString(), category: '', supplier: '', quantity: 1, unitPrice: 0, note: '' }]);
  };

  const removeItem = (id: string) => setItems(prev => prev?.filter(i => i?.id !== id));

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(prev => prev?.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const totalCost = items?.reduce((s, i) => s + i?.quantity * i?.unitPrice, 0);
  const expectedRevenue = instance?.priceAdult * instance?.expectedGuests;
  const profit = expectedRevenue - totalCost;
  const margin = expectedRevenue > 0 ? (profit / expectedRevenue) * 100 : 0;

  // Bookings for this tour
  const tourBookings = mockBookings?.filter((b: Booking) =>
    b?.tourName?.toLowerCase()?.includes(instance?.programName?.toLowerCase()?.split(' ')[0])
  );

  const getPassengerCount = (b: Booking) => {
    const adults = b?.passengers?.filter((p: Booking['passengers'][0]) => p.type === 'adult')?.length;
    const children = b?.passengers?.filter((p: Booking['passengers'][0]) => p.type === 'child')?.length;
    return `${adults} NL${children > 0 ? ` · ${children} TE` : ''}`;
  };

  type TabKey = 'overview' | 'guests' | 'itinerary' | 'estimate';
  const tabs: Array<{ key: TabKey; label: string; badge?: number | null }> = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'guests', label: 'Danh sách khách hàng', badge: tourBookings?.length || null },
    { key: 'itinerary', label: 'Lịch trình' },
    { key: 'estimate', label: 'Dự toán' },
  ];

  return (
    <div className="p-8 bg-[var(--color-background)] min-h-screen">
      {/* Header */}
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
              <button onClick={() => navigate(`${basePrefix}/tours`)}
                className="px-6 py-2 border border-red-500 text-red-600 hover:bg-red-50 text-sm uppercase tracking-widest transition-colors font-medium">
                Từ Chối
              </button>
              <button onClick={() => navigate(`${basePrefix}/tours`)}
                className="px-6 py-2 bg-[#2C5545] text-white hover:bg-[#1a382b] text-sm uppercase tracking-widest transition-colors font-medium shadow-md">
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

      {/* 4-Tab bar */}
      <div className="flex gap-8 mb-8 border-b border-[#D0C5AF]/40">
        {tabs?.map(t => (
          <button
            key={t?.key}
            onClick={() => setActiveTab(t?.key)}
            className={`pb-4 px-2 text-sm uppercase tracking-widest font-medium transition-colors flex items-center gap-2 ${
              activeTab === t?.key
                ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]'
                : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
            }`}
          >
            {t?.label}
            {t?.badge != null && (
              <span className="bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {t?.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Tổng quan ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div className="bg-white border border-[#D0C5AF]/40 shadow-sm p-6 space-y-5">
            <h3 className="font-serif text-lg border-b border-[#D0C5AF]/30 pb-3">Thông tin Tour</h3>
            {[
              ['Mã tour', instance?.id],
              ['Tên chương trình', instance?.programName],
              ['Ngày khởi hành', new Date(instance?.departureDate)?.toLocaleDateString('vi-VN')],
              ['Điểm khởi hành', instance?.departurePoint],
              ['Điểm tham quan', instance?.sightseeingSpots?.join(', ')],
              ['Phương tiện', instance.transport === 'xe' ? 'Xe' : 'Máy bay'],
              ['Số khách dự kiến', `${instance?.expectedGuests} người`],
              ['Số khách tối thiểu', `${instance?.minParticipants} người`],
            ]?.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-[var(--color-primary)]/50">{label}</span>
                <span className="font-medium text-[var(--color-primary)]">{value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-[#D0C5AF]/40 shadow-sm p-6 space-y-4">
              <h3 className="font-serif text-lg border-b border-[#D0C5AF]/30 pb-3">Thông tin Giá</h3>
              {[
                ['Giá bán NL', `${instance?.priceAdult?.toLocaleString()} đ`],
                ['Giá bán TE', `${instance?.priceChild?.toLocaleString()} đ`],
                ['Giá net', instance?.costEstimate
                  ? `${instance?.costEstimate?.pricingConfig?.netPrice?.toLocaleString()} đ`
                  : '—'
                ],
              ]?.map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-[var(--color-primary)]/50">{label}</span>
                  <span className="font-medium text-[var(--color-primary)]">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-[var(--color-secondary)]/8 border border-[var(--color-secondary)]/20 p-6">
              <h3 className="font-serif text-lg text-[var(--color-primary)] mb-4">Thông tin Nhà cung cấp</h3>
              {instance?.costEstimate
                ? instance?.costEstimate?.categories?.flatMap(cat =>
                    cat?.items?.flatMap(item =>
                      item?.suppliers?.filter(s => s?.isPrimary)?.map(s => ({
                        category: `${cat?.id}. ${cat?.name}`,
                        supplier: s?.supplierName,
                        price: s?.quotedPrice,
                      }))
                    )
                  )?.slice(0, 4)?.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--color-primary)]/60">{s?.category}</span>
                      <span className="font-medium">{s?.supplier}</span>
                    </div>
                  ))
                : <p className="text-sm text-[var(--color-primary)]/40 italic">Chưa có dữ liệu dự toán</p>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: DS KH ── */}
      {activeTab === 'guests' && (
        <div className="bg-white border border-[#D0C5AF]/40 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-surface)] border-b border-[#D0C5AF]/40 text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50">
                  <th className="py-4 px-6 font-bold">Mã Booking</th>
                  <th className="py-4 px-6 font-bold">Tên liên hệ</th>
                  <th className="py-4 px-6 font-bold">Số điện thoại</th>
                  <th className="py-4 px-6 font-bold">Hành khách</th>
                  <th className="py-4 px-6 font-bold text-right">Tổng tiền</th>
                  <th className="py-4 px-6 font-bold">Thanh toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/20 text-sm">
                {tourBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--color-primary)]/40 text-sm">
                      Chưa có booking nào cho tour này
                    </td>
                  </tr>
                ) : tourBookings?.map(b => (
                  <tr key={b?.id} className="hover:bg-black/5 transition-colors">
                    <td className="py-3 px-6 font-mono text-xs">{b?.bookingCode}</td>
                    <td className="py-3 px-6">{b?.contactInfo?.name}</td>
                    <td className="py-3 px-6">{b?.contactInfo?.phone}</td>
                    <td className="py-3 px-6">
                      {getPassengerCount(b)}
                    </td>
                    <td className="py-3 px-6 text-right font-medium">{b?.totalAmount?.toLocaleString()} đ</td>
                    <td className="py-3 px-6">
                      <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider rounded-full ${
                        b.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                        b.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {b.paymentStatus === 'paid' ? 'Đã TT' : b.paymentStatus === 'partial' ? 'Còn lại' : 'Chưa TT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Lịch trình ── */}
      {activeTab === 'itinerary' && (
        <div className="space-y-0 animate-in fade-in duration-300">
          {program?.itinerary?.map((day, idx) => (
            <div key={idx} className="flex gap-0 border-b border-[#D0C5AF]/20">
              {/* Day marker */}
              <div className="w-20 shrink-0 flex flex-col items-center pt-6 pb-6 bg-[var(--color-surface)] border-r border-[#D0C5AF]/20">
                <span className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/40 font-bold">Ngày</span>
                <span className="text-2xl font-serif font-bold text-[var(--color-secondary)]">{day?.day}</span>
              </div>
              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-medium text-[var(--color-primary)]">{day?.title}</h4>
                  <div className="flex gap-2 shrink-0">
                    {day?.meals?.map(m => (
                      <span key={m} className="text-[10px] px-2 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded font-medium">
                        {{ breakfast: 'Sáng', lunch: 'Trưa', dinner: 'Tối' }[m]}
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

      {/* ── Tab: Dự toán ── */}
      {activeTab === 'estimate' && (
        <>
          {/* Sticky header cost table */}
          <div className="bg-white border border-[#D0C5AF]/40 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Sticky header row — gold */}
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#D4AF37] text-white shadow-sm">
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold">Hạng Mục</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold">Nhà Cung Cấp</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold text-center">Số Lượng</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold text-right">Đơn Giá</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold text-right">Thành Tiền</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold">Ghi Chú</th>
                    <th className="py-4 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/20 text-sm">
                  {items?.map(item => (
                    <tr key={item?.id} className="hover:bg-black/5 transition-colors group">
                      <td className="py-3 px-6">
                        <input
                          value={item?.category}
                          onChange={e => updateItem(item?.id, 'category', e?.target?.value)}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-[var(--color-secondary)] p-1 font-medium text-sm outline-none"
                          placeholder="Hạng mục chi phí"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <input
                          value={item?.supplier}
                          onChange={e => updateItem(item?.id, 'supplier', e?.target?.value)}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-[var(--color-secondary)] p-1 text-sm outline-none"
                          placeholder="Nhà cung cấp"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <input
                          type="number"
                          value={item?.quantity}
                          min={1}
                          onChange={e => updateItem(item?.id, 'quantity', Math.max(1, parseInt(e?.target?.value) || 1))}
                          className="w-16 bg-transparent border-none focus:ring-1 focus:ring-[var(--color-secondary)] p-1 text-center outline-none"
                        />
                      </td>
                      <td className="py-3 px-6">
                        <input
                          type="number"
                          value={item?.unitPrice}
                          min={0}
                          onChange={e => updateItem(item?.id, 'unitPrice', Math.max(0, parseInt(e?.target?.value) || 0))}
                          className="w-32 bg-transparent border-none focus:ring-1 focus:ring-[var(--color-secondary)] p-1 text-right outline-none"
                        />
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-[var(--color-primary)]">
                        {(item?.quantity * item?.unitPrice)?.toLocaleString()}
                      </td>
                      <td className="py-3 px-6">
                        <input
                          value={item?.note}
                          onChange={e => updateItem(item?.id, 'note', e?.target?.value)}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-[var(--color-secondary)] p-1 text-xs outline-none text-[var(--color-primary)]/50"
                          placeholder="..."
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => removeItem(item?.id)}
                          className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--color-surface)]">
                  <tr>
                    <td colSpan={7} className="p-4">
                      <button onClick={addItem}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[var(--color-tertiary)] hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Thêm hạng mục chi phí
                      </button>
                    </td>
                  </tr>
                  <tr className="border-t-2 border-[#D0C5AF]/50">
                    <td colSpan={4} className="py-5 px-6 font-bold text-[11px] uppercase tracking-widest text-right text-[var(--color-primary)]">
                      Tổng Dự Chi:
                    </td>
                    <td className="py-5 px-6 font-bold text-lg text-[var(--color-primary)] text-right">
                      {totalCost?.toLocaleString()} đ
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#D0C5AF]/40 shadow-sm p-6 space-y-5">
              <h3 className="font-serif text-lg border-b border-[#D0C5AF]/30 pb-3">Doanh Thu Dự Kiến</h3>
              <div className="space-y-3">
                {[
                  ['Số khách dự kiến', `${instance?.expectedGuests} người`],
                  ['Giá bán NL', `${instance?.priceAdult?.toLocaleString()} đ`],
                  ['Doanh thu dự kiến', `${expectedRevenue?.toLocaleString()} đ`],
                ]?.map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[var(--color-primary)]/50">{label}</span>
                    <span className="font-medium text-[var(--color-primary)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Tổng Chi Phí Dự Toán', value: totalCost, color: 'text-[#ba1a1a]' },
                { label: 'Lợi Nhuận Gộp (Dự Kiến)', value: profit, color: 'text-[var(--color-primary)]' },
                { label: 'Tỷ Suất Lợi Nhuận', value: `${margin?.toFixed(1)}%`, color: margin < 15 ? 'text-red-500' : 'text-[var(--color-tertiary)]', isStr: true },
              ]?.map(item => (
                <div key={item?.label} className="bg-white border border-[#D0C5AF]/40 shadow-sm p-6 flex justify-between items-center">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50 font-bold">{item?.label}</div>
                  {'isStr' in item ? (
                    <div className={`font-serif text-2xl ${item?.color}`}>{item?.value}</div>
                  ) : (
                    <div className={`font-serif text-2xl ${item?.color}`}>{(item?.value as number)?.toLocaleString()} đ</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

