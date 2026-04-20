import { useMemo, useState } from 'react';
import { Button, Checkbox, Modal } from 'antd';
import { mockBookings } from '@entities/booking/data/bookings';
import { mockSuppliers, mockTourInstances, mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import { buildDailyRevenueRows } from '@shared/lib/bookingReports';

type CoordinatorReportType = 'operations_summary' | 'tour_volume' | 'supplier_snapshot';

type CoordinatorTaskGroup = {
  label: string;
  tone: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    action: string;
  }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function inRange(value: string, from: string, to: string) {
  const target = new Date(value);
  const start = new Date(from);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return target >= start && target <= end;
}

function downloadReport(filename: string, title: string, rows: string[][]) {
  const content = ['\uFEFF' + title, '', rows.map((row) => row.join(',')).join('\n')].join('\n');
  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filename}.xls`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function TaskCard({ group }: { group: CoordinatorTaskGroup }) {
  return (
    <div className="bg-white border border-[#D0C5AF]/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-1 h-4 ${group.tone}`} />
        <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">
          {group.label}
        </h3>
        <span className="ml-auto px-2 py-0.5 bg-[#FAFAF5] text-[#2A2421]/70 text-[10px] font-bold rounded-full">
          {group.items.length}
        </span>
      </div>

      {group.items.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#2A2421]/40">Nhóm này hiện chưa có dữ liệu mẫu.</div>
      ) : (
        <div className="space-y-3">
          {group.items.map((item) => (
            <div key={item.id} className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4">
              <p className="text-sm font-medium text-[#2A2421]">{item.title}</p>
              <p className="text-[11px] text-[#2A2421]/50 mt-1">{item.meta}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mt-3">{item.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorDashboard() {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-04-30');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTypes, setExportTypes] = useState<CoordinatorReportType[]>([]);

  const filteredBookings = useMemo(
    () => mockBookings.filter((booking) => inRange(booking.createdAt, dateFrom, dateTo)),
    [dateFrom, dateTo],
  );
  const dailyRevenue = useMemo(() => buildDailyRevenueRows(filteredBookings), [filteredBookings]);

  const taskGroups = useMemo<CoordinatorTaskGroup[]>(() => {
    const receiveDispatch = mockTourInstances
      .filter((tour) => tour.status === 'cho_nhan_dieu_hanh')
      .sort((left, right) => left.departureDate.localeCompare(right.departureDate))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Khởi hành ${formatDate(tour.departureDate)} · ${tour.expectedGuests} khách dự kiến`,
        action: 'Nhận điều hành',
      }));

    const estimateTasks = mockTourInstances
      .filter((tour) => tour.status === 'cho_du_toan')
      .sort((left, right) => left.departureDate.localeCompare(right.departureDate))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Khởi hành ${formatDate(tour.departureDate)} · Tạo/chỉnh sửa dự toán`,
        action: 'Lập dự toán',
      }));

    const guideDispatch = mockTourInstances
      .filter((tour) => tour.status === 'san_sang_trien_khai' || (tour.status === 'dang_trien_khai' && !tour.assignedGuide))
      .sort((left, right) => left.departureDate.localeCompare(right.departureDate))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Khởi hành ${formatDate(tour.departureDate)} · ${tour.departurePoint}`,
        action: 'Phân công HDV',
      }));

    const settlementTasks = mockTourInstances
      .filter((tour) => tour.status === 'cho_quyet_toan')
      .sort((left, right) => left.departureDate.localeCompare(right.departureDate))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Khởi hành ${formatDate(tour.departureDate)} · Chờ quyết toán`,
        action: 'Làm quyết toán',
      }));

    const saleEditTasks = mockTourInstances
      .filter((tour) => tour.status === 'yeu_cau_chinh_sua' || tour.status === 'cho_duyet_ban')
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Yêu cầu tạo tour ngày ${formatDate(tour.createdAt)}`,
        action: tour.status === 'cho_duyet_ban' ? 'Cảnh báo cần tạo tour' : 'Chỉnh sửa yêu cầu bán',
      }));

    const draftPrograms = mockTourPrograms
      .filter((program) => program.status === 'draft')
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(0, 3)
      .map((program) => ({
        id: program.id,
        title: program.name,
        meta: `Tạo ngày ${formatDate(program.createdAt)} · ${program.createdBy}`,
        action: 'Hoàn thiện bản nháp chương trình tour',
      }));

    return [
      { label: 'Nhận điều hành', tone: 'bg-blue-500', items: receiveDispatch },
      { label: 'Tạo/chỉnh sửa dự toán', tone: 'bg-emerald-500', items: estimateTasks },
      { label: 'Phân công HDV', tone: 'bg-amber-500', items: guideDispatch },
      { label: 'Quyết toán', tone: 'bg-purple-500', items: settlementTasks },
      { label: 'Cảnh báo cần tạo tour và chỉnh sửa yêu cầu bán', tone: 'bg-red-500', items: saleEditTasks },
      { label: 'Hoàn thiện bản nháp chương trình tour', tone: 'bg-stone-500', items: draftPrograms },
    ];
  }, []);

  const reportStats = useMemo(
    () => [
      {
        label: 'Tour đang triển khai',
        value: mockTourInstances.filter((tour) => tour.status === 'dang_trien_khai').length.toString(),
        icon: 'tour',
        color: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Tour chờ điều phối',
        value: mockTourInstances.filter((tour) => tour.status === 'cho_nhan_dieu_hanh' || tour.status === 'cho_du_toan').length.toString(),
        icon: 'checklist',
        color: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Booking trong kỳ',
        value: filteredBookings.length.toString(),
        icon: 'confirmation_number',
        color: 'bg-[#D4AF37]/10 text-[#D4AF37]',
      },
      {
        label: 'NCC hợp tác',
        value: mockSuppliers.length.toString(),
        icon: 'handshake',
        color: 'bg-stone-100 text-stone-700',
      },
    ],
    [filteredBookings],
  );

  const topToursByVolume = useMemo(() => {
    const grouped = new Map<string, { count: number; revenue: number }>();
    for (const booking of filteredBookings) {
      const current = grouped.get(booking.tourName) ?? { count: 0, revenue: 0 };
      grouped.set(booking.tourName, {
        count: current.count + 1,
        revenue: current.revenue + booking.totalAmount,
      });
    }

    return [...grouped.entries()]
      .map(([tourName, value]) => ({ tourName, ...value }))
      .sort((left, right) => right.count - left.count || right.revenue - left.revenue)
      .slice(0, 5);
  }, [filteredBookings]);

  const handleExport = () => {
    exportTypes.forEach((type) => {
      if (type === 'operations_summary') {
        downloadReport(
          `BaoCao_DieuPhoi_${dateFrom}_${dateTo}`,
          'BÁO CÁO TỔNG HỢP ĐIỀU PHỐI',
          [
            ['Nhóm công việc', 'Số lượng'],
            ...taskGroups.map((group) => [group.label, String(group.items.length)]),
          ],
        );
      }

      if (type === 'tour_volume') {
        downloadReport(
          `BaoCao_LuuLuongTour_${dateFrom}_${dateTo}`,
          'BÁO CÁO LƯU LƯỢNG TOUR',
          [
            ['Chương trình tour', 'Số booking', 'Doanh số'],
            ...topToursByVolume.map((item) => [item.tourName, String(item.count), formatCurrency(item.revenue)]),
          ],
        );
      }

      if (type === 'supplier_snapshot') {
        downloadReport(
          `BaoCao_NCC_${dateFrom}_${dateTo}`,
          'BÁO CÁO NHÀ CUNG CẤP',
          [
            ['Tên NCC', 'Loại', 'Số biến thể dịch vụ'],
            ...mockSuppliers.map((supplier) => [supplier.name, supplier.type, String(supplier.serviceVariants.length)]),
          ],
        );
      }
    });

    setExportModalOpen(false);
    setExportTypes([]);
  };

  return (
    <div className="w-full min-h-full bg-[#F3F3F3] p-6 md:p-10">
      <div className="mb-8 space-y-1.5">
        <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Tổng quan</p>
        <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Dashboard Điều phối</h1>
        <p className="text-xs text-[#2A2421]/50">Tách riêng tác vụ vận hành khỏi phần thống kê và xuất báo cáo điều phối.</p>
      </div>

      <section className="mb-10" aria-labelledby="coordinator-task-title">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-red-500 rounded-sm" />
          <h2 id="coordinator-task-title" className="font-['Inter'] text-base font-bold text-[#2A2421]">
            Công việc cần làm
          </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {taskGroups.map((group) => (
            <TaskCard key={group.label} group={group} />
          ))}
        </div>
      </section>

      <section aria-labelledby="coordinator-report-title">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-[#D4AF37] rounded-sm" />
          <h2 id="coordinator-report-title" className="font-['Inter'] text-base font-bold text-[#2A2421]">
            Báo cáo điều phối
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#2A2421]/50">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="border border-[#D0C5AF]/40 px-3 py-2 text-sm focus:border-[#D4AF37] outline-none bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#2A2421]/50">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="border border-[#D0C5AF]/40 px-3 py-2 text-sm focus:border-[#D4AF37] outline-none bg-white"
            />
          </div>
          <button
            onClick={() => setExportModalOpen(true)}
            className="ml-auto flex items-center gap-2 bg-[#2A2421] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Xuất Báo Cáo
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {reportStats.map((item) => (
            <div key={item.label} className="bg-white border border-[#D0C5AF]/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-xl p-2 rounded-lg ${item.color}`}>{item.icon}</span>
              </div>
              <p className="font-['Noto_Serif'] text-2xl font-bold text-[#2A2421]">{item.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-[#D4AF37]" />
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">
                Top tour theo lượng booking trong kỳ
              </h3>
            </div>
            <div className="space-y-3">
              {topToursByVolume.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#2A2421]/40">Không có dữ liệu trong khoảng thời gian đã chọn.</div>
              ) : (
                topToursByVolume.map((item, index) => (
                  <div key={item.tourName} className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#2A2421]">{item.tourName}</p>
                      <p className="text-[11px] text-[#2A2421]/50 mt-1">{item.count} booking</p>
                    </div>
                    <p className="text-xs font-semibold text-[#D4AF37]">{formatCurrency(item.revenue)}đ</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-blue-500" />
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">
                Báo cáo doanh thu theo ngày
              </h3>
            </div>
            <div className="space-y-3">
              {dailyRevenue.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#2A2421]/40">Không có doanh thu trong khoảng thời gian đã chọn.</div>
              ) : dailyRevenue.map((item) => (
                <div key={item.date} className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#2A2421]">{formatDate(item.date)}</p>
                    <p className="text-[11px] text-[#2A2421]/50 mt-1">{item.bookingCount} booking</p>
                  </div>
                  <p className="text-xs font-semibold text-[#D4AF37]">{formatCurrency(item.revenue)}đ</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        title={<span className="font-['Noto_Serif'] text-xl text-[#2A2421]">Xuất Báo Cáo Excel</span>}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => setExportModalOpen(false)}>Hủy</Button>
            <Button type="primary" disabled={exportTypes.length === 0} onClick={handleExport}>
              Xuất {exportTypes.length > 0 ? `${exportTypes.length} báo cáo` : ''}
            </Button>
          </div>
        }
        destroyOnHidden
      >
        <p className="text-sm text-[#2A2421]/70 mb-4">Chọn loại báo cáo muốn xuất:</p>
        <div className="space-y-3">
          {[
            {
              key: 'operations_summary' as const,
              label: 'Báo cáo tổng hợp điều phối',
              desc: 'Tổng hợp số lượng tác vụ vận hành theo từng nhóm.',
            },
            {
              key: 'tour_volume' as const,
              label: 'Báo cáo lưu lượng tour',
              desc: 'Top tour có lượng booking cao nhất trong kỳ.',
            },
            {
              key: 'supplier_snapshot' as const,
              label: 'Báo cáo nhà cung cấp',
              desc: 'Snapshot số lượng biến thể dịch vụ của từng nhà cung cấp.',
            },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() =>
                setExportTypes((previous) =>
                  previous.includes(item.key) ? previous.filter((value) => value !== item.key) : [...previous, item.key],
                )
              }
              className={`p-4 border cursor-pointer transition-colors ${
                exportTypes.includes(item.key)
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                  : 'border-[#D0C5AF]/40 hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox checked={exportTypes.includes(item.key)} />
                <div>
                  <p className="text-sm font-medium text-[#2A2421]">{item.label}</p>
                  <p className="text-[11px] text-[#2A2421]/50 mt-0.5">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
