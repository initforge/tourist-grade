import { useMemo, useState } from 'react';
import type { TourGuide } from '@entities/tour-program/data/tourProgram';
import { useAppDataStore } from '@shared/store/useAppDataStore';

interface DispatchHDVModalProps {
  tourId: string;
  tourName: string;
  onClose: () => void;
  onConfirm: (hdv: TourGuide) => void;
  requiredLanguages?: string[];
  excludedGuideId?: string;
  title?: string;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function DispatchHDVModal({
  tourId,
  tourName,
  onClose,
  onConfirm,
  requiredLanguages = [],
  excludedGuideId,
  title = 'Phân công HDV',
}: DispatchHDVModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const guides = useAppDataStore((state) => state.guides);

  const filteredGuides = useMemo(() => {
    const normalizedRequired = requiredLanguages.map(normalize);
    const keyword = normalize(searchQuery);

    return guides
      .filter((guide: TourGuide) => guide.id !== excludedGuideId)
      .filter((guide: TourGuide) => (
        normalizedRequired.length === 0
          ? true
          : normalizedRequired.every((language) => guide.languages.some((item) => normalize(item) === language))
      ))
      .filter((guide: TourGuide) => (
        !keyword
          || [
            guide.id,
            guide.name,
            guide.phone,
            guide.languages.join(' '),
          ].join(' ').toLowerCase().includes(keyword)
      ));
  }, [excludedGuideId, guides, requiredLanguages, searchQuery]);

  const selected = filteredGuides.find((guide: TourGuide) => guide.id === selectedId);
  const getTourSpecificCount = (guide: TourGuide) => Math.max(0, (guide.tourGuidedCount ?? 0) % 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-hdv-title"
        className="relative w-full max-w-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[80vh]"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 id="dispatch-hdv-title" className="font-serif text-2xl text-primary">{title}</h3>
            <button onClick={onClose} className="text-primary/40 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="bg-[var(--color-surface)] p-3 mb-6">
            <p className="text-sm font-medium text-primary">{tourName}</p>
            <p className="text-xs text-primary/50 font-mono mt-0.5">{tourId}</p>
            {requiredLanguages.length > 0 && (
              <p className="mt-2 text-xs text-primary/60">
                Yêu cầu ngoại ngữ: <strong className="text-primary">{requiredLanguages.join(', ')}</strong>
              </p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-primary mb-2">Tìm hướng dẫn viên</label>
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên, mã, số điện thoại, ngoại ngữ"
              className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none focus:border-[var(--color-secondary)]"
            />
          </div>

          <p className="text-sm font-medium text-primary mb-4">Danh sách phù hợp</p>

          <div className="space-y-3 mb-6">
            {filteredGuides.length === 0 ? (
              <div className="border border-outline-variant/30 bg-surface px-5 py-8 text-center text-sm text-primary/50">
                Không có hướng dẫn viên phù hợp với bộ lọc hiện tại.
              </div>
            ) : filteredGuides.map((guide: TourGuide) => (
              <button
                type="button"
                key={guide.id}
                onClick={() => setSelectedId(guide.id)}
                className={`w-full text-left flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                  selectedId === guide.id
                    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                    : 'border-outline-variant/30 hover:border-[var(--color-secondary)]/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl text-[var(--color-secondary)]">
                    {guide.languages.length > 1 ? 'translate' : 'person'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">{guide.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-primary/55">
                    <span>SĐT: <strong className="text-primary">{guide.phone}</strong></span>
                    <span>Số lần đã dẫn tour này: <strong className="text-primary">{getTourSpecificCount(guide)}</strong></span>
                    <span>Ngoại ngữ: <strong className="text-primary">{guide.languages.join(', ') || '-'}</strong></span>
                    <span>Kinh nghiệm: <strong className="text-primary">{guide.experienceYears} năm</strong></span>
                  </div>
                </div>
                {selectedId === guide.id && (
                  <span className="material-symbols-outlined text-xl text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                if (selected) {
                  onConfirm(selected);
                  onClose();
                }
              }}
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
