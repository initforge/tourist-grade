import React, { useState } from 'react';
import { mockTourGuides } from '../data/tourProgram';
import type { TourGuide } from '../data/tourProgram';

interface DispatchHDVModalProps {
  tourId: string;
  tourName: string;
  onClose: () => void;
  onConfirm: (hdv: TourGuide) => void;
}

export function DispatchHDVModal({ tourId, tourName, onClose, onConfirm }: DispatchHDVModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = mockTourGuides.find((h: TourGuide) => h.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[80vh]">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-2xl text-primary">Điều phối hướng dẫn viên</h3>
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
            {mockTourGuides.map((hdv: TourGuide) => (
              <div
                key={hdv.id}
                onClick={() => setSelectedId(hdv.id)}
                className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                  selectedId === hdv.id
                    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                    : 'border-outline-variant/30 hover:border-[var(--color-secondary)]/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl text-[var(--color-secondary)]">
                    {hdv.languages.length > 1 ? 'translate' : 'person'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">{hdv.name}</p>
                  <p className="text-xs text-primary/50 mt-0.5">{hdv.phone}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] bg-[var(--color-surface)] px-2 py-0.5 text-primary/50">
                      {hdv.tourGuidedCount} lần dẫn tour
                    </span>
                    <span className="text-[10px] bg-[var(--color-surface)] px-2 py-0.5 text-primary/50">
                      {hdv.experienceYears} năm KN
                    </span>
                    {hdv.languages.map((l: string) => (
                      <span key={l} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5">{l}</span>
                    ))}
                  </div>
                </div>
                {selectedId === hdv.id && (
                  <span className="material-symbols-outlined text-xl text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </div>
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
