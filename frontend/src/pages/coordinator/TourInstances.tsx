import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  mockTourInstances,
  TOUR_INSTANCE_STATUS_LABEL,
  TOUR_INSTANCE_STATUS_STYLE,
  type TourInstance,
  type TourInstanceStatus,
} from '../../data/tourProgram';

type TabKey =
  | 'cho_nhan_dieu_hanh'
  | 'cho_du_toan'
  | 'phan_cong_hdv'
  | 'dang_khoi_hanh'
  | 'cho_quyet_toan'
  | 'hoan_thanh'
  | 'da_huy';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'cho_nhan_dieu_hanh', label: 'Chờ nhận ĐH', desc: 'Tour đủ điều kiện chờ nhận điều hành' },
  { key: 'cho_du_toan', label: 'Chờ dự toán', desc: 'Tour đã nhận, chờ dự toán' },
  { key: 'phan_cong_hdv', label: 'Phân công HDV', desc: 'Tour sẵn sàng phân công hướng dẫn viên' },
  { key: 'dang_khoi_hanh', label: 'Đang khởi hành', desc: 'Tour đang trong quá trình triển khai' },
  { key: 'cho_quyet_toan', label: 'Chờ quyết toán', desc: 'Tour đã kết thúc, chờ quyết toán' },
  { key: 'hoan_thanh', label: 'Hoàn thành', desc: 'Tour đã quyết toán xong' },
  { key: 'da_huy', label: 'Đã hủy', desc: 'Tour đã bị hủy' },
];

const COMMON_COLS = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Số KH', 'Hướng dẫn viên', 'Trạng thái', ''];

const COL_COMPLETED = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH', 'Doanh thu thực tế', 'Chi phí thực tế', 'Lợi nhuận', ''];
const COL_CANCELLED = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH đăng ký', 'Thời điểm hủy', 'Tổng tiền hoàn', 'Lý do'];

export default function AdminTourPrograms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('cho_nhan_dieu_hanh');

  // Map tab key → status filter (phan_cong_hdv → san_sang_trien_khai, dang_khoi_hanh → dang_trien_khai)
  const tabStatusMap: Record<TabKey, TourInstanceStatus> = {
    cho_nhan_dieu_hanh: 'cho_nhan_dieu_hanh',
    cho_du_toan: 'cho_du_toan',
    phan_cong_hdv: 'san_sang_trien_khai',
    dang_khoi_hanh: 'dang_trien_khai',
    cho_quyet_toan: 'cho_quyet_toan',
    hoan_thanh: 'hoan_thanh',
    da_huy: 'da_huy',
  };

  const instances = mockTourInstances;
  const tabCounts = TABS.reduce((acc, tab) => {
    const status = tabStatusMap[tab.key];
    acc[tab.key] = instances.filter(i => i.status === status).length;
    return acc;
  }, {} as Record<TabKey, number>);

  const filtered = instances.filter(i => i.status === tabStatusMap[activeTab]);

  const getColumns = (tab: TabKey) => {
    if (tab === 'hoan_thanh') return COL_COMPLETED;
    if (tab === 'da_huy') return COL_CANCELLED;
    return COMMON_COLS;
  };

  const renderCell = (inst: TourInstance, col: string, tab: TabKey) => {
    if (col === '') return '';
    if (tab === 'hoan_thanh') {
      if (col === 'Mã tour') return <span className="font-mono text-xs">{inst.id}</span>;
      if (col === 'Tên chương trình') return inst.programName;
      if (col === 'Ngày KH') return new Date(inst.departureDate).toLocaleDateString('vi-VN');
      if (col === 'Số KH') return inst.expectedGuests;
      if (col === 'Doanh thu thực tế') {
        const rev = inst.settlement?.revenue;
        return rev ? `${rev.toLocaleString('vi-VN')}đ` : '—';
      }
      if (col === 'Chi phí thực tế') {
        const cost = inst.settlement?.totalActualCost;
        return cost ? `${cost.toLocaleString('vi-VN')}đ` : '—';
      }
      if (col === 'Lợi nhuận') {
        const pct = inst.settlement?.profitPercent;
        return pct != null ? (
          <span className={`font-bold ${pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</span>
        ) : '—';
      }
      return '—';
    }
    if (tab === 'da_huy') {
      if (col === 'Mã tour') return <span className="font-mono text-xs">{inst.id}</span>;
      if (col === 'Tên chương trình') return inst.programName;
      if (col === 'Ngày KH') return new Date(inst.departureDate).toLocaleDateString('vi-VN');
      if (col === 'Số KH đăng ký') return inst.expectedGuests;
      if (col === 'Thời điểm hủy') return inst.cancelledAt ? new Date(inst.cancelledAt).toLocaleDateString('vi-VN') : '—';
      if (col === 'Tổng tiền hoàn') return inst.refundTotal ? `${inst.refundTotal.toLocaleString('vi-VN')}đ` : '—';
      if (col === 'Lý do') return (
        <span className="text-xs text-primary/60 line-clamp-2 max-w-[150px]" title={inst.cancelReason}>
          {inst.cancelReason ?? '—'}
        </span>
      );
      return '—';
    }
    // Common columns
    if (col === 'Mã tour') return <span className="font-mono text-xs">{inst.id}</span>;
    if (col === 'Tên chương trình') return <span className="text-sm font-medium">{inst.programName}</span>;
    if (col === 'Ngày KH') return new Date(inst.departureDate).toLocaleDateString('vi-VN');
    if (col === 'Điểm KH') return <span className="text-xs">{inst.departurePoint}</span>;
    if (col === 'Điểm TQ') return <span className="text-xs">{inst.sightseeingSpots.join(', ')}</span>;
    if (col === 'Thời lượng') return '—';
    if (col === 'Số KH') return inst.expectedGuests;
    if (col === 'Hướng dẫn viên') return <span className="text-xs text-primary/50">—</span>;
    if (col === 'Trạng thái') return (
      <span className={`text-[10px] px-2 py-1 border font-label uppercase tracking-wider ${TOUR_INSTANCE_STATUS_STYLE[inst.status]}`}>
        {TOUR_INSTANCE_STATUS_LABEL[inst.status]}
      </span>
    );
    return '—';
  };

  const getRowAction = (inst: TourInstance, tab: TabKey) => {
    if (tab === 'cho_nhan_dieu_hanh') return (
      <button
        onClick={() => navigate(`/coordinator/tour-programs/${inst.id}/receive`)}
        className="px-4 py-1.5 bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors"
      >
        Nhận điều hành
      </button>
    );
    if (tab === 'cho_du_toan') return (
      <button
        onClick={() => navigate(`/coordinator/tours/${inst.id}/estimate`)}
        className="px-4 py-1.5 bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-teal-700 transition-colors"
      >
        Làm dự toán
      </button>
    );
    if (tab === 'phan_cong_hdv') return (
      <button
        onClick={() => navigate(`/coordinator/tour-programs/${inst.id}`)}
        className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
      >
        Xem chi tiết
      </button>
    );
    if (tab === 'dang_khoi_hanh') return (
      <button
        onClick={() => navigate(`/coordinator/tour-programs/${inst.id}/dispatch-hdv`)}
        className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors"
      >
        Điều phối HDV
      </button>
    );
    if (tab === 'cho_quyet_toan') return (
      <button
        onClick={() => navigate(`/coordinator/tours/${inst.id}/settle`)}
        className="px-4 py-1.5 bg-cyan-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-cyan-800 transition-colors"
      >
        Làm quyết toán
      </button>
    );
    if (tab === 'hoan_thanh') return (
      <button
        onClick={() => navigate(`/coordinator/tour-programs/${inst.id}`)}
        className="px-4 py-1.5 border border-outline-variant/50 text-primary/60 text-[10px] uppercase tracking-wider hover:bg-surface transition-colors"
      >
        Chi tiết
      </button>
    );
    if (tab === 'da_huy') return (
      <button
        onClick={() => navigate(`/coordinator/tour-programs/${inst.id}`)}
        className="px-4 py-1.5 border border-outline-variant/50 text-primary/60 text-[10px] uppercase tracking-wider hover:bg-surface transition-colors"
      >
        Xem
      </button>
    );
    return null;
  };

  const cols = getColumns(activeTab);

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-32">
      <main className="p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 block mb-1">Khu vực điều phối</span>
            <h1 className="font-serif text-3xl text-primary tracking-tight">Điều hành Tour</h1>
          </div>
        </div>

        {/* 8 Tabs */}
        <div className="flex overflow-x-auto gap-0 mb-0 border-b border-outline-variant/30 bg-white rounded-t-sm">
          {TABS.map(tab => {
            const count = tabCounts[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                    : 'border-transparent text-primary/40 hover:text-primary/70 hover:bg-surface'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]' : 'bg-surface text-primary/40'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <div className="bg-white border-x border-b border-outline-variant/30 px-6 py-3 mb-0">
          <p className="text-xs text-primary/50 italic">
            {TABS.find(t => t.key === activeTab)?.desc}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white border-x border-b border-outline-variant/30 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-primary/10 block mb-3">inbox</span>
              <p className="text-sm text-primary/40">Không có tour nào trong mục này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                    {cols.map(col => (
                      <th key={col} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-5 py-3.5 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inst, rowIdx) => (
                    <tr key={inst.id}
                      className={`border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low transition-colors ${
                        rowIdx % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface)]/30'
                      }`}
                    >
                      {cols.map(col => (
                        <td key={col} className="px-5 py-4 text-primary text-sm align-middle">
                          {col === '' ? (
                            <div className="flex justify-end">{getRowAction(inst, activeTab)}</div>
                          ) : (
                            renderCell(inst, col, activeTab)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
