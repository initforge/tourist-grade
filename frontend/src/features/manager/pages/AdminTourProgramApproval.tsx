import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockTourPrograms } from '@entities/tour-program/data/tourProgram';
import type { TourProgram } from '@entities/tour-program/data/tourProgram';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOUR_TYPE_LABEL: Record<string, string> = {
  mua_le: 'Mùa lễ',
  quanh_nam: 'Quanh năm',
};
const TRANSPORT_LABEL: Record<string, string> = {
  xe: 'Xe ? t?',
  maybay: 'Máy bay',
};
function fmt(n: number) {
  return new Intl.NumberFormat('vi-VN')?.format(n) + ' VND';
}
function fmtDate(iso: string) {
  return new Date(iso)?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Popups ───────────────────────────────────────────────────────────────────

function RejectPopup({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="program-reject-title" className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-500">block</span>
        </div>
        <h3 id="program-reject-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Từ chối chương trình tour</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-4">Vui lòng nhập lý do từ chối.</p>
        <textarea value={reason} onChange={e => setReason(e?.target?.value)} rows={3}
          placeholder="Lý do từ chối..." className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Hủy bỏ</button>
          <button onClick={() => reason?.trim() && onConfirm(reason)} disabled={!reason?.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${reason?.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproveConfirmPopup({ tourName, onConfirm, onCancel }: { tourName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div role="dialog" aria-modal="true" aria-labelledby="program-approve-title" className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
        </div>
        <h3 id="program-approve-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">Duyệt chương trình tour</h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-6">
          Xác nhận duyệt chương trình tour <strong>{tourName}</strong>? Tour sẽ chuyển sang trạng thái <strong>Đang hoạt động</strong>.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors">Không</button>
          <button onClick={onConfirm} className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Duyệt</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminTourProgramApproval() {
  const { id } = useParams<{ id: string }>();
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const program: TourProgram | undefined = mockTourPrograms?.find(p => p.id === id);

  const handleApprove = () => { setShowApprove(false); };
  const handleReject = (reason: string) => { setRejected(reason); setShowReject(false); };

  if (!program) {
    return (
      <div className="w-full bg-[#F3F3F3] min-h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Không tìm thấy chương trình tour</p>
          <Link to="/manager/tour-programs" className="text-[#D4AF37] hover:underline text-sm">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F3F3F3] min-h-full">
      <div className="p-6 md:p-10 max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link to="/manager/tour-programs" className="text-[#D4AF37] hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">post_add</span>
            Chương trình Tour
          </Link>
          <span className="text-[#2A2421]/30">/</span>
          <span className="text-[#2A2421]/60">Phê duyệt CT Tour</span>
        </nav>

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#FAFAF5] border border-[#D0C5AF]/30 px-6 py-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Phê duyệt chương trình tour</p>
            <h1 className="font-['Noto_Serif'] text-xl text-[#2A2421]">{program?.name}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowReject(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">block</span>
              Từ chối
            </button>
            <button onClick={() => setShowApprove(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              <span className="material-symbols-outlined text-[16px]">check</span>
              Duyệt chương trình tour
            </button>
          </div>
        </div>

        {/* Rejected notice */}
        {rejected && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-2">
            <span className="material-symbols-outlined text-red-600 text-[16px] shrink-0">info</span>
            <div>
              <p className="text-xs font-bold text-red-700">Đã từ chối</p>
              <p className="text-xs text-red-600 mt-1">Lý do: {rejected}</p>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Part 1: Thông tin chung */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Thông tin chung</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: 'Tên chương trình', value: program?.name },
                  { label: 'Loại tour', value: TOUR_TYPE_LABEL[program?.tourType] },
                  { label: 'Điểm khởi hành', value: program?.departurePoint },
                  { label: 'Điểm tham quan', value: program?.sightseeingSpots?.join(', ') },
                  { label: 'Phương tiện', value: TRANSPORT_LABEL[program?.transport] },
                  ...(program?.arrivalPoint ? [{ label: 'Điểm đến', value: program?.arrivalPoint }] : []),
                  { label: 'Thời lượng', value: `${program?.duration?.days} ngày ${program?.duration?.nights} đêm` },
                  { label: 'Số khách tối thiểu', value: `${program?.pricingConfig?.minParticipants} người` },
                  { label: 'Hạn đặt tour', value: `${program?.bookingDeadline} ngày trước KH` },
                  ...(program?.holiday ? [{ label: 'Dịp lễ', value: program?.holiday }] : []),
                ]?.map(item => (
                  <div key={item?.label}>
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">{item?.label}</p>
                    <p className="text-sm font-medium">{item?.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Part 2: Lịch trình */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Lịch trình</h2>
              </div>
              <div className="space-y-4">
                {program?.itinerary?.map(day => (
                  <div key={day?.day} className="border border-[#D0C5AF]/20 p-4">
                    <h3 className="font-['Noto_Serif'] text-base font-bold text-[#2A2421] mb-2">Ngày {day?.day}: {day?.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {day?.meals?.map(m => (
                        <span key={m} className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold uppercase">
                          {m === 'breakfast' ? 'Bữa sáng' : m === 'lunch' ? 'Bữa trưa' : 'Bữa tối'}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-[#2A2421]/70">{day?.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Part 3: Giá & Cấu hành */}
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
              <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Giá & Cấu hình</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Giá NL', value: fmt(program?.pricingConfig?.sellPriceAdult) },
                  { label: 'Giá TE', value: fmt(program?.pricingConfig?.sellPriceChild) },
                  { label: 'Giá EB', value: program?.pricingConfig?.sellPriceInfant ? fmt(program?.pricingConfig?.sellPriceInfant) : 'Miễn phí' },
                ]?.map(item => (
                  <div key={item?.label} className="bg-[#FAFAF5] p-4 border border-[#D0C5AF]/20">
                    <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">{item?.label}</p>
                    <p className="font-['Noto_Serif'] text-lg font-bold text-[#D4AF37]">{item?.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs text-[#2A2421]/60">
                <div>LN: <strong className="text-[#2A2421]">{program?.pricingConfig?.profitMargin}%</strong></div>
                <div>Thuế: <strong className="text-[#2A2421]">{program?.pricingConfig?.taxRate}%</strong></div>
                <div>Chi phí khác: <strong className="text-[#2A2421]">{(program?.pricingConfig?.otherCostFactor * 100)?.toFixed(0)}%</strong></div>
              </div>
            </section>
          </div>

          {/* Right 1/3 */}
          <div className="space-y-6">
            <section className="bg-white border border-[#D0C5AF]/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-4 bg-[#D4AF37]"></div>
                <h2 className="font-['Inter'] text-[10px] uppercase tracking-widest font-bold text-[#2A2421]">Thông tin hệ thống</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">Người tạo</p>
                  <p className="text-sm font-medium">{program?.createdBy}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">Ngày tạo</p>
                  <p className="text-sm font-medium">{fmtDate(program?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">Cập nhật lần cuối</p>
                  <p className="text-sm font-medium">{fmtDate(program?.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-[#2A2421]/40 font-bold mb-1">Mã chương trình</p>
                  <p className="text-sm font-mono font-medium">{program?.id}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showReject && <RejectPopup onConfirm={handleReject} onCancel={() => setShowReject(false)} />}
      {showApprove && <ApproveConfirmPopup tourName={program?.name} onConfirm={handleApprove} onCancel={() => setShowApprove(false)} />}
    </div>
  );
}

