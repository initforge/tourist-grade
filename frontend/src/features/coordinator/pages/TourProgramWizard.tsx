import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VIETNAM_PROVINCES,
  PROVINCES_WITH_AIRPORT,
  WEEKDAYS,
  MEAL_LABELS,
  mockHolidays,
  type ProgramItineraryDay,
} from '@entities/tour-program/data/tourProgram';

type Transport = 'xe' | 'maybay';
type TourType = 'mua_le' | 'quanh_nam';
type DayMeals = ('breakfast' | 'lunch' | 'dinner')[];

interface DayForm {
  day: number;
  title: string;
  meals: DayMeals;
  description: string;
}

interface FormState {
  name: string;
  days: number;
  nights: number;
  departurePoint: string;
  sightseeingSpots: string[];
  routeDescription: string;
  bookingDeadline: number;
  transport: Transport;
  arrivalPoint: string;
  tourType: TourType;
  holiday: string;
  selectedDates: string[]; // Mùa lễ: selected departure dates
  weekdays: string[]; // Quanh năm: selected weekdays
  coverageMonths: number; // Quanh năm: độ phủ mở bán tối thiểu (thàng)
  itinerary: DayForm[];
}

const initialItinerary = (days: number): DayForm[] =>
  Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    title: '',
    meals: [] as DayMeals,
    description: '',
  }));

function toDateKey(date: Date) {
  const year = date?.getFullYear();
  const month = String(date?.getMonth() + 1)?.padStart(2, '0');
  const day = String(date?.getDate())?.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date?.getFullYear(), date?.getMonth(), 1);
}

function addMonths(date: Date, offset: number) {
  return new Date(date?.getFullYear(), date?.getMonth() + offset, 1);
}

export default function AdminTourProgramWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({
    name: '',
    days: 3,
    nights: 2,
    departurePoint: '',
    sightseeingSpots: [],
    routeDescription: '',
    bookingDeadline: 7,
    transport: 'xe',
    arrivalPoint: '',
    tourType: 'quanh_nam',
    holiday: '',
    selectedDates: [],
    weekdays: [],
    coverageMonths: 3,
    itinerary: initialItinerary(3),
  });
  const [savedPrograms, setSavedPrograms] = useState<string[]>([]);
  const [holidayMonthAnchor, setHolidayMonthAnchor] = useState(() => {
    const today = new Date();
    return toDateKey(startOfMonth(today));
  });

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      // Auto-sync itinerary days when duration changes
      if (key === 'days' && typeof value === 'number') {
        next.itinerary = initialItinerary(value);
      }
      return next;
    });
  };

  const updateDay = (idx: number, patch: Partial<DayForm>) => {
    setForm(prev => ({
      ...prev,
      itinerary: prev?.itinerary?.map((d, i) => i === idx ? { ...d, ...patch } : d),
    }));
  };

  const toggleMeal = (idx: number, meal: DayForm['meals'][0]) => {
    setForm(prev => ({
      ...prev,
      itinerary: prev?.itinerary?.map((d, i) => {
        if (i !== idx) return d;
        const meals = d?.meals?.includes(meal)
          ? d?.meals?.filter(m => m !== meal)
          : [...d?.meals, meal];
        return { ...d, meals };
      }),
    }));
  };

  const handleSaveDraft = () => {
    setSavedPrograms(prev => [...prev, form?.name]);
    navigate('/coordinator/tour-programs');
  };

  const handleSubmitForApproval = () => {
    navigate('/coordinator/tour-programs');
  };

  const weekDayLabels: Record<string, string> = {
    t2: 'T2', t3: 'T3', t4: 'T4', t5: 'T5', t6: 'T6', t7: 'T7', cn: 'CN',
  };
  const selectedHoliday = mockHolidays?.find(holiday => holiday.name === form?.holiday);
  useEffect(() => {
    if (selectedHoliday) {
      setHolidayMonthAnchor(toDateKey(startOfMonth(new Date(selectedHoliday?.date))));
    }
  }, [selectedHoliday?.id, selectedHoliday?.date]);

  const displayMonth = startOfMonth(new Date(holidayMonthAnchor));
  const holidayStart = selectedHoliday ? new Date(selectedHoliday?.date) : null;
  const holidayDateKeys = holidayStart
    ? Array.from({ length: selectedHoliday?.durationDays ?? 0 }, (_, index) => {
        const nextDate = new Date(holidayStart);
        nextDate?.setDate(nextDate?.getDate() + index);
        return toDateKey(nextDate);
      })
    : [];
  const holidayDateKeySet = new Set(holidayDateKeys);
  const firstDayOffset = (displayMonth?.getDay() + 6) % 7;
  const daysInMonth = new Date(displayMonth?.getFullYear(), displayMonth?.getMonth() + 1, 0)?.getDate();
  const holidayCalendarCells = [
    ...Array.from({ length: firstDayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(displayMonth?.getFullYear(), displayMonth?.getMonth(), index + 1)),
  ];
  const sortedSelectedDepartureDates = [...form?.selectedDates]?.sort((left, right) => new Date(left)?.getTime() - new Date(right)?.getTime());

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-40">
      <main className="pt-6 px-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-primary">Thêm mới chương trình tour</h1>
            <p className="text-xs text-primary/50 mt-1">Bước {step} / 3 — {
              step === 1 ? 'Thông tin chung' :
              step === 2 ? 'Lịch trình' :
              'Giá và cấu hình'
            }</p>
          </div>
          {/* Top action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2.5 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-[11px] hover:bg-surface transition-colors"
            >
              Lưu nháp
            </button>
            <button
              onClick={handleSubmitForApproval}
              className="px-6 py-2.5 bg-emerald-600 text-white font-sans uppercase tracking-wider text-[11px] hover:bg-emerald-700 transition-colors"
            >
              Gửi phê duyệt
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 relative mb-10">
          <div className="absolute top-4 left-0 w-full h-[2px] bg-outline-variant/30 -z-10" />
          {[1, 2, 3]?.map(s => (
            <div key={s} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-9 h-9 flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step >= s
                  ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/10'
                  : 'border-outline-variant/40 text-primary/30'
              }`}>
                {s}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-label ${
                step >= s ? 'text-[var(--color-secondary)]' : 'text-primary/30'
              }`}>
                {s === 1 ? 'Thông tin chung' : s === 2 ? 'Lịch trình' : 'Giá & Cấu hình'}
              </span>
            </div>
          ))}
        </div>

        {/* ===================== STEP 1 ===================== */}
        {step === 1 && (
          <div className="space-y-10">
            {/* Duration */}
            <section className="bg-white border border-outline-variant/30 p-8">
              <h2 className="font-headline text-lg text-primary mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                Thời lượng tour
              </h2>
              <div className="grid grid-cols-2 gap-8 max-w-sm">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                    Số ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form?.days}
                    onChange={e => updateForm('days', parseInt(e?.target?.value) || 1)}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                    Số đêm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={29}
                    value={form?.nights}
                    onChange={e => updateForm('nights', parseInt(e?.target?.value) || 0)}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                  />
                </div>
              </div>
              {form?.days - form?.nights !== 0 && form?.days - form?.nights !== 1 && (
                <p className="text-xs text-red-500 mt-3">
                  ⚠ Số ngày chỉ được chênh số đêm 0 hoặc 1 ngày
                </p>
              )}
            </section>

            {/* Route */}
            <section className="bg-white border border-outline-variant/30 p-8">
              <h2 className="font-headline text-lg text-primary mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">route</span>
                Lộ trình
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                    Tên chương trình tour <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form?.name}
                    onChange={e => updateForm('name', e?.target?.value)}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                    placeholder="VD: Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                      Điểm khởi hành <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form?.departurePoint}
                      onChange={e => updateForm('departurePoint', e?.target?.value)}
                      className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                    >
                      <option value="">— Chọn tỉnh/thành —</option>
                      {VIETNAM_PROVINCES?.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                      Điểm tham quan <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-outline-variant/50 p-3 min-h-[48px]">
                      <div className="flex flex-wrap gap-1">
                        {form?.sightseeingSpots?.map(spot => (
                          <span key={spot} className="inline-flex items-center gap-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-xs px-2 py-1">
                            {spot}
                            <button onClick={() => updateForm('sightseeingSpots', form?.sightseeingSpots?.filter(s => s !== spot))}
                              className="hover:text-red-500">×</button>
                          </span>
                        ))}
                        <select
                          value=""
                          onChange={e => {
                            if (e?.target?.value && !form?.sightseeingSpots?.includes(e?.target?.value)) {
                              updateForm('sightseeingSpots', [...form?.sightseeingSpots, e?.target?.value]);
                            }
                          }}
                          className="text-xs border-none outline-none bg-transparent text-primary/40 min-w-[80px]"
                        >
                          <option value="">+ Thêm</option>
                          {VIETNAM_PROVINCES?.filter(p => !form?.sightseeingSpots?.includes(p))?.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                    Thời hạn đặt tour <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={form?.bookingDeadline}
                      onChange={e => updateForm('bookingDeadline', parseInt(e?.target?.value) || 1)}
                      className="w-24 border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                    />
                    <span className="text-sm text-primary/60">ngày trước ngày khởi hành</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                    Mô tả
                  </label>
                  <textarea
                    aria-label="Mô tả"
                    value={form?.routeDescription}
                    onChange={e => updateForm('routeDescription', e?.target?.value)}
                    rows={4}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none resize-none"
                    placeholder="Mô tả ngắn về lưu ? hành trình, điểm nhấn của tour và phạm vi khởi hành?."
                  />
                </div>
              </div>
            </section>

            {/* Transport */}
            <section className="bg-white border border-outline-variant/30 p-8">
              <h2 className="font-headline text-lg text-primary mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">commute</span>
                Phương tiện
              </h2>
              <div className="flex gap-4 mb-5">
                {(['xe', 'maybay'] as Transport[])?.map(t => (
                  <label key={t} className={`flex items-center gap-3 px-6 py-3 border cursor-pointer transition-colors ${
                    form.transport === t
                      ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                      : 'border-outline-variant/50 hover:border-outline-variant'
                  }`}>
                    <input type="radio" name="transport" checked={form.transport === t}
                      onChange={() => updateForm('transport', t)}
                      className="accent-[var(--color-secondary)]" />
                    <span className="text-sm font-medium">
                      {t === 'xe' ? 'Xe du lịch' : 'Máy bay'}
                    </span>
                    <span className="material-symbols-outlined text-xl text-primary/20 ml-2">
                      {t === 'xe' ? 'directions_bus' : 'flight'}
                    </span>
                  </label>
                ))}
              </div>
              {form.transport === 'maybay' && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                    Điểm đến (tỉnh có sân bay) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form?.arrivalPoint}
                    onChange={e => updateForm('arrivalPoint', e?.target?.value)}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none max-w-sm"
                  >
                    <option value="">? Chọn điểm đến —</option>
                    {PROVINCES_WITH_AIRPORT?.filter(p => p !== form?.departurePoint)?.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            {/* Tour type */}
            <section className="bg-white border border-outline-variant/30 p-8">
              <h2 className="font-headline text-lg text-primary mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">category</span>
                Loại tour
              </h2>
              <div className="flex gap-4 mb-5">
                {([
                  { key: 'quanh_nam', label: 'Quanh năm' },
                  { key: 'mua_le', label: 'Mùa lễ' },
                ] as { key: TourType; label: string }[])?.map(t => (
                  <label key={t?.key} className={`flex items-center gap-3 px-6 py-3 border cursor-pointer transition-colors ${
                    form.tourType === t?.key
                      ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5'
                      : 'border-outline-variant/50 hover:border-outline-variant'
                  }`}>
                    <input type="radio" name="tourType" checked={form.tourType === t?.key}
                      onChange={() => updateForm('tourType', t?.key)}
                      className="accent-[var(--color-secondary)]" />
                    <span className="text-sm font-medium">{t?.label}</span>
                  </label>
                ))}
              </div>

              {/* Mùa lễ fields */}
              {form.tourType === 'mua_le' && (
                <div className="space-y-5 border-t border-outline-variant/30 pt-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                      Dịp lễ <span className="text-red-500">*</span>
                    </label>
                    <select
                      aria-label="Dịp lễ"
                      value={form?.holiday}
                      onChange={e => {
                        const nextHoliday = mockHolidays?.find(holiday => holiday.name === e?.target?.value);
                        updateForm('holiday', e?.target?.value);
                        updateForm('selectedDates', []);
                        if (nextHoliday) {
                          setHolidayMonthAnchor(toDateKey(startOfMonth(new Date(nextHoliday?.date))));
                        }
                      }}
                      className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none max-w-sm"
                    >
                      <option value="">— Chọn dịp lễ —</option>
                      {mockHolidays?.map(h => (
                        <option key={h?.id} value={h?.name}>{h?.name} ({new Date(h?.date)?.toLocaleDateString('vi-VN')})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/60 font-label mb-2">
                      Ngày khởi hành thuộc dịp lễ <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-primary/50 mb-3">Chọn ngày trên lịch thành đúng dịp lễ; các ngày không nằm trong dải lễ sẽ bị khóa?.</p>
                    <div className="border border-outline-variant/30 max-w-2xl">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-[var(--color-surface)]">
                        <button
                          type="button"
                          onClick={() => setHolidayMonthAnchor(toDateKey(addMonths(displayMonth, -1)))}
                          className="w-9 h-9 border border-outline-variant/40 flex items-center justify-center text-primary/60 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                          aria-label="Tháng trước"
                        >
                          <span className="material-symbols-outlined text-base">chevron_left</span>
                        </button>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-widest text-primary/40 font-bold">Lịch khởi hành</p>
                          <p className="text-sm font-medium text-primary">
                            Tháng {displayMonth?.getMonth() + 1}/{displayMonth?.getFullYear()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHolidayMonthAnchor(toDateKey(addMonths(displayMonth, 1)))}
                          className="w-9 h-9 border border-outline-variant/40 flex items-center justify-center text-primary/60 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
                          aria-label="Tháng sau"
                        >
                          <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-7 border-b border-outline-variant/20">
                        {WEEKDAYS?.map(day => (
                          <div key={day?.value} className="px-3 py-2 text-center text-[10px] uppercase tracking-widest text-primary/45 font-bold border-r last:border-r-0 border-outline-variant/10">
                            {day?.label}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7">
                        {holidayCalendarCells?.map((date, index) => {
                          if (!date) {
                            return <div key={`empty-${index}`} className="min-h-[64px] border-r border-b border-outline-variant/10 bg-white" />;
                          }

                          const dateKey = toDateKey(date);
                          const isSelectable = holidayDateKeySet?.has(dateKey);
                          const isSelected = form?.selectedDates?.includes(dateKey);

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              disabled={!isSelectable}
                              onClick={() => {
                                const next = isSelected
                                  ? form?.selectedDates?.filter(item => item !== dateKey)
                                  : [...form?.selectedDates, dateKey];
                                updateForm('selectedDates', next);
                              }}
                              className={`min-h-[64px] border-r border-b border-outline-variant/10 p-2 text-left align-top transition-colors ${
                                isSelected
                                  ? 'bg-[var(--color-secondary)] text-white'
                                  : isSelectable
                                    ? 'bg-white text-primary hover:bg-[var(--color-secondary)]/8'
                                    : 'bg-[var(--color-surface)]/60 text-primary/20 cursor-not-allowed'
                              }`}
                            >
                              <span className="text-sm font-medium">{date?.getDate()}</span>
                              {isSelectable && (
                                <span className={`block text-[10px] mt-2 ${isSelected ? 'text-white/80' : 'text-[var(--color-secondary)]'}`}>
                                  {selectedHoliday?.name}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 border border-outline-variant/20 bg-[var(--color-surface)] p-4 max-w-2xl">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50 font-bold">Danh sách ngày khởi hành dự kiến</p>
                        <span className="text-xs text-primary/45">{form?.selectedDates?.length} ngày đã chọn</span>
                      </div>
                      {sortedSelectedDepartureDates.length === 0 ? (
                        <p className="text-sm text-primary/45">Chưa chọn ngày khởi hành nào trong dịp lễ?.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {sortedSelectedDepartureDates?.map(dateKey => (
                            <span key={dateKey} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-outline-variant/25 text-sm text-primary">
                              {new Date(dateKey)?.toLocaleDateString('vi-VN')}
                              <button
                                type="button"
                                onClick={() => updateForm('selectedDates', form?.selectedDates?.filter(item => item !== dateKey))}
                                className="text-primary/35 hover:text-red-500"
                                aria-label={`Bỏ ${dateKey}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quanh năm fields */}
              {form.tourType === 'quanh_nam' && (
                <div className="space-y-5 border-t border-outline-variant/30 pt-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/60 font-label mb-2">
                      Ngày khởi hành trong tuần
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateForm('weekdays', WEEKDAYS?.map(w => w?.value))}
                        className="px-3 py-1.5 text-xs border border-outline-variant/50 hover:border-[var(--color-secondary)] transition-colors"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        onClick={() => updateForm('weekdays', [])}
                        className="px-3 py-1.5 text-xs border border-outline-variant/50 hover:border-[var(--color-secondary)] transition-colors"
                      >
                        Bỏ chọn
                      </button>
                      <div className="flex gap-2 ml-2">
                        {WEEKDAYS?.map(w => {
                          const selected = form?.weekdays?.includes(w?.value);
                          return (
                            <button key={w?.value}
                              onClick={() => {
                                const next = selected
                                  ? form?.weekdays?.filter(x => x !== w?.value)
                                  : [...form?.weekdays, w?.value];
                                updateForm('weekdays', next);
                              }}
                              className={`w-10 h-10 border text-xs font-medium transition-colors ${
                                selected
                                  ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]'
                                  : 'border-outline-variant/50 hover:border-[var(--color-secondary)]/50'
                              }`}>
                              {w?.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                      Độ phủ mở bán tối thiểu
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={form?.coverageMonths}
                        onChange={e => updateForm('coverageMonths', parseInt(e?.target?.value) || 1)}
                        className="w-24 border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                      />
                      <span className="text-sm text-primary/60">thàng</span>
                    </div>
                    <p className="text-xs text-primary/40 mt-1">Tour sẽ được mở bán trước tối thiểu N tháng</p>
                  </div>
                </div>
              )}
            </section>

            {/* Next */}
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all bg-primary text-surface hover:bg-[var(--color-secondary)]">
                Tiếp theo: Lịch trình
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 2 ===================== */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="bg-white border border-outline-variant/30 divide-y divide-outline-variant/20">
              {form?.itinerary?.map((day, idx) => (
                <div key={day?.day} className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/10 flex items-center justify-center shrink-0">
                      <span className="font-headline font-bold text-secondary">{day?.day}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-headline text-base text-primary">Ngày {day?.day}</h3>
                    </div>
                    <span className="text-xs text-primary/40">Tự động sinh theo thời lượng</span>
                  </div>

                  <div className="space-y-5 pl-16">
                    {/* Title */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                        Tiêu đề ngày <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={day?.title}
                        onChange={e => updateDay(idx, { title: e?.target?.value })}
                        className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none max-w-xl"
                        placeholder="VD: Hà Nội - Vịnh Hạ Long"
                      />
                    </div>

                    {/* Meals */}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/60 font-label mb-2">
                        Bữa ăn trong ngày
                      </p>
                      <div className="flex gap-4">
                        {(['breakfast', 'lunch', 'dinner'] as const)?.map(m => {
                          const selected = day?.meals?.includes(m);
                          return (
                            <button key={m} onClick={() => toggleMeal(idx, m)}
                              className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors ${
                                selected
                                  ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5 text-[var(--color-secondary)]'
                                  : 'border-outline-variant/50 hover:border-outline-variant text-primary/50'
                              }`}>
                              <span className={`material-symbols-outlined text-base ${
                                selected ? 'text-[var(--color-secondary)]' : 'text-primary/20'
                              }`} style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}>
                                {m === 'breakfast' ? 'bakery_dining' : m === 'lunch' ? 'lunch_dining' : 'dinner_dining'}
                              </span>
                              {MEAL_LABELS[m]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                        Mô tả <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        aria-label={`Mô tả ngày ${day?.day}`}
                        value={day?.description}
                        onChange={e => updateDay(idx, { description: e?.target?.value })}
                        rows={4}
                        className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none resize-none max-w-2xl"
                        placeholder="Mô tả chi tiết các hoạt động, điểm tham quan trong ngày..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)}
                className="px-8 py-4 border border-outline-variant/60 text-primary font-sans uppercase tracking-[0.2em] text-[12px] hover:bg-surface transition-all">
                ← Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all bg-primary text-surface hover:bg-[var(--color-secondary)]">
                Tiếp theo: Giá & Cấu hình
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 3 ===================== */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="bg-white border border-outline-variant/30 p-8">
              <h2 className="font-headline text-lg text-primary mb-1 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">payments</span>
                Thông tin cấu hành giá tour
              </h2>
              <p className="text-xs text-primary/50 mb-6">Dành cho <strong>{form?.name || 'chương trình tour'}</strong> — {form?.days} ngày {form?.nights} đêm</p>

              {/* Pricing inputs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                {([
                  { label: 'Giá bán người lớn', key: 'adult' as const, unit: 'đ' },
                  { label: 'Giá bán trẻ em', key: 'child' as const, unit: 'đ' },
                  { label: 'Giá bán trẻ sơ sinh', key: 'infant' as const, unit: 'đ' },
                  { label: 'Số khách tối thiểu', key: 'minGuests' as const, unit: 'người' },
                ])?.map(({ label, key, unit }) => (
                  <div key={key}>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} defaultValue={key === 'minGuests' ? 8 : 0}
                        className="flex-1 border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none" />
                      <span className="text-xs text-primary/40 shrink-0">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost categories */}
              <div className="space-y-6">
                <h3 className="font-headline text-base text-primary border-t border-outline-variant/30 pt-5">
                  Bảng kê chi phí dự kiến
                </h3>

                {/* A?. Vận chuyển */}
                <div className="border border-outline-variant/30">
                  <div className="bg-[var(--color-surface)] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">A</span>
                      <span className="text-sm font-medium text-primary">Vận chuyển</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs px-3 py-1 border border-outline-variant/50 text-primary/60 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] transition-colors">
                        + Thêm dịch vụ
                      </button>
                      <button className="text-xs px-3 py-1 border border-outline-variant/50 text-primary/60 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] transition-colors">
                        + Thêm nhà cung cấp
                      </button>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    {/* Default: Xe tham quan */}
                    <div className="flex items-center justify-between p-3 bg-[var(--color-surface)]/50 border border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary/30">directions_bus</span>
                        <div>
                          <p className="text-sm font-medium">Xe tham quan</p>
                          <p className="text-xs text-primary/40">Xe Limousine 16-29 chỗ</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input type="number" placeholder="Báo giá" className="w-32 border border-outline-variant/50 px-3 py-2 text-sm text-right outline-none" />
                        <span className="text-xs text-primary/40 w-8">/chuyến</span>
                        <input type="number" placeholder="Ghi chú" className="w-32 border border-outline-variant/50 px-3 py-2 text-sm outline-none" />
                      </div>
                    </div>
                    {form.transport === 'maybay' && (
                      <div className="flex items-center justify-between p-3 bg-[var(--color-secondary)]/5 border border-[var(--color-secondary)]/20">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[var(--color-secondary)]">flight</span>
                          <div>
                            <p className="text-sm font-medium text-[var(--color-secondary)]">
                              Vé máy bay từ {form?.departurePoint} đến {form?.arrivalPoint}
                            </p>
                            <p className="text-xs text-[var(--color-secondary)]/60">Không chỉnh sửa được</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-center">
                          <div className="text-xs text-primary/40 space-y-1 text-right">
                            <p>NL: —</p>
                            <p>TE: —</p>
                            <p>EB: —</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* B?. Khách sạn */}
                <div className="border border-outline-variant/30">
                  <div className="bg-[var(--color-surface)] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">B</span>
                      <span className="text-sm font-medium text-primary">Khách sạn</span>
                    </div>
                    <button className="text-xs px-3 py-1 border border-outline-variant/50 text-primary/60 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] transition-colors">
                      + Thêm nhà cung cấp
                    </button>
                  </div>
                  <div className="p-5 text-sm text-primary/40 italic">
                    Chọn địa điểm lưu trú trước khi thêm nhà cung cấp
                  </div>
                </div>

                {/* C?. Chi phí ăn */}
                <div className="border border-outline-variant/30">
                  <div className="bg-[var(--color-surface)] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">C</span>
                      <span className="text-sm font-medium text-primary">Chi phí ăn</span>
                    </div>
                    <span className="text-xs text-primary/40 italic">
                      {form?.itinerary?.flatMap(d => d?.meals)?.length} bữa được tạo tự động
                    </span>
                  </div>
                </div>

                {/* D?. Vé thắng cảnh */}
                <div className="border border-outline-variant/30">
                  <div className="bg-[var(--color-surface)] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">D</span>
                      <span className="text-sm font-medium text-primary">Vé thắng cảnh</span>
                    </div>
                    <button className="text-xs px-3 py-1 border border-outline-variant/50 text-primary/60 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] transition-colors">
                      + Thêm dịch vụ
                    </button>
                  </div>
                </div>

                {/* E?. Hướng dẫn viên */}
                <div className="border border-outline-variant/30">
                  <div className="bg-[var(--color-surface)] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">E</span>
                      <span className="text-sm font-medium text-primary">Hướng dẫn viên</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Số lần</label>
                        <input type="number" value={form?.nights > form?.days ? form?.days + 0.5 : form?.days} readOnly
                          className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm bg-[var(--color-surface)]" />
                        <p className="text-[10px] text-primary/40 mt-1">Tự động: {form?.nights > form?.days ? `= ${form?.days} + 0.5` : `= ${form?.days} ngày`}</p>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Đơn giá</label>
                        <input type="number" placeholder="1,500,000" defaultValue="1500000"
                          className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Thành tiền</label>
                        <div className="border border-outline-variant/50 px-3 py-2.5 bg-[var(--color-surface)] text-sm text-primary/50 h-[42px]">
                          —
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* F?. Chi phí khác */}
                <div className="border border-outline-variant/30">
                  <div className="bg-[var(--color-surface)] px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">F</span>
                      <span className="text-sm font-medium text-primary">Chi phí khác</span>
                    </div>
                    <button className="text-xs px-3 py-1 border border-outline-variant/50 text-primary/60 hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)] transition-colors">
                      + Thêm dịch vụ
                    </button>
                  </div>
                  <div className="p-5 space-y-2">
                    {/* Default: Bảo hiểm */}
                    <div className="flex items-center justify-between p-3 bg-[var(--color-secondary)]/5 border border-[var(--color-secondary)]/20">
                      <span className="text-sm">Bảo hiểm du lịch</span>
                      <span className="text-xs text-primary/40">Mặc định</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky pricing summary */}
            <div className="bg-white border border-[var(--color-secondary)]/50 shadow-lg p-6 sticky bottom-8 z-10">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="flex flex-wrap gap-6">
                  {([
                    { label: 'Giá bán NL', key: 'adult' },
                    { label: 'Giá bán TE', key: 'child' },
                    { label: 'Giá bán EB', key: 'infant' },
                    { label: 'Số KH tối thiểu', key: 'minGuests' },
                  ] as const)?.map(({ label, key }) => (
                    <div key={key}>
                      <p className="text-[10px] uppercase tracking-widest text-primary/50 font-label mb-1">{label}</p>
                      <input type="number" placeholder="0"
                        className="w-36 border border-outline-variant/50 px-3 py-2 text-sm focus:border-[var(--color-secondary)] outline-none" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-primary/40 italic max-w-xs">
                  Giá bán TE = 75% ? Giá bán NL?. Giá EB = 0 hoặc = giá và MB trẻ sơ sinh (nếu có)
                </p>
              </div>
            </div>

            {/* Bottom navigation */}
            <div className="flex justify-between">
              <button onClick={() => setStep(2)}
                className="px-8 py-4 border border-outline-variant/60 text-primary font-sans uppercase tracking-[0.2em] text-[12px] hover:bg-surface transition-all">
                ← Quay lại Lịch trình
              </button>
              <p className="text-xs text-primary/40 self-center">Lưu nháp và Gửi phê duyệt nằm ở đầu màn hình?.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

