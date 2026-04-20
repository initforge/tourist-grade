import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { mockTourPrograms, mockTourInstances, type TourInstance } from '@entities/tour-program/data/tourProgram';
import { PageSearchInput } from '@shared/ui/PageSearchInput';

type SubTab = 'quy_tac' | 'cho_duyet_ban';

type PreviewRow = {
  id: string;
  departureDate: string;
  endDate: string;
  dayType: string;
  expectedGuests: number;
  costPerAdult: number;
  sellPrice: number;
  profitPercent: number;
  bookingDeadline: string;
  conflictLabel: string;
  conflictDetails: string[];
  checked: boolean;
};

type GenerateModalState = {
  programId: string;
  programName: string;
  type: 'mua_le' | 'quanh_nam';
  rows: PreviewRow[];
};

const DEPLOYED_STATUSES = new Set(['san_sang_trien_khai', 'dang_trien_khai', 'cho_quyet_toan', 'hoan_thanh']);
const OPEN_SELLING_STATUSES = new Set(['dang_mo_ban', 'cho_duyet_ban']);

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value)?.toLocaleDateString('vi-VN');
}

function toDateInput(value: string) {
  return new Date(value)?.toISOString()?.split('T')[0];
}

function monthCoverage(start?: string | null, end?: string | null) {
  if (!start || !end) return '-';
  const diffDays = Math.max(0, Math.round((new Date(end)?.getTime() - new Date(start)?.getTime()) / 86400000));
  const months = diffDays / 30;
  return `${months?.toFixed(1)} thàng`;
}

function buildPreviewRows(programId: string): PreviewRow[] {
  const program = mockTourPrograms?.find(item => item.id === programId);
  if (!program) {
    return [];
  }
  const existingRows = mockTourInstances?.filter(item => item.programId === programId && OPEN_SELLING_STATUSES?.has(item?.status));
  const offsets = [7, 14, 21, 28, 35, 42];

  return offsets?.map((offset, index) => {
    const departureDate = new Date();
    departureDate?.setDate(departureDate?.getDate() + offset);
    const endDate = new Date(departureDate);
    endDate?.setDate(endDate?.getDate() + Math.max(1, program?.duration?.days - 1));
    const bookingDeadline = new Date(departureDate);
    bookingDeadline?.setDate(bookingDeadline?.getDate() - program?.bookingDeadline);

    const overlapping = existingRows?.filter(instance => {
      const gap = Math.abs(new Date(instance?.departureDate)?.getTime() - departureDate?.getTime());
      return gap <= 4 * 86400000;
    });

    const sellPrice = program?.pricingConfig?.sellPriceAdult + index * 150000;
    const costPerAdult = Math.round(sellPrice * 0.68);
    const profitPercent = Number((((sellPrice - costPerAdult) / sellPrice) * 100)?.toFixed(1));

    return {
      id: `T00${index + 1}`,
      departureDate: toDateInput(departureDate?.toISOString()),
      endDate: toDateInput(endDate?.toISOString()),
      dayType: program.tourType === 'mua_le' ? 'Ngày lễ' : index === 2 ? 'Giỗ tổ' : index === 5 ? 'Lễ 30/04 - 1/5' : 'Ngày thường',
      expectedGuests: program?.pricingConfig?.minParticipants + 2 + index,
      costPerAdult,
      sellPrice,
      profitPercent,
      bookingDeadline: toDateInput(bookingDeadline?.toISOString()),
      conflictLabel: overlapping.length === 0
        ? '0 tour trùng thời điểm'
        : overlapping?.map(instance => `x ${instance.status === 'cho_duyet_ban' ? 'tour chờ duyệt' : 'tour mở bán'}`)?.join('\n'),
      conflictDetails: overlapping.length === 0 ? [] : overlapping?.map(instance => `${instance?.id} - ${instance?.programName}`),
      checked: index !== 3 && index !== 4,
    };
  });
}

export default function TourGenerationRules() {
  const [subTab, setSubTab] = useState<SubTab>('quy_tac');
  const [searchQuery, setSearchQuery] = useState('');
  const [generateModal, setGenerateModal] = useState<GenerateModalState | null>(null);
  const [viewModal, setViewModal] = useState<TourInstance | null>(null);

  const activePrograms = useMemo(() => {
    return mockTourPrograms
      ?.filter(program => program.status === 'active')
      ?.map(program => {
        const rows = mockTourInstances?.filter(instance => instance.programId === program?.id);
        const sellingRows = rows?.filter(instance => OPEN_SELLING_STATUSES?.has(instance?.status));
        const deployedRows = rows?.filter(instance => DEPLOYED_STATUSES?.has(instance?.status));
        const farthestSelling = sellingRows?.sort((a, b) => new Date(b?.departureDate)?.getTime() - new Date(a?.departureDate)?.getTime())[0];
        const nearestSelling = sellingRows?.sort((a, b) => new Date(a?.departureDate)?.getTime() - new Date(b?.departureDate)?.getTime())[0];
        const warningDate = rows
          ?.filter(instance => instance?.warningDate)
          ?.sort((a, b) => new Date(a?.warningDate ?? '')?.getTime() - new Date(b?.warningDate ?? '')?.getTime())[0]?.warningDate;

        return {
          program,
          farthestSelling,
          nearestSelling,
          deployedCount: deployedRows?.length,
          computedCoverage: monthCoverage(nearestSelling?.departureDate, farthestSelling?.departureDate),
          availableCoverage: monthCoverage(nearestSelling?.departureDate, farthestSelling?.departureDate),
          minimumCoverage: program.tourType === 'quanh_nam' ? '3 tháng' : '-',
          statusLabel: warningDate ? 'Cảnh báo' : 'Đạt',
          warningDate,
        };
      })
      ?.sort((left, right) => {
        if (left?.statusLabel !== right?.statusLabel) {
          return left.statusLabel === 'Cảnh báo' ? -1 : 1;
        }
        if (left?.warningDate && right?.warningDate) {
          return new Date(left?.warningDate)?.getTime() - new Date(right?.warningDate)?.getTime();
        }
        return left?.program?.name?.localeCompare(right?.program?.name);
      });
  }, []);

  const pendingApprovalInstances = useMemo(
    () => mockTourInstances?.filter(instance => instance.status === 'cho_duyet_ban'),
    [],
  );

  const filteredActivePrograms = useMemo(() => {
    const keyword = searchQuery?.trim()?.toLowerCase();
    if (!keyword) return activePrograms;
    return activePrograms?.filter(row =>
      [
        row?.program?.id,
        row?.program?.name,
        row?.program?.departurePoint,
        row?.program?.sightseeingSpots?.join(' '),
        row?.statusLabel,
      ]?.join(' ')?.toLowerCase()?.includes(keyword),
    );
  }, [activePrograms, searchQuery]);

  const filteredPendingApprovalInstances = useMemo(() => {
    const keyword = searchQuery?.trim()?.toLowerCase();
    if (!keyword) return pendingApprovalInstances;
    return pendingApprovalInstances?.filter(instance => {
      const program = mockTourPrograms?.find(item => item.id === instance?.programId);
      return [
        instance?.id,
        instance?.programName,
        instance?.departureDate,
        instance?.createdAt,
        program?.tourType,
      ]?.join(' ')?.toLowerCase()?.includes(keyword);
    });
  }, [pendingApprovalInstances, searchQuery]);

  const selectedCount = generateModal?.rows?.filter(row => row?.checked)?.length ?? 0;
  const unselectedCount = generateModal ? generateModal?.rows?.length - selectedCount : 0;

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-32">
      <main className="p-8 max-w-7xl mx-auto">
        <Breadcrumb
          className="mb-4 text-xs"
          items={[
            { title: <Link to="/coordinator/tour-rules" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Quản lý Tour</Link> },
            { title: <span className="text-[var(--color-primary)]/30">Quy tắc tạo tour</span> },
          ]}
        />

        <div className="mb-8">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 block mb-1">Khu vực điều phối</span>
          <h1 className="font-serif text-3xl text-primary">Quản lý Tour</h1>
          <p className="text-sm text-primary/50 mt-2">
            Rà soát độ bao phủ của chương trình tour và tạo các đợt khởi hành mới theo đúng wireframe nghiệp vụ.
          </p>
        </div>

        <div className="flex gap-0 mb-0 border-b border-outline-variant/30 bg-white rounded-t-sm overflow-hidden">
          <button
            onClick={() => setSubTab('quy_tac')}
            className={`px-6 py-3 text-[11px] font-medium border-b-2 transition-colors ${
              subTab === 'quy_tac'
                ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                : 'border-transparent text-primary/40 hover:text-primary/70'
            }`}
          >
            Quy tắc tạo tour
          </button>
          <button
            onClick={() => setSubTab('cho_duyet_ban')}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-medium border-b-2 transition-colors ${
              subTab === 'cho_duyet_ban'
                ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                : 'border-transparent text-primary/40 hover:text-primary/70'
            }`}
          >
            Chờ duyệt bán
            {pendingApprovalInstances?.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-mono">
                {pendingApprovalInstances?.length}
              </span>
            )}
          </button>
        </div>

        <PageSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={subTab === 'quy_tac'
            ? 'Tìm theo chương trình tour, điểm khởi hành, trạng thái...'
            : 'Tìm theo mã yêu cầu, chương trình tour, ngày khởi hành...'}
          className="my-6"
        />

        {subTab === 'quy_tac' && (
          <div className="bg-white border-x border-b border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px]">
                <thead>
                  <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                    {[
                      'Chương trình tour',
                      'Loại tour',
                      'Ngày khởi hành xa nhất',
                      'Độ bao phủ đã tính',
                      'Độ phủ khả dụng',
                      'Độ bao phủ tối thiểu',
                      'Trạng thái',
                      'Thao tác',
                    ]?.map(header => (
                      <th key={header} className="px-5 py-4 text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredActivePrograms.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center text-sm text-primary/40">
                        Chưa có chương trình tour. Kết nối API hoặc tạo dữ liệu thật để bắt đầu.
                      </td>
                    </tr>
                  )}
                  {filteredActivePrograms?.map((row, index) => (
                    <tr key={row?.program?.id} className={index % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface)]/20'}>
                      <td className="px-5 py-4 text-sm font-medium text-primary">{row?.program?.name}</td>
                      <td className="px-5 py-4 text-sm">{row?.program.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'}</td>
                      <td className="px-5 py-4 text-sm">{formatDate(row?.farthestSelling?.departureDate)}</td>
                      <td className="px-5 py-4 text-sm">{row?.computedCoverage}</td>
                      <td className="px-5 py-4 text-sm">{row?.availableCoverage}</td>
                      <td className="px-5 py-4 text-sm">{row?.minimumCoverage}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                          row.statusLabel === 'Cảnh báo' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {row?.statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setGenerateModal({
                            programId: row?.program?.id,
                            programName: row?.program?.name,
                            type: row?.program?.tourType,
                            rows: buildPreviewRows(row?.program?.id),
                          })}
                          className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-colors"
                        >
                          Tạo tour
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'cho_duyet_ban' && (
          <div className="bg-white border-x border-b border-outline-variant/30 overflow-hidden">
            {filteredPendingApprovalInstances.length === 0 ? (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-primary/10 block mb-3">inbox</span>
                <p className="text-sm text-primary/40">Không có tour nào chờ duyệt bán</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                      {['Mã yêu cầu', 'Tên chương trình', 'Loại tour', 'Ngày KH gần nhất', 'Số tour yêu cầu', 'Ngày tạo', '']?.map(header => (
                        <th key={header} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-5 py-3.5 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPendingApprovalInstances?.map((instance, index) => {
                      const program = mockTourPrograms?.find(item => item.id === instance?.programId);
                      return (
                        <tr key={instance?.id} className={`border-b border-outline-variant/20 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface)]/30'}`}>
                          <td className="px-5 py-4 font-mono text-xs">{instance?.id}</td>
                          <td className="px-5 py-4 text-sm font-medium">{instance?.programName}</td>
                          <td className="px-5 py-4 text-xs">
                            <span className={`text-[10px] px-2 py-0.5 font-label uppercase tracking-wider ${
                              program?.tourType === 'mua_le' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {program?.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm">{formatDate(instance?.departureDate)}</td>
                          <td className="px-5 py-4 text-sm">1 tour</td>
                          <td className="px-5 py-4 text-sm">{formatDate(instance?.createdAt)}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setViewModal(instance)} className="px-3 py-1.5 border border-outline-variant/50 text-primary/60 text-[10px] uppercase tracking-wider hover:bg-surface transition-colors">
                                Xem
                              </button>
                              <button className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors">
                                Sửa
                              </button>
                              <button className="px-3 py-1.5 border border-red-300 text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors">
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {viewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setViewModal(null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="tour-detail-title" className="relative w-full max-w-5xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between z-10">
                <div>
                  <h3 id="tour-detail-title" className="font-serif text-xl text-primary">Chi tiết tour</h3>
                  <p className="text-xs text-primary/50 mt-0.5">Mã yêu cầu: <span className="font-mono">{viewModal?.id}</span></p>
                </div>
                <button onClick={() => setViewModal(null)} className="text-primary/40 hover:text-primary">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(() => {
                    const program = mockTourPrograms?.find(item => item.id === viewModal?.programId);
                    return [
                      { label: 'Tên chương trình', value: viewModal?.programName },
                      { label: 'Loại tour', value: program?.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm' },
                      { label: 'Điểm khởi hành', value: viewModal?.departurePoint },
                      { label: 'Điểm tham quan', value: viewModal?.sightseeingSpots?.join(', ') },
                      { label: 'Thời lượng tour', value: program ? `${program?.duration?.days} ngày ${program?.duration?.nights} đêm` : '-' },
                    ]?.map(item => (
                      <div key={item?.label} className="bg-[var(--color-surface)] p-3">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-1">{item?.label}</p>
                        <p className="text-sm font-medium text-primary">{item?.value}</p>
                      </div>
                    ));
                  })()}
                </div>

                <div className="overflow-x-auto border border-outline-variant/30">
                  <table className="w-full min-w-[920px]">
                    <thead>
                      <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                        {['Mã tour', 'Ngày khởi hành', 'Loại ngày', 'Số khách dự kiến', 'Giá vốn/người lớn', 'Lợi nhuận', 'Giá bán', 'Hạn đặt tour']?.map(header => (
                          <th key={header} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-4 py-3 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {buildPreviewRows(viewModal?.programId)?.map(row => (
                        <tr key={row?.id} className="border-b border-outline-variant/20 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs">{row?.id}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(row?.departureDate)}</td>
                          <td className="px-4 py-3 text-sm">{row?.dayType}</td>
                          <td className="px-4 py-3 text-sm">{row?.expectedGuests}</td>
                          <td className="px-4 py-3 text-sm">{row?.costPerAdult?.toLocaleString('vi-VN')}đ</td>
                          <td className="px-4 py-3 text-sm">{row?.profitPercent}%</td>
                          <td className="px-4 py-3 text-sm">{row?.sellPrice?.toLocaleString('vi-VN')}đ</td>
                          <td className="px-4 py-3 text-sm">{formatDate(row?.bookingDeadline)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {generateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setGenerateModal(null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="generate-tour-title" className="relative w-full max-w-6xl bg-white shadow-2xl max-h-[88vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between z-10">
                <div>
                  <h3 id="generate-tour-title" className="font-serif text-2xl text-primary">Sinh tour</h3>
                  <p className="text-xs text-primary/50 mt-0.5">{generateModal?.programName}</p>
                </div>
                <button onClick={() => setGenerateModal(null)} className="text-primary/40 hover:text-primary">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4 max-w-xl">
                  <label className="text-sm text-primary/70">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Sinh từ ngày</span>
                    <input type="date" defaultValue={generateModal?.rows[0]?.departureDate} className="w-full border border-outline-variant/50 px-4 py-2.5 outline-none" />
                  </label>
                  <label className="text-sm text-primary/70">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Đến ngày</span>
                    <input type="date" defaultValue={generateModal?.rows?.at(-1)?.departureDate} className="w-full border border-outline-variant/50 px-4 py-2.5 outline-none" />
                  </label>
                </div>

                <div>
                  <p className="text-sm font-medium text-primary mb-3">Preview danh sách tour</p>
                  <div className="overflow-x-auto border border-outline-variant/30">
                    <table className="w-full min-w-[1320px]">
                      <thead>
                        <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                          {['Mã tour', 'Ngày khởi hành', 'Ngày kết thúc', 'Loại ngày', 'Số khách dự kiến', 'Giá vốn', 'Giá bán', 'Lợi nhuận', 'Hạn đặt tour', 'Cùng thời điểm', 'Tạo']?.map(header => (
                            <th key={header} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-4 py-3 whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {generateModal?.rows?.map((row, index) => (
                          <tr key={row?.id} className={`border-b border-outline-variant/20 last:border-0 ${row?.checked ? 'bg-white' : 'bg-gray-100 text-gray-400'}`}>
                            <td className="px-4 py-3 font-mono text-xs">{row?.id}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row?.departureDate)}</td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row?.endDate)}</td>
                            <td className="px-4 py-3 text-sm">{row?.dayType}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row?.expectedGuests}
                                disabled={!row?.checked}
                                onChange={event => setGenerateModal(current => current ? ({
                                  ...current,
                                  rows: current?.rows?.map(item => item.id === row?.id ? { ...item, expectedGuests: Math.max(1, Number(event?.target?.value) || 1) } : item),
                                }) : current)}
                                className="w-24 border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm">{row?.costPerAdult?.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row?.sellPrice}
                                disabled={!row?.checked}
                                onChange={event => setGenerateModal(current => current ? ({
                                  ...current,
                                  rows: current?.rows?.map(item => {
                                    if (item?.id !== row?.id) return item;
                                    const sellPrice = Math.max(0, Number(event?.target?.value) || 0);
                                    const profitPercent = sellPrice > 0 ? Number((((sellPrice - item?.costPerAdult) / sellPrice) * 100)?.toFixed(1)) : 0;
                                    return { ...item, sellPrice, profitPercent };
                                  }),
                                }) : current)}
                                className="w-28 border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm">{row?.profitPercent}%</td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={row?.bookingDeadline}
                                disabled={!row?.checked}
                                onChange={event => setGenerateModal(current => current ? ({
                                  ...current,
                                  rows: current?.rows?.map(item => item.id === row?.id ? { ...item, bookingDeadline: event?.target?.value } : item),
                                }) : current)}
                                className="border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                              />
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-pre-line" title={row?.conflictDetails?.join('\n')}>
                              {row?.conflictLabel}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={row?.checked}
                                aria-label={`Tạo ${row?.id}`}
                                onChange={() => setGenerateModal(current => current ? ({
                                  ...current,
                                  rows: current?.rows?.map(item => item.id === row?.id ? { ...item, checked: !item?.checked } : item),
                                }) : current)}
                                className="accent-[var(--color-secondary)] w-4 h-4"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border border-t-0 border-outline-variant/30 bg-[var(--color-surface)] px-4 py-3 text-sm text-primary/70">
                    <span>Đã chọn: {selectedCount} tour</span>
                    <span>Chưa chọn: {unselectedCount} tour</span>
                  </div>
                </div>

                <div className="text-xs text-primary/50 bg-[var(--color-surface)] border border-outline-variant/30 p-3">
                  <strong>Tóm tắt:</strong> {selectedCount} tour được chọn để gửi duyệt. Bỏ chọn một dòng sẽ làm mờ dòng đó và khóa chỉnh sửa theo đúng logic nghiệp vụ.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setGenerateModal(null)}
                    className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      setGenerateModal(null);
                      setSubTab('cho_duyet_ban');
                    }}
                    disabled={selectedCount === 0}
                    className={`flex-1 py-3 font-sans uppercase tracking-wider text-xs font-bold transition-colors ${
                      selectedCount > 0
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Gửi duyệt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

