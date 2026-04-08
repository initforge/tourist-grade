import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'T1', value: 320 }, { month: 'T2', value: 280 }, { month: 'T3', value: 450 },
  { month: 'T4', value: 380 }, { month: 'T5', value: 520 }, { month: 'T6', value: 610 },
  { month: 'T7', value: 750 }, { month: 'T8', value: 680 }, { month: 'T9', value: 590 },
  { month: 'T10', value: 0 }, { month: 'T11', value: 0 }, { month: 'T12', value: 0 },
];

const pendingItems = [
  { id: 1, type: 'CT Tour', title: 'Hạ Long - Kỳ quan Thế giới 3N2Đ', author: 'Điều phối viên Trần', date: '25/03/2026', action: 'Phê duyệt' },
  { id: 2, type: 'Dự toán', title: 'Phú Quốc - Đảo Ngọc 4N3Đ', author: 'Điều phối viên Lê', date: '24/03/2026', action: 'Duyệt chi phí' },
  { id: 3, type: 'CT Tour', title: 'Sapa - Ruộng Bậc Thang 3N2Đ', author: 'Điều phối viên Trần', date: '23/03/2026', action: 'Phê duyệt' },
  { id: 4, type: 'Delay', title: 'Huế - Cố đô Tour #T089', author: 'Hệ thống', date: '22/03/2026', action: 'Xem xét' },
];

const stats = [
  { label: 'CT Tour chờ duyệt', value: '3', icon: 'pending_actions', color: 'bg-amber-50 text-amber-700' },
  { label: 'Dự toán chờ duyệt', value: '2', icon: 'request_quote', color: 'bg-blue-50 text-blue-700' },
  { label: 'Tour đang chạy', value: '12', icon: 'tour', color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Doanh thu tháng', value: '1.2 tỷ', icon: 'payments', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
];

export default function ManagerDashboard() {
  return (
    <div className="w-full min-h-full bg-[#F3F3F3] p-6 md:p-10">
      {/* Header */}
      <div className="mb-8 space-y-1.5">
        <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Tổng quan</p>
        <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Dashboard Quản lý</h1>
        <p className="text-xs text-[#2A2421]/50">Phê duyệt chương trình tour, dự toán chi phí và giám sát hoạt động kinh doanh.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-[#D0C5AF]/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`material-symbols-outlined text-xl p-2 rounded-lg ${s.color}`}>{s.icon}</span>
            </div>
            <p className="font-['Noto_Serif'] text-2xl font-bold text-[#2A2421]">{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pending Items */}
        <div className="lg:col-span-3 bg-white border border-[#D0C5AF]/20 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-[#D4AF37]"></div>
            <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Cần xử lý</h2>
            <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{pendingItems.length}</span>
          </div>
          <div className="space-y-3">
            {pendingItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-[#FAFAF5] border border-[#D0C5AF]/15 hover:border-[#D4AF37]/40 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      item.type === 'CT Tour' ? 'bg-blue-100 text-blue-700' : item.type === 'Dự toán' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>{item.type}</span>
                    <span className="text-[10px] text-[#2A2421]/40">{item.date}</span>
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-[11px] text-[#2A2421]/50 mt-0.5">Bởi: {item.author}</p>
                </div>
                <button className="px-3 py-1.5 bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#C49B2F] transition-colors whitespace-nowrap">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white border border-[#D0C5AF]/20 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-[#D4AF37]"></div>
            <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Doanh thu theo tháng</h2>
          </div>
          <p className="text-[10px] text-[#2A2421]/40 mb-4">Đơn vị: triệu VND</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0C5AF33" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#2A242180' }} />
              <YAxis tick={{ fontSize: 10, fill: '#2A242180' }} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #D0C5AF40' }} />
              <Bar dataKey="value" fill="#D4AF37" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
