import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TourProgramWizard from '@features/coordinator/pages/TourProgramWizard';
import type { TourProgram } from '@entities/tour-program/data/tourProgram';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { useAuthStore } from '@shared/store/useAuthStore';
import { apiRequest } from '@shared/lib/api/client';

function RejectPopup({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-reject-title"
        className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8"
      >
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-500">block</span>
        </div>
        <h3 id="program-reject-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">
          Từ chối chương trình tour
        </h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-4">Vui lòng nhập lý do từ chối.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e?.target?.value)}
          rows={3}
          placeholder="Lý do từ chối..."
          className="w-full border border-[#D0C5AF]/40 p-3 text-sm outline-none focus:border-[#D4AF37] resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => reason?.trim() && onConfirm(reason)}
            disabled={!reason?.trim()}
            className={`flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold transition-colors ${
              reason?.trim() ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-approve-title"
        className="relative bg-white w-full max-w-sm mx-4 shadow-2xl border border-[#D0C5AF]/30 p-8"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
        </div>
        <h3 id="program-approve-title" className="font-['Noto_Serif'] text-xl text-[#2A2421] text-center mb-2">
          Duyệt chương trình tour
        </h3>
        <p className="text-xs text-[#2A2421]/60 text-center mb-6">
          Xác nhận duyệt chương trình tour <strong>{tourName}</strong>? Tour sẽ chuyển sang trạng thái <strong>Đang hoạt động</strong>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest border border-[#2A2421]/20 hover:bg-gray-50 transition-colors"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTourProgramApproval() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const token = useAuthStore(state => state.accessToken);
  const tourPrograms = useAppDataStore(state => state.tourPrograms);
  const upsertTourProgram = useAppDataStore(state => state.upsertTourProgram);

  const program: TourProgram | undefined = useMemo(() => tourPrograms?.find(p => p.id === id), [id, tourPrograms]);

  if (!program) {
    return (
      <div className="w-full bg-[#F3F3F3] min-h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#D0C5AF]">search_off</span>
          <p className="text-lg text-[#2A2421]/60">Không tìm thấy chương trình tour</p>
          <Link to="/manager/tour-programs" className="text-[#D4AF37] hover:underline text-sm">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    if (token && program) {
      const response = await apiRequest<{ success: boolean; tourProgram: TourProgram }>(`/tour-programs/${program.id}/approve`, {
        method: 'POST',
        token,
      });
      upsertTourProgram(response.tourProgram);
    }
    setApproved(true);
    setRejected(null);
    setShowApprove(false);
    navigate('/manager/tour-programs?tab=active');
  };

  const handleReject = async (reason: string) => {
    if (token && program) {
      const response = await apiRequest<{ success: boolean; tourProgram: TourProgram }>(`/tour-programs/${program.id}/reject`, {
        method: 'POST',
        token,
        body: JSON.stringify({ reason }),
      });
      upsertTourProgram(response.tourProgram);
    }
    setRejected(reason);
    setApproved(false);
    setShowReject(false);
  };

  const headerActions = approved ? (
    <span className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
      Đã duyệt
    </span>
  ) : rejected ? (
    <span
      className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-200"
      title={`Lý do: ${rejected}`}
    >
      Đã từ chối
    </span>
  ) : (
    <>
      <button
        onClick={() => setShowReject(true)}
        className="flex items-center gap-2 px-4 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">block</span>
        Từ chối
      </button>
      <button
        onClick={() => setShowApprove(true)}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-['Inter'] uppercase tracking-widest font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">check</span>
        Duyệt chương trình tour
      </button>
    </>
  );

  return (
    <>
      <TourProgramWizard initialProgram={program} readOnly headerTitle="Thêm mới chương trình tour" headerActions={headerActions} />
      {showReject && <RejectPopup onConfirm={handleReject} onCancel={() => setShowReject(false)} />}
      {showApprove && <ApproveConfirmPopup tourName={program?.name} onConfirm={handleApprove} onCancel={() => setShowApprove(false)} />}
    </>
  );
}
