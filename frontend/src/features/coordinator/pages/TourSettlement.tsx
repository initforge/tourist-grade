import React, { useMemo, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Breadcrumb, message } from 'antd';
import { mockTourInstances } from '@entities/tour-program/data/tourProgram';

type SettlementRow = {
  rowId: string;
  categoryId: string;
  categoryName: string;
  itemId: number;
  itemName: string;
  supplierName: string;
  serviceName: string;
  estimated: number;
  actual: number;
  note: string;
};

function formatCurrency(value: number) {
  return `${value?.toLocaleString('vi-VN')} đ`;
}

export default function TourSettlement() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const basePrefix = location?.pathname?.startsWith('/manager') ? '/manager' : '/coordinator';
  const isReadOnly = Boolean(location.state?.readOnly);

  const instance = mockTourInstances?.find(i => i.id === id);

  if (!instance) {
    return (
      <div className="p-8 bg-[var(--color-background)] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-[var(--color-primary)]/20">receipt_long</span>
          <h1 className="font-serif text-2xl text-[var(--color-primary)]">Chưa có dữ liệu quyết toán</h1>
          <p className="text-sm text-[var(--color-primary)]/50">
            API tour instance chưa sẵn sàng hoặc chưa có tour phù hợp để quyết toán.
          </p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'settlement' | 'summary'>('settlement');
  const [pricePopup, setPricePopup] = useState<{ rowId: string; itemName: string; currentPrice: number } | null>(null);

  const initialRows: SettlementRow[] = useMemo(() => {
    if (instance?.settlement?.actualCosts?.length) {
      return instance?.settlement?.actualCosts?.flatMap(category =>
        category?.items?.map(item => ({
          rowId: `${category?.id}-${item?.id}-${item?.suppliers[0]?.supplierId ?? 'main'}`,
          categoryId: category?.id,
          categoryName: category?.name,
          itemId: item?.id,
          itemName: item?.name,
          supplierName: item?.suppliers[0]?.supplierName ?? '-',
          serviceName: item?.suppliers[0]?.serviceVariant ?? item?.name,
          estimated: item?.total,
          actual: item?.total,
          note: item?.suppliers[0]?.notes ?? '',
        })),
      );
    }

    if (instance?.costEstimate) {
      return instance?.costEstimate?.categories?.flatMap(category =>
        category?.items?.flatMap(item =>
          item?.suppliers?.map(supplier => ({
            rowId: `${category?.id}-${item?.id}-${supplier?.supplierId}`,
            categoryId: category?.id,
            categoryName: category?.name,
            itemId: item?.id,
            itemName: item?.name,
            supplierName: supplier?.supplierName,
            serviceName: supplier?.serviceVariant,
            estimated: supplier?.quotedPrice * item?.quantity,
            actual: supplier?.quotedPrice * item?.quantity,
            note: supplier?.notes ?? '',
          })),
        ),
      );
    }

    return [
      { rowId: 'A-1', categoryId: 'A', categoryName: 'Vận chuyển', itemId: 1, itemName: 'Xe vận chuyển', supplierName: 'NCC A', serviceName: 'Xe tham quan', estimated: 8100000, actual: 8200000, note: 'Nhập ghi chú' },
      { rowId: 'A-2', categoryId: 'A', categoryName: 'Vận chuyển', itemId: 2, itemName: 'Vé máy bay', supplierName: 'Đại lý bán vé máy bay A', serviceName: 'Vé máy bay', estimated: 25200000, actual: 25200000, note: 'Nhập ghi chú' },
      { rowId: 'B-1', categoryId: 'B', categoryName: 'Khách sạn', itemId: 1, itemName: 'Phòng đôi - Đêm 1, Đêm 2', supplierName: 'Khách sạn C', serviceName: 'Phòng đôi', estimated: 2700000, actual: 2700000, note: 'Nhập ghi chú' },
      { rowId: 'B-2', categoryId: 'B', categoryName: 'Khách sạn', itemId: 2, itemName: 'Phòng đôi - Đêm 3', supplierName: 'Khách sạn E', serviceName: 'Phòng đôi', estimated: 1440000, actual: 1440000, note: 'Nhập ghi chú' },
      { rowId: 'C-1', categoryId: 'C', categoryName: 'Chi phí ăn', itemId: 1, itemName: 'Ngày 1 - Bữa trưa', supplierName: 'Nhà hàng A', serviceName: 'Set 1', estimated: 2880000, actual: 2880000, note: 'Nhập ghi chú' },
      { rowId: 'D-1', categoryId: 'D', categoryName: 'Vé thắng cảnh', itemId: 1, itemName: 'Ngày 1 - Vé tham quan Sunworld', supplierName: 'NCC A', serviceName: 'Vé tham quan Sunworld', estimated: 6000000, actual: 6000000, note: 'Nhập ghi chú' },
      { rowId: 'E-1', categoryId: 'E', categoryName: 'Hướng dẫn viên', itemId: 1, itemName: 'Hướng dẫn viên', supplierName: 'Tên HDV', serviceName: 'Hướng dẫn viên', estimated: 1600000, actual: 1600000, note: 'Nhập ghi chú' },
      { rowId: 'F-1', categoryId: 'F', categoryName: 'Chi phí khác', itemId: 1, itemName: 'Bảo hiểm du lịch', supplierName: 'NCC V', serviceName: 'Bảo hiểm du lịch', estimated: 960000, actual: 960000, note: 'Nhập ghi chú' },
    ];
  }, [instance]);

  const [rows, setRows] = useState(initialRows);
  const [actualRevenue] = useState(instance?.settlement?.revenue ?? 195000000);

  const groupedRows = useMemo(() => {
    const byCategory = new Map<string, { categoryId: string; categoryName: string; rows: SettlementRow[] }>();
    rows?.forEach(row => {
      if (!byCategory?.has(row?.categoryId)) {
        byCategory?.set(row?.categoryId, { categoryId: row?.categoryId, categoryName: row?.categoryName, rows: [] });
      }
      byCategory?.get(row?.categoryId)!?.rows?.push(row);
    });
    return Array.from(byCategory?.values());
  }, [rows]);

  const updateActual = (rowId: string, actual: number) => {
    setRows(previous => previous?.map(row => row.rowId === rowId ? { ...row, actual: Math.max(0, actual) } : row));
  };

  const adjustActual = (rowId: string, delta: number, step = 500000) => {
    setRows(previous => previous?.map(row => row.rowId === rowId ? { ...row, actual: Math.max(0, row?.actual + delta * step) } : row));
  };

  const totalEstimated = rows?.reduce((sum, row) => sum + row?.estimated, 0);
  const totalActual = rows?.reduce((sum, row) => sum + row?.actual, 0);
  const variance = totalActual - totalEstimated;
  const netProfit = actualRevenue - totalActual;
  const margin = actualRevenue > 0 ? (netProfit / actualRevenue) * 100 : 0;

  return (
    <div className="p-8 bg-[var(--color-background)] min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <Breadcrumb
            className="mb-4 text-xs"
            items={[
              { title: <Link to={`${basePrefix}/tours`} className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Điều hành tour</Link> },
              { title: <span className="text-[var(--color-primary)]/30">Quyết toán</span> },
            ]}
          />
          <h1 className="font-serif text-3xl text-[var(--color-primary)]">Báo Cáo Quyết Toán Tour</h1>
          <p className="text-sm text-[var(--color-primary)]/50 mt-1">{instance?.programName} - {instance?.departureDate}</p>
        </div>
        {!isReadOnly && <div className="flex gap-4">
          <button onClick={() => message.success('Đã lưu nháp quyết toán')} className="px-6 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-black/5 text-sm uppercase tracking-widest transition-colors font-medium">
            Lưu Nháp
          </button>
          <button onClick={() => {
            message.success('Đã hoàn tất quyết toán');
            navigate(`${basePrefix}/tours`);
          }} className="px-6 py-2 bg-[var(--color-primary)] text-white hover:bg-black text-sm uppercase tracking-widest transition-colors font-medium shadow-md">
            Hoàn Tất Quyết Toán
          </button>
        </div>}
      </div>

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
          Phân Tách Hiệu Quả
        </button>
      </div>

      {activeTab === 'settlement' && (
        <>
          <div className="bg-white border border-[#D0C5AF]/40 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#D4AF37] text-white">
                    {['STT', 'Nhà cung cấp', 'Dịch vụ', 'Dự toán', 'Thực chi', 'Chênh lệch', 'Ghi chú']?.map(header => (
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
                        <td colSpan={7} className="px-6 py-3 font-bold text-[var(--color-primary)]">
                          {category?.categoryId}. {category?.categoryName}
                        </td>
                      </tr>
                      {category?.rows?.map((row, index) => {
                        const diff = row?.actual - row?.estimated;
                        return (
                          <tr key={row?.rowId} className="border-t border-[#D0C5AF]/10">
                            <td className="px-6 py-3 text-[var(--color-primary)]/50">{index + 1}</td>
                            <td className="px-6 py-3">{row?.supplierName}</td>
                            <td className="px-6 py-3">
                              <div className="font-medium">{row?.serviceName}</div>
                              <div className="text-[10px] text-[var(--color-primary)]/40 mt-0.5">Kế thừa từ dự toán tour</div>
                            </td>
                            <td className="px-6 py-3 text-right text-[var(--color-primary)]/50">{formatCurrency(row?.estimated)}</td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => adjustActual(row?.rowId, -1)}
                                  disabled={isReadOnly}
                                  className="w-6 h-6 flex items-center justify-center rounded border border-[#D0C5AF]/40 text-[var(--color-primary)]/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors text-sm font-bold leading-none"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={row?.actual}
                                  min={0}
                                  step={500000}
                                  disabled={isReadOnly}
                                  onChange={event => updateActual(row?.rowId, parseInt(event?.target?.value, 10) || 0)}
                                  className="w-36 border border-[#D0C5AF]/40 bg-white px-2 py-1 text-center font-bold text-[var(--color-primary)] text-sm outline-none focus:border-[#D4AF37]"
                                />
                                <button
                                  onClick={() => adjustActual(row?.rowId, 1)}
                                  disabled={isReadOnly}
                                  className="w-6 h-6 flex items-center justify-center rounded border border-[#D0C5AF]/40 text-[var(--color-primary)]/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors text-sm font-bold leading-none"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className={`px-6 py-3 text-right font-bold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-600' : 'text-[var(--color-primary)]'}`}>
                              {diff > 0 ? '+' : ''}{formatCurrency(diff)?.replace(' đ', '')}
                            </td>
                            <td className="px-6 py-3">
                                <input
                                  value={row?.note}
                                  readOnly={isReadOnly}
                                  onChange={event => setRows(previous => previous?.map(item => item.rowId === row.rowId ? { ...item, note: event?.target?.value } : item))}
                                className="w-full bg-transparent border-none outline-none text-sm text-[var(--color-primary)]/60"
                                aria-label={`Ghi chú ${row?.serviceName}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--color-surface)]">
                  <tr className="border-t-2 border-[#D0C5AF]/50">
                    <td colSpan={3} className="py-5 px-6 font-bold text-[11px] uppercase tracking-widest text-right text-[var(--color-primary)]">
                      Tổng kết:
                    </td>
                    <td className="py-5 px-6 text-right text-[var(--color-primary)]/50">{formatCurrency(totalEstimated)}</td>
                    <td className="py-5 px-6 text-center">
                      <span className="font-bold text-lg text-[var(--color-primary)]">{formatCurrency(totalActual)}</span>
                    </td>
                    <td className={`py-5 px-6 text-right font-bold text-lg ${variance > 0 ? 'text-red-500' : variance < 0 ? 'text-emerald-600' : 'text-[var(--color-primary)]'}`}>
                      {variance > 0 ? '+' : ''}{formatCurrency(variance)?.replace(' đ', '')}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-[var(--color-primary)]/50 mb-6">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)] flex items-center justify-center text-[10px] font-bold">-</span>
              Giảm 500.000 đ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-[var(--color-secondary)]/20 border border-[var(--color-secondary)] flex items-center justify-center text-[10px] font-bold">+</span>
              Tăng 500.000 đ
            </span>
          </div>
        </>
      )}

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white border border-[#D0C5AF]/40 p-10 shadow-sm space-y-8">
            <h3 className="font-serif text-2xl border-b border-[#D0C5AF]/30 pb-6">Hiệu Quả Kinh Doanh</h3>
            <div className="grid grid-cols-2 gap-8">
              {[
                { label: 'Doanh Thu Thực Tế', value: formatCurrency(actualRevenue), color: 'text-[var(--color-tertiary)]' },
                { label: 'Tổng Chi Phí Thực Tế', value: formatCurrency(totalActual), color: 'text-[#ba1a1a]' },
                { label: 'Lợi Nhuận Thực Tế', value: formatCurrency(netProfit), color: 'text-[var(--color-primary)]' },
                { label: 'Tỷ Suất Lợi Nhuận', value: `${margin?.toFixed(1)}%`, color: margin < 15 ? 'text-red-500' : 'text-[var(--color-tertiary)]' },
              ]?.map(item => (
                <div key={item?.label}>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 font-bold mb-2">{item?.label}</p>
                  <p className={`text-3xl font-serif ${item?.color}`}>{item?.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#2A2421] p-10 text-white shadow-xl flex flex-col justify-center">
            <h4 className="font-serif text-xl border-b border-white/20 pb-4 mb-8">Đánh Giá Vận Hành</h4>
            <div className="space-y-6">
              {[
                { label: 'Chênh lệch Dự toán', value: `${variance > 0 ? '+' : ''}${formatCurrency(variance)}`, good: variance <= 0 },
                { label: 'Chỉ số Hiệu quả (ROI)', value: `${(netProfit / Math.max(1, totalActual) * 100)?.toFixed(1)}%`, good: netProfit > 0 },
                { label: 'Biên lợi nhuận', value: `${margin?.toFixed(1)}%`, good: margin >= 15 },
              ]?.map(row => (
                <div key={row?.label} className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-xs uppercase tracking-widest opacity-60">{row?.label}</span>
                  <span className={`font-bold ${row?.good ? 'text-[#D4AF37]' : 'text-orange-400'}`}>{row?.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {pricePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--color-primary)]/40 backdrop-blur-sm" onClick={() => setPricePopup(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="settlement-price-title" className="relative w-full max-w-md bg-white shadow-2xl p-6 space-y-5">
            <div>
              <h3 id="settlement-price-title" className="font-serif text-2xl text-[var(--color-primary)]">Chỉnh sửa giá</h3>
              <p className="text-xs text-[var(--color-primary)]/50 mt-1">{pricePopup?.itemName}</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-primary)]/60 block mb-1">Thực chi mới</label>
              <input
                type="number"
                defaultValue={pricePopup?.currentPrice}
                className="w-full border border-[#D0C5AF]/50 px-4 py-3 text-sm outline-none"
                onChange={event => updateActual(pricePopup?.rowId, Math.max(0, parseInt(event?.target?.value, 10) || 0))}
              />
              <p className="text-[10px] text-[var(--color-primary)]/40 mt-1">Dữ liệu quyết toán kế thừa từ dự toán tour, chỉ được chỉnh phần thực chi.</p>
            </div>
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

