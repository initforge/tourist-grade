import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  mockTourInstances,
  TOUR_INSTANCE_STATUS_LABEL,
  TOUR_INSTANCE_STATUS_STYLE,
  type TourInstance,
  type TourInstanceStatus,
} from '../../data/tourProgram';

type TabKey = TourInstanceStatus | 'all';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'cho_duyet_ban', label: 'Chờ duyệt bán', desc: 'Tour chờ duyệt mở bán' },
  { key: 'cho_nhan_dieu_hanh', label: 'Chờ nhận ĐH', desc: 'Tour đủ điều kiện chờ nhận điều hành' },
  { key: 'cho_du_toan', label: 'Chờ dự toán', desc: 'Tour đã nhận, chờ dự toán' },
  { key: 'san_sang_trien_khai', label: 'Sẵn sàng', desc: 'Tour sẵn sàng triển khai' },
  { key: 'dang_trien_khai', label: 'Đang triển khai', desc: 'Tour đang chạy' },
  { key: 'cho_quyet_toan', label: 'Chờ quyết toán', desc: 'Tour đã kết thúc, chờ quyết toán' },
  { key: 'hoan_thanh', label: 'Hoàn thành', desc: 'Tour đã quyết toán xong' },
  { key: 'da_huy', label: 'Đã hủy', desc: 'Tour đã bị hủy' },
];

const COMMON_COLS = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Số KH', 'Người tạo', 'Trạng thái', ''];

const COL_APPROVAL = ['Mã yêu cầu', 'Tên chương trình', 'Loại tour', 'Ngày KH gần nhất', 'Số tour yêu cầu', 'Ngày tạo', ''];
const COL_COMPLETED = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH', 'Doanh thu thực tế', 'Chi phí thực tế', 'Lợi nhuận', ''];
const COL_CANCELLED = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH đăng ký', 'Thời điểm hủy', 'Tổng tiền hoàn', 'Lý do'];

export default function AdminTourPrograms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('cho_duyet_ban');

  const instances = mockTourInstances;

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? instances.length
      : instances.filter(i => i.status === tab.key).length;
    return acc;
  }, {} as Record<TabKey, number>);

  const filtered = activeTab === 'all'
    ? instances
    : instances.filter(i => i.status === activeTab);

  const getColumns = (tab: TabKey) => {
    if (tab === 'cho_duyet_ban') return COL_APPROVAL;
    if (tab === 'hoan_thanh') return COL_COMPLETED;
    if (tab === 'da_huy') return COL_CANCELLED;
    return COMMON_COLS;
  };

  const renderCell = (inst: TourInstance, col: string, tab: TabKey) => {
    if (col === '') return '';
    if (tab === 'cho_duyet_ban') {
      if (col === 'Mã yêu cầu') return <span className="font-mono text-xs text-primary/60">{inst.id}</span>;
      if (col === 'Tên chương trình') return <span className="text-sm font-medium">{inst.programName}</span>;
      if (col === 'Loại tour') return <span className="text-xs text-primary/60">{inst.transport === 'maybay' ? 'Máy bay' : 'Xe'}</span>;
      if (col === 'Ngày KH gần nhất') return new Date(inst.departureDate).toLocaleDateString('vi-VN');
      if (col === 'Số tour yêu cầu') return <span className="text-sm">1 tour</span>;
      if (col === 'Ngày tạo') return inst.createdAt ? new Date(inst.createdAt).toLocaleDateString('vi-VN') : '—';
      return <span className="text-xs text-primary/60">—</span>;
    }
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
    if (col === 'Người tạo') return '—';
    if (col === 'Trạng thái') return (
      <span className={`text-[10px] px-2 py-1 border font-label uppercase tracking-wider ${TOUR_INSTANCE_STATUS_STYLE[inst.status]}`}>
        {TOUR_INSTANCE_STATUS_LABEL[inst.status]}
      </span>
    );
    return '—';
  };

  const getRowAction = (inst: TourInstance, tab: TabKey) => {
    if (tab === 'cho_duyet_ban') return (
      <div className="flex gap-2">
        <button className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors">
          Duyệt
        </button>
        <button className="px-3 py-1.5 border border-orange-400 text-orange-600 text-[10px] font-bold uppercase tracking-wider hover:bg-orange-50 transition-colors">
          Yêu cầu chỉnh sửa
        </button>
        <button className="px-3 py-1.5 border border-red-300 text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors">
          Từ chối
        </button>
      </div>
    );
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
    if (tab === 'san_sang_trien_khai') return (
      <button
        onClick={() => navigate(`/coordinator/tour-programs/${inst.id}`)}
        className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors"
      >
        Xem chi tiết
      </button>
    );
    if (tab === 'dang_trien_khai') return (
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
      <button className="px-4 py-1.5 border border-outline-variant/50 text-primary/60 text-[10px] uppercase tracking-wider hover:bg-surface transition-colors">
        Chi tiết
      </button>
    );
    if (tab === 'da_huy') return (
      <button className="px-4 py-1.5 border border-outline-variant/50 text-primary/60 text-[10px] uppercase tracking-wider hover:bg-surface transition-colors">
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
            <h1 className="font-serif text-3xl text-primary tracking-tight">Quản lý Tour</h1>
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
