import { useMemo, useState } from 'react';
import { Button, Checkbox, Modal } from 'antd';
import { mockBookings } from '@entities/booking/data/bookings';
import { bookingNoteLabel, buildDailyRevenueRows, passengerCountLabel } from '@shared/lib/bookingReports';

type SalesReportType = 'booking_summary' | 'top_programs' | 'refund_followup';

type SalesTask = {
  id: string;
  code: string;
  customer: string;
  tour: string;
  dateLabel: string;
  amount: string;
  badge: string;
  badgeClassName: string;
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

function TaskPanel({
  title,
  hint,
  tasks,
  emptyLabel,
}: {
  title: string;
  hint: string;
  tasks: SalesTask[];
  emptyLabel: string;
}) {
  return (
    <div className="bg-white border border-[#D0C5AF]/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-red-500" />
        <div className="min-w-0">
          <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">
            {title}
          </h3>
          <p className="text-[11px] text-[#2A2421]/45 mt-1">{hint}</p>
        </div>
        <span className="ml-auto px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#2A2421]/40">{emptyLabel}</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4 hover:border-[#D4AF37]/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${task.badgeClassName}`}>
                      {task.badge}
                    </span>
                    <span className="text-[10px] font-mono text-[#2A2421]/40">#{task.code}</span>
                  </div>
                  <p className="text-sm font-medium text-[#2A2421]">
                    {task.customer} - {task.tour}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#2A2421]/55">
                    <span>{task.dateLabel}</span>
                    <span className="text-[#D4AF37] font-semibold">{task.amount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SalesDashboard() {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-04-30');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTypes, setExportTypes] = useState<SalesReportType[]>([]);

  const bookingsInRange = useMemo(
    () => mockBookings.filter((booking) => inRange(booking.createdAt, dateFrom, dateTo)),
    [dateFrom, dateTo],
  );
  const dailyRevenue = useMemo(() => buildDailyRevenueRows(bookingsInRange), [bookingsInRange]);

  const pendingBookingTasks = useMemo(
    () =>
      mockBookings
        .filter((booking) => booking.status === 'pending')
        .sort((left, right) => left.tourDate.localeCompare(right.tourDate))
        .slice(0, 5)
        .map<SalesTask>((booking) => ({
          id: `pending-book-${booking.id}`,
          code: booking.bookingCode,
          customer: booking.contactInfo.name,
          tour: booking.tourName,
          dateLabel: `Khởi hành: ${formatDate(booking.tourDate)}`,
          amount: `${formatCurrency(booking.totalAmount)} VND`,
          badge: 'Xác nhận đơn đặt',
          badgeClassName: 'bg-amber-100 text-amber-700',
        })),
    [],
  );

  const pendingCancelTasks = useMemo(
    () =>
      mockBookings
        .filter((booking) => booking.status === 'pending_cancel')
        .sort((left, right) => (left.cancelledAt ?? left.createdAt).localeCompare(right.cancelledAt ?? right.createdAt))
        .slice(0, 5)
        .map<SalesTask>((booking) => ({
          id: `pending-cancel-${booking.id}`,
          code: booking.bookingCode,
          customer: booking.contactInfo.name,
          tour: booking.tourName,
          dateLabel: `Yêu cầu hủy: ${formatDate(booking.cancelledAt ?? booking.createdAt)}`,
          amount: `${formatCurrency(booking.refundAmount ?? booking.totalAmount)} VND`,
          badge: 'Xác nhận hủy',
          badgeClassName: 'bg-orange-100 text-orange-700',
        })),
    [],
  );

  const refundTasks = useMemo(
    () =>
      mockBookings
        .filter((booking) => booking.status === 'cancelled' && booking.refundStatus === 'pending')
        .sort((left, right) => (left.cancelledConfirmedAt ?? left.cancelledAt ?? left.createdAt).localeCompare(right.cancelledConfirmedAt ?? right.cancelledAt ?? right.createdAt))
        .slice(0, 5)
        .map<SalesTask>((booking) => ({
          id: `refund-${booking.id}`,
          code: booking.bookingCode,
          customer: booking.contactInfo.name,
          tour: booking.tourName,
          dateLabel: `Đã xác nhận hủy: ${formatDate(booking.cancelledConfirmedAt ?? booking.cancelledAt ?? booking.createdAt)}`,
          amount: `${formatCurrency(booking.refundAmount ?? booking.totalAmount)} VND`,
          badge: 'Hoàn tiền',
          badgeClassName: 'bg-red-100 text-red-700',
        })),
    [],
  );

  const topPrograms = useMemo(() => {
    const grouped = new Map<string, { count: number; revenue: number }>();
    for (const booking of bookingsInRange) {
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
  }, [bookingsInRange]);

  const reportStats = useMemo(
    () => [
      {
        label: 'Tổng booking',
        value: bookingsInRange.length.toString(),
        icon: 'confirmation_number',
        color: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Doanh số',
        value: `${formatCurrency(bookingsInRange.reduce((sum, booking) => sum + booking.totalAmount, 0))}đ`,
        icon: 'payments',
        color: 'bg-[#D4AF37]/10 text-[#D4AF37]',
      },
      {
        label: 'Đã hoàn thành',
        value: bookingsInRange.filter((booking) => booking.status === 'completed').length.toString(),
        icon: 'task_alt',
        color: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Đơn đã hủy',
        value: bookingsInRange.filter((booking) => booking.status === 'cancelled').length.toString(),
        icon: 'cancel',
        color: 'bg-red-50 text-red-700',
      },
    ],
    [bookingsInRange],
  );

  const handleExport = () => {
    exportTypes.forEach((type) => {
      if (type === 'booking_summary') {
        downloadReport(
          `BaoCao_Booking_${dateFrom}_${dateTo}`,
          'BÁO CÁO BOOKING',
          [
            ['Từ ngày', dateFrom],
            ['Đến ngày', dateTo],
            [],
            ['Mã đơn', 'Khách hàng', 'Tour', 'Ngày tạo', 'Ngày khởi hành', 'Số lượng khách', 'Ghi chú', 'Tổng tiền', 'Trạng thái'],
            ...bookingsInRange.map((booking) => [
              booking.bookingCode,
              booking.contactInfo.name,
              booking.tourName,
              formatDate(booking.createdAt),
              formatDate(booking.tourDate),
              passengerCountLabel(booking),
              bookingNoteLabel(booking),
              formatCurrency(booking.totalAmount),
              booking.status,
            ]),
          ],
        );
      }

      if (type === 'top_programs') {
        downloadReport(
          `BaoCao_TopTour_${dateFrom}_${dateTo}`,
          'TOP 5 CHƯƠNG TRÌNH TOUR THEO BOOKING',
          [
            ['Từ ngày', dateFrom],
            ['Đến ngày', dateTo],
            [],
            ['Xếp hạng', 'Chương trình tour', 'Số booking', 'Doanh số'],
            ...topPrograms.map((item, index) => [
              String(index + 1),
              item.tourName,
              String(item.count),
              formatCurrency(item.revenue),
            ]),
          ],
        );
      }

      if (type === 'refund_followup') {
        downloadReport(
          `BaoCao_HoanTien_${dateFrom}_${dateTo}`,
          'BÁO CÁO THEO DÕI HOÀN TIỀN',
          [
            ['Mã đơn', 'Khách hàng', 'Tour', 'Ngày khởi hành', 'Số lượng khách', 'Tổng tiền', 'Trạng thái đơn', 'Lý do hủy', 'Số tiền hoàn', 'TT hoàn tiền'],
            ...bookingsInRange
              .filter((booking) => booking.status === 'cancelled' && booking.refundStatus === 'pending')
              .map((booking) => [
                booking.bookingCode,
                booking.contactInfo.name,
                booking.tourName,
                formatDate(booking.tourDate),
                passengerCountLabel(booking),
                formatCurrency(booking.totalAmount),
                'Đã hủy',
                booking.cancellationReason ?? '-',
                booking.refundAmount ? formatCurrency(booking.refundAmount) : '-',
                'Chưa hoàn',
              ]),
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
        <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Dashboard Kinh doanh</h1>
        <p className="text-xs text-[#2A2421]/50">Tách riêng công việc cần xử lý khỏi phần thống kê và xuất báo cáo.</p>
      </div>

      <section className="mb-10" aria-labelledby="sales-urgent-title">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-red-500 rounded-sm" />
          <h2 id="sales-urgent-title" className="font-['Inter'] text-base font-bold text-[#2A2421]">
            Công việc cần xử lý
          </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <TaskPanel
            title="Xác nhận đơn đặt"
            hint="Tối đa 5 booking, ưu tiên ngày khởi hành gần nhất."
            tasks={pendingBookingTasks}
            emptyLabel="Không có booking nào đang chờ xác nhận."
          />
          <TaskPanel
            title="Xác nhận đơn hủy"
            hint="Tối đa 5 yêu cầu, yêu cầu gửi sớm hơn nằm trước."
            tasks={pendingCancelTasks}
            emptyLabel="Không có yêu cầu hủy nào đang chờ xác nhận."
          />
          <TaskPanel
            title="Hoàn tiền"
            hint="Tối đa 5 đơn, ưu tiên đơn đã chờ hoàn tiền lâu nhất."
            tasks={refundTasks}
            emptyLabel="Không có đơn nào đang chờ hoàn tiền."
          />
        </div>
      </section>

      <section aria-labelledby="sales-report-title">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-[#D4AF37] rounded-sm" />
          <h2 id="sales-report-title" className="font-['Inter'] text-base font-bold text-[#2A2421]">
            Báo cáo kinh doanh
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

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
          <div className="bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-[#D4AF37]" />
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">
                Top 5 chương trình tour có số lượt booking nhiều nhất
              </h3>
            </div>
            <div className="space-y-3">
              {topPrograms.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#2A2421]/40">Không có dữ liệu trong khoảng thời gian đã chọn.</div>
              ) : (
                topPrograms.map((item, index) => (
                  <div key={item.tourName} className="flex items-center gap-4 border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#2A2421]">{item.tourName}</p>
                      <p className="text-[11px] text-[#2A2421]/50 mt-1">{item.count} booking</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#D4AF37]">{formatCurrency(item.revenue)}đ</p>
                      <p className="text-[10px] text-[#2A2421]/40">Doanh số</p>
                    </div>
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
              key: 'booking_summary' as const,
              label: 'Báo cáo tổng hợp booking',
              desc: 'Danh sách booking trong khoảng thời gian đã chọn.',
            },
            {
              key: 'top_programs' as const,
              label: 'Báo cáo Top 5 chương trình tour',
              desc: 'Top tour có số lượt booking nhiều nhất.',
            },
            {
              key: 'refund_followup' as const,
              label: 'Báo cáo theo dõi hoàn tiền',
              desc: 'Danh sách đơn đã xác nhận hủy và còn chờ hoàn tiền.',
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
