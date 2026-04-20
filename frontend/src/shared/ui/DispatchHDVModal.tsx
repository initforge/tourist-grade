import { useState } from 'react';
import { mockTourGuides } from '@entities/tour-program/data/tourProgram';
import type { TourGuide } from '@entities/tour-program/data/tourProgram';

interface DispatchHDVModalProps {
  tourId: string;
  tourName: string;
  onClose: () => void;
  onConfirm: (hdv: TourGuide) => void;
}

export function DispatchHDVModal({ tourId, tourName, onClose, onConfirm }: DispatchHDVModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = mockTourGuides?.find((h: TourGuide) => h.id === selectedId);
  const getTourSpecificCount = (hdv: TourGuide) => Math.max(0, hdv?.tourGuidedCount % 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-hdv-title"
        className="relative w-full max-w-lg bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[80vh]"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 id="dispatch-hdv-title" className="font-serif text-2xl text-primary">Phân công HDV</h3>
            <button onClick={onClose} className="text-primary/40 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="bg-[var(--color-surface)] p-3 mb-6">
            <p className="text-sm font-medium text-primary">{tourName}</p>
            <p className="text-xs text-primary/50 font-mono mt-0.5">{tourId}</p>
          </div>

          <p className="text-sm font-medium text-primary mb-4">Chọn hướng dẫn viên</p>

          <div className="space-y-3 mb-6">
            {mockTourGuides?.map((hdv: TourGuide) => (
              <button
                type="button"
                key={hdv?.id}
                onClick={() => setSelectedId(hdv?.id)}
                className={`w-full text-left flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                  selectedId === hdv?.id
                    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                    : 'border-outline-variant/30 hover:border-[var(--color-secondary)]/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl text-[var(--color-secondary)]">
                    {hdv?.languages?.length > 1 ? 'translate' : 'person'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">{hdv?.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-primary/55">
                    <span>SĐT: <strong className="text-primary">{hdv?.phone}</strong></span>
                    <span>Số lần đã dẫn tour này: <strong className="text-primary">{getTourSpecificCount(hdv)}</strong></span>
                  </div>
                </div>
                {selectedId === hdv?.id && (
                  <span className="material-symbols-outlined text-xl text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors">
              Hủy
            </button>
            <button
              onClick={() => { if (selected) { onConfirm(selected); onClose(); } }}
              disabled={!selectedId}
              className={`flex-1 py-3 font-sans uppercase tracking-wider text-xs transition-colors ${
                selectedId
                  ? 'bg-primary text-white hover:bg-[var(--color-secondary)]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Xác nhận điều phối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

