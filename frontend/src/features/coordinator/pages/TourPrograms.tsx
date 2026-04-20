import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { mockTourPrograms, type TourProgram } from '@entities/tour-program/data/tourProgram';
import { PageSearchInput } from '@shared/ui/PageSearchInput';

type TabKey = 'draft' | 'active' | 'inactive';

function fmtPrice(n: number) {
  return new Intl.NumberFormat('vi-VN')?.format(n) + ' VND';
}

function tourTypeLabel(type: TourProgram['tourType']) {
  return type === 'mua_le' ? 'Mùa lễ' : 'Quanh năm';
}

export default function CoordinatorTourPrograms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('draft');
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = mockTourPrograms?.filter(p => {
    if (activeTab === 'draft') return p.status === 'draft';
    return p.status === activeTab;
  })?.filter(program => {
    const keyword = searchQuery?.trim()?.toLowerCase();
    if (!keyword) return true;
    return [
      program?.id,
      program?.name,
      program?.departurePoint,
      program?.sightseeingSpots?.join(' '),
      program?.createdBy,
    ]?.join(' ')?.toLowerCase()?.includes(keyword);
  });

  const headers = activeTab === 'draft'
    ? ['Mã nháp', 'Tên chương trình tour', 'Điểm khởi hành', 'Điểm tham quan', 'Thời lượng', 'Cập nhật gần nhất', 'Tình trạng']
    : activeTab === 'active'
    ? ['Mã Tour', 'Tên chương trình tour', 'Điểm khởi hành', 'Điểm tham quan', 'Thời lượng', 'Loại tour', 'Đơn giá', 'Người tạo chương trình tour', 'Hành động']
    : ['Mã Tour', 'Tên chương trình tour', 'Điểm khởi hành', 'Điểm tham quan', 'Thời lượng', 'Loại tour', 'Lý do ngừng', 'Người tạo chương trình tour'];

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen">
      <main className="p-10">
        <Breadcrumb className="mb-6 text-xs" items={[
          { title: <Link to="/coordinator/tour-programs" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Chương trình tour</Link> },
          { title: <span className="text-[var(--color-primary)]/30">Quản lý chương trình tour</span> },
        ]} />

        <div className="flex justify-between items-end mb-8 gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 block mb-1">NV điều phối</span>
            <h1 className="font-serif text-3xl text-primary">Quản lý Chương trình tour</h1>
            <p className="text-sm text-primary/50 mt-2">Tách khỏi màn Điều hành tour; chỉ quản lý template chương trình.</p>
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
          {[
            { key: 'draft' as const, label: 'Nháp' },
            { key: 'active' as const, label: 'Đang hoạt động' },
            { key: 'inactive' as const, label: 'Ngừng hoạt động' },
          ]?.map(tab => (
            <button key={tab?.key} onClick={() => setActiveTab(tab?.key)} className={`px-6 py-3 text-xs uppercase tracking-widest border-b-2 ${activeTab === tab?.key ? 'border-secondary text-secondary font-bold' : 'border-transparent text-primary/50'}`}>
              {tab?.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-outline-variant/30 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                {headers?.map(h => <th key={h} className="px-5 py-4 text-[10px] uppercase tracking-widest text-primary/50 font-bold">{h}</th>)}
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
                    </>
                  )}
                  {activeTab === 'active' && (
                    <>
                      <td className="px-5 py-4 text-sm text-primary/70">{tourTypeLabel(program?.tourType)}</td>
                      <td className="px-5 py-4 text-sm font-bold text-secondary">{fmtPrice(program?.pricingConfig?.sellPriceAdult)}</td>
                      <td className="px-5 py-4 text-sm text-primary/70">{program?.createdBy}</td>
                      <td className="px-5 py-4"><button className="px-3 py-1.5 border border-red-300 text-red-600 text-[10px] uppercase tracking-widest font-bold">Ngừng kinh doanh</button></td>
                    </>
                  )}
                  {activeTab === 'inactive' && (
                    <>
                      <td className="px-5 py-4 text-sm text-primary/70">{tourTypeLabel(program?.tourType)}</td>
                      <td className="px-5 py-4 text-sm text-primary/70">Ngừng theo kế hoạch kinh doanh</td>
                      <td className="px-5 py-4 text-sm text-primary/70">{program?.createdBy}</td>
                    </>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={headers?.length} className="py-16 text-center text-sm text-primary/40">Không có chương trình tour nào</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

