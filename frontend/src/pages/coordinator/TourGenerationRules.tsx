import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTourPrograms, mockTourInstances } from '../../data/tourProgram';

export default function TourGenerationRules() {
  const navigate = useNavigate();
  const [generateModal, setGenerateModal] = useState<{ programId: string; programName: string; type: 'mua_le' | 'quanh_nam' } | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Programs đang hoạt động
  const activePrograms = mockTourPrograms.filter(p => p.status === 'active');

  // Instances đang mở bán
  const openInstances = mockTourInstances.filter(i => i.status === 'dang_mo_ban');

  // Tính ngày khởi hành xa nhất
  const getFarthestDate = (programId: string) => {
    const instances = mockTourInstances.filter(i => i.programId === programId && i.status === 'dang_mo_ban');
    if (instances.length === 0) return null;
    return instances.reduce((max, i) =>
      new Date(i.departureDate) > new Date(max.departureDate) ? i : max
    ).departureDate;
  };

  const getNearestDate = (programId: string) => {
    const instances = mockTourInstances.filter(i => i.programId === programId && i.status === 'dang_mo_ban');
    if (instances.length === 0) return null;
    return instances.reduce((min, i) =>
      new Date(i.departureDate) < new Date(min.departureDate) ? i : min
    ).departureDate;
  };

  const today = new Date();

  const getWarningDays = (programId: string) => {
    const farthest = getFarthestDate(programId);
    if (!farthest) return null;
    const diff = Math.ceil((new Date(farthest).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 7) return { label: 'Cảnh báo', color: 'text-red-600', bg: 'bg-red-50' };
    if (diff <= 14) return { label: 'Sắp hết hạn', color: 'text-amber-600', bg: 'bg-amber-50' };
    return null;
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-32">
      <main className="p-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 block mb-1">Khu vực điều phối</span>
          <h1 className="font-serif text-3xl text-primary">Quy tắc tạo tour</h1>
          <p className="text-sm text-primary/50 mt-2">
            Sinh tour từ chương trình đang hoạt động. Mùa lễ chỉ xuất hiện khi vừa được duyệt, Quanh năm luôn hiển thị.
          </p>
        </div>

        {/* Programs */}
        <div className="space-y-6">
          {activePrograms.length === 0 ? (
            <div className="bg-white border border-outline-variant/30 py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-primary/10 block mb-3">travel_explore</span>
              <p className="text-primary/40">Không có chương trình nào đang hoạt động</p>
            </div>
          ) : (
            activePrograms.map(program => {
              const farthestDate = getFarthestDate(program.id);
              const nearestDate = getNearestDate(program.id);
              const warning = getWarningDays(program.id);
              const isMuaLe = program.tourType === 'mua_le';

              return (
                <div key={program.id}
                  className={`bg-white border shadow-sm overflow-hidden ${
                    warning ? 'border-l-4 border-l-red-400' : 'border-outline-variant/30'
                  }`}
                >
                  {/* Program header */}
                  <div className="p-6 flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {warning && (
                          <span className={`${warning.bg} ${warning.color} text-[10px] px-2 py-1 font-bold uppercase tracking-wider`}>
                            ⚠ {warning.label}
                          </span>
                        )}
                        <span className="text-xs text-primary/40 font-mono">{program.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 font-label uppercase tracking-wider ${
                          isMuaLe ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {isMuaLe ? 'Mùa lễ' : 'Quanh năm'}
                        </span>
                      </div>
                      <h3 className="font-headline text-xl text-primary mb-2">{program.name}</h3>
                      <div className="flex flex-wrap gap-4 text-xs text-primary/50">
                        <span>{program.departurePoint} → {program.sightseeingSpots.join(', ')}</span>
                        <span>·</span>
                        <span>{program.duration.days}N{program.duration.nights}Đ</span>
                        <span>·</span>
                        <span>Phương tiện: {program.transport === 'xe' ? 'Xe' : 'Máy bay'}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      {nearestDate && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-primary/40">Gần nhất</p>
                          <p className="text-sm font-medium">{new Date(nearestDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                      )}
                      {farthestDate && nearestDate && farthestDate !== nearestDate && (
                        <>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-primary/40">Xa nhất</p>
                            <p className="text-sm font-medium">{new Date(farthestDate).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-primary/40">Độ bao phủ</p>
                            <p className="text-sm font-medium">
                              {Math.ceil((new Date(farthestDate).getTime() - new Date(nearestDate).getTime()) / (1000 * 60 * 60 * 24))} ngày
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="border-t border-outline-variant/30 px-6 py-4 bg-[var(--color-surface)]">
                    <button
                      onClick={() => setGenerateModal({
                        programId: program.id,
                        programName: program.name,
                        type: isMuaLe ? 'mua_le' : 'quanh_nam',
                      })}
                      className="px-6 py-2.5 bg-primary text-white font-sans uppercase tracking-wider text-[11px] font-bold hover:bg-[var(--color-secondary)] transition-colors"
                    >
                      Tạo tour
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Generate Modal */}
        {generateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setGenerateModal(null)} />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl text-primary">Sinh tour</h3>
                  <p className="text-xs text-primary/50 mt-0.5">{generateModal.programName}</p>
                </div>
                <button onClick={() => setGenerateModal(null)} className="text-primary/40 hover:text-primary">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                {generateModal.type === 'mua_le' ? (
                  // Mùa lễ: popup đơn giản
                  <>
                    <div className="bg-[var(--color-surface)] p-4 space-y-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Giá bán người lớn (đ)</label>
                        <input type="number" defaultValue={0} className="w-full border border-outline-variant/50 px-4 py-2.5 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Hạn đặt tour (ngày trước KH)</label>
                        <input type="number" defaultValue={7} className="w-full border border-outline-variant/50 px-4 py-2.5 text-sm outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setGenerateModal(null)}
                        className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors">
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          setGenerateModal(null);
                          navigate('/coordinator/tour-programs');
                        }}
                        className="flex-1 py-3 bg-emerald-600 text-white font-sans uppercase tracking-wider text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Gửi duyệt tour
                      </button>
                    </div>
                  </>
                ) : (
                  // Quanh năm: preview nhiều ngày
                  <>
                    <div className="bg-[var(--color-surface)] p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Hạn đặt tour (ngày)</label>
                          <input type="number" defaultValue={7} className="w-full border border-outline-variant/50 px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Giá bán NL (đ)</label>
                          <input type="number" defaultValue={0} className="w-full border border-outline-variant/50 px-4 py-2.5 text-sm outline-none" />
                        </div>
                      </div>
                    </div>

                    {/* Preview departure dates */}
                    <div>
                      <p className="text-sm font-medium text-primary mb-3">Chọn ngày khởi hành</p>
                      <div className="space-y-2">
                        {[7, 14, 21, 28].map(offset => {
                          const date = new Date(today.getTime() + offset * 86400000);
                          const dateStr = date.toISOString().split('T')[0];
                          const selected = selectedDates.includes(dateStr);
                          return (
                            <div key={offset}
                              className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                                selected
                                  ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                                  : 'border-outline-variant/30 hover:border-[var(--color-secondary)]/50'
                              }`}
                              onClick={() => setSelectedDates(prev =>
                                prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
                              )}
                            >
                              <input type="checkbox" checked={selected}
                                onChange={() => {}}
                                className="accent-[var(--color-secondary)] w-4 h-4" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-right text-xs text-primary/50">
                                Còn {20 - offset} chỗ
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {selectedDates.length > 0 && (
                        <p className="text-xs text-primary/40 mt-2">{selectedDates.length} ngày được chọn</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setGenerateModal(null)}
                        className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors">
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          setGenerateModal(null);
                          navigate('/coordinator/tour-programs');
                        }}
                        disabled={selectedDates.length === 0}
                        className={`flex-1 py-3 font-sans uppercase tracking-wider text-xs font-bold transition-colors ${
                          selectedDates.length > 0
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Gửi duyệt ({selectedDates.length} tour)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
