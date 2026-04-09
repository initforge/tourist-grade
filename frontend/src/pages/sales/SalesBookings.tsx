import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Modal, Checkbox, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { mockBookings, type Booking } from '../../data/bookings';

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingTab = 'pending_confirm' | 'confirmed' | 'completed' | 'cancelled';
type ConfirmSubFilter = 'all' | 'pending_book' | 'pending_cancel';
type RefundSubFilter = 'all' | 'pending' | 'refunded' | 'not_required';
type ExportReportType = 'all' | 'pending_confirm' | 'confirmed' | 'completed' | 'cancelled';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const TABS: { key: BookingTab; label: string; icon: string }[] = [
  { key: 'pending_confirm', label: 'Cần xác nhận', icon: 'pending_actions' },
  { key: 'confirmed',      label: 'Đã xác nhận',  icon: 'check_circle' },
  { key: 'completed',     label: 'Hoàn thành',    icon: 'task_alt' },
  { key: 'cancelled',     label: 'Đã hủy',        icon: 'cancel' },
];

const CONFIRM_SUB_FILTERS: { key: ConfirmSubFilter; label: string }[] = [
  { key: 'all',           label: 'Tất cả' },
  { key: 'pending_book',  label: 'Cần xác nhận đơn đặt' },
  { key: 'pending_cancel', label: 'Cần xác nhận hủy' },
];

const REFUND_SUB_FILTERS: { key: RefundSubFilter; label: string }[] = [
  { key: 'all',         label: 'Tất cả' },
  { key: 'pending',    label: 'Chưa hoàn' },
  { key: 'refunded',   label: 'Đã hoàn' },
  { key: 'not_required', label: 'Không cần hoàn' },
];

// Label & style for paymentStatus (50% = partial, 100% = paid)
const PAYMENT_LABEL: Record<string, string> = {
  unpaid:   'Chưa thanh toán',
  partial:  'Đã cọc',
  paid:     'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
};
const PAYMENT_STYLE: Record<string, string> = {
  unpaid:   'bg-gray-100 text-gray-600',
  partial:  'bg-amber-100 text-amber-700',
  paid:     'bg-emerald-100 text-emerald-700',
  refunded: 'bg-red-100 text-red-700',
};

// Label & style for booking order status
const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:        'Cần xác nhận đơn đặt',
  pending_cancel: 'Cần xác nhận hủy',
  booked:         'Đã đặt',
  confirmed:      'Đã xác nhận',
  completed:      'Hoàn thành',
  cancelled:      'Đã hủy',
};
const ORDER_STATUS_STYLE: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-700',
  pending_cancel: 'bg-orange-100 text-orange-700',
  booked:         'bg-indigo-100 text-indigo-700',
  confirmed:      'bg-blue-100 text-blue-700',
  completed:      'bg-emerald-100 text-emerald-700',
  cancelled:      'bg-red-100 text-red-700',
};

// Label & style for refund status
const REFUND_STATUS_LABEL: Record<string, string> = {
  none:         '—',
  pending:      'Chưa hoàn',
  refunded:     'Đã hoàn',
  not_required: 'Không cần hoàn',
};
const REFUND_STATUS_STYLE: Record<string, string> = {
  none:         'text-[#2A2421]/30',
  pending:      'bg-amber-100 text-amber-700',
  refunded:     'bg-emerald-100 text-emerald-700',
  not_required: 'bg-gray-100 text-gray-500',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function passengerCount(booking: Booking) {
  const adults   = booking.passengers.filter(p => p.type === 'adult').length;
  const children = booking.passengers.filter(p => p.type === 'child').length;
  const infants  = booking.passengers.filter(p => p.type === 'infant').length;
  return `${adults} NL / ${children} TE / ${infants} EB`;
}

// ── Excel Export Helpers ───────────────────────────────────────────────────────

function buildExcelRows(data: Booking[], tab: BookingTab): string {
  let content = '\uFEFF'; // BOM for UTF-8

  if (tab === 'cancelled') {
    content += 'Mã đơn,Khách hàng,Tour,Ngày KH,Số khách,Tổng tiền,Trạng thái đơn,Lý do hủy,Số tiền hoàn,Trạng thái hoàn tiền\n';
    data.forEach(b => {
      content += [
        b.bookingCode,
        b.contactInfo.name,
        b.tourName,
        formatDate(b.tourDate),
        passengerCount(b),
        formatCurrency(b.totalAmount) + ' VND',
        ORDER_STATUS_LABEL[b.status] ?? b.status,
        b.cancellationReason ?? '—',
        b.refundAmount ? formatCurrency(b.refundAmount) + ' VND' : '—',
        REFUND_STATUS_LABEL[b.refundStatus] ?? b.refundStatus,
      ].join(',') + '\n';
    });
  } else {
    content += 'Mã đơn,Khách hàng,Tour,Ngày KH,Số khách,Tổng tiền,TT thanh toán,Trạng thái đơn,Ngày tạo\n';
    data.forEach(b => {
      content += [
        b.bookingCode,
        b.contactInfo.name,
        b.tourName,
        formatDate(b.tourDate),
        passengerCount(b),
        formatCurrency(b.totalAmount) + ' VND',
        PAYMENT_LABEL[b.paymentStatus] ?? b.paymentStatus,
        ORDER_STATUS_LABEL[b.status] ?? b.status,
        formatDate(b.createdAt),
      ].join(',') + '\n';
    });
  }

  return content;
}

function downloadExcel(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BookingManagement() {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]        = useState<BookingTab>('pending_confirm');
  const [confirmSubFilter, setConfirmSubFilter] = useState<ConfirmSubFilter>('all');
  const [refundSubFilter,  setRefundSubFilter]  = useState<RefundSubFilter>('all');
  const [searchKeyword,   setSearchKeyword]    = useState('');
  const [searchInput,      setSearchInput]       = useState('');
  const [currentPage,     setCurrentPage]       = useState(1);

  // Date range state (dayjs | null)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Export modal state
  const [exportModalOpen,    setExportModalOpen]    = useState(false);
  const [exportReportTypes, setExportReportTypes]  = useState<ExportReportType[]>(['pending_confirm']);

  // Booking action modals
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; booking: Booking | null }>({ open: false, booking: null });
  const [rejectModal,  setRejectModal]  = useState<{ open: boolean; booking: Booking | null; defaultReason?: string }>({ open: false, booking: null });
  const [rejectReason, setRejectReason] = useState('');

  // Live bookings state (mutable for demo)
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = (tab: BookingTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setConfirmSubFilter('all');
    setRefundSubFilter('all');
  };

  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setSearchKeyword(searchInput);
    setCurrentPage(1);
  };
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchKeyword('');
    setCurrentPage(1);
  };

  // ── Core filter pipeline ─────────────────────────────────────────────────
  const tabFiltered = useMemo(() => {
    switch (activeTab) {
      case 'pending_confirm':
        return bookings.filter(b => b.status === 'pending' || b.status === 'pending_cancel');
      case 'confirmed':
        return bookings.filter(b => b.status === 'confirmed');
      case 'completed':
        return bookings.filter(b => b.status === 'completed');
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled');
    }
  }, [bookings, activeTab]);

  // Sub-filter: "Cần xác nhận" → phân biệt đơn đặt vs đơn hủy
  const subFiltered = useMemo(() => {
    if (activeTab !== 'pending_confirm') return tabFiltered;
    if (confirmSubFilter === 'all') return tabFiltered;
    if (confirmSubFilter === 'pending_cancel') {
      return tabFiltered.filter(b => b.status === 'pending_cancel');
    }
    return tabFiltered.filter(b => b.status === 'pending');
  }, [tabFiltered, activeTab, confirmSubFilter]);

  // Sub-filter: "Đã hủy" → phân biệt refund status
  const refundFiltered = useMemo(() => {
    if (activeTab !== 'cancelled') return subFiltered;
    if (refundSubFilter === 'all') return subFiltered;
    return subFiltered.filter(b => b.refundStatus === refundSubFilter);
  }, [subFiltered, activeTab, refundSubFilter]);

  // Search keyword filter
  const searchFiltered = useMemo(() => {
    if (!searchKeyword.trim()) return refundFiltered;
    const kw = searchKeyword.toLowerCase();
    return refundFiltered.filter(b =>
      b.bookingCode.toLowerCase().includes(kw) ||
      b.contactInfo.name.toLowerCase().includes(kw) ||
      b.tourName.toLowerCase().includes(kw),
    );
  }, [refundFiltered, searchKeyword]);

  // Date range filter
  const dateFiltered = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return searchFiltered;
    const [start, end] = dateRange;
    return searchFiltered.filter(b => {
      const d = dayjs(b.createdAt).startOf('day');
      const s = start.startOf('day');
      const e = end.startOf('day');
      return d.diff(s, 'day') >= 0 && e.diff(d, 'day') >= 0;
    });
  }, [searchFiltered, dateRange]);

  // Paginate
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return dateFiltered.slice(start, start + PAGE_SIZE);
  }, [dateFiltered, currentPage]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    pending_confirm: bookings.filter(b => b.status === 'pending' || b.status === 'pending_cancel').length,
    confirmed:      bookings.filter(b => b.status === 'confirmed').length,
    completed:       bookings.filter(b => b.status === 'completed').length,
    cancelled:       bookings.filter(b => b.status === 'cancelled').length,
  }), [bookings]);

  // ── Column headers per tab ────────────────────────────────────────────────
  const headers = useMemo(() => {
    const base = [
      { label: 'Mã đơn',          className: 'w-28' },
      { label: 'Khách hàng',       className: 'w-44' },
      { label: 'Tour',             className: 'min-w-40' },
      { label: 'Ngày khởi hành',   className: 'w-28' },
      { label: 'Số lượng khách',   className: 'w-32' },
      { label: 'Tổng tiền',        className: 'w-36 text-right' },
    ];

    if (activeTab === 'pending_confirm') {
      return [
        ...base,
        { label: 'TT thanh toán',  className: 'w-28 text-center' },
        { label: 'Ngày tạo đơn',  className: 'w-28' },
        { label: 'Ghi chú',        className: 'w-36' },
        { label: 'Trạng thái đơn', className: 'w-44' },
      ];
    }

    if (activeTab === 'confirmed') {
      return [
        ...base,
        { label: 'TT thanh toán',  className: 'w-28 text-center' },
        { label: 'Trạng thái đơn', className: 'w-36' },
      ];
    }

    if (activeTab === 'completed') {
      return [
        ...base,
        { label: 'TT thanh toán',  className: 'w-28 text-center' },
        { label: 'Trạng thái đơn', className: 'w-36' },
      ];
    }

    // activeTab === 'cancelled'
    return [
      ...base,
      { label: 'Trạng thái đơn',  className: 'w-28' },
      { label: 'Lý do hủy',       className: 'w-36' },
      { label: 'Số tiền hoàn',     className: 'w-28' },
      { label: 'TT hoàn tiền',    className: 'w-28 text-center' },
    ];
  }, [activeTab]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => setExportModalOpen(true);

  // ── Booking Action Handlers ────────────────────────────────────────────────

  const handleOpenConfirm = (booking: Booking) => {
    setConfirmModal({ open: true, booking });
  };

  const handleOpenReject = (booking: Booking) => {
    const defaultReason = booking.status === 'pending_cancel'
      ? ''
      : 'Danh sách hành khách không đủ điều kiện';
    setRejectReason(defaultReason);
    setRejectModal({ open: true, booking, defaultReason });
  };

  const handleConfirmBooking = () => {
    if (!confirmModal.booking) return;
    setBookings(prev => prev.map(b => {
      if (b.id !== confirmModal.booking!.id) return b;
      if (b.status === 'pending') return { ...b, status: 'confirmed' as const };
      if (b.status === 'pending_cancel') return { ...b, status: 'cancelled' as const };
      return b;
    }));
    setConfirmModal({ open: false, booking: null });
  };

  const handleRejectBooking = (reason: string) => {
    if (!rejectModal.booking) return;
    setBookings(prev => prev.map(b => {
      if (b.id !== rejectModal.booking!.id) return b;
      if (b.status === 'pending') {
        return { ...b, status: 'cancelled' as const, cancellationReason: reason };
      }
      if (b.status === 'pending_cancel') {
        return { ...b, status: 'confirmed' as const };
      }
      return b;
    }));
    setRejectModal({ open: false, booking: null });
  };

  const handleConfirmExport = () => {
    const today = new Date().toISOString().split('T')[0];
    exportReportTypes.forEach(type => {
      const rows = bookings.filter(b => {
        switch (type) {
          case 'pending_confirm': return b.status === 'pending' || b.status === 'pending_cancel';
          case 'confirmed':       return b.status === 'confirmed';
          case 'completed':      return b.status === 'completed';
          case 'cancelled':      return b.status === 'cancelled';
          default:               return true;
        }
      });
      const tab: BookingTab = type === 'pending_confirm' ? 'pending_confirm'
        : type === 'confirmed' ? 'confirmed'
        : type === 'completed' ? 'completed'
        : 'cancelled';
      const content = buildExcelRows(rows, tab);
      downloadExcel(content, `Travela_${type}_${today}`);
    });
    setExportModalOpen(false);
  };

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* ── Title row ── */}
        <div className="mb-6">
          <div className="space-y-1.5 mb-4">
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Hệ thống đặt chỗ</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421] leading-tight">Báo cáo Kinh doanh</h1>
          </div>

          {/* Date range + Export controls — right under title */}
          <div className="flex flex-wrap items-center gap-3">
            <DatePicker.RangePicker
              value={dateRange}
              onChange={val => { setDateRange(val as [Dayjs | null, Dayjs | null]); setCurrentPage(1); }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear
              className="h-9 text-xs"
            />

            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-[#2A2421] text-white px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest hover:bg-[#D4AF37] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Xuất Excel
            </button>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="bg-white border border-[#D0C5AF]/30 mb-6">
          <div className="flex overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-['Inter'] uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-[#D4AF37] text-[#D4AF37] font-bold bg-[#D4AF37]/5'
                    : 'border-transparent text-[#2A2421]/50 hover:text-[#2A2421] hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full ${
                  activeTab === tab.key ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Sub-filter: "Cần xác nhận" */}
          {activeTab === 'pending_confirm' && (
            <div className="px-5 py-3 bg-amber-50/50 border-t border-[#D0C5AF]/20 flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[#2A2421]/40 font-bold flex-shrink-0">Lọc:</span>
              {CONFIRM_SUB_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setConfirmSubFilter(f.key); setCurrentPage(1); }}
                  className={`px-3 py-1 text-[11px] font-medium border transition-all ${
                    confirmSubFilter === f.key
                      ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                      : 'bg-white text-[#2A2421]/60 border-[#D0C5AF]/40 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Sub-filter: "Đã hủy" — dropdown refund status */}
          {activeTab === 'cancelled' && (
            <div className="px-5 py-3 bg-red-50/40 border-t border-[#D0C5AF]/20 flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[#2A2421]/40 font-bold flex-shrink-0">Trạng thái hoàn tiền:</span>
              <select
                value={refundSubFilter}
                onChange={e => { setRefundSubFilter(e.target.value as RefundSubFilter); setCurrentPage(1); }}
                className="px-3 py-1.5 text-[11px] border border-[#D0C5AF]/40 bg-white outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                {REFUND_SUB_FILTERS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Search bar ── */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center border border-[#D0C5AF]/40 bg-white focus-within:border-[#D4AF37] transition-colors flex-1 max-w-72">
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn, khách hàng, tour..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              className="pl-3 pr-2 py-2 text-sm outline-none bg-transparent w-full"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="px-1 text-[#2A2421]/30 hover:text-[#2A2421]/60 transition-colors"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <button
              onClick={handleSearch}
              className="px-3 py-2 text-[#2A2421]/40 hover:text-[#D4AF37] transition-colors border-l border-[#D0C5AF]/20"
              title="Tìm kiếm"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
          </div>

          {searchKeyword && (
            <p className="text-[11px] text-[#D4AF37] flex-shrink-0">
              Kết quả: "{searchKeyword}" ({dateFiltered.length} đơn)
            </p>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                {headers.map(h => (
                  <th key={h.label} className={`px-4 py-3.5 font-['Inter'] text-[10px] uppercase tracking-widest text-[#2A2421] font-bold ${h.className}`}>
                    {h.label}
                  </th>
                ))}
                <th className="px-4 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="px-5 py-16 text-center">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#D0C5AF]">inbox</span>
                    <p className="text-sm text-[#2A2421]/40">Không có đơn booking nào</p>
                  </td>
                </tr>
              ) : paginated.map(booking => (
                <tr
                  key={booking.id}
                  onClick={() => navigate(`/sales/bookings/${booking.id}`)}
                  className="hover:bg-[#FAFAF5] transition-colors cursor-pointer border-l-2 border-transparent hover:border-[#D4AF37]"
                >
                  {/* Mã đơn */}
                  <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">
                    #{booking.bookingCode}
                  </td>

                  {/* Khách hàng */}
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-[#2A2421]">{booking.contactInfo.name}</p>
                    <p className="text-[11px] text-[#2A2421]/50">{booking.contactInfo.phone}</p>
                  </td>

                  {/* Tour */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-[#2A2421]">{booking.tourName}</p>
                    <p className="text-[11px] text-[#2A2421]/50">{booking.tourDuration}</p>
                  </td>

                  {/* Ngày khởi hành */}
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(booking.tourDate)}</td>

                  {/* Số lượng khách */}
                  <td className="px-4 py-4 text-xs text-[#2A2421]/70">{passengerCount(booking)}</td>

                  {/* Tổng tiền */}
                  <td className="px-4 py-4 text-right font-['Noto_Serif'] text-sm font-medium text-[#D4AF37]">
                    {formatCurrency(booking.totalAmount)}
                  </td>

                  {/* ── Tabs cụ thể ── */}
                  {activeTab === 'pending_confirm' && (
                    <>
                      {/* TT thanh toán */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking.paymentStatus] ?? ''}`}>
                          {PAYMENT_LABEL[booking.paymentStatus] ?? booking.paymentStatus}
                        </span>
                      </td>

                      {/* Ngày tạo đơn / yêu cầu hủy */}
                      <td className="px-4 py-4 text-xs text-[#2A2421]/50">
                        {formatDate(booking.createdAt)}
                      </td>

                      {/* Ghi chú / Lý do hủy */}
                      <td className="px-4 py-4 text-xs text-[#2A2421]/50 max-w-36 truncate">
                        {booking.status === 'pending_cancel'
                          ? (booking.cancellationReason ?? '—')
                          : (booking.contactInfo.note ?? '—')}
                      </td>

                      {/* Trạng thái đơn */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${ORDER_STATUS_STYLE[booking.status] ?? ''}`}>
                          {ORDER_STATUS_LABEL[booking.status] ?? booking.status}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenConfirm(booking)}
                            className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => handleOpenReject(booking)}
                            className="px-3 py-1.5 text-[10px] font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </>
                  )}

                  {(activeTab === 'confirmed' || activeTab === 'completed') && (
                    <>
                      {/* TT thanh toán */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking.paymentStatus] ?? ''}`}>
                          {PAYMENT_LABEL[booking.paymentStatus] ?? booking.paymentStatus}
                        </span>
                      </td>

                      {/* Trạng thái đơn */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${ORDER_STATUS_STYLE[booking.status] ?? ''}`}>
                          {ORDER_STATUS_LABEL[booking.status] ?? booking.status}
                        </span>
                      </td>
                    </>
                  )}

                  {activeTab === 'cancelled' && (
                    <>
                      {/* Trạng thái đơn */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${ORDER_STATUS_STYLE[booking.status] ?? ''}`}>
                          {ORDER_STATUS_LABEL[booking.status] ?? booking.status}
                        </span>
                      </td>

                      {/* Lý do hủy */}
                      <td className="px-4 py-4 text-xs text-[#2A2421]/50 max-w-36 truncate">
                        {booking.cancellationReason ?? '—'}
                      </td>

                      {/* Số tiền hoàn */}
                      <td className="px-4 py-4 text-xs text-red-600 font-medium">
                        {booking.refundAmount
                          ? formatCurrency(booking.refundAmount)
                          : '—'}
                      </td>

                      {/* TT hoàn tiền */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${REFUND_STATUS_STYLE[booking.refundStatus] ?? ''}`}>
                          {REFUND_STATUS_LABEL[booking.refundStatus] ?? '—'}
                        </span>
                      </td>
                    </>
                  )}

                  {/* Chevron */}
                  <td className="px-4 py-4 text-right">
                    <span className="material-symbols-outlined text-[#2A2421]/30 text-lg">chevron_right</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {dateFiltered.length > PAGE_SIZE && (
          <div className="mt-4 flex justify-end">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={dateFiltered.length}
              onChange={page => setCurrentPage(page)}
              showSizeChanger={false}
              showTotal={(total, [from, to]) => (
                <span className="text-[11px] text-[#2A2421]/50">
                  {from}–{to} của {total} đơn
                </span>
              )}
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex justify-between items-center">
          <p className="text-[11px] text-[#2A2421]/40">
            Hiển thị {dateFiltered.length > 0 ? Math.min((currentPage - 1) * PAGE_SIZE + 1, dateFiltered.length) : 0}–{Math.min(currentPage * PAGE_SIZE, dateFiltered.length)} trong {dateFiltered.length} đơn
          </p>
        </div>

      </div>

      {/* ── Export Modal ── */}
      <Modal
        title={
          <span className="font-['Noto_Serif'] text-xl text-[#2A2421]">
            Xuất Báo cáo Excel
          </span>
        }
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => setExportModalOpen(false)}>Đóng</Button>
            <Button
              type="primary"
              onClick={handleConfirmExport}
              disabled={exportReportTypes.length === 0}
            >
              Xuất {exportReportTypes.length > 0 ? `${exportReportTypes.length} báo cáo` : ''}
            </Button>
          </div>
        }
        destroyOnClose
      >
        <p className="text-sm text-[#2A2421]/70 mb-4">
          Chọn loại báo cáo muốn xuất (có thể chọn nhiều):
        </p>
        <div className="space-y-3">
          {(['pending_confirm', 'confirmed', 'completed', 'cancelled'] as ExportReportType[]).map(type => (
            <Checkbox
              key={type}
              checked={exportReportTypes.includes(type)}
              onChange={e => {
                if (e.target.checked) {
                  setExportReportTypes(prev => [...prev, type]);
                } else {
                  setExportReportTypes(prev => prev.filter(t => t !== type));
                }
              }}
            >
              <span className="text-sm">
                {type === 'pending_confirm' ? 'Cần xác nhận'
                  : type === 'confirmed'      ? 'Đã xác nhận'
                  : type === 'completed'      ? 'Hoàn thành'
                  : 'Đã hủy'}
              </span>
              <span className="text-[11px] text-[#2A2421]/40 ml-2">
                ({tabCounts[type as keyof typeof tabCounts]} đơn)
              </span>
            </Checkbox>
          ))}
        </div>
      </Modal>

      {/* ── Modal: Xác nhận đơn ── */}
      <Modal
        open={confirmModal.open}
        onCancel={() => setConfirmModal({ open: false, booking: null })}
        title={<span className="font-['Noto_Serif'] text-xl text-[#2A2421]">Xác nhận đơn đặt</span>}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => setConfirmModal({ open: false, booking: null })}>Hủy</Button>
            <Button type="primary" onClick={handleConfirmBooking}>
              Xác nhận
            </Button>
          </div>
        }
      >
        {confirmModal.booking && (
          <div className="space-y-3">
            <p className="text-sm text-[#2A2421]/70">
              Bạn có chắc muốn xác nhận đơn này?
            </p>
            <div className="bg-[#FAFAF5] border border-[#D0C5AF]/20 p-4 space-y-2">
              <p className="text-sm">
                <span className="font-bold">Mã đơn:</span>{' '}
                <span className="font-['Noto_Serif'] text-[#D4AF37]">#{confirmModal.booking.bookingCode}</span>
              </p>
              <p className="text-sm">
                <span className="font-bold">Khách hàng:</span> {confirmModal.booking.contactInfo.name}
              </p>
              <p className="text-sm">
                <span className="font-bold">Tour:</span> {confirmModal.booking.tourName}
              </p>
              <p className="text-sm">
                <span className="font-bold">Trạng thái hiện tại:</span>{' '}
                <span className="font-bold text-orange-600">
                  {ORDER_STATUS_LABEL[confirmModal.booking.status]}
                </span>
              </p>
            </div>
            <p className="text-xs text-[#2A2421]/50 italic">
              Sau khi xác nhận, đơn sẽ chuyển sang tab{" "}
              <span className="text-emerald-600 font-bold">
                {confirmModal.booking.status === 'pending_cancel' ? 'Đã hủy' : 'Đã xác nhận'}
              </span>
              .
            </p>
          </div>
        )}
      </Modal>

      {/* ── Modal: Từ chối đơn ── */}
      <Modal
        open={rejectModal.open}
        onCancel={() => setRejectModal({ open: false, booking: null })}
        title={<span className="font-['Noto_Serif'] text-xl text-[#2A2421]">Từ chối đơn đặt</span>}
        footer={
          <div className="flex justify-end gap-3">
            <Button onClick={() => setRejectModal({ open: false, booking: null })}>Hủy</Button>
            <Button
              danger
              onClick={() => {
                handleRejectBooking(rejectReason || 'Danh sách hành khách không đủ điều kiện');
              }}
            >
              Xác nhận từ chối
            </Button>
          </div>
        }
      >
        {rejectModal.booking && (
          <div className="space-y-3">
            <p className="text-sm text-[#2A2421]/70">
              Vui lòng nhập lý do từ chối đơn.
            </p>
            <div className="bg-[#FAFAF5] border border-[#D0C5AF]/20 p-4 space-y-2 mb-3">
              <p className="text-sm">
                <span className="font-bold">Mã đơn:</span>{' '}
                <span className="font-['Noto_Serif'] text-[#D4AF37]">#{rejectModal.booking.bookingCode}</span>
              </p>
              <p className="text-sm">
                <span className="font-bold">Khách hàng:</span> {rejectModal.booking.contactInfo.name}
              </p>
              <p className="text-sm">
                <span className="font-bold">Trạng thái hiện tại:</span>{' '}
                <span className="font-bold text-orange-600">
                  {ORDER_STATUS_LABEL[rejectModal.booking.status]}
                </span>
              </p>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder={
                rejectModal.booking.status === 'pending_cancel'
                  ? 'Nhập lý do không chấp nhận yêu cầu hủy...'
                  : 'Nhập lý do từ chối đơn đặt...'
              }
              className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none"
            />
            <p className="text-xs text-[#2A2421]/50 italic">
              {rejectModal.booking.status === 'pending_cancel'
                ? 'Sau khi từ chối, đơn quay lại tab Đã xác nhận.'
                : 'Sau khi từ chối, đơn chuyển sang tab Đã hủy.'}
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
}
