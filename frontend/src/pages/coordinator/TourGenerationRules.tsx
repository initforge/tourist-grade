import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTourPrograms, mockTourInstances, type TourInstance } from '../../data/tourProgram';

type SubTab = 'quy_tac' | 'cho_duyet_ban';

export default function TourGenerationRules() {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<SubTab>('quy_tac');
  const [generateModal, setGenerateModal] = useState<{ programId: string; programName: string; type: 'mua_le' | 'quanh_nam' } | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [viewModal, setViewModal] = useState<TourInstance | null>(null);

  // Programs đang hoạt động
  const activePrograms = mockTourPrograms.filter(p => p.status === 'active');

  // Instances đang chờ duyệt bán
  const pendingApprovalInstances = mockTourInstances.filter(i => i.status === 'cho_duyet_ban');

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

  const getProgram = (programId: string) => mockTourPrograms.find(p => p.id === programId);

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

        {/* 2 Sub-tabs */}
        <div className="flex gap-0 mb-0 border-b border-outline-variant/30 bg-white rounded-t-sm overflow-hidden">
          <button
            onClick={() => setSubTab('quy_tac')}
            className={`px-6 py-3 text-[11px] font-medium border-b-2 transition-colors ${
              subTab === 'quy_tac'
                ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                : 'border-transparent text-primary/40 hover:text-primary/70'
            }`}
          >
            Quy tắc tạo tour
          </button>
          <button
            onClick={() => setSubTab('cho_duyet_ban')}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-medium border-b-2 transition-colors ${
              subTab === 'cho_duyet_ban'
                ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                : 'border-transparent text-primary/40 hover:text-primary/70'
            }`}
          >
            Chờ duyệt bán
            {pendingApprovalInstances.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-mono">
                {pendingApprovalInstances.length}
              </span>
            )}
          </button>
        </div>

        {/* SUB-TAB: Quy tắc tạo tour */}
        {subTab === 'quy_tac' && (
          <div className="bg-white border-x border-b border-outline-variant/30 p-8">
            <div className="space-y-6">
              {activePrograms.length === 0 ? (
                <div className="py-20 text-center">
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
                      className={`border shadow-sm overflow-hidden ${
                        warning ? 'border-l-4 border-l-red-400' : 'border-outline-variant/30'
                      }`}
                    >
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
          </div>
        )}

        {/* SUB-TAB: Chờ duyệt bán */}
        {subTab === 'cho_duyet_ban' && (
          <div className="bg-white border-x border-b border-outline-variant/30 overflow-hidden">
            {pendingApprovalInstances.length === 0 ? (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-primary/10 block mb-3">inbox</span>
                <p className="text-sm text-primary/40">Không có tour nào chờ duyệt bán</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                      {['Mã yêu cầu', 'Tên chương trình', 'Loại tour', 'Ngày KH gần nhất', 'Số tour yêu cầu', 'Ngày tạo', ''].map(h => (
                        <th key={h} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-5 py-3.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovalInstances.map((inst, rowIdx) => (
                      <tr key={inst.id}
                        className={`border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low transition-colors ${
                          rowIdx % 2 === 0 ? 'bg-white' : 'bg-[var(--color-surface)]/30'
                        }`}
                      >
                        <td className="px-5 py-4 font-mono text-xs">{inst.id}</td>
                        <td className="px-5 py-4 text-sm font-medium">{inst.programName}</td>
                        <td className="px-5 py-4 text-xs text-primary/60">
                          <span className="text-[10px] px-2 py-0.5 font-label uppercase tracking-wider bg-blue-50 text-blue-600">
                            Quanh năm
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm">{new Date(inst.departureDate).toLocaleDateString('vi-VN')}</td>
                        <td className="px-5 py-4 text-sm">1 tour</td>
                        <td className="px-5 py-4 text-sm">{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setViewModal(inst)}
                              className="px-3 py-1.5 border border-outline-variant/50 text-primary/60 text-[10px] uppercase tracking-wider hover:bg-surface transition-colors"
                            >
                              Xem
                            </button>
                            <button className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors">
                              Sửa
                            </button>
                            <button className="px-3 py-1.5 border border-red-300 text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-colors">
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* View Modal — popup chi tiết tour như hình screenshot */}
        {viewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setViewModal(null)} />
            <div className="relative w-full max-w-3xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between z-10">
                <div>
                  <h3 className="font-serif text-xl text-primary">Chi tiết tour</h3>
                  <p className="text-xs text-primary/50 mt-0.5">Mã yêu cầu: <span className="font-mono">{viewModal.id}</span></p>
                </div>
                <button onClick={() => setViewModal(null)} className="text-primary/40 hover:text-primary">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(() => {
                    const program = getProgram(viewModal.programId);
                    return [
                      { label: 'Tên chương trình', value: viewModal.programName },
                      { label: 'Loại tour', value: program?.tourType === 'mua_le' ? 'Mùa lễ' : 'Quanh năm' },
                      { label: 'Điểm khởi hành', value: viewModal.departurePoint },
                      { label: 'Điểm tham quan', value: viewModal.sightseeingSpots.join(', ') },
                      { label: 'Thời lượng tour', value: program ? `${program.duration.days} ngày ${program.duration.nights} đêm` : '—' },
                    ].map(item => (
                      <div key={item.label} className="bg-[var(--color-surface)] p-3">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-1">{item.label}</p>
                        <p className="text-sm font-medium text-primary">{item.value}</p>
                      </div>
                    ));
                  })()}
                </div>

                {/* Instances table */}
                <div>
                  <p className="text-sm font-medium text-primary mb-3">Danh sách ngày khởi hành</p>
                  <div className="overflow-x-auto border border-outline-variant/30">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                          {['Mã tour', 'Ngày khởi hành', 'Loại ngày', 'Số khách dự kiến', 'Giá vốn/NL', 'Lợi nhuận', 'Giá bán', 'Hạn đặt tour'].map(h => (
                            <th key={h} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map(idx => (
                          <tr key={idx} className="border-b border-outline-variant/20">
                            <td className="px-4 py-3 font-mono text-xs">{viewModal.id}</td>
                            <td className="px-4 py-3 text-sm">{new Date(viewModal.departureDate).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className="text-[10px] px-2 py-0.5 bg-[var(--color-surface)] font-label">{idx === 1 ? 'Ngày thường' : idx === 2 ? 'Giỗ tổ' : 'Ngày thường'}</span>
                            </td>
                            <td className="px-4 py-3 text-sm">{viewModal.expectedGuests}</td>
                            <td className="px-4 py-3 text-sm font-mono">—</td>
                            <td className="px-4 py-3 text-sm text-emerald-600">—</td>
                            <td className="px-4 py-3 text-sm font-mono">{viewModal.priceAdult.toLocaleString('vi-VN')}đ</td>
                            <td className="px-4 py-3 text-sm">{new Date(viewModal.bookingDeadline).toLocaleDateString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={() => setViewModal(null)}
                    className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors">
                    Đóng
                  </button>
                  <button className="flex-1 py-3 bg-blue-600 text-white font-sans uppercase tracking-wider text-xs font-bold hover:bg-blue-700 transition-colors">
                    Sửa
                  </button>
                  <button className="flex-1 py-3 border border-red-300 text-red-500 font-sans uppercase tracking-wider text-xs font-bold hover:bg-red-50 transition-colors">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Modal */}
        {generateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setGenerateModal(null)} />
            <div className="relative w-full max-w-2xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-outline-variant/30 px-8 py-5 flex items-center justify-between z-10">
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
                          setSubTab('cho_duyet_ban');
                        }}
                        className="flex-1 py-3 bg-emerald-600 text-white font-sans uppercase tracking-wider text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Gửi duyệt tour
                      </button>
                    </div>
                  </>
                ) : (
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
                          setSubTab('cho_duyet_ban');
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
