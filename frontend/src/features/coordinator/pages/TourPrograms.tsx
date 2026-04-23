import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb, message } from 'antd';
import {
  loadTourPrograms,
  saveTourPrograms,
  type TourProgram,
} from '@entities/tour-program/data/tourProgram';
import { PageSearchInput } from '@shared/ui/PageSearchInput';

type TabKey = 'draft' | 'active' | 'inactive';

function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN')?.format(n) + ' VND';
}

function tourTypeLabel(type: TourProgram['tourType']) {
  return type === 'mua_le' ? 'Mùa lễ' : 'Quanh năm';
}

function persistPrograms(nextPrograms: TourProgram[], setPrograms: (value: TourProgram[]) => void) {
  saveTourPrograms(nextPrograms);
  setPrograms(nextPrograms);
}

interface StopProgramModalProps {
  program: TourProgram;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

function StopProgramModal({ program, onCancel, onConfirm }: StopProgramModalProps) {
  const [reason, setReason] = useState(program?.inactiveReason ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div role="dialog" aria-modal="true" aria-labelledby="stop-program-title" className="relative w-full max-w-lg bg-white border border-outline-variant/30 shadow-xl p-6 space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary/45 font-bold">Đang hoạt động</p>
          <h3 id="stop-program-title" className="font-serif text-2xl text-primary mt-1">Ngừng kinh doanh chương trình tour</h3>
          <p className="text-sm text-primary/55 mt-2">{program?.name}</p>
        </div>

        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">
            Lý do <span className="text-red-500">*</span>
          </span>
          <textarea
            value={reason}
            onChange={event => setReason(event?.target?.value)}
            rows={4}
            className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none focus:border-[var(--color-secondary)] resize-none"
            placeholder="Nhập lý do ngừng kinh doanh"
          />
        </label>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-outline-variant/40 text-xs uppercase tracking-widest text-primary/70 hover:bg-surface transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className={`flex-1 px-4 py-3 text-xs uppercase tracking-widest font-bold transition-colors ${
              reason.trim()
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Xác nhận ngừng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoordinatorTourPrograms() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location?.state as { tab?: TabKey } | null)?.tab;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab ?? 'draft');
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<TourProgram[]>(() => loadTourPrograms());
  const [programToStop, setProgramToStop] = useState<TourProgram | null>(null);

  const filtered = useMemo(() => {
    return programs
      ?.filter(program => program?.status === activeTab)
      ?.filter(program => {
        const keyword = searchQuery?.trim()?.toLowerCase();
        if (!keyword) return true;
        return [
          program?.id,
          program?.name,
          program?.departurePoint,
          program?.sightseeingSpots?.join(' '),
          program?.createdBy,
          program?.inactiveReason,
        ]?.join(' ')?.toLowerCase()?.includes(keyword);
      });
  }, [activeTab, programs, searchQuery]);

  const tabCounts = useMemo(() => ({
    draft: programs?.filter(program => program?.status === 'draft')?.length,
    active: programs?.filter(program => program?.status === 'active')?.length,
    inactive: programs?.filter(program => program?.status === 'inactive')?.length,
  }), [programs]);

  const headers = activeTab === 'draft'
    ? ['Mã nháp', 'Tên chương trình tour', 'Điểm khởi hành', 'Điểm tham quan', 'Thời lượng', 'Cập nhật gần nhất', 'Tình trạng', 'Hành động']
    : activeTab === 'active'
      ? ['Mã Tour', 'Tên chương trình tour', 'Điểm khởi hành', 'Điểm tham quan', 'Thời lượng', 'Loại tour', 'Đơn giá', 'Người tạo chương trình tour', 'Hành động']
      : ['Mã Tour', 'Tên chương trình tour', 'Điểm khởi hành', 'Điểm tham quan', 'Thời lượng', 'Loại tour', 'Lý do ngừng', 'Người tạo chương trình tour', 'Hành động'];

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      {programToStop && (
        <StopProgramModal
          program={programToStop}
          onCancel={() => setProgramToStop(null)}
          onConfirm={(reason) => {
            const nextPrograms = programs?.map(item => (
              item?.id === programToStop?.id
                ? {
                    ...item,
                    status: 'inactive' as const,
                    inactiveReason: reason,
                    updatedAt: new Date()?.toISOString(),
                  }
                : item
            ));
            persistPrograms(nextPrograms, setPrograms);
            setProgramToStop(null);
            setActiveTab('inactive');
            message.success(`Đã ngừng kinh doanh ${programToStop?.name}`);
          }}
        />
      )}

      <main className="p-10">
        <Breadcrumb className="mb-6 text-xs" items={[
          { title: <Link to="/coordinator/tour-programs" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Chương trình tour</Link> },
          { title: <span className="text-[var(--color-primary)]/30">Quản lý chương trình tour</span> },
        ]} />

        <div className="flex justify-between items-end mb-8 gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 block mb-1">NV điều phối</span>
            <h1 className="font-serif text-3xl text-primary">Quản lý Chương trình tour</h1>
            <p className="text-sm text-primary/50 mt-2">Tách khỏi màn Điều hành tour; quản lý template chương trình và thao tác chi tiết theo từng trạng thái.</p>
          </div>
          <button onClick={() => navigate('/coordinator/tour-programs/create')} className="px-8 py-4 bg-[#D4AF37] text-white font-bold uppercase tracking-widest text-[10px] hover:opacity-90 shadow-lg">
            Tạo mới
          </button>
        </div>

        <PageSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã chương trình, tên tour, điểm khởi hành..."
          className="mb-6"
        />

        <div className="bg-white border border-outline-variant/30 mb-6">
          {([
            { key: 'draft' as const, label: 'Nháp' },
            { key: 'active' as const, label: 'Đang hoạt động' },
            { key: 'inactive' as const, label: 'Ngừng hoạt động' },
          ])?.map(tab => (
            <button key={tab?.key} onClick={() => setActiveTab(tab?.key)} className={`px-6 py-3 text-xs uppercase tracking-widest border-b-2 ${activeTab === tab?.key ? 'border-secondary text-secondary font-bold' : 'border-transparent text-primary/50'}`}>
              {tab?.label}
              <span className={`ml-2 px-1.5 py-0.5 text-[9px] rounded-full ${activeTab === tab?.key ? 'bg-[#D4AF37]/15' : 'bg-gray-100 text-gray-500'}`}>
                {tabCounts[tab?.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-white border border-outline-variant/30 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                {headers?.map(header => (
                  <th key={header} className="px-5 py-4 text-[10px] uppercase tracking-widest text-primary/50 font-bold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filtered?.map(program => (
                <tr key={program?.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-5 py-4 font-mono text-xs">{program?.id}</td>
                  <td className="px-5 py-4 text-sm font-medium">{program?.name}</td>
                  <td className="px-5 py-4 text-sm text-primary/70">{program?.departurePoint}</td>
                  <td className="px-5 py-4 text-sm text-primary/70">{program?.sightseeingSpots?.join(', ')}</td>
                  <td className="px-5 py-4 text-sm text-primary/70">{program?.duration?.days}N{program?.duration?.nights}Đ</td>

                  {activeTab === 'draft' && (
                    <>
                      <td className="px-5 py-4 text-sm text-primary/70">{new Date(program?.updatedAt)?.toLocaleDateString('vi-VN')}</td>
                      <td className="px-5 py-4 text-xs text-amber-700 font-bold">Nháp</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/coordinator/tour-programs/${program?.id}`)}
                          className="px-3 py-1.5 border border-outline-variant/40 text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </>
                  )}

                  {activeTab === 'active' && (
                    <>
                      <td className="px-5 py-4 text-sm text-primary/70">{tourTypeLabel(program?.tourType)}</td>
                      <td className="px-5 py-4 text-sm font-bold text-secondary">{fmtPrice(program?.pricingConfig?.sellPriceAdult)}</td>
                      <td className="px-5 py-4 text-sm text-primary/70">{program?.createdBy}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/coordinator/tour-programs/${program?.id}`)}
                            className="px-3 py-1.5 border border-outline-variant/40 text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface transition-colors"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => setProgramToStop(program)}
                            className="px-3 py-1.5 border border-red-300 text-red-600 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 transition-colors"
                          >
                            Ngừng kinh doanh
                          </button>
                        </div>
                      </td>
                    </>
                  )}

                  {activeTab === 'inactive' && (
                    <>
                      <td className="px-5 py-4 text-sm text-primary/70">{tourTypeLabel(program?.tourType)}</td>
                      <td className="px-5 py-4 text-sm text-primary/70">{program?.inactiveReason ?? 'Ngừng theo kế hoạch kinh doanh'}</td>
                      <td className="px-5 py-4 text-sm text-primary/70">{program?.createdBy}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => navigate(`/coordinator/tour-programs/${program?.id}`)}
                          className="px-3 py-1.5 border border-outline-variant/40 text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-surface transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={headers?.length} className="py-16 text-center text-sm text-primary/40">
                    Không có chương trình tour nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
