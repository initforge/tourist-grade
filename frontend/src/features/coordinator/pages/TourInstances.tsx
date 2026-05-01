import { useMemo, useState } from 'react';
import { Breadcrumb, message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Booking } from '@entities/booking/data/bookings';
import {
  TOUR_INSTANCE_STATUS_LABEL,
  TOUR_INSTANCE_STATUS_STYLE,
  type TourInstance,
  type TourInstanceStatus,
} from '@entities/tour-program/data/tourProgram';
import { isBookingConfirmedForOperations } from '@shared/lib/bookingLifecycle';
import { updateTourInstanceCommand } from '@shared/lib/api/tourInstances';
import { useAuthStore } from '@shared/store/useAuthStore';
import { DispatchHDVModal } from '@shared/ui/DispatchHDVModal';
import { PageSearchInput } from '@shared/ui/PageSearchInput';
import { useAppDataStore } from '@shared/store/useAppDataStore';

type TabKey =
  | 'cho_nhan_dieu_hanh'
  | 'cho_du_toan'
  | 'phan_cong_hdv'
  | 'dang_khoi_hanh'
  | 'cho_quyet_toan'
  | 'hoan_thanh'
  | 'da_huy';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'cho_nhan_dieu_hanh', label: 'Chờ nhận điều hành', desc: 'Tour đủ điều kiện chờ nhận điều hành' },
  { key: 'cho_du_toan', label: 'Chờ dự toán', desc: 'Tour đã nhận, chờ lập dự toán' },
  { key: 'phan_cong_hdv', label: 'Phân công HDV', desc: 'Tour sẵn sàng phân công hướng dẫn viên' },
  { key: 'dang_khoi_hanh', label: 'Đang khởi hành', desc: 'Tour đang triển khai' },
  { key: 'cho_quyet_toan', label: 'Chờ quyết toán', desc: 'Tour đã kết thúc, chờ quyết toán' },
  { key: 'hoan_thanh', label: 'Hoàn thành', desc: 'Tour đã quyết toán xong' },
  { key: 'da_huy', label: 'Đã hủy', desc: 'Tour đã bị hủy' },
];

const HDV_TABS: TabKey[] = ['dang_khoi_hanh', 'cho_quyet_toan'];
const COMMON_COLS_CREATOR = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Số KH', 'Người tạo', 'Trạng thái', ''];
const COMMON_COLS_HDV = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Điểm KH', 'Điểm TQ', 'Thời lượng', 'Số KH', 'Hướng dẫn viên', 'Trạng thái', ''];
const COL_COMPLETED = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH', 'Doanh thu thực tế', 'Chi phí thực tế', 'Lợi nhuận', ''];
const COL_CANCELLED = ['Mã tour', 'Tên chương trình', 'Ngày KH', 'Số KH đăng ký', 'Thời điểm hủy', 'Tổng tiền hoàn', 'Lý do'];
const TAB_STATUS_MAP: Record<TabKey, TourInstanceStatus> = {
  cho_nhan_dieu_hanh: 'cho_nhan_dieu_hanh',
  cho_du_toan: 'cho_du_toan',
  phan_cong_hdv: 'san_sang_trien_khai',
  dang_khoi_hanh: 'dang_trien_khai',
  cho_quyet_toan: 'cho_quyet_toan',
  hoan_thanh: 'hoan_thanh',
  da_huy: 'da_huy',
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '—';
}

function formatCurrency(value?: number) {
  return value != null ? `${value.toLocaleString('vi-VN')}đ` : '—';
}

function getGuestCount(bookings: Booking[]) {
  return bookings.reduce((sum, booking) => sum + booking.passengers.length, 0);
}

function getRoomSummary(booking: Booking) {
  const rooms = booking.roomCounts;
  if (!rooms) return 'Đơn 0 | Đôi 0 | Ba 0';
  return `Đơn ${rooms.single ?? 0} | Đôi ${rooms.double ?? 0} | Ba ${rooms.triple ?? 0}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlDocument(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;font-size:12pt;color:#1f2937}table{border-collapse:collapse;width:100%;margin-top:12px}th,td{border:1px solid #94a3b8;padding:8px;text-align:left;vertical-align:top}th{background:#e2e8f0}.section{margin-top:18px;font-weight:700}</style></head><body>${body}</body></html>`;
}

function buildGuideCommonDocument(instance: TourInstance, itineraryLines: string[], bookings: Booking[], guideName: string) {
  const itineraryRows = itineraryLines.map((line) => {
    const [day, title, description] = line.split('|');
    return `<tr><td>${escapeHtml(day)}</td><td>${escapeHtml(title)}</td><td>${escapeHtml(description)}</td></tr>`;
  }).join('');

  return buildHtmlDocument('Thông tin tour và lịch trình', [
    '<h1>Thông tin tour</h1>',
    '<table><tbody>',
    `<tr><th>Tour</th><td>${escapeHtml(instance.programName)}</td></tr>`,
    `<tr><th>Đoàn</th><td>${escapeHtml(instance.id)}</td></tr>`,
    `<tr><th>Thời gian</th><td>${escapeHtml(formatDate(instance.departureDate))}</td></tr>`,
    `<tr><th>Số lượng</th><td>${escapeHtml(getGuestCount(bookings))} khách</td></tr>`,
    `<tr><th>Điểm đón</th><td>${escapeHtml(instance.departurePoint)}</td></tr>`,
    `<tr><th>Hướng dẫn viên</th><td>${escapeHtml(guideName)}</td></tr>`,
    '</tbody></table>',
    '<div class="section">Lịch trình chi tiết</div>',
    '<table><thead><tr><th>Ngày</th><th>Tiêu đề</th><th>Mô tả</th></tr></thead><tbody>',
    itineraryRows || '<tr><td colspan="3">Chưa có lịch trình</td></tr>',
    '</tbody></table>',
  ].join(''));
}

function buildGuidePassengerWorkbook(bookings: Booking[]) {
  const bookingRows = bookings.flatMap((booking) => (
    booking.passengers.map((passenger, index) => [
      index === 0 ? booking.bookingCode : '',
      index === 0 ? booking.contactInfo.name : '',
      index === 0 ? booking.contactInfo.phone : '',
      index === 0 ? getRoomSummary(booking) : '',
      String(index + 1),
      passenger.name,
      passenger.dob,
      passenger.gender === 'male' ? 'Nam' : 'Nữ',
      passenger.nationality ?? 'Việt Nam',
    ])
  ));

  const rows = bookingRows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');

  return buildHtmlDocument('Danh sách khách hàng', [
    '<h1>Danh sách khách hàng</h1>',
    '<table><thead><tr>',
    '<th>Mã booking</th><th>Người đặt</th><th>Liên hệ</th><th>Số phòng</th><th>STT khách</th><th>Họ tên</th><th>Ngày sinh</th><th>Giới tính</th><th>Quốc tịch</th>',
    '</tr></thead><tbody>',
    rows || '<tr><td colspan="9">Chưa có khách hàng</td></tr>',
    '</tbody></table>',
  ].join(''));
}

function buildGuidePacketPayload(instance: TourInstance, itineraryLines: string[], bookings: Booking[], guideName: string) {
  return {
    commonFileName: `${instance.id}-thong-tin-lich-trinh.doc`,
    commonFileContent: buildGuideCommonDocument(instance, itineraryLines, bookings, guideName),
    passengerFileName: `${instance.id}-danh-sach-khach.xls`,
    passengerFileContent: buildGuidePassengerWorkbook(bookings),
  };
}

export default function TourInstances() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore(state => state.accessToken);
  const tourInstances = useAppDataStore((state) => state.tourInstances);
  const tourPrograms = useAppDataStore((state) => state.tourPrograms);
  const bookings = useAppDataStore((state) => state.bookings);
  const upsertTourInstance = useAppDataStore((state) => state.upsertTourInstance);

  const initialTab = location.state?.tab as TabKey | undefined;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab && TABS.some((tab) => tab.key === initialTab) ? initialTab : 'cho_nhan_dieu_hanh');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState<TourInstance | null>(null);

  const getProgram = (programId: string) => tourPrograms.find((program) => program.id === programId);

  const getTourBookings = (instance: TourInstance) => bookings.filter((booking) => isBookingConfirmedForOperations(booking) && (
    booking.instanceCode === instance.id || (!booking.instanceCode && booking.tourId === instance.id)
  ));

  const getRequiredLanguages = (instance: TourInstance) => {
    const required = new Set<string>();
    getTourBookings(instance).forEach((booking) => {
      booking.passengers.forEach((passenger) => {
        const nationality = passenger.nationality?.trim().toLowerCase();
        if (!nationality || nationality === 'việt nam' || nationality === 'viet nam') return;
        if (nationality.includes('nhật')) required.add('Tiếng Nhật');
        else if (nationality.includes('hàn')) required.add('Tiếng Hàn');
        else if (nationality.includes('trung')) required.add('Tiếng Trung');
        else required.add('Tiếng Anh');
      });
    });
    return Array.from(required);
  };

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = tourInstances.filter((instance) => instance.status === TAB_STATUS_MAP[tab.key]).length;
    return acc;
  }, {} as Record<TabKey, number>);

  const displayRows = useMemo(() => {
    const rows = tourInstances.filter((instance) => instance.status === TAB_STATUS_MAP[activeTab]);
    if (activeTab === 'hoan_thanh' && rows.length === 0) {
      return tourInstances.filter((instance) => instance.status === 'cho_quyet_toan');
    }
    return rows;
  }, [activeTab, tourInstances]);

  const filtered = displayRows.filter((instance) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return [
      instance.id,
      instance.programName,
      instance.departurePoint,
      instance.sightseeingSpots.join(' '),
      instance.createdBy,
      instance.assignedGuide?.name,
      instance.cancelReason,
    ].join(' ').toLowerCase().includes(keyword);
  });

  const getColumns = (tab: TabKey) => {
    if (tab === 'hoan_thanh') return COL_COMPLETED;
    if (tab === 'da_huy') return COL_CANCELLED;
    return HDV_TABS.includes(tab) ? COMMON_COLS_HDV : COMMON_COLS_CREATOR;
  };

  const getStatusLabel = (instance: TourInstance, tab: TabKey) => {
    if (tab === 'phan_cong_hdv') return instance.assignedGuide ? 'Đã phân công' : 'Phân công HDV';
    if (tab === 'dang_khoi_hanh') return 'Đang khởi hành';
    if (tab === 'cho_du_toan' && instance.cancelReason) return 'Yêu cầu sửa';
    return TOUR_INSTANCE_STATUS_LABEL[instance.status];
  };

  const getStatusStyle = (instance: TourInstance, tab: TabKey) => (
    tab === 'cho_du_toan' && instance.cancelReason
      ? TOUR_INSTANCE_STATUS_STYLE.yeu_cau_chinh_sua
      : TOUR_INSTANCE_STATUS_STYLE[instance.status]
  );

  const renderCell = (instance: TourInstance, col: string, tab: TabKey) => {
    if (col === '') return '';

    if (tab === 'hoan_thanh') {
      if (col === 'Mã tour') return <span className="font-mono text-xs">{instance.id}</span>;
      if (col === 'Tên chương trình') return instance.programName;
      if (col === 'Ngày KH') return formatDate(instance.departureDate);
      if (col === 'Số KH') return instance.expectedGuests;
      if (col === 'Doanh thu thực tế') return formatCurrency(instance.settlement?.revenue);
      if (col === 'Chi phí thực tế') return formatCurrency(instance.settlement?.totalActualCost);
      if (col === 'Lợi nhuận') {
        const percent = instance.settlement?.profitPercent;
        return percent != null ? <span className={`font-bold ${percent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{percent}%</span> : '—';
      }
      return '—';
    }

    if (tab === 'da_huy') {
      if (col === 'Mã tour') return <span className="font-mono text-xs">{instance.id}</span>;
      if (col === 'Tên chương trình') return instance.programName;
      if (col === 'Ngày KH') return formatDate(instance.departureDate);
      if (col === 'Số KH đăng ký') return instance.expectedGuests;
      if (col === 'Thời điểm hủy') return formatDate(instance.cancelledAt);
      if (col === 'Tổng tiền hoàn') return formatCurrency(instance.refundTotal);
      if (col === 'Lý do') {
        return <span className="max-w-[150px] line-clamp-2 text-xs text-primary/60" title={instance.cancelReason}>{instance.cancelReason ?? '—'}</span>;
      }
      return '—';
    }

    if (col === 'Mã tour') return <span className="font-mono text-xs">{instance.id}</span>;
    if (col === 'Tên chương trình') return <span className="text-sm font-medium">{instance.programName}</span>;
    if (col === 'Ngày KH') return formatDate(instance.departureDate);
    if (col === 'Điểm KH') return <span className="text-xs">{instance.departurePoint}</span>;
    if (col === 'Điểm TQ') return <span className="text-xs">{instance.sightseeingSpots.join(', ')}</span>;
    if (col === 'Thời lượng') {
      const program = getProgram(instance.programId);
      return program ? `${program.duration.days}N${program.duration.nights}Đ` : '—';
    }
    if (col === 'Số KH') return instance.expectedGuests;
    if (col === 'Hướng dẫn viên') return <span className="text-xs">{instance.assignedGuide?.name ?? '—'}</span>;
    if (col === 'Người tạo') return <span className="text-xs text-primary/50">{instance.createdBy}</span>;
    if (col === 'Trạng thái') {
      return (
        <span className={`border px-2 py-1 text-[10px] font-label uppercase tracking-wider ${getStatusStyle(instance, tab)}`}>
          {getStatusLabel(instance, tab)}
        </span>
      );
    }
    return '—';
  };

  const openDispatchFlow = (instance: TourInstance) => {
    if (instance.assignedGuide && !window.confirm(`Thay đổi HDV hiện tại của tour ${instance.id}?`)) {
      return;
    }
    setDispatchTarget(instance);
    setShowDispatchModal(true);
  };

  const getRowAction = (instance: TourInstance, tab: TabKey) => {
    if (tab === 'cho_nhan_dieu_hanh') {
      return (
        <button
          onClick={() => navigate(`/coordinator/tour-programs/${instance.id}/receive`)}
          className="bg-purple-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-purple-700"
        >
          Nhận điều hành
        </button>
      );
    }
    if (tab === 'cho_du_toan') {
      return (
        <button
          onClick={() => navigate(`/coordinator/tours/${instance.id}/estimate`)}
          className="bg-teal-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-teal-700"
        >
          Làm dự toán
        </button>
      );
    }
    if (tab === 'phan_cong_hdv') {
      return (
        <button
          onClick={() => openDispatchFlow(instance)}
          className="bg-blue-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-700"
        >
          {instance.assignedGuide ? 'Thay đổi HDV' : 'Phân công HDV'}
        </button>
      );
    }
    if (tab === 'dang_khoi_hanh') {
      return (
        <button
          onClick={() => navigate(`/coordinator/tour-programs/${instance.id}/receive`, { state: { readOnly: true } })}
          className="border border-outline-variant/50 px-4 py-1.5 text-[10px] uppercase tracking-wider text-primary/60 transition-colors hover:bg-surface"
        >
          Xem chi tiết
        </button>
      );
    }
    if (tab === 'cho_quyet_toan') {
      return (
        <button
          onClick={() => navigate(`/coordinator/tours/${instance.id}/settle`)}
          className="bg-cyan-700 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-cyan-800"
        >
          Làm quyết toán
        </button>
      );
    }
    if (tab === 'hoan_thanh') {
      return (
        <button
          onClick={() => navigate(`/coordinator/tours/${instance.id}/settle`, { state: { readOnly: true } })}
          className="border border-outline-variant/50 px-4 py-1.5 text-[10px] uppercase tracking-wider text-primary/60 transition-colors hover:bg-surface"
        >
          Chi tiết
        </button>
      );
    }
    if (tab === 'da_huy') {
      return (
        <button
          onClick={() => navigate(`/coordinator/tour-programs/${instance.id}`)}
          className="border border-outline-variant/50 px-4 py-1.5 text-[10px] uppercase tracking-wider text-primary/60 transition-colors hover:bg-surface"
        >
          Xem
        </button>
      );
    }
    return null;
  };

  const columns = getColumns(activeTab);

  return (
    <div className="min-h-screen w-full bg-[var(--color-background)] pb-32">
      <main className="mx-auto max-w-7xl p-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">Khu vực điều phối</span>
            <h1 className="font-serif text-3xl tracking-tight text-primary">Điều hành Tour</h1>
          </div>
        </div>

        <Breadcrumb
          className="mb-6 text-xs"
          items={[
            { title: <Link to="/coordinator/tours" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Điều hành tour</Link> },
            { title: <span className="text-[var(--color-primary)]/30">Danh sách tour</span> },
          ]}
        />

        <PageSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã tour, chương trình, điểm khởi hành, HDV..."
          className="mb-6"
        />

        <div className="mb-0 flex gap-0 overflow-x-auto rounded-t-sm border-b border-outline-variant/30 bg-white">
          {TABS.map((tab) => {
            const count = tabCounts[tab.key];
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5 text-[var(--color-secondary)]'
                    : 'border-transparent text-primary/40 hover:bg-surface hover:text-primary/70'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${isActive ? 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]' : 'bg-surface text-primary/40'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-0 border-x border-b border-outline-variant/30 bg-white px-6 py-3">
          <p className="text-xs italic text-primary/50">{TABS.find((tab) => tab.key === activeTab)?.desc}</p>
        </div>

        <div className="overflow-hidden border-x border-b border-outline-variant/30 bg-white">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined mb-3 block text-5xl text-primary/10">inbox</span>
              <p className="text-sm text-primary/40">Không có tour nào trong mục này</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-[var(--color-surface)]">
                    {columns.map((col) => (
                      <th key={col} className="whitespace-nowrap px-5 py-3.5 text-left text-[10px] font-medium uppercase tracking-widest text-primary/50">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((instance, rowIdx) => (
                    <tr
                      key={instance.id}
                      className={`border-b border-outline-variant/20 transition-colors hover:bg-surface-container-low last:border-0 ${
                        rowIdx % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface)]/30'
                      }`}
                    >
                      {columns.map((col) => (
                        <td key={col} className="align-middle px-5 py-4 text-sm text-primary">
                          {col === '' ? <div className="flex justify-end">{getRowAction(instance, activeTab)}</div> : renderCell(instance, col, activeTab)}
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

      {showDispatchModal && dispatchTarget && (
        <DispatchHDVModal
          tourId={dispatchTarget.id}
          tourName={dispatchTarget.programName}
          requiredLanguages={getRequiredLanguages(dispatchTarget)}
          excludedGuideId={dispatchTarget.assignedGuide?.id}
          title={dispatchTarget.assignedGuide ? 'Thay đổi HDV' : 'Phân công HDV'}
          onClose={() => {
            setShowDispatchModal(false);
            setDispatchTarget(null);
          }}
          onConfirm={async (guide) => {
            if (!token) return;
            const itineraryLines = (getProgram(dispatchTarget.programId)?.itinerary ?? []).map((day) => (
              `${day.day}|${day.title}|${(day.description ?? '').replace(/[|]/g, '/')}`
            ));
            try {
              const tourBookings = getTourBookings(dispatchTarget);
              const response = await updateTourInstanceCommand(token, dispatchTarget.id, 'assign-guide', {
                assignedGuide: { id: guide.id, name: guide.name, email: guide.email ?? '' },
                guidePacket: buildGuidePacketPayload(dispatchTarget, itineraryLines, tourBookings, guide.name),
              });
              upsertTourInstance(response.tourInstance);
              message.success(guide.email
                ? `Đã ${dispatchTarget.assignedGuide ? 'thay đổi' : 'phân công'} HDV và gửi email cho ${guide.name}`
                : `Đã ${dispatchTarget.assignedGuide ? 'thay đổi' : 'phân công'} HDV: ${guide.name}. HDV chưa có email để gửi file.`);
              setShowDispatchModal(false);
              setDispatchTarget(null);
              return;
            } catch (error) {
              message.error(error instanceof Error ? error.message : 'Không thể phân công hướng dẫn viên');
              return;
            }

          }}
        />
      )}
    </div>
  );
}
