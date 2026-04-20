import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import type { TourProgram } from '@entities/tour-program/data/tourProgram';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN')?.format(n) + ' VND';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminTourPrograms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [programs, setPrograms] = useState<TourProgram[]>(mockTourPrograms);
  const [inactiveReasons, setInactiveReasons] = useState<Record<string, string>>({});
  const [viewProgram, setViewProgram] = useState<TourProgram | null>(null);

  const filtered = programs?.filter(p => {
    if (activeTab === 'pending') return p.status === 'draft';
    return p.status === activeTab;
  });

  const tabCounts = {
    pending: programs?.filter(p => p.status === 'draft')?.length,
    active: programs?.filter(p => p.status === 'active')?.length,
    inactive: programs?.filter(p => p.status === 'inactive')?.length,
  };

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-[#D4AF37] rounded-sm"></div>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Quản lý Chương trình Tour</h1>
          </div>
          <p className="text-xs text-[#2A2421]/50 ml-4">Quản lý và phê duyệt các chương trình tour trong hệ thống.</p>
        </div>

        {/* Tab Bar */}
        <div className="bg-white border border-[#D0C5AF]/30 mb-6">
          <div className="flex overflow-x-auto">
            {([
              { key: 'pending' as const, label: 'Chờ duyệt', icon: 'pending' },
              { key: 'active' as const, label: 'Đang hoạt động', icon: 'check_circle' },
              { key: 'inactive' as const, label: 'Ngừng hoạt động', icon: 'pause_circle' },
            ])?.map(tab => (
              <button key={tab?.key} onClick={() => setActiveTab(tab?.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-['Inter'] uppercase tracking-widest border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab?.key ? 'border-[#D4AF37] text-[#D4AF37] font-bold bg-[#D0C5AF]/5' : 'border-transparent text-[#2A2421]/50 hover:text-[#2A2421] hover:bg-gray-50'
                }`}>
                <span className="material-symbols-outlined text-[16px]">{tab?.icon}</span>
                {tab?.label}
                <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === tab?.key ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-500'}`}>
                  {tabCounts[tab?.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                {(activeTab === 'pending'
                  ? ['Mã nháp', 'Tên CT Tour', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Đơn giá', 'Người tạo', 'Hành động']
                  : activeTab === 'active'
                  ? ['Mã Tour', 'Tên CT Tour', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Số tour đang bán', 'Đơn giá', 'Hành động']
                  : ['Mã Tour', 'Tên CT Tour', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Loại tour', 'Lý do ngừng']
                )?.map(h => (
                  <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-widest text-[#2A2421] font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'inactive' ? 7 : 8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#D0C5AF]">inbox</span>
                    Không có chương trình tour nào
                  </td>
                </tr>
              )}
              {filtered?.map(p => (
                <tr key={p?.id}
                  className="hover:bg-[#FAFAF5] transition-colors cursor-pointer"
                  onClick={() => {
                    if (activeTab === 'pending') navigate(`/manager/tour-programs/${p?.id}/approval`);
                  }}
                >
                  <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">{p?.id}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#2A2421]">{p?.name}</td>
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{p?.departurePoint}</td>
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{p?.sightseeingSpots?.join(', ')}</td>
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{p?.duration?.days}N{p?.duration?.nights}Đ</td>

                  {activeTab === 'pending' && (
                    <>
                      <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">{fmtPrice(p?.pricingConfig?.sellPriceAdult)}</td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{p?.createdBy}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={e => { e?.stopPropagation(); navigate(`/manager/tour-programs/${p?.id}/approval`); }}
                          className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Duyệt
                        </button>
                      </td>
                    </>
                  )}
                  {activeTab === 'active' && (
                    <>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold">—</span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">{fmtPrice(p?.pricingConfig?.sellPriceAdult)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={e => {
                              e?.stopPropagation();
                              setViewProgram(p);
                            }}
                            className="px-2 py-1 text-[10px] font-bold border border-[#D0C5AF] text-[#2A2421]/60 hover:bg-gray-50"
                          >
                            Xem
                          </button>
                          <button
                            onClick={e => {
                              e?.stopPropagation();
                              setPrograms(prev => prev.map(item => (
                                item.id === p.id
                                  ? { ...item, status: 'inactive', updatedAt: new Date().toISOString() }
                                  : item
                              )));
                              setInactiveReasons(prev => ({
                                ...prev,
                                [p.id]: 'Tạm ngừng thủ công từ màn quản lý chương trình tour',
                              }));
                              setActiveTab('inactive');
                              message.success(`Đã tạm ngừng ${p?.name}`);
                            }}
                            className="px-2 py-1 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Tạm ngừng
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                  {activeTab === 'inactive' && (
                    <>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{p.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'}</td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{inactiveReasons[p.id] ?? '—'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-[11px] text-[#2A2421]/40">Hiển thị {filtered?.length} chương trình tour</p>
        </div>
      </div>

      {viewProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2A2421]/40" onClick={() => setViewProgram(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="program-detail-title" className="relative w-full max-w-3xl bg-white border border-[#D0C5AF]/40 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D0C5AF]/30 px-6 py-5">
              <div>
                <h2 id="program-detail-title" className="font-['Noto_Serif'] text-2xl text-[#2A2421]">Chi tiết chương trình tour</h2>
                <p className="mt-1 text-xs text-[#2A2421]/50">{viewProgram.id} · {viewProgram.name}</p>
              </div>
              <button onClick={() => setViewProgram(null)} className="text-[#2A2421]/40 hover:text-[#2A2421]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {[
                ['Điểm khởi hành', viewProgram.departurePoint],
                ['Điểm tham quan', viewProgram.sightseeingSpots?.join(', ')],
                ['Thời lượng', `${viewProgram.duration?.days} ngày ${viewProgram.duration?.nights} đêm`],
                ['Loại tour', viewProgram.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'],
                ['Giá người lớn', fmtPrice(viewProgram.pricingConfig?.sellPriceAdult)],
                ['Người tạo', viewProgram.createdBy],
              ]?.map(([label, value]) => (
                <div key={label} className="border border-[#D0C5AF]/30 bg-[#FAFAF5] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/45">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#2A2421]">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-[#D0C5AF]/30 px-6 py-4">
              <button onClick={() => setViewProgram(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-[#D0C5AF] text-[#2A2421]/70 hover:bg-[#FAFAF5]">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
