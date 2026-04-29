import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Pagination } from 'antd';
import type { Booking } from '@entities/booking/data/bookings';
import { useAppDataStore } from '@shared/store/useAppDataStore';

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingTab = 'pending_confirm' | 'confirmed' | 'completed' | 'cancelled';
type ConfirmSubFilter = 'all' | 'pending_book' | 'pending_cancel';
type RefundSubFilter = 'all' | 'pending' | 'completed';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const TABS: { key: BookingTab; label: string; icon: string }[] = [
  { key: 'pending_confirm', label: 'Cần xác nhận', icon: 'pending_actions' },
  { key: 'confirmed',       label: 'Đã xác nhận',  icon: 'check_circle' },
  { key: 'completed',      label: 'Hoàn thành',   icon: 'task_alt' },
  { key: 'cancelled',      label: 'Đã hủy',       icon: 'cancel' },
];

const CONFIRM_SUB_FILTERS: { key: ConfirmSubFilter; label: string }[] = [
  { key: 'all',            label: 'Tất cả yêu cầu' },
  { key: 'pending_book',  label: 'Cần xác nhận đơn đặt' },
  { key: 'pending_cancel', label: 'Cần xác nhận hủy' },
];

const REFUND_SUB_FILTERS: { key: RefundSubFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả trạng thái' },
  { key: 'pending', label: 'Chưa hoàn' },
  { key: 'completed', label: 'Hoàn thành' },
];

// Label & style for paymentStatus (partial = Đã cọc, paid = 100%)
const PAYMENT_LABEL: Record<string, string> = {
  unpaid:   'Chưa thanh toán',
  partial:  '50%',
  paid:     '100%',
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
  confirmed:      'Đã xác nhận',
  completed:      'Hoàn thành',
  cancelled:      'Đã hủy',
};
const ORDER_STATUS_STYLE: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-700',
  pending_cancel: 'bg-orange-100 text-orange-700',
  confirmed:      'bg-blue-100 text-blue-700',
  completed:      'bg-emerald-100 text-emerald-700',
  cancelled:      'bg-red-100 text-red-700',
};

// Label & style for refund status
const REFUND_STATUS_LABEL: Record<string, string> = {
  none: '—',
  pending: 'Chưa hoàn',
  refunded: 'Hoàn thành',
  not_required: 'Hoàn thành',
};
const REFUND_STATUS_STYLE: Record<string, string> = {
  none: 'text-[#2A2421]/30',
  pending: 'bg-amber-100 text-amber-700',
  refunded: 'bg-emerald-100 text-emerald-700',
  not_required: 'bg-emerald-100 text-emerald-700',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN')?.format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr)?.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function passengerCount(booking: Booking) {
  const adults   = booking?.passengers?.filter(p => p.type === 'adult')?.length;
  const children = booking?.passengers?.filter(p => p.type === 'child')?.length;
  const infants  = booking?.passengers?.filter(p => p.type === 'infant')?.length;
  return `${adults} Người lớn / ${children} Trẻ em / ${infants} Em bé`;
}

function bookingMemo(booking: Booking) {
  return booking.status === 'pending_cancel'
    ? (booking?.cancellationReason ?? '—')
    : (booking?.contactInfo?.note ?? '—');
}

function matchesRefundSubFilter(booking: Booking, filter: RefundSubFilter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return booking?.refundStatus === 'pending';
  return booking?.refundStatus === 'refunded' || booking?.refundStatus === 'not_required';
}

function pendingCancelSortTime(booking: Booking) {
  return new Date(booking.cancelledAt ?? booking.createdAt).getTime();
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BookingManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State — đọc tab từ URL để giữ đúng tab khi back từ detail ──
  const initialTab = (searchParams?.get('tab') as BookingTab) ?? 'pending_confirm';
  const [activeTab,        setActiveTab]        = useState<BookingTab>(initialTab);
  const [confirmSubFilter, setConfirmSubFilter] = useState<ConfirmSubFilter>('all');
  const [refundSubFilter,  setRefundSubFilter]  = useState<RefundSubFilter>('all');
  const [searchKeyword,   setSearchKeyword]    = useState('');
  const [searchInput,      setSearchInput]       = useState('');
  const [currentPage,     setCurrentPage]       = useState(1);

  const bookings = useAppDataStore((state) => state.bookings);

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTabChange = (tab: BookingTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
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
        return bookings?.filter(b => b.status === 'pending' || b.status === 'pending_cancel');
      case 'confirmed':
        return bookings?.filter(b => b.status === 'confirmed');
      case 'completed':
        return bookings?.filter(b => b.status === 'completed');
      case 'cancelled':
        return bookings?.filter(b => b.status === 'cancelled');
    }
  }, [bookings, activeTab]);

  // Sub-filter: "Cần xác nhận" → phân biệt đơn đặt vs đơn hủy
  const subFiltered = useMemo(() => {
    if (activeTab !== 'pending_confirm') return tabFiltered;
    if (confirmSubFilter === 'all') return tabFiltered;
    if (confirmSubFilter === 'pending_cancel') {
      return tabFiltered
        ?.filter(b => b.status === 'pending_cancel')
        .sort((left, right) => pendingCancelSortTime(left) - pendingCancelSortTime(right));
    }
    return tabFiltered?.filter(b => b.status === 'pending');
  }, [tabFiltered, activeTab, confirmSubFilter]);

  // Sub-filter: "Đã hủy" → phân biệt refund status
  const refundFiltered = useMemo(() => {
    if (activeTab !== 'cancelled') return subFiltered;
    return subFiltered?.filter(booking => matchesRefundSubFilter(booking, refundSubFilter));
  }, [subFiltered, activeTab, refundSubFilter]);

  // Search keyword filter
  const searchFiltered = useMemo(() => {
    if (!searchKeyword?.trim()) return refundFiltered;
    const kw = searchKeyword?.toLowerCase();
    return refundFiltered?.filter(b =>
      b?.bookingCode?.toLowerCase()?.includes(kw) ||
      b?.contactInfo?.name?.toLowerCase()?.includes(kw) ||
      b?.tourName?.toLowerCase()?.includes(kw),
    );
  }, [refundFiltered, searchKeyword]);

  // Paginate
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return searchFiltered?.slice(start, start + PAGE_SIZE);
  }, [searchFiltered, currentPage]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    pending_confirm: bookings?.filter(b => b.status === 'pending' || b.status === 'pending_cancel')?.length,
    confirmed:       bookings?.filter(b => b.status === 'confirmed')?.length,
    completed:       bookings?.filter(b => b.status === 'completed')?.length,
    cancelled:       bookings?.filter(b => b.status === 'cancelled')?.length,
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
        { label: 'TT thanh toán',    className: 'w-24 text-center' },
        { label: 'Ngày tạo',          className: 'w-28' },
        { label: 'Ghi chú',           className: 'w-36' },
        { label: 'Trạng thái đơn',   className: 'w-44' },
      ];
    }

    if (activeTab === 'confirmed') {
      return [
        ...base,
        { label: 'TT thanh toán',  className: 'w-24 text-center' },
        { label: 'Trạng thái đơn', className: 'w-36' },
      ];
    }

    if (activeTab === 'completed') {
      return [
        ...base,
        { label: 'TT thanh toán', className: 'w-24 text-center' },
        { label: 'Trạng thái đơn', className: 'w-36' },
      ];
    }

    // activeTab === 'cancelled'
    return [
      ...base,
      { label: 'Lý do hủy',    className: 'w-36' },
      { label: 'Số tiền hoàn', className: 'w-28' },
      { label: 'TT hoàn tiền', className: 'w-28 text-center' },
    ];
  }, [activeTab]);

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10">

        {/* ── Title row ── */}
        <div className="mb-6">
          <div className="space-y-1.5 mb-4">
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Hệ thống đặt chỗ</p>
            <h1 className="font-['Noto_Serif'] text-3xl text-[#2A2421] leading-tight">Quản lý Booking</h1>
            <p className="text-xs text-[#2A2421]/50">Danh sách đơn hàng theo từng trạng thái booking.</p>
          </div>

          {/* Search controls stay directly under the title. */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-[#D0C5AF]/40 bg-white focus-within:border-[#D4AF37] transition-colors flex-1 min-w-[260px] max-w-xl">
              <input
                type="text"
                placeholder="Tìm kiếm mã đơn, khách hàng, tour..."
                value={searchInput}
                onChange={e => setSearchInput(e?.target?.value)}
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
                Kết quả: "{searchKeyword}" ({searchFiltered?.length} đơn)
              </p>
            )}
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="bg-white border border-[#D0C5AF]/30 mb-6">
          <div className="flex overflow-x-auto">
            {TABS?.map(tab => (
              <button
                key={tab?.key}
                onClick={() => handleTabChange(tab?.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-['Inter'] uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab?.key
                    ? 'border-[#D4AF37] text-[#D4AF37] font-bold bg-[#D4AF37]/5'
                    : 'border-transparent text-[#2A2421]/50 hover:text-[#2A2421] hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab?.icon}</span>
                {tab?.label}
                <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full ${
                  activeTab === tab?.key ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tabCounts[tab?.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Sub-filter: "Cần xác nhận" */}
          {activeTab === 'pending_confirm' && (
            <div className="px-5 py-3 bg-amber-50/50 border-t border-[#D0C5AF]/20 flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[#2A2421]/40 font-bold flex-shrink-0">Lọc:</span>
              {CONFIRM_SUB_FILTERS?.map(f => (
                <button
                  key={f?.key}
                  onClick={() => { setConfirmSubFilter(f?.key); setCurrentPage(1); }}
                  className={`px-3 py-1 text-[11px] font-medium border transition-all ${
                    confirmSubFilter === f?.key
                      ? 'bg-[#D4AF37] text-white border-[#D4AF37]'
                      : 'bg-white text-[#2A2421]/60 border-[#D0C5AF]/40 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {f?.label}
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
                onChange={e => { setRefundSubFilter(e?.target?.value as RefundSubFilter); setCurrentPage(1); }}
                className="px-3 py-1.5 text-[11px] border border-[#D0C5AF]/40 bg-white outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                {REFUND_SUB_FILTERS?.map(f => (
                  <option key={f?.key} value={f?.key}>{f?.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-[#D0C5AF]/20 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#FAFAF5] border-b border-[#D0C5AF]/30">
                {headers?.map(h => (
                  <th key={h?.label} className={`px-4 py-3.5 font-['Inter'] text-[10px] uppercase tracking-widest text-[#2A2421] font-bold ${h?.className}`}>
                    {h?.label}
                  </th>
                ))}
                <th className="px-4 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0C5AF]/15">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={headers?.length + 1} className="px-5 py-16 text-center">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#D0C5AF]">inbox</span>
                    <p className="text-sm text-[#2A2421]/40">Không có đơn booking nào</p>
                  </td>
                </tr>
              ) : paginated?.map(booking => (
                <tr
                  key={booking?.id}
                  onClick={() => navigate(`/sales/bookings/${booking?.id}?tab=${activeTab}`)}
                  className="hover:bg-[#FAFAF5] transition-colors cursor-pointer border-l-2 border-transparent hover:border-[#D4AF37]"
                >
                  {/* Mã đơn */}
                  <td className="px-4 py-4 font-medium text-sm font-['Noto_Serif'] text-[#2A2421]">
                    #{booking?.bookingCode}
                  </td>

                  {/* Khách hàng */}
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-[#2A2421]">{booking?.contactInfo?.name}</p>
                    <p className="text-[11px] text-[#2A2421]/50">{booking?.contactInfo?.phone}</p>
                  </td>

                  {/* Tour */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-[#2A2421]">{booking?.tourName}</p>
                    <p className="text-[11px] text-[#2A2421]/50">{booking?.tourDuration}</p>
                  </td>

                  {/* Ngày khởi hành */}
                  <td className="px-4 py-4 text-sm text-[#2A2421]/70">{formatDate(booking?.tourDate)}</td>

                  {/* Số lượng khách */}
                  <td className="px-4 py-4 text-xs text-[#2A2421]/70">{passengerCount(booking)}</td>

                  {/* Tổng tiền */}
                  <td className="px-4 py-4 text-right font-['Noto_Serif'] text-sm font-medium text-[#D4AF37]">
                    {formatCurrency(booking?.totalAmount)}
                  </td>

                  {/* ── Tabs cụ thể ── */}
                  {activeTab === 'pending_confirm' && (
                    <>
                      {/* TT thanh toán */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking?.paymentStatus] ?? ''}`}>
                          {PAYMENT_LABEL[booking?.paymentStatus] ?? booking?.paymentStatus}
                        </span>
                      </td>

                      {/* Ngày tạo đơn / yêu cầu hủy */}
                      <td className="px-4 py-4 text-xs text-[#2A2421]/50">
                        {formatDate(booking?.createdAt)}
                      </td>

                      {/* Ghi chú / Lý do hủy */}
                      <td className="px-4 py-4 text-xs text-[#2A2421]/50 max-w-36 truncate" title={bookingMemo(booking)}>
                        {bookingMemo(booking)}
                      </td>

                      {/* Trạng thái đơn */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${ORDER_STATUS_STYLE[booking?.status] ?? ''}`}>
                          {ORDER_STATUS_LABEL[booking?.status] ?? booking?.status}
                        </span>
                      </td>

                      {/* Hành động */}
                    </>
                  )}

                  {activeTab === 'confirmed' && (
                    <>
                      {/* TT thanh toán */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking?.paymentStatus] ?? ''}`}>
                          {PAYMENT_LABEL[booking?.paymentStatus] ?? booking?.paymentStatus}
                        </span>
                      </td>

                      {/* Trạng thái đơn */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${ORDER_STATUS_STYLE[booking?.status] ?? ''}`}>
                          {ORDER_STATUS_LABEL[booking?.status] ?? booking?.status}
                        </span>
                      </td>
                    </>
                  )}

                  {activeTab === 'completed' && (
                    <>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${PAYMENT_STYLE[booking?.paymentStatus] ?? ''}`}>
                          {PAYMENT_LABEL[booking?.paymentStatus] ?? booking?.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${ORDER_STATUS_STYLE[booking?.status] ?? ''}`}>
                          {ORDER_STATUS_LABEL[booking?.status] ?? booking?.status}
                        </span>
                      </td>
                    </>
                  )}

                  {activeTab === 'cancelled' && (
                    <>
                      {/* Lý do hủy */}
                      <td className="px-4 py-4 text-xs text-[#2A2421]/50 max-w-36 truncate" title={booking?.cancellationReason ?? '—'}>
                        {booking?.cancellationReason ?? '—'}
                      </td>

                      {/* Số tiền hoàn */}
                      <td className="px-4 py-4 text-xs text-red-600 font-medium">
                        {booking?.refundAmount
                          ? formatCurrency(booking?.refundAmount)
                          : '—'}
                      </td>

                      {/* TT hoàn tiền */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${REFUND_STATUS_STYLE[booking?.refundStatus] ?? ''}`}>
                          {REFUND_STATUS_LABEL[booking?.refundStatus] ?? '—'}
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
        {searchFiltered?.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={searchFiltered?.length}
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
        <div className="mt-3 flex flex-wrap justify-end items-center gap-3">
          <p className="text-[11px] text-[#2A2421]/40">
            Hiển thị {searchFiltered?.length > 0 ? Math.min((currentPage - 1) * PAGE_SIZE + 1, searchFiltered?.length) : 0}–{Math.min(currentPage * PAGE_SIZE, searchFiltered?.length)} trong {searchFiltered?.length} đơn
          </p>
        </div>

      </div>

    </div>
  );
}

