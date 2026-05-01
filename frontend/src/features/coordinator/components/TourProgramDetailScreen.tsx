import { useMemo, useState } from 'react';
import { Breadcrumb } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TourProgramPricingTables from '@features/coordinator/components/TourProgramPricingTables';
import {
  VIETNAM_PROVINCES,
  WEEKDAYS,
  type TourProgram,
} from '@entities/tour-program/data/tourProgram';
import { useAppDataStore } from '@shared/store/useAppDataStore';

type DetailTab = 'general' | 'itinerary' | 'pricing';
type DetailRole = 'coordinator' | 'manager';

type EditableProgram = TourProgram & {
  sightseeingSpotsInput: string;
  selectedDatesInput: string;
};

function formatDateTime(value?: string) {
  if (!value) return '-';
  return new Date(value)?.toLocaleString('vi-VN');
}

function formatMoney(value: number) {
  return Math.round(value)?.toLocaleString('vi-VN');
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
    priceIncludes: program?.priceIncludes ?? '',
    priceExcludes: program?.priceExcludes ?? '',
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

function ReadonlyPricingSection({ program }: { program: EditableProgram }) {
  const otherCostFactorPercent = program?.pricingConfig?.otherCostFactor > 1
    ? program.pricingConfig.otherCostFactor
    : Math.round(program.pricingConfig.otherCostFactor * 100);
  const expectedGuests = Math.max(1, program?.pricingConfig?.expectedGuests ?? program?.pricingConfig?.maxGuests ?? program?.pricingConfig?.minParticipants ?? 1);
  const maxGuests = Math.max(expectedGuests, program?.pricingConfig?.maxGuests ?? expectedGuests);
  const guideUnitPrice = program?.pricingConfig?.guideUnitPrice ?? 0;
  const estimatedNetPrice = Math.round(
    (program?.pricingConfig?.sellPriceAdult ?? 0)
      / Math.max(1, (1 + (program?.pricingConfig?.profitMargin ?? 0) / 100) * (1 + (program?.pricingConfig?.taxRate ?? 0) / 100) * (1 + (otherCostFactorPercent / 100))),
  );
  const pricingItinerary = useMemo(() => {
    const fallbackPoint = program?.sightseeingSpots?.[0] ?? program?.departurePoint;
    return program.itinerary.map((day, index) => ({
      day: day.day,
      title: day.title,
      meals: day.meals,
      accommodationPoint: index < program.duration.nights ? (program.sightseeingSpots[index] ?? fallbackPoint) : '',
    }));
  }, [program]);
  const pricingDepartureDates = useMemo(() => {
    if (program?.tourType === 'mua_le' && (program?.selectedDates?.length ?? 0) > 0) {
      return program.selectedDates ?? [];
    }
    const previewDates = (program?.draftPreviewRows ?? []).map(row => row.departureDate).filter(Boolean);
    if (previewDates.length > 0) return previewDates;
    return program?.selectedDates ?? [];
  }, [program]);

  return (
    <fieldset disabled className="space-y-8 border-0 p-0 m-0">
      <section className="bg-white border border-outline-variant/30 p-6">
        <h2 className="font-headline text-lg text-primary mb-1 flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary">payments</span>
          Thông tin cấu hình giá tour
        </h2>
        <p className="text-xs text-primary/50 mb-6">Dành cho <strong>{program?.name}</strong> - {program?.duration?.days} ngày {program?.duration?.nights} đêm</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { label: 'Số khách dự kiến', value: expectedGuests, unit: 'khách' },
            { label: 'Số lượng khách tối đa', value: maxGuests, unit: 'khách' },
            { label: 'Tỷ lệ lợi nhuận mong muốn (%)', value: program?.pricingConfig?.profitMargin ?? 0, unit: '%' },
            { label: 'Thuế (%)', value: program?.pricingConfig?.taxRate ?? 0, unit: '%' },
          ].map(item => (
            <div key={item.label}>
              <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">{item.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={item.value}
                  readOnly
                  className="flex-1 border border-outline-variant/50 px-3 py-2.5 text-sm bg-[var(--color-surface)]/60 text-primary/60 outline-none"
                />
                <span className="text-xs text-primary/40 shrink-0">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-outline-variant/30 p-6">
        <h3 className="font-headline text-base text-primary mb-5">Bảng kê chi phí dự kiến</h3>
        <div className="overflow-x-auto pb-3 pointer-events-none">
          <TourProgramPricingTables
            transport={program?.transport}
            departurePoint={program?.departurePoint}
            arrivalPoint={program?.arrivalPoint ?? ''}
            days={program?.duration?.days}
            nights={program?.duration?.nights}
            itinerary={pricingItinerary}
            lodgingStandard={program?.lodgingStandard ?? ''}
            sightseeingSpots={program?.sightseeingSpots}
            departureDates={pricingDepartureDates}
            expectedGuests={expectedGuests}
            taxRate={program?.pricingConfig?.taxRate ?? 0}
            otherCostFactor={otherCostFactorPercent}
            guideUnitPrice={guideUnitPrice}
            onGuideUnitPriceChange={() => undefined}
            value={program?.draftPricingTables}
            hideActionColumn
          />
        </div>
      </section>

      <section className="bg-white border border-[var(--color-secondary)]/50 shadow-sm p-5">
        <h3 className="font-semibold text-sm text-primary mb-3 bg-amber-50 inline-block px-3 py-1">Tính toán dự kiến</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-3">
          {[
            { label: 'Giá bán (Người lớn)', value: program?.pricingConfig?.sellPriceAdult ?? 0 },
            { label: 'Giá trẻ em', value: program?.pricingConfig?.sellPriceChild ?? 0 },
            { label: 'Giá trẻ sơ sinh', value: program?.pricingConfig?.sellPriceInfant ?? 0 },
            { label: 'Phụ phí phòng đơn', value: program.duration.nights > 0 ? Math.round((program?.pricingConfig?.sellPriceAdult ?? 0) * 0.28) : 0 },
            { label: 'Giá net', value: estimatedNetPrice },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 min-w-0">
              <span className="text-sm min-w-[138px]">{item.label}</span>
              <input
                type="text"
                value={formatMoney(item.value)}
                readOnly
                className="w-32 border border-outline-variant/50 px-2 py-1 text-sm text-right bg-[var(--color-surface)]/60 text-primary/60 outline-none"
              />
            </div>
          ))}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm min-w-[138px]">Tỷ lệ lợi nhuận thực tế</span>
            <input
              type="text"
              value={`${program?.pricingConfig?.profitMargin ?? 0}%`}
              readOnly
              className="w-32 border border-outline-variant/50 px-2 py-1 text-sm text-right bg-[var(--color-surface)]/60 text-primary/60 outline-none"
            />
          </div>
        </div>
      </section>
    </fieldset>
  );
}

export default function TourProgramDetailScreen({ role }: { role: DetailRole }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const programs = useAppDataStore(state => state.tourPrograms);
  const protectedReady = useAppDataStore(state => state.protectedReady);
  const protectedLoading = useAppDataStore(state => state.protectedLoading);
  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const isEditing = false;

  const basePath = role === 'manager' ? '/manager/tour-programs' : '/coordinator/tour-programs';
  const roleLabel = role === 'manager' ? 'Quản lý' : 'NV điều phối';
  const canEdit = role === 'coordinator';

  const program = useMemo(
    () => programs?.find(item => item?.id === id),
    [id, programs],
  );

  const [draft, setDraft] = useState<EditableProgram | null>(() => {
    const found = programs?.find(item => item?.id === id);
    return found ? toEditableProgram(found) : null;
  });

  if ((protectedLoading || !protectedReady) && (!program || !draft)) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary/30">progress_activity</span>
          <p className="text-sm text-primary/60">Đang tải dữ liệu chương trình tour...</p>
        </div>
      </div>
    );
  }

  if (!program || !draft) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <h1 className="font-serif text-2xl text-primary">Không tìm thấy chương trình tour</h1>
          <button
            onClick={() => navigate(basePath)}
            className="px-5 py-3 border border-outline-variant/40 text-xs uppercase tracking-widest text-primary"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const isActiveProgram = program?.status === 'active';

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

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main className="p-10">
        <Breadcrumb className="mb-6 text-xs" items={[
          { title: <Link to={basePath} className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Chương trình tour</Link> },
          { title: <span className="text-[var(--color-primary)]/30">Chi tiết chương trình tour</span> },
        ]} />

        <div className="flex justify-between items-start gap-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/40 mb-2">{roleLabel}</p>
            <h1 className="font-serif text-3xl text-primary">{program?.name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border ${statusTone(program?.status)}`}>
                {statusLabel(program?.status)}
              </span>
              <span className="text-sm text-primary/45">Mã: {program?.id}</span>
              <span className="text-sm text-primary/45">Cập nhật: {formatDateTime(program?.updatedAt)}</span>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={() => navigate(`/coordinator/tour-programs/${program?.id}/edit`)}
              className="px-6 py-3 bg-[#D4AF37] text-white text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity"
            >
              Chỉnh sửa
            </button>
          )}
        </div>

        {program?.rejectionReason && (
          <div className="mb-6 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Lý do từ chối: {program.rejectionReason}
          </div>
        )}

        {program?.inactiveReason && (
          <div className="mb-6 border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700">
            Lý do ngừng kinh doanh: {program.inactiveReason}
          </div>
        )}

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
                  disabled={!canEdit || !isEditing || isActiveProgram}
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
                  disabled={!canEdit || !isEditing}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Điểm khởi hành</span>
                <select
                  value={draft?.departurePoint}
                  onChange={event => updateDraft('departurePoint', event?.target?.value)}
                  disabled={!canEdit || !isEditing || isActiveProgram}
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
                  disabled={!canEdit || !isEditing || isActiveProgram}
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
                  disabled={!canEdit || !isEditing || isActiveProgram}
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
                  disabled={!canEdit || !isEditing || isActiveProgram}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Loại tour</span>
                <select
                  value={draft?.tourType}
                  onChange={event => updateDraft('tourType', event?.target?.value as TourProgram['tourType'])}
                  disabled={!canEdit || !isEditing || isActiveProgram}
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
                disabled={!canEdit || !isEditing}
                rows={4}
                className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none resize-none disabled:bg-surface disabled:text-primary/45"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Giá tour bao gồm</span>
                <textarea
                  aria-label="Giá tour bao gồm"
                  value={draft?.priceIncludes ?? ''}
                  onChange={event => updateDraft('priceIncludes', event?.target?.value)}
                  disabled={!canEdit || !isEditing}
                  rows={4}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none resize-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Giá tour không bao gồm</span>
                <textarea
                  aria-label="Giá tour không bao gồm"
                  value={draft?.priceExcludes ?? ''}
                  onChange={event => updateDraft('priceExcludes', event?.target?.value)}
                  disabled={!canEdit || !isEditing}
                  rows={4}
                  className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none resize-none disabled:bg-surface disabled:text-primary/45"
                />
              </label>
            </div>

            <section className="border border-outline-variant/20 p-6 bg-[var(--color-surface)]/35 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary/45 font-bold">Loại tour</p>
                <h3 className="font-serif text-xl text-primary mt-1">{tourTypeLabel(draft?.tourType)}</h3>
              </div>

              {draft?.tourType === 'mua_le' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Dịp lễ</span>
                    <input
                      value={draft?.holiday ?? ''}
                      onChange={event => updateDraft('holiday', event?.target?.value)}
                      disabled={!canEdit || !isEditing || isActiveProgram}
                      className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Ngày khởi hành đã chọn</span>
                    <input
                      value={draft?.selectedDatesInput}
                      onChange={event => updateDraft('selectedDatesInput', event?.target?.value)}
                      disabled={!canEdit || !isEditing || isActiveProgram}
                      className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
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
                          type="date"
                          value={draft?.yearRoundStartDate ?? ''}
                          onChange={event => updateDraft('yearRoundStartDate', event?.target?.value)}
                          disabled={!canEdit || !isEditing}
                          className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none disabled:bg-white disabled:text-primary/45"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Ngày kết thúc</span>
                        <input
                          type="date"
                          value={draft?.yearRoundEndDate ?? ''}
                          onChange={event => updateDraft('yearRoundEndDate', event?.target?.value)}
                          disabled={!canEdit || !isEditing}
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
                              if (!canEdit || !isEditing || isActiveProgram) return;
                              const next = selected
                                ? draft?.weekdays?.filter(item => item !== day?.value)
                                : [...(draft?.weekdays ?? []), day?.value];
                              updateDraft('weekdays', next);
                            }}
                            className={`w-11 h-11 border text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                                : 'border-outline-variant/40 text-primary/70'
                            } ${(!canEdit || !isEditing || isActiveProgram) ? 'cursor-default' : 'hover:border-[var(--color-secondary)]'}`}
                          >
                            {day?.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block max-w-xs">
                    <span className="block text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2">Thời gian mở bán tối thiểu</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={draft?.coverageMonths ?? 1}
                      onChange={event => updateDraft('coverageMonths', parseInt(event?.target?.value, 10) || 1)}
                      disabled={!canEdit || !isEditing || isActiveProgram}
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
                      disabled={!canEdit || !isEditing}
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
                    disabled={!canEdit || !isEditing}
                    rows={4}
                    className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none resize-none disabled:bg-surface disabled:text-primary/45"
                  />
                </label>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'pricing' && <ReadonlyPricingSection program={draft} />}
      </main>
    </div>
  );
}
