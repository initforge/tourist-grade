import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { type TourProgram } from '@entities/tour-program/data/tourProgram';
import { patchTourProgram } from '@shared/lib/api/tourPrograms';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { useAuthStore } from '@shared/store/useAuthStore';

function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' VND';
}

export default function AdminTourPrograms() {
  const navigate = useNavigate();
  const token = useAuthStore(state => state.accessToken);
  const programs = useAppDataStore(state => state.tourPrograms);
  const setPrograms = useAppDataStore(state => state.setTourPrograms);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'inactive'>('pending');
  const [stopDraft, setStopDraft] = useState<{ program: TourProgram; reason: string } | null>(null);

  const filtered = useMemo(() => programs.filter((program) => {
    if (activeTab === 'pending') return program.status === 'draft';
    return program.status === activeTab;
  }), [activeTab, programs]);

  const tabCounts = useMemo(() => ({
    pending: programs.filter(program => program.status === 'draft').length,
    active: programs.filter(program => program.status === 'active').length,
    inactive: programs.filter(program => program.status === 'inactive').length,
  }), [programs]);

  const persistPrograms = (nextPrograms: TourProgram[]) => {
    setPrograms(nextPrograms);
  };

  const handleStopProgram = async () => {
    if (!stopDraft) return;
    const reason = stopDraft.reason.trim();
    if (!reason) {
      message.error('Cần nhập lý do ngừng kinh doanh');
      return;
    }

    const nextProgram: TourProgram = {
      ...stopDraft.program,
      status: 'inactive',
      inactiveReason: reason,
      updatedAt: new Date().toISOString(),
    };
    persistPrograms(programs.map(item => item.id === nextProgram.id ? nextProgram : item));

    try {
      if (token) {
        const response = await patchTourProgram(token, stopDraft.program.id, {
          status: 'inactive',
          inactiveReason: reason,
        });
        persistPrograms(programs.map(item => item.id === response.tourProgram.id ? response.tourProgram : item));
      }
      setActiveTab('inactive');
      setStopDraft(null);
      message.success(`Đã ngừng kinh doanh ${stopDraft.program.name}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái chương trình tour');
    }
  };

  return (
    <div className="w-full min-h-full bg-[#F3F3F3]">
      <div className="p-6 md:p-10">
        <div className="mb-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-5 w-1 rounded-sm bg-[#D4AF37]" />
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Quản lý Chương trình Tour</h1>
          </div>
          <p className="ml-4 text-xs text-[#2A2421]/50">Quản lý và phê duyệt các chương trình tour trong hệ thống.</p>
        </div>

        <div className="mb-6 border border-[#D0C5AF]/30 bg-white">
          <div className="flex overflow-x-auto">
            {[
              { key: 'pending' as const, label: 'Chờ duyệt', icon: 'pending' },
              { key: 'active' as const, label: 'Đang hoạt động', icon: 'check_circle' },
              { key: 'inactive' as const, label: 'Ngừng hoạt động', icon: 'pause_circle' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3.5 font-['Inter'] text-xs uppercase tracking-widest transition-all ${
                  activeTab === tab.key
                    ? 'border-[#D4AF37] bg-[#D0C5AF]/5 font-bold text-[#D4AF37]'
                    : 'border-transparent text-[#2A2421]/50 hover:bg-gray-50 hover:text-[#2A2421]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${
                  activeTab === tab.key ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-500'
                }`}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-[#D0C5AF]/20 bg-white shadow-sm">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#D0C5AF]/30 bg-[#FAFAF5]">
                {(activeTab === 'pending'
                  ? ['Mã nháp', 'Tên CT Tour', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Đơn giá', 'Người tạo', 'Hành động']
                  : activeTab === 'active'
                    ? ['Mã Tour', 'Tên CT Tour', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Số tour đang bán', 'Đơn giá', 'Hành động']
                    : ['Mã Tour', 'Tên CT Tour', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Loại tour', 'Lý do ngừng']
                ).map(header => (
                  <th key={header} className="px-4 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[#2A2421]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'inactive' ? 7 : 8} className="px-5 py-16 text-center text-sm text-[#2A2421]/40">
                    <span className="material-symbols-outlined mb-2 block text-4xl text-[#D0C5AF]">inbox</span>
                    Không có chương trình tour nào
                  </td>
                </tr>
              )}

              {filtered.map(program => (
                <tr
                  key={program.id}
                  className="cursor-pointer transition-colors hover:bg-[#FAFAF5]"
                  onClick={() => {
                    if (activeTab === 'pending') {
                      navigate(`/manager/tour-programs/${program.id}/approval`);
                    }
                  }}
                >
                  <td className="px-4 py-4 font-['Noto_Serif'] text-sm font-medium text-[#2A2421]">{program.id}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#2A2421]">{program.name}</td>
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{program.departurePoint}</td>
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{program.sightseeingSpots.join(', ')}</td>
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{program.duration.days}N{program.duration.nights}Đ</td>

                  {activeTab === 'pending' && (
                    <>
                      <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">{fmtPrice(program.pricingConfig.sellPriceAdult)}</td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{program.createdBy}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/manager/tour-programs/${program.id}/approval`);
                          }}
                          className="bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700"
                        >
                          Duyệt
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'active' && (
                    <>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-[#D4AF37]/10 px-2 py-1 text-xs font-bold text-[#D4AF37]">—</span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#D4AF37]">{fmtPrice(program.pricingConfig.sellPriceAdult)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/manager/tour-programs/${program.id}`);
                            }}
                            className="border border-[#D0C5AF] px-2 py-1 text-[10px] font-bold text-[#2A2421]/60 hover:bg-gray-50"
                          >
                            Xem
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setStopDraft({ program, reason: program.inactiveReason ?? '' });
                            }}
                            className="border border-red-300 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-50"
                          >
                            Tạm ngừng
                          </button>
                        </div>
                      </td>
                    </>
                  )}

                  {activeTab === 'inactive' && (
                    <>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{program.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'}</td>
                      <td className="px-4 py-4 text-sm text-[#2A2421]/70">{program.inactiveReason ?? '—'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-[#2A2421]/40">Hiển thị {filtered.length} chương trình tour</p>
        </div>
      </div>

      {stopDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#2A2421]/50" onClick={() => setStopDraft(null)} />
          <div className="relative w-full max-w-lg border border-[#D0C5AF]/30 bg-white p-8 shadow-2xl">
            <h3 className="font-['Noto_Serif'] text-2xl text-[#2A2421]">Ngừng kinh doanh</h3>
            <p className="mt-2 text-sm text-[#2A2421]/60">Nhập lý do ngừng kinh doanh cho chương trình <strong>{stopDraft.program.name}</strong>.</p>
            <textarea
              value={stopDraft.reason}
              onChange={(event) => setStopDraft({ ...stopDraft, reason: event.target.value })}
              rows={4}
              className="mt-5 w-full resize-none border border-[#D0C5AF]/40 p-3 text-sm outline-none"
              placeholder="Lý do ngừng kinh doanh..."
            />
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStopDraft(null)} className="flex-1 border border-[#2A2421]/20 py-3 text-xs font-bold uppercase tracking-widest">Hủy</button>
              <button onClick={() => void handleStopProgram()} className="flex-1 bg-red-600 py-3 text-xs font-bold uppercase tracking-widest text-white">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


