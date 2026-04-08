import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockTourInstances, mockTourPrograms, mockSuppliers } from '../../data/tourProgram';
import { mockBookings } from '../../data/bookings';

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const instances = mockTourInstances;

  // ── Real stats from mockTourInstances ──
  const stats = [
    {
      label: 'Chờ duyệt bán',
      value: instances.filter(i => i.status === 'cho_duyet_ban').length,
      icon: 'checklist',
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Chờ nhận ĐH',
      value: instances.filter(i => i.status === 'cho_nhan_dieu_hanh').length,
      icon: 'assignment_turned_in',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Chờ dự toán',
      value: instances.filter(i => i.status === 'cho_du_toan').length,
      icon: 'request_quote',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Đang triển khai',
      value: instances.filter(i => i.status === 'dang_trien_khai').length,
      icon: 'tour',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Đã hoàn thành',
      value: instances.filter(i => i.status === 'hoan_thanh').length,
      icon: 'verified',
      color: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    },
  ];

  // ── Tasks: urgent instances needing action ──
  const urgentInstances = [
    ...instances.filter(i => i.status === 'cho_duyet_ban').map(i => ({ ...i, action: 'Duyệt bán', priority: 'high' as const, type: 'Duyệt bán' })),
    ...instances.filter(i => i.status === 'cho_nhan_dieu_hanh').map(i => ({ ...i, action: 'Nhận ĐH', priority: 'high' as const, type: 'Nhận ĐH' })),
    ...instances.filter(i => i.status === 'cho_du_toan').map(i => ({ ...i, action: 'Lập dự toán', priority: 'high' as const, type: 'Dự toán' })),
    ...instances.filter(i => i.status === 'dang_trien_khai').map(i => ({ ...i, action: 'Phân HDV', priority: 'medium' as const, type: 'HDV' })),
  ].slice(0, 5);

  // ── Timeline from instance timestamps ──
  const timelineEvents = [
    ...instances.filter(i => i.approvedAt).map(i => ({
      time: i.approvedAt ? new Date(i.approvedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '',
      text: `Tour "${i.programName}" đã được duyệt`,
      user: i.approvedBy ?? 'Quản lý',
    })),
    ...instances.filter(i => i.submittedAt).map(i => ({
      time: i.submittedAt ? new Date(i.submittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '',
      text: `Tour "${i.programName}" đã gửi duyệt`,
      user: i.createdBy,
    })),
    ...instances.filter(i => i.receivedAt).map(i => ({
      time: i.receivedAt ? new Date(i.receivedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '',
      text: `Nhận điều hành "${i.programName}"`,
      user: i.receivedBy ?? 'Bạn',
    })),
  ].slice(0, 4);

  // ── Chart data ──
  const chartData = [
    { month: 'T1', tours: 3 }, { month: 'T2', tours: 5 },
    { month: 'T3', tours: 4 }, { month: 'T4', tours: 7 },
    { month: 'T5', tours: 6 }, { month: 'T6', tours: 9 },
    { month: 'T7', tours: 8 }, { month: 'T8', tours: 11 },
  ];

  const totalBookings = mockBookings.length;
  const activeSuppliers = mockSuppliers.length;
  const activeInstances = instances.filter(i => i.status === 'dang_mo_ban' || i.status === 'dang_trien_khai').length;

  const handleTaskClick = (instance: typeof urgentInstances[0]) => {
    switch (instance.status) {
      case 'cho_duyet_ban':
        navigate('/coordinator/tour-programs');
        break;
      case 'cho_nhan_dieu_hanh':
        navigate(`/coordinator/tour-programs/${instance.id}/receive`);
        break;
      case 'cho_du_toan':
        navigate(`/coordinator/tours/${instance.id}/estimate`);
        break;
      case 'dang_trien_khai':
        navigate('/coordinator/tour-programs');
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full min-h-full bg-[#F3F3F3] p-6 md:p-10">
      <div className="mb-8 space-y-1.5">
        <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Tổng quan</p>
        <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421]">Dashboard Điều phối</h1>
        <p className="text-xs text-[#2A2421]/50">
          {activeInstances} tour đang hoạt động · {totalBookings} booking · {activeSuppliers} NCC đang hợp tác
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-[#D0C5AF]/20 p-5 hover:border-[#D4AF37]/40 transition-colors cursor-default">
            <div className="flex items-center justify-between mb-3">
              <span className={`material-symbols-outlined text-xl p-2 rounded-lg ${s.color}`}>{s.icon}</span>
            </div>
            <p className="font-['Noto_Serif'] text-2xl font-bold text-[#2A2421]">{s.value}</p>
            <p className="text-[10px] uppercase tracking-widest text-[#2A2421]/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 bg-white border border-[#D0C5AF]/20 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-[#D4AF37]"></div>
            <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold">Việc cần làm</h2>
            <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{urgentInstances.length}</span>
          </div>
          <div className="space-y-2">
            {urgentInstances.length === 0 ? (
              <div className="py-8 text-center text-[#2A2421]/40 text-sm">
                <span className="material-symbols-outlined text-4xl block mb-2">check_circle</span>
                Không có việc cần xử lý
              </div>
            ) : urgentInstances.map(t => (
              <div
                key={t.id}
                onClick={() => handleTaskClick(t)}
                className="flex items-center gap-4 p-3 bg-[#FAFAF5] border border-[#D0C5AF]/15 hover:border-[#D4AF37]/40 transition-colors cursor-pointer"
              >
                <span className={`material-symbols-outlined text-lg p-1.5 rounded ${
                  t.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {t.type === 'Duyệt bán' ? 'checklist' :
                   t.type === 'Nhận ĐH' ? 'assignment_turned_in' :
                   t.type === 'Dự toán' ? 'calculate' : 'person_add'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t.programName}</p>
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${
                    t.priority === 'high' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {t.type} · {new Date(t.departureDate).toLocaleDateString('vi-VN')} ·{' '}
                    {t.expectedGuests} KH
                  </span>
                </div>
                <span className="text-xs text-[#D4AF37] font-bold">{t.action}</span>
                <span className="material-symbols-outlined text-[#2A2421]/30">chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 bg-[#D4AF37]"></div>
              <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold">Hoạt động gần đây</h2>
            </div>
            <div className="space-y-4">
              {timelineEvents.length === 0 ? (
                <p className="text-sm text-[#2A2421]/40 italic">Chưa có hoạt động nào</p>
              ) : timelineEvents.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5"></div>
                    {i < timelineEvents.length - 1 && <div className="w-px flex-1 bg-[#D0C5AF]/30 mt-1"></div>}
                  </div>
                  <div className="pb-4">
                    <p className="text-[10px] text-[#2A2421]/40 font-medium">{t.time}</p>
                    <p className="text-xs mt-0.5">{t.text}</p>
                    <p className="text-[10px] text-[#D4AF37] mt-0.5">{t.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-[#D0C5AF]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-[#D4AF37]"></div>
              <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold">Tour theo tháng</h2>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D0C5AF33" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#2A242180' }} />
                <YAxis tick={{ fontSize: 9, fill: '#2A242180' }} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #D0C5AF40' }} />
                <Area type="monotone" dataKey="tours" stroke="#D4AF37" fill="#D4AF3720" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
