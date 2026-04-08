import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockBookings } from '../../data/bookings';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'tr';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

// Chart data — hardcoded vì cần aggregate theo ngày trong khoảng date range
const dailyBookings = [
  { day: '01', count: 3 }, { day: '03', count: 5 }, { day: '05', count: 2 },
  { day: '07', count: 7 }, { day: '09', count: 4 }, { day: '11', count: 8 },
  { day: '13', count: 6 }, { day: '15', count: 9 }, { day: '17', count: 5 },
  { day: '19', count: 11 }, { day: '21', count: 3 }, { day: '23', count: 7 },
  { day: '25', count: 9 }, { day: '27', count: 4 }, { day: '29', count: 6 },
];
const dailyRevenue = [
  { day: '01', revenue: 27 }, { day: '03', revenue: 45 }, { day: '05', revenue: 18 },
  { day: '07', revenue: 63 }, { day: '09', revenue: 36 }, { day: '11', revenue: 72 },
  { day: '13', revenue: 54 }, { day: '15', revenue: 81 }, { day: '17', revenue: 45 },
  { day: '19', revenue: 99 }, { day: '21', revenue: 27 }, { day: '23', revenue: 63 },
  { day: '25', revenue: 81 }, { day: '27', revenue: 36 }, { day: '29', revenue: 54 },
];

const BOOKING_STATUS_LABEL: Record<string, string> = {
  booked: 'Đã đặt',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const BOOKING_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  booked: 'bg-indigo-100 text-indigo-700',
};

// ── Excel Export ───────────────────────────────────────────────────────────────

function exportSalesReport(from: string, to: string, bookings: typeof mockBookings) {
  const filtered = bookings.filter(b => {
    const d = new Date(b.createdAt);
    const fromD = new Date(from);
    const toD = new Date(to);
    return d >= fromD && d <= toD;
  });
  const rows = filtered.map(b => [
    b.bookingCode,
    b.contactInfo.name,
    b.tourName,
    b.tourDate,
    b.totalAmount.toLocaleString('vi-VN') + ' VND',
    BOOKING_STATUS_LABEL[b.status],
    b.paymentStatus,
  ]);
  let content = '\uFEFF';
  content += 'BÁO CÁO KINH DOANH\n';
  content += `Từ ngày,${from}\n`;
  content += `Đến ngày,${to}\n`;
  content += `Tổng số booking,${filtered.length}\n\n`;
  content += 'Mã đơn,Khách hàng,Tour,Ngày KH,Tổng tiền,Trạng thái đơn,TT thanh toán\n';
  rows.forEach(r => { content += r.join(',') + '\n'; });
  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoCao_KinhDoanh_${from}_${to}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SalesDashboard() {
  const [dateFrom, setDateFrom] = useState('2026-03-01');
  const [dateTo, setDateTo] = useState('2026-03-31');

  // ── Computed from mockBookings ────────────────────────────────────────

  const pendingCount = useMemo(
    () => mockBookings.filter(b => b.status === 'pending').length,
    []
  );
  const refundPendingCount = useMemo(
    () => mockBookings.filter(b => b.refundStatus === 'pending').length,
    []
  );
  const totalBookings = useMemo(() => mockBookings.length, []);
  const monthlyRevenue = useMemo(
    () => mockBookings.reduce((sum, b) => sum + b.totalAmount, 0),
    []
  );

  const urgentItems = useMemo(() => {
    const items: Array<{
      id: string;
      code: string;
      customer: string;
      tour: string;
      amount: string;
      type: 'confirm' | 'refund';
      typeLabel: string;
    }> = [];

    // Pending bookings → Cần xác nhận
    mockBookings
      .filter(b => b.status === 'pending' && b.refundStatus !== 'pending')
      .slice(0, 5)
      .forEach(b => {
        items.push({
          id: b.id,
          code: b.bookingCode,
          customer: b.contactInfo.name,
          tour: b.tourName,
          amount: b.totalAmount.toLocaleString('vi-VN') + ' VND',
          type: 'confirm',
          typeLabel: 'Cần xác nhận',
        });
      });

    // Refund pending → Hoàn tiền
    mockBookings
      .filter(b => b.refundStatus === 'pending')
      .slice(0, 3)
      .forEach(b => {
        items.push({
          id: b.id,
          code: b.bookingCode,
          customer: b.contactInfo.name,
          tour: b.tourName,
          amount: (b.refundAmount ?? b.totalAmount).toLocaleString('vi-VN') + ' VND',
          type: 'refund',
          typeLabel: 'Hoàn tiền',
        });
      });

    return items;
  }, []);

  const recentBookings = useMemo(
    () => [...mockBookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    []
  );

  const urgentStats = [
    { label: 'Booking cần xác nhận', value: pendingCount.toString(), icon: 'pending_actions', color: 'bg-amber-50 text-amber-700' },
    { label: 'Hoàn tiền pending', value: refundPendingCount.toString(), icon: 'currency_exchange', color: 'bg-red-50 text-red-700' },
    { label: 'Tổng booking', value: totalBookings.toString(), icon: 'confirmation_number', color: 'bg-blue-50 text-blue-700' },
    { label: 'Doanh số', value: fmt(monthlyRevenue), icon: 'payments', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
  ];

  const reportStats = [
    { label: 'Tổng Booking', value: totalBookings.toString(), icon: 'confirmation_number', color: 'bg-blue-50 text-blue-700' },
    { label: 'Doanh số', value: fmt(monthlyRevenue), icon: 'payments', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
    { label: 'Đơn hoàn thành', value: mockBookings.filter(b => b.status === 'completed').length.toString(), icon: 'task_alt', color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Đơn hủy', value: mockBookings.filter(b => b.status === 'cancelled').length.toString(), icon: 'cancel', color: 'bg-red-50 text-red-700' },
  ];

  const formatDateDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="w-full min-h-full bg-[#F3F3F3] p-6 md:p-10">

      {/* Header */}
      <div className="mb-8 space-y-1.5">
        <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Tổng quan</p>
        <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Dashboard Kinh doanh</h1>
        <p className="text-xs text-[#2A2421]/50">Quản lý booking, xác nhận thanh toán và xử lý hoàn tiền.</p>
      </div>

      {/* ══ PHẦN 1: CÔNG VIỆC CẦN XỬ LÝ ══ */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-red-500 rounded-sm"></div>
          <h2 className="font-['Inter'] text-base font-bold text-[#2A2421]">Công việc cần xử lý</h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {urgentStats.map((s, i) => (
            <div key={i} className="bg-white border border-[#D0C5AF]/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-xl p-2 rounded-lg ${s.color}`}>{s.icon}</span>
              </div>
              <p className="font-['Noto_Serif'] text-2xl font-bold text-[#2A2421]">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Urgent items + Recent bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-red-500"></div>
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold">Cần xử lý ngay</h3>
              <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">{urgentItems.length}</span>
            </div>
            {urgentItems.length === 0 ? (
              <p className="text-sm text-[#2A2421]/40 text-center py-8">Không có công việc cần xử lý</p>
            ) : (
              <div className="space-y-3">
                {urgentItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-[#FAFAF5] border border-[#D0C5AF]/15 hover:border-[#D4AF37]/40 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          item.type === 'confirm' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{item.typeLabel}</span>
                        <span className="text-[10px] text-[#2A2421]/40 font-mono">#{item.code}</span>
                      </div>
                      <p className="text-sm font-medium">{item.customer} — {item.tour}</p>
                      <p className="text-[11px] text-[#D4AF37] font-medium mt-0.5">{item.amount}</p>
                    </div>
                    <button className="px-3 py-1.5 bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#C49B2F] transition-colors whitespace-nowrap">
                      Xử lý
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent bookings */}
          <div className="lg:col-span-2 bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-[#D4AF37]"></div>
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold">Booking gần đây</h3>
            </div>
            <div className="space-y-3">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#D0C5AF]/10 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-[#2A2421]/40">#{b.bookingCode}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${BOOKING_STATUS_STYLE[b.status]}`}>
                        {BOOKING_STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    <p className="text-xs font-medium truncate">{b.contactInfo.name} — {b.tourName}</p>
                  </div>
                  <span className="text-xs font-medium text-[#D4AF37] ml-2 shrink-0">
                    {b.totalAmount.toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ PHẦN 2: BÁO CÁO KINH DOANH ══ */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-5 bg-[#D4AF37] rounded-sm"></div>
          <h2 className="font-['Inter'] text-base font-bold text-[#2A2421]">Báo cáo kinh doanh</h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {reportStats.map((s, i) => (
            <div key={i} className="bg-white border border-[#D0C5AF]/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`material-symbols-outlined text-xl p-2 rounded-lg ${s.color}`}>{s.icon}</span>
              </div>
              <p className="font-['Noto_Serif'] text-2xl font-bold text-[#2A2421]">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white border border-[#D0C5AF]/20 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#2A2421]/50">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border border-[#D0C5AF]/40 px-3 py-2 text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-[#2A2421]/50">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border border-[#D0C5AF]/40 px-3 py-2 text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>
          <button
            onClick={() => exportSalesReport(formatDateDisplay(dateFrom), formatDateDisplay(dateTo), mockBookings)}
            className="ml-auto flex items-center gap-2 bg-[#2A2421] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Xuất Báo Cáo
          </button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-400"></div>
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold">Số Booking theo ngày</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D0C5AF33" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#2A242180' }} />
                <YAxis tick={{ fontSize: 9, fill: '#2A242180' }} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #D0C5AF40' }} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-[#D4AF37]"></div>
              <h3 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold">Doanh thu theo ngày (triệu VND)</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D0C5AF33" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#2A242180' }} />
                <YAxis tick={{ fontSize: 9, fill: '#2A242180' }} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #D0C5AF40' }} />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
