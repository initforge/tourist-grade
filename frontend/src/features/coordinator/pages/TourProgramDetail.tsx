import { useMemo, useState } from 'react';
import { Breadcrumb, message } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  loadTourPrograms,
  saveTourPrograms,
  VIETNAM_PROVINCES,
  WEEKDAYS,
  type TourProgram,
} from '@entities/tour-program/data/tourProgram';

type DetailTab = 'general' | 'itinerary' | 'pricing';

type EditableProgram = TourProgram & {
  sightseeingSpotsInput: string;
  selectedDatesInput: string;
};

function formatDateTime(value?: string) {
  if (!value) return '-';
  return new Date(value)?.toLocaleString('vi-VN');
}

function statusLabel(status: TourProgram['status']) {
  if (status === 'active') return 'Đang hoạt động';
  if (status === 'inactive') return 'Ngừng hoạt động';
  return 'Nháp';
}

function statusTone(status: TourProgram['status']) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (status === 'inactive') return 'bg-red-100 text-red-700 border-red-300';
  return 'bg-amber-100 text-amber-700 border-amber-300';
}

function tourTypeLabel(type: TourProgram['tourType']) {
  return type === 'mua_le' ? 'Mùa lễ' : 'Quanh năm';
}

function toEditableProgram(program: TourProgram): EditableProgram {
  return {
    ...program,
    routeDescription: program?.routeDescription ?? '',
    selectedDates: program?.selectedDates ?? [],
    weekdays: program?.weekdays ?? [],
    yearRoundStartDate: program?.yearRoundStartDate ?? '',
    yearRoundEndDate: program?.yearRoundEndDate ?? '',
    coverageMonths: program?.coverageMonths ?? 3,
    inactiveReason: program?.inactiveReason ?? '',
    sightseeingSpotsInput: program?.sightseeingSpots?.join(', '),
    selectedDatesInput: (program?.selectedDates ?? [])?.join(', '),
  };
}

function toPersistedProgram(program: EditableProgram): TourProgram {
  return {
    ...program,
    routeDescription: program?.routeDescription?.trim(),
    sightseeingSpots: program?.sightseeingSpotsInput
      ?.split(',')
      ?.map(item => item?.trim())
      ?.filter(Boolean),
    selectedDates: program?.selectedDatesInput
      ?.split(',')
      ?.map(item => item?.trim())
      ?.filter(Boolean),
  };
}

export default function TourProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<TourProgram[]>(() => loadTourPrograms());
  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const [isEditing, setIsEditing] = useState(false);

  const program = useMemo(
    () => programs?.find(item => item?.id === id),
    [id, programs],
  );

  const [draft, setDraft] = useState<EditableProgram | null>(() => {
    const found = loadTourPrograms()?.find(item => item?.id === id);
    return found ? toEditableProgram(found) : null;
  });

  if (!program || !draft) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <h1 className="font-serif text-2xl text-primary">Không tìm thấy chương trình tour</h1>
          <button
            onClick={() => navigate('/coordinator/tour-programs')}
            className="px-5 py-3 border border-outline-variant/40 text-xs uppercase tracking-widest text-primary"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const isActiveProgram = program?.status === 'active';
  const isYearRound = draft?.tourType === 'quanh_nam';

  const updateDraft = <K extends keyof EditableProgram>(key: K, value: EditableProgram[K]) => {
    setDraft(current => current ? { ...current, [key]: value } : current);
  };

  const updateItinerary = (dayIndex: number, patch: Partial<TourProgram['itinerary'][number]>) => {
    setDraft(current => {
      if (!current) return current;
      return {
        ...current,
        itinerary: current?.itinerary?.map((day, index) => index === dayIndex ? { ...day, ...patch } : day),
      };
    });
  };

  const persistProgram = (nextProgram: TourProgram) => {
    const nextPrograms = programs?.map(item => item?.id === nextProgram?.id ? nextProgram : item);
    saveTourPrograms(nextPrograms);
    setPrograms(nextPrograms);
    setDraft(toEditableProgram(nextProgram));
  };

  const saveChanges = () => {
    const persisted = toPersistedProgram({
      ...draft,
      updatedAt: new Date()?.toISOString(),
    });
    persistProgram(persisted);
    setIsEditing(false);
    message.success('Đã lưu thay đổi chương trình tour');
  };

  const sendForApproval = () => {
    const persisted = toPersistedProgram({
      ...draft,
      status: 'draft',
      updatedAt: new Date()?.toISOString(),
    });
    persistProgram(persisted);
    setIsEditing(false);
    message.success('Đã gửi duyệt chương trình tour');
    navigate('/coordinator/tour-programs', { state: { tab: 'draft' } });
  };

  const resetDraft = () => {
    setDraft(toEditableProgram(program));
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main className="p-10">
        <Breadcrumb className="mb-6 text-xs" items={[
          { title: <Link to="/coordinator/tour-programs" className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Chương trình tour</Link> },
          { title: <span className="text-[var(--color-primary)]/30">Chi tiết chương trình tour</span> },
        ]} />

        <div className="flex justify-between items-start gap-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 mb-2">NV điều phối</p>
            <h1 className="font-serif text-3xl text-primary">{program?.name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border ${statusTone(program?.status)}`}>
                {statusLabel(program?.status)}
              </span>
              <span className="text-sm text-primary/45">Mã: {program?.id}</span>
              <span className="text-sm text-primary/45">Cập nhật: {formatDateTime(program?.updatedAt)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-[#D4AF37] text-white text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
              >
                Chỉnh sửa
              </button>
            ) : (
              <>
                <button
                  onClick={resetDraft}
                  className="px-6 py-3 border border-outline-variant/40 text-xs uppercase tracking-widest text-primary/70 hover:bg-surface transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={saveChanges}
                  className="px-6 py-3 bg-primary text-white text-xs uppercase tracking-widest font-bold hover:bg-[var(--color-secondary)] transition-colors"
                >
                  Lưu thay đổi
                </button>
                {!isActiveProgram && (
                  <button
                    onClick={sendForApproval}
                    className="px-6 py-3 bg-emerald-600 text-white text-xs uppercase tracking-widest font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Gửi duyệt
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-8 mb-8 border-b border-outline-variant/30">
          {([
            { key: 'general' as const, label: 'Thông tin chung' },
            { key: 'itinerary' as const, label: 'Lịch trình' },
            { key: 'pricing' as const, label: 'Giá & cấu hình' },
          ])?.map(tab => (
            <button
              key={tab?.key}
              onClick={() => setActiveTab(tab?.key)}
              className={`pb-4 px-2 text-sm uppercase tracking-widest font-medium transition-colors ${
                activeTab === tab?.key
                  ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]'
                  : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
              }`}
            >
              {tab?.label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <div className="bg-white border border-outline-variant/30 p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Tên chương trình tour</span>
                <input
                  value={draft?.name}
                  onChange={event => updateDraft('name', event?.target?.value)}
                  disabled={!isEditing || isActiveProgram}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Thời hạn đặt</span>
                <input
                  aria-label="Thời hạn đặt"
                  type="number"
                  min={1}
                  value={draft?.bookingDeadline}
                  onChange={event => updateDraft('bookingDeadline', parseInt(event?.target?.value, 10) || 1)}
                  disabled={!isEditing}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Điểm khởi hành</span>
                <select
                  value={draft?.departurePoint}
                  onChange={event => updateDraft('departurePoint', event?.target?.value)}
                  disabled={!isEditing || isActiveProgram}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                >
                  {VIETNAM_PROVINCES?.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Điểm tham quan</span>
                <input
                  value={draft?.sightseeingSpotsInput}
                  onChange={event => updateDraft('sightseeingSpotsInput', event?.target?.value)}
                  disabled={!isEditing || isActiveProgram}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Số ngày</span>
                <input
                  type="number"
                  min={1}
                  value={draft?.duration?.days}
                  onChange={event => updateDraft('duration', { ...draft?.duration, days: parseInt(event?.target?.value, 10) || 1 })}
                  disabled={!isEditing || isActiveProgram}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Số đêm</span>
                <input
                  type="number"
                  min={0}
                  value={draft?.duration?.nights}
                  onChange={event => updateDraft('duration', { ...draft?.duration, nights: parseInt(event?.target?.value, 10) || 0 })}
                  disabled={!isEditing || isActiveProgram}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Loại tour</span>
                <select
                  value={draft?.tourType}
                  onChange={event => updateDraft('tourType', event?.target?.value as TourProgram['tourType'])}
                  disabled={!isEditing || isActiveProgram}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                >
                  <option value="quanh_nam">Quanh năm</option>
                  <option value="mua_le">Mùa lễ</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Mô tả</span>
              <textarea
                aria-label="Mô tả chương trình tour"
                value={draft?.routeDescription}
                onChange={event => updateDraft('routeDescription', event?.target?.value)}
                disabled={!isEditing}
                rows={4}
                className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none resize-none disabled:bg-surface disabled:text-primary/45"
              />
            </label>

            <section className="border border-outline-variant/20 p-6 bg-[var(--color-surface)]/35 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold">Loại tour</p>
                  <h3 className="font-serif text-xl text-primary mt-1">{tourTypeLabel(draft?.tourType)}</h3>
                </div>
              </div>

              {draft?.tourType === 'mua_le' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Dịp lễ</span>
                    <input
                      value={draft?.holiday ?? ''}
                      onChange={event => updateDraft('holiday', event?.target?.value)}
                      disabled={!isEditing || isActiveProgram}
                      className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Ngày khởi hành đã chọn</span>
                    <input
                      value={draft?.selectedDatesInput}
                      onChange={event => updateDraft('selectedDatesInput', event?.target?.value)}
                      disabled={!isEditing || isActiveProgram}
                      className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
                      placeholder="2026-10-15, 2026-10-18"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-5">
                  {!isActiveProgram && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="block">
                        <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Ngày bắt đầu</span>
                        <input
                          aria-label="Ngày bắt đầu"
                          type="date"
                          value={draft?.yearRoundStartDate ?? ''}
                          onChange={event => updateDraft('yearRoundStartDate', event?.target?.value)}
                          disabled={!isEditing}
                          className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Ngày kết thúc</span>
                        <input
                          aria-label="Ngày kết thúc"
                          type="date"
                          value={draft?.yearRoundEndDate ?? ''}
                          onChange={event => updateDraft('yearRoundEndDate', event?.target?.value)}
                          disabled={!isEditing}
                          className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
                        />
                      </label>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Ngày khởi hành trong tuần</p>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS?.map(day => {
                        const selected = draft?.weekdays?.includes(day?.value);
                        return (
                          <button
                            key={day?.value}
                            type="button"
                            onClick={() => {
                              if (!isEditing || isActiveProgram) return;
                              const next = selected
                                ? draft?.weekdays?.filter(item => item !== day?.value)
                                : [...(draft?.weekdays ?? []), day?.value];
                              updateDraft('weekdays', next);
                            }}
                            className={`w-11 h-11 border text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                                : 'border-outline-variant/40 text-primary/70'
                            } ${(!isEditing || isActiveProgram) ? 'cursor-default' : 'hover:border-[var(--color-secondary)]'}`}
                          >
                            {day?.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block max-w-xs">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Độ phủ mở bán tối thiểu</span>
                    <input
                      aria-label="Độ phủ mở bán tối thiểu"
                      type="number"
                      min={1}
                      max={12}
                      value={draft?.coverageMonths ?? 1}
                      onChange={event => updateDraft('coverageMonths', parseInt(event?.target?.value, 10) || 1)}
                      disabled={!isEditing || isActiveProgram}
                      className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
                    />
                  </label>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="space-y-6">
            {draft?.itinerary?.map((day, index) => (
              <section key={day?.day} className="bg-white border border-outline-variant/30 p-8 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold">Ngày {day?.day}</p>
                    <h3 className="font-serif text-2xl text-primary mt-1">{day?.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    {day?.meals?.map(meal => (
                      <span key={meal} className="px-2.5 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-[10px] uppercase tracking-widest font-bold">
                        {meal}
                      </span>
                    ))}
                  </div>
                </div>

                {!isActiveProgram && (
                  <label className="block">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Tiêu đề ngày</span>
                    <input
                      value={day?.title}
                      onChange={event => updateItinerary(index, { title: event?.target?.value })}
                      disabled={!isEditing}
                      className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Mô tả</span>
                  <textarea
                    aria-label={`Mô tả ngày ${day?.day}`}
                    value={day?.description}
                    onChange={event => updateItinerary(index, { description: event?.target?.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none resize-none disabled:bg-surface disabled:text-primary/45"
                  />
                </label>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="bg-white border border-outline-variant/30 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ['Giá bán người lớn', draft?.pricingConfig?.sellPriceAdult, 'sellPriceAdult'],
                ['Giá bán trẻ em', draft?.pricingConfig?.sellPriceChild, 'sellPriceChild'],
                ['Giá bán trẻ sơ sinh', draft?.pricingConfig?.sellPriceInfant, 'sellPriceInfant'],
                ['Số khách tối thiểu', draft?.pricingConfig?.minParticipants, 'minParticipants'],
              ]?.map(([label, value, key]) => (
                <label key={String(key)} className="block">
                  <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">{label}</span>
                  <input
                    type="number"
                    value={Number(value ?? 0)}
                    onChange={event => updateDraft('pricingConfig', {
                      ...draft?.pricingConfig,
                      [key]: parseInt(event?.target?.value, 10) || 0,
                    })}
                    disabled={!isEditing || isActiveProgram}
                    className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                  />
                </label>
              ))}
            </div>
            {isActiveProgram && (
              <p className="mt-4 text-sm text-primary/50">
                Chương trình tour đang hoạt động chỉ cho phép chỉnh sửa Thời hạn đặt, Mô tả ở Thông tin chung và Mô tả ở tab Lịch trình.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
