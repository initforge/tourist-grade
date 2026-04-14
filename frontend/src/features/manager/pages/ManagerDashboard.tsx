import { useMemo, useState } from 'react';
import { Button, Checkbox, Modal } from 'antd';
import { mockBookings } from '@entities/booking/data/bookings';
import { mockTourInstances, mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import { mockVouchers } from '@entities/voucher/data/vouchers';

type ManagerReportType = 'approval_summary' | 'tour_performance' | 'voucher_pipeline';

type TaskGroup = {
  label: string;
  count: number;
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

function TaskColumn({ group }: { group: TaskGroup }) {
  return (
    <div className="bg-white border border-[#D0C5AF]/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-1 h-4 ${group.tone}`} />
        <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">
          {group.label}
        </h3>
        <span className="ml-auto px-2 py-0.5 bg-[#FAFAF5] text-[#2A2421]/70 text-[10px] font-bold rounded-full">
          {group.count}
        </span>
      </div>

      {group.items.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#2A2421]/40">Hiện chưa có dữ liệu mẫu cho nhóm này.</div>
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

export default function ManagerDashboard() {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-04-30');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTypes, setExportTypes] = useState<ManagerReportType[]>([]);

  const filteredBookings = useMemo(
    () => mockBookings.filter((booking) => inRange(booking.createdAt, dateFrom, dateTo)),
    [dateFrom, dateTo],
  );

  const taskGroups = useMemo<TaskGroup[]>(() => {
    const voucherApprovals = mockVouchers
      .filter((voucher) => voucher.status === 'pending_approval')
      .sort((left, right) => left.startDate.localeCompare(right.startDate) || (left.createdAt ?? '').localeCompare(right.createdAt ?? ''))
      .slice(0, 3)
      .map((voucher) => ({
        id: voucher.id,
        title: voucher.code,
        meta: `Bắt đầu ${formatDate(voucher.startDate)} · ${voucher.createdBy ?? 'Nhân viên kinh doanh'}`,
        action: 'Phê duyệt voucher',
      }));

    const programApprovals = mockTourPrograms
      .filter((program) => program.status === 'draft')
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(0, 3)
      .map((program) => ({
        id: program.id,
        title: program.name,
        meta: `Tạo ngày ${formatDate(program.createdAt)} · ${program.createdBy}`,
        action: 'Phê duyệt chương trình tour',
      }));

    const saleApprovals = mockTourInstances
      .filter((tour) => tour.status === 'cho_duyet_ban')
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Khởi hành ${formatDate(tour.departureDate)} · ${tour.createdBy}`,
        action: 'Phê duyệt yêu cầu bán',
      }));

    const estimateApprovals = mockTourInstances
      .filter((tour) => tour.status === 'cho_duyet_du_toan')
      .sort((left, right) => left.departureDate.localeCompare(right.departureDate))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Khởi hành ${formatDate(tour.departureDate)} · ${formatCurrency(tour.costEstimate?.totalCost ?? 0)}đ`,
        action: 'Phê duyệt dự toán',
      }));

    const underfilledTours = mockTourInstances
      .filter((tour) => tour.status === 'chua_du_kien')
      .sort((left, right) => left.bookingDeadline.localeCompare(right.bookingDeadline))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Hạn bán ${formatDate(tour.bookingDeadline)} · ${tour.expectedGuests}/${tour.minParticipants} khách`,
        action: 'Xử lý tour không đủ điều kiện',
      }));

    const settlementReviews = mockTourInstances
      .filter((tour) => tour.status === 'cho_quyet_toan')
      .sort((left, right) => (left.settledAt ?? left.endedAt ?? left.departureDate).localeCompare(right.settledAt ?? right.endedAt ?? right.departureDate))
      .slice(0, 3)
      .map((tour) => ({
        id: tour.id,
        title: tour.programName,
        meta: `Khởi hành ${formatDate(tour.departureDate)} · ${tour.assignedGuide?.name ?? 'Chưa phân công HDV'}`,
        action: 'Xem quyết toán mới tạo',
      }));

    return [
      { label: 'Phê duyệt voucher', count: voucherApprovals.length, tone: 'bg-amber-500', items: voucherApprovals },
      { label: 'Phê duyệt chương trình tour', count: programApprovals.length, tone: 'bg-blue-500', items: programApprovals },
      { label: 'Phê duyệt dự toán', count: estimateApprovals.length, tone: 'bg-indigo-500', items: estimateApprovals },
      { label: 'Phê duyệt yêu cầu bán', count: saleApprovals.length, tone: 'bg-emerald-500', items: saleApprovals },
      { label: 'Xử lý tour không đủ điều kiện khởi hành', count: underfilledTours.length, tone: 'bg-red-500', items: underfilledTours },
      { label: 'Xem quyết toán mới tạo', count: settlementReviews.length, tone: 'bg-purple-500', items: settlementReviews },
    ];
  }, []);

  const reportStats = useMemo(
    () => [
      {
        label: 'Voucher chờ duyệt',
        value: mockVouchers.filter((voucher) => voucher.status === 'pending_approval').length.toString(),
        icon: 'sell',
        color: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Tour đang mở bán',
        value: mockTourInstances.filter((tour) => tour.status === 'dang_mo_ban').length.toString(),
        icon: 'tour',
        color: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Doanh số',
        value: `${formatCurrency(filteredBookings.reduce((sum, booking) => sum + booking.totalAmount, 0))}đ`,
        icon: 'payments',
        color: 'bg-[#D4AF37]/10 text-[#D4AF37]',
      },
      {
        label: 'Đơn hoàn thành',
        value: filteredBookings.filter((booking) => booking.status === 'completed').length.toString(),
        icon: 'task_alt',
        color: 'bg-emerald-50 text-emerald-700',
      },
    ],
    [filteredBookings],
  );

  const topRevenuePrograms = useMemo(() => {
    const grouped = new Map<string, { bookings: number; revenue: number }>();
    for (const booking of filteredBookings) {
      const current = grouped.get(booking.tourName) ?? { bookings: 0, revenue: 0 };
      grouped.set(booking.tourName, {
        bookings: current.bookings + 1,
        revenue: current.revenue + booking.totalAmount,
      });
    }

    return [...grouped.entries()]
      .map(([tourName, value]) => ({ tourName, ...value }))
      .sort((left, right) => right.revenue - left.revenue || right.bookings - left.bookings)
      .slice(0, 5);
  }, [filteredBookings]);

  const handleExport = () => {
    exportTypes.forEach((type) => {
      if (type === 'approval_summary') {
        downloadReport(
          `BaoCao_PheDuyet_${dateFrom}_${dateTo}`,
          'BÁO CÁO CÔNG VIỆC CHỜ PHÊ DUYỆT',
          [
            ['Nhóm công việc', 'Số lượng'],
            ...taskGroups.map((group) => [group.label, String(group.count)]),
          ],
        );
      }

      if (type === 'tour_performance') {
        downloadReport(
          `BaoCao_HieuQuaTour_${dateFrom}_${dateTo}`,
          'BÁO CÁO HIỆU QUẢ TOUR',
          [
            ['Từ ngày', dateFrom],
            ['Đến ngày', dateTo],
            [],
            ['Chương trình tour', 'Số booking', 'Doanh số'],
            ...topRevenuePrograms.map((item) => [item.tourName, String(item.bookings), formatCurrency(item.revenue)]),
          ],
        );
      }

      if (type === 'voucher_pipeline') {
        downloadReport(
          `BaoCao_Voucher_${dateFrom}_${dateTo}`,
          'BÁO CÁO PIPELINE VOUCHER',
          [
            ['Mã voucher', 'Ngày bắt đầu', 'Người tạo', 'Trạng thái'],
            ...mockVouchers
              .filter((voucher) => voucher.status === 'pending_approval')
              .map((voucher) => [
                voucher.code,
                formatDate(voucher.startDate),
                voucher.createdBy ?? 'Nhân viên kinh doanh',
                'Chờ phê duyệt',
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
        <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Dashboard Quản lý</h1>
        <p className="text-xs text-[#2A2421]/50">Tập trung vào phê duyệt, xử lý ngoại lệ và theo dõi hiệu quả kinh doanh.</p>
      </div>

      <section className="mb-10" aria-labelledby="manager-task-title">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-red-500 rounded-sm" />
          <h2 id="manager-task-title" className="font-['Inter'] text-base font-bold text-[#2A2421]">
            Công việc cần làm
          </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {taskGroups.map((group) => (
            <TaskColumn key={group.label} group={group} />
          ))}
        </div>
      </section>

      <section aria-labelledby="manager-report-title">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-[#D4AF37] rounded-sm" />
          <h2 id="manager-report-title" className="font-['Inter'] text-base font-bold text-[#2A2421]">
            Báo cáo quản lý
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
                Top tour theo doanh số trong kỳ
              </h3>
            </div>
            <div className="space-y-3">
              {topRevenuePrograms.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#2A2421]/40">Không có dữ liệu trong khoảng thời gian đã chọn.</div>
              ) : (
                topRevenuePrograms.map((item, index) => (
                  <div key={item.tourName} className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#2A2421]">{item.tourName}</p>
                      <p className="text-[11px] text-[#2A2421]/50 mt-1">{item.bookings} booking</p>
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
                Điểm kiểm soát
              </h3>
            </div>
            <div className="space-y-3 text-sm text-[#2A2421]/70">
              <div className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4">
                Voucher chờ duyệt được ưu tiên theo ngày bắt đầu gần nhất, sau đó đến ngày gửi duyệt.
              </div>
              <div className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4">
                Báo cáo có filter ngày bắt đầu và ngày kết thúc, không trộn chung với danh sách tác vụ.
              </div>
              <div className="border border-[#D0C5AF]/15 bg-[#FAFAF5] p-4">
                Các nhóm như phê duyệt dự toán hoặc xử lý tour không đủ điều kiện vẫn hiển thị rõ kể cả khi chưa có dữ liệu mẫu.
              </div>
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
              key: 'approval_summary' as const,
              label: 'Báo cáo tổng hợp phê duyệt',
              desc: 'Tổng hợp các nhóm công việc đang chờ quản lý xử lý.',
            },
            {
              key: 'tour_performance' as const,
              label: 'Báo cáo hiệu quả tour',
              desc: 'Top tour theo doanh số trong khoảng thời gian đã chọn.',
            },
            {
              key: 'voucher_pipeline' as const,
              label: 'Báo cáo pipeline voucher',
              desc: 'Danh sách voucher đang chờ phê duyệt.',
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
