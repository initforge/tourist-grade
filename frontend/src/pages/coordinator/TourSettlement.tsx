import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mockTourInstances, mockTourPrograms } from '../../data/tourProgram';
import { mockBookings } from '../../data/bookings';
import type { Booking } from '../../data/bookings';

export default function TourSettlement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/manager') ? '/manager' : '/coordinator';

  const instance = mockTourInstances.find(i => i.id === id) ?? mockTourInstances[0];
  const program = mockTourPrograms.find(p => p.id === instance.programId) ?? mockTourPrograms[0];

  const [activeTab, setActiveTab] = useState<'settlement' | 'summary'>('settlement');

  // Settlement items — pre-filled from costEstimate if available
  const initialItems = instance.settlement
    ? instance.settlement.actualCosts.flatMap(cat =>
        cat.items.map(item => ({
          id: `${cat.id}-${item.id}`,
          category: `${cat.id}. ${cat.name}`,
          supplier: item.suppliers[0]?.supplierName ?? '',
          estimated: item.total,
          actual: item.total,
          note: item.suppliers[0]?.notes ?? '',
        }))
      )
    : [
        { id: '1', category: 'A. Vận chuyển', supplier: 'Saigon Tourist', estimated: 48000000, actual: 48000000, note: '' },
        { id: '2', category: 'B. Khách sạn', supplier: 'InterContinental', estimated: 72000000, actual: 72000000, note: '' },
        { id: '3', category: 'C. Chi phí ăn', supplier: 'Hương Việt', estimated: 21000000, actual: 21000000, note: '' },
        { id: '4', category: 'D. Vé thắng cảnh', supplier: 'VNR', estimated: 9000000, actual: 9000000, note: '' },
        { id: '5', category: 'E. HDV', supplier: '—', estimated: 15000000, actual: 15000000, note: '' },
        { id: '6', category: 'F. Chi phí khác', supplier: '—', estimated: 3000000, actual: 3000000, note: '' },
      ];

  const [items, setItems] = useState(initialItems);
  const [actualRevenue] = useState(instance.settlement?.revenue ?? 195000000);

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now().toString(), category: '', supplier: '', estimated: 0, actual: 0, note: '' }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateField = (id: string, field: string, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Arrow adjust actual by step
  const adjustActual = (id: string, delta: number, step = 500000) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, actual: Math.max(0, i.actual + delta * step) } : i
    ));
  };

  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const variance = totalActual - totalEstimated;
  const netProfit = actualRevenue - totalActual;
  const margin = actualRevenue > 0 ? (netProfit / actualRevenue) * 100 : 0;

  // Bookings
  const tourBookings = mockBookings.filter((b: Booking) =>
    b.tourName.toLowerCase().includes(instance.programName.toLowerCase().split(' ')[0])
  );

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
            <span className="text-[var(--color-primary)] font-bold">{id ?? instance.id}</span>
          </nav>
          <h1 className="font-serif text-3xl text-[var(--color-primary)]">Báo Cáo Quyết Toán Tour</h1>
          <p className="text-sm text-[var(--color-primary)]/50 mt-1">{instance.programName} · {instance.departureDate}</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-black/5 text-sm uppercase tracking-widest transition-colors font-medium">
            Lưu Nháp
          </button>
          <button className="px-6 py-2 bg-[var(--color-primary)] text-white hover:bg-black text-sm uppercase tracking-widest transition-colors font-medium shadow-md">
            Hoàn Tất Quyết Toán
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-8 mb-8 border-b border-[#D0C5AF]/40">
        <button
          onClick={() => setActiveTab('settlement')}
          className={`pb-4 px-2 text-sm uppercase tracking-widest font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'settlement'
              ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]'
              : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
          }`}
        >
          Bảng Quyết Toán
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-4 px-2 text-sm uppercase tracking-widest font-medium transition-colors ${
            activeTab === 'summary'
              ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]'
              : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
          }`}
        >
          Phân Tích Hiệu Quả
        </button>
      </div>

      {/* ── Tab: Bảng Quyết Toán ── */}
      {activeTab === 'settlement' && (
        <>
          <div className="bg-white border border-[#D0C5AF]/40 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* Header */}
                <thead>
                  <tr className="bg-[#D4AF37] text-white">
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold">Hạng Mục</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold">Nhà Cung Cấp</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold text-right">Dự Toán (VNĐ)</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold text-center">Thực Chi (VNĐ)</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold text-right">Chênh Lệch</th>
                    <th className="py-4 px-6 text-[10px] tracking-widest uppercase font-bold">Ghi Chú QT</th>
                    <th className="py-4 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5AF]/20 text-sm">
                  {items.map(item => {
                    const diff = item.actual - item.estimated;
                    return (
                      <tr key={item.id} className="hover:bg-black/5 transition-colors group">
                        <td className="py-3 px-6">
                          <input
                            value={item.category}
                            onChange={e => updateField(item.id, 'category', e.target.value)}
                            className="w-full bg-transparent border-none p-1 font-medium text-sm outline-none"
                            placeholder="Hạng mục"
                          />
                        </td>
                        <td className="py-3 px-6">
                          <input
                            value={item.supplier}
                            onChange={e => updateField(item.id, 'supplier', e.target.value)}
                            className="w-full bg-transparent border-none p-1 text-sm outline-none"
                            placeholder="NCC"
                          />
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-right block text-[var(--color-primary)]/50 text-sm">
                            {item.estimated.toLocaleString()}
                          </span>
                        </td>
                        {/* Thực chi — with arrow controls */}
                        <td className="py-3 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => adjustActual(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded border border-[#D0C5AF]/40 text-[var(--color-primary)]/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors text-sm font-bold leading-none"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.actual}
                              min={0}
                              onChange={e => updateField(item.id, 'actual', Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-36 bg-transparent border-none p-1 text-center font-bold text-[var(--color-primary)] text-sm outline-none"
                            />
                            <button
                              onClick={() => adjustActual(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded border border-[#D0C5AF]/40 text-[var(--color-primary)]/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors text-sm font-bold leading-none"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className={`py-3 px-6 text-right font-bold ${
                          diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-600' : 'text-[var(--color-primary)]'
                        }`}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                        </td>
                        <td className="py-3 px-6">
                          <input
                            value={item.note}
                            onChange={e => updateField(item.id, 'note', e.target.value)}
                            className="w-full bg-transparent border-none p-1 text-xs italic text-[var(--color-primary)]/50 outline-none"
                            placeholder="..."
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[var(--color-surface)]">
                  <tr>
                    <td colSpan={7} className="p-4">
                      <button onClick={addItem}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[var(--color-tertiary)] hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        Thêm hạng mục quyết toán
                      </button>
                    </td>
                  </tr>
                  <tr className="border-t-2 border-[#D0C5AF]/50">
                    <td colSpan={2} className="py-5 px-6 font-bold text-[11px] uppercase tracking-widest text-right text-[var(--color-primary)]">
                      Tổng Kết:
                    </td>
                    <td className="py-5 px-6 text-right text-[var(--color-primary)]/50">{totalEstimated.toLocaleString()}</td>
                    <td className="py-5 px-6 text-center">
                      <span className="font-bold text-lg text-[var(--color-primary)]">{totalActual.toLocaleString()}</span>
                    </td>
                    <td className={`py-5 px-6 text-right font-bold text-lg ${
                      variance > 0 ? 'text-red-500' : variance < 0 ? 'text-emerald-600' : 'text-[var(--color-primary)]'
                    }`}>
                      {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-[var(--color-primary)]/50 mb-6">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)] flex items-center justify-center text-[10px] font-bold">−</span>
              Giảm 500.000 đ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)] flex items-center justify-center text-[10px] font-bold">+</span>
              Tăng 500.000 đ
            </span>
          </div>
        </>
      )}

      {/* ── Tab: Phân Tích Hiệu Quả ── */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Revenue vs Cost */}
          <div className="bg-white border border-[#D0C5AF]/40 p-10 shadow-sm space-y-8">
            <h3 className="font-serif text-2xl border-b border-[#D0C5AF]/30 pb-6">Hiệu Quả Kinh Doanh</h3>
            <div className="grid grid-cols-2 gap-8">
              {[
                { label: 'Doanh Thu Thực Tế', value: actualRevenue, color: 'text-[var(--color-tertiary)]' },
                { label: 'Tổng Chi Phí Thực Tế', value: totalActual, color: 'text-[#ba1a1a]' },
                { label: 'Lợi Nhuận Thực Tế', value: netProfit, color: 'text-[var(--color-primary)]' },
                { label: 'Tỷ Suất Lợi Nhuận', value: `${margin.toFixed(1)}%`, color: margin < 15 ? 'text-red-500' : 'text-[var(--color-tertiary)]', isStr: true },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 font-bold mb-2">{item.label}</p>
                  {'isStr' in item ? (
                    <p className={`text-3xl font-serif ${item.color}`}>{item.value}</p>
                  ) : (
                    <p className={`text-3xl font-serif ${item.color}`}>{(item.value as number).toLocaleString()} đ</p>
                  )}
                </div>
              ))}
            </div>

            {/* Variance bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--color-primary)]/60">
                <span>Chênh lệch so với dự toán</span>
                <span className={variance > 0 ? 'text-red-500 font-bold' : variance < 0 ? 'text-emerald-600 font-bold' : ''}>
                  {variance > 0 ? '+' : ''}{variance.toLocaleString()} đ
                </span>
              </div>
              <div className="h-3 bg-[var(--color-surface)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    variance <= 0 ? 'bg-[var(--color-tertiary)]' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.abs(variance) / totalEstimated * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--color-primary)]/40">
                {variance <= 0 ? 'Tiết kiệm hơn dự toán' : 'Vượt dự toán'}
              </p>
            </div>
          </div>

          {/* Dark evaluation card */}
          <div className="bg-[#2A2421] p-10 text-white shadow-xl flex flex-col justify-center">
            <h4 className="font-serif text-xl border-b border-white/20 pb-4 mb-8">Đánh Giá Vận Hành</h4>
            <div className="space-y-6">
              {[
                { label: 'Chênh lệch Dự toán', value: `${variance > 0 ? '+' : ''}${variance.toLocaleString()} đ`, good: variance <= 0 },
                { label: 'Chỉ số Hiệu quả (ROI)', value: `${(netProfit / totalActual * 100).toFixed(1)}%`, good: netProfit > 0 },
                { label: 'Số booking hoàn thành', value: `${tourBookings.length} booking`, good: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-xs uppercase tracking-widest opacity-60">{row.label}</span>
                  <span className={`font-bold ${row.good ? 'text-[#D4AF37]' : 'text-orange-400'}`}>{row.value}</span>
                </div>
              ))}
              <div className="pt-4">
                <p className="text-xs italic opacity-70 leading-relaxed">
                  "Quyết toán tour này cho thấy sự kiểm soát chi phí{' '}
                  {variance <= 0 ? 'tốt hơn' : 'kém hơn'} so với dự kiến ban đầu.
                  {margin >= 20 ? ' Biên lợi nhuận khả quan, có thể tăng giá bán ở các đợt sau.' : ''}
                  "
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
