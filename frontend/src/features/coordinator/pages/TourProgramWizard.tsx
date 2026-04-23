import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VIETNAM_PROVINCES,
  PROVINCES_WITH_AIRPORT,
  WEEKDAYS,
  MEAL_LABELS,
  mockHolidays,
} from '@entities/tour-program/data/tourProgram';
import type { TourProgram } from '@entities/tour-program/data/tourProgram';
import TourProgramPricingTables from '@features/coordinator/components/TourProgramPricingTables';

type Transport = 'xe' | 'maybay';
type TourType = 'mua_le' | 'quanh_nam';
type DayMeals = ('breakfast' | 'lunch' | 'dinner')[];
type WizardStep = 1 | 2 | 3 | 4;
type EditablePriceKey = 'adult' | 'child' | 'infant' | 'singleSupplement';

type WizardProps = {
  initialProgram?: TourProgram;
  readOnly?: boolean;
  headerTitle?: string;
  headerActions?: ReactNode;
};

interface DayForm {
  day: number;
  title: string;
  meals: DayMeals;
  description: string;
  accommodationPoint: string;
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
  selectedDates: string[];
  weekdays: string[];
  yearRoundStartDate: string;
  yearRoundEndDate: string;
  coverageMonths: number;
  itinerary: DayForm[];
}

interface PricingConfigState {
  expectedGuests: number;
  profitMargin: number;
  taxRate: number;
  otherCostFactor: number;
  guideUnitPrice: number;
}

interface PreviewRow {
  id: string;
  departureDate: string;
  endDate: string;
  dayType: string;
  expectedGuests: number;
  costPerAdult: number;
  sellPrice: number;
  profitPercent: number;
  bookingDeadline: string;
  conflictLabel: string;
  conflictDetails: string[];
  checked: boolean;
}

const weekdayValueByDay = ['cn', 't2', 't3', 't4', 't5', 't6', 't7'];
const editablePriceLabels: Record<EditablePriceKey, string> = {
  adult: 'Giá bán (Người lớn)',
  child: 'Giá trẻ em',
  infant: 'Giá trẻ sơ sinh',
  singleSupplement: 'Phụ phí phòng đơn',
};

const initialItinerary = (days: number): DayForm[] =>
  Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    title: '',
    meals: [] as DayMeals,
    description: '',
    accommodationPoint: '',
  }));

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

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

function addDays(value: string, days: number) {
  const date = parseLocalDate(value);
  date?.setDate(date?.getDate() + days);
  return toDateKey(date);
}

function formatDate(value?: string) {
  if (!value) return '-';
  return parseLocalDate(value)?.toLocaleDateString('vi-VN');
}

function formatMoney(value: number) {
  return Math.round(value)?.toLocaleString('vi-VN');
}

function roundToThousand(value: number) {
  return Math.round(value / 1000) * 1000;
}

function buildDateRange(startDate: string, endDate: string, weekdays: string[]) {
  if (!startDate || !endDate) return [];

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (Number.isNaN(start?.getTime()) || Number.isNaN(end?.getTime()) || start > end) {
    return [];
  }

  const selectedWeekdays = new Set(weekdays);
  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end && dates.length < 370) {
    const weekdayValue = weekdayValueByDay[cursor?.getDay()];
    if (selectedWeekdays.size === 0 || selectedWeekdays?.has(weekdayValue)) {
      dates.push(toDateKey(cursor));
    }
    cursor?.setDate(cursor?.getDate() + 1);
  }

  return dates;
}

function getDayType(tourType: TourType, holidayName: string, dateKey: string) {
  if (tourType === 'mua_le') {
    return holidayName || 'Ngày lễ';
  }
  const day = parseLocalDate(dateKey)?.getDay();
  return day === 0 || day === 6 ? 'Cuối tuần' : 'Ngày thường';
}

function formFromProgram(program: TourProgram): FormState {
  const days = Math.max(1, program?.duration?.days ?? 3);
  const nights = Math.max(0, program?.duration?.nights ?? 2);
  const itinerary = (program?.itinerary?.length ? program.itinerary : initialItinerary(days)).map((day, index) => ({
    day: day?.day ?? index + 1,
    title: day?.title ?? '',
    meals: (day?.meals ?? []) as DayMeals,
    description: day?.description ?? '',
    accommodationPoint: '',
  }));

  return {
    name: program?.name ?? '',
    days,
    nights,
    departurePoint: program?.departurePoint ?? '',
    sightseeingSpots: [...(program?.sightseeingSpots ?? [])],
    routeDescription: program?.routeDescription ?? '',
    bookingDeadline: program?.bookingDeadline ?? 7,
    transport: program?.transport ?? 'xe',
    arrivalPoint: program?.arrivalPoint ?? '',
    tourType: program?.tourType ?? 'quanh_nam',
    holiday: program?.holiday ?? '',
    selectedDates: [...(program?.selectedDates ?? [])],
    weekdays: [...(program?.weekdays ?? [])],
    yearRoundStartDate: program?.yearRoundStartDate ?? '',
    yearRoundEndDate: program?.yearRoundEndDate ?? '',
    coverageMonths: program?.coverageMonths ?? 3,
    itinerary,
  };
}

function pricingFromProgram(program: TourProgram): PricingConfigState {
  const otherCostFactorPercent = program?.pricingConfig?.otherCostFactor != null
    ? Math.round(program.pricingConfig.otherCostFactor * 100)
    : 15;

  return {
    expectedGuests: Math.max(1, program?.pricingConfig?.minParticipants ?? 25),
    profitMargin: program?.pricingConfig?.profitMargin ?? 15,
    taxRate: program?.pricingConfig?.taxRate ?? 10,
    otherCostFactor: otherCostFactorPercent,
    guideUnitPrice: 400000,
  };
}

export default function AdminTourProgramWizard({
  initialProgram,
  readOnly = false,
  headerTitle = 'Thêm mới chương trình tour',
  headerActions,
}: WizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<FormState>(() => initialProgram ? formFromProgram(initialProgram) : ({
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
    yearRoundStartDate: '',
    yearRoundEndDate: '',
    coverageMonths: 3,
    itinerary: initialItinerary(3),
  }));
  const [holidayMonthAnchor, setHolidayMonthAnchor] = useState(() => {
    if (initialProgram?.holiday) {
      const holiday = mockHolidays?.find(item => item.name === initialProgram.holiday);
      if (holiday) return toDateKey(startOfMonth(new Date(holiday.date)));
    }
    return toDateKey(startOfMonth(new Date()));
  });
  const [pricingConfig, setPricingConfig] = useState<PricingConfigState>(() => initialProgram ? pricingFromProgram(initialProgram) : ({
    expectedGuests: 25,
    profitMargin: 15,
    taxRate: 10,
    otherCostFactor: 15,
    guideUnitPrice: 400000,
  }));
  const [manualPricing, setManualPricing] = useState<Record<EditablePriceKey, boolean>>({
    adult: false,
    child: false,
    infant: false,
    singleSupplement: false,
  });
  const [pricingOverrides, setPricingOverrides] = useState<Record<EditablePriceKey, number>>({
    adult: 0,
    child: 0,
    infant: 0,
    singleSupplement: 0,
  });
  const [previewEdits, setPreviewEdits] = useState<Record<string, Partial<PreviewRow>>>({});

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    if (readOnly) return;
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'days' && typeof value === 'number') {
        const existingByDay = new Map(prev?.itinerary?.map(day => [day.day, day]));
        next.itinerary = Array.from({ length: value }, (_, index) => {
          const existing = existingByDay?.get(index + 1);
          return existing ?? initialItinerary(value)[index];
        });
      }
      return next;
    });
  };

  const updatePricingConfig = <K extends keyof PricingConfigState>(key: K, value: PricingConfigState[K]) => {
    if (readOnly) return;
    setPricingConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateDay = (idx: number, patch: Partial<DayForm>) => {
    if (readOnly) return;
    setForm(prev => ({
      ...prev,
      itinerary: prev?.itinerary?.map((d, i) => i === idx ? { ...d, ...patch } : d),
    }));
  };

  const toggleMeal = (idx: number, meal: DayForm['meals'][0]) => {
    if (readOnly) return;
    setForm(prev => ({
      ...prev,
      itinerary: prev?.itinerary?.map((d, i) => {
        if (i !== idx) return d;
        const meals = d.meals.includes(meal)
          ? d.meals.filter(m => m !== meal)
          : [...d.meals, meal];
        return { ...d, meals };
      }),
    }));
  };

  const handleSaveDraft = () => {
    if (readOnly) return;
    navigate('/coordinator/tour-programs');
  };

  const handleSubmitForApproval = () => {
    if (readOnly) return;
    navigate('/coordinator/tour-programs');
  };

  const selectedHoliday = mockHolidays?.find(holiday => holiday.name === form?.holiday);

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

  const yearRoundDepartureDates = useMemo(
    () => buildDateRange(form?.yearRoundStartDate, form?.yearRoundEndDate, form?.weekdays),
    [form?.yearRoundStartDate, form?.yearRoundEndDate, form?.weekdays],
  );
  const expectedDepartureDates = useMemo(
    () => form?.tourType === 'mua_le'
      ? [...form.selectedDates].sort((left, right) => parseLocalDate(left)?.getTime() - parseLocalDate(right)?.getTime())
      : yearRoundDepartureDates,
    [form?.tourType, form.selectedDates, yearRoundDepartureDates],
  );

  const mealRows = form?.itinerary?.flatMap(day =>
    day?.meals?.map(meal => ({
      id: `${day.day}-${meal}`,
      label: `Ngày ${day.day} - ${MEAL_LABELS[meal]}`,
      service: meal === 'breakfast' ? 'Set buffet sáng' : meal === 'lunch' ? 'Set ăn trưa' : 'Set ăn tối',
      price: meal === 'breakfast' ? 90000 : 120000,
    })),
  );

  const totalMealCost = mealRows?.reduce((sum, meal) => sum + meal.price, 0);
  const hotelVariableCost = Math.max(1, form?.nights) * 650000;
  const attractionVariableCost = Math.max(1, form?.days) * 250000;
  const insuranceVariableCost = 200000;
  const transportFixedCost = form?.transport === 'maybay' ? 4400000 : 8500000;
  const fixedCost = transportFixedCost + pricingConfig?.guideUnitPrice;
  const variableAdultCost = hotelVariableCost + totalMealCost + attractionVariableCost + insuranceVariableCost;
  const netPrice = fixedCost / Math.max(1, pricingConfig?.expectedGuests) + variableAdultCost;
  const suggestedAdultPrice = roundToThousand(netPrice * (1 + pricingConfig?.profitMargin / 100) * (1 + pricingConfig?.taxRate / 100) * (1 + pricingConfig?.otherCostFactor / 100));
  const suggestedPrices: Record<EditablePriceKey, number> = {
    adult: suggestedAdultPrice,
    child: roundToThousand(suggestedAdultPrice * 0.75),
    infant: 0,
    singleSupplement: 650000,
  };
  const actualPrices: Record<EditablePriceKey, number> = {
    adult: manualPricing.adult ? pricingOverrides.adult : suggestedPrices.adult,
    child: manualPricing.child ? pricingOverrides.child : suggestedPrices.child,
    infant: manualPricing.infant ? pricingOverrides.infant : suggestedPrices.infant,
    singleSupplement: manualPricing.singleSupplement ? pricingOverrides.singleSupplement : suggestedPrices.singleSupplement,
  };
  const actualProfitRate = netPrice > 0 ? ((actualPrices.adult - netPrice) / netPrice) * 100 : 0;

  const basePreviewRows = useMemo<PreviewRow[]>(() => expectedDepartureDates.map((departureDate, index) => {
    const costPerAdult = roundToThousand(netPrice);
    const sellPrice = actualPrices.adult + index * 50000;
    const profitPercent = sellPrice > 0 ? Number((((sellPrice - costPerAdult) / sellPrice) * 100)?.toFixed(1)) : 0;
    return {
      id: `T${String(index + 1).padStart(3, '0')}`,
      departureDate,
      endDate: addDays(departureDate, Math.max(0, form?.days - 1)),
      dayType: getDayType(form?.tourType, selectedHoliday?.name ?? '', departureDate),
      expectedGuests: pricingConfig?.expectedGuests,
      costPerAdult,
      sellPrice,
      profitPercent,
      bookingDeadline: addDays(departureDate, -Math.max(0, form?.bookingDeadline)),
      conflictLabel: index % 5 === 3 ? 'x tour chờ duyệt' : index % 7 === 5 ? 'x tour mở bán' : '0 tour trùng thời điểm',
      conflictDetails: index % 5 === 3 ? ['TP-CHODUYET - Tour chờ duyệt cùng giai đoạn'] : index % 7 === 5 ? ['TP-MOBAN - Tour đang mở bán cùng giai đoạn'] : [],
      checked: true,
    };
  }), [actualPrices.adult, expectedDepartureDates, form?.bookingDeadline, form?.days, form?.tourType, netPrice, pricingConfig?.expectedGuests, selectedHoliday?.name]);

  const previewRows = useMemo(() => basePreviewRows.map(row => {
    const next = { ...row, ...(previewEdits[row.id] ?? {}) };
    next.profitPercent = next.sellPrice > 0 ? Number((((next.sellPrice - next.costPerAdult) / next.sellPrice) * 100)?.toFixed(1)) : 0;
    return next;
  }), [basePreviewRows, previewEdits]);

  const selectedPreviewCount = previewRows?.filter(row => row?.checked)?.length;
  const unselectedPreviewCount = previewRows?.length - selectedPreviewCount;

  const setPreviewRow = (id: string, patch: Partial<PreviewRow>) => {
    if (readOnly) return;
    setPreviewEdits(rows => ({
      ...rows,
      [id]: {
        ...(rows[id] ?? {}),
        ...patch,
      },
    }));
  };

  const toggleManualPrice = (key: EditablePriceKey) => {
    if (readOnly) return;
    setManualPricing(prev => {
      if (prev[key]) {
        return { ...prev, [key]: false };
      }
      setPricingOverrides(current => ({ ...current, [key]: actualPrices[key] }));
      return { ...prev, [key]: true };
    });
  };

  return (
    <div className="w-full bg-[var(--color-background)] min-h-screen pb-40">
      <main className="pt-6 px-8 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-primary">{headerTitle}</h1>
            <p className="text-xs text-primary/50 mt-1">Bước {step} / 4 - {
              step === 1 ? 'Thông tin chung' :
              step === 2 ? 'Lịch trình' :
              step === 3 ? 'Giá và cấu hình' :
              'Tour dự kiến'
            }</p>
          </div>
          <div className="flex gap-3">
            {headerActions ?? (!readOnly && (
              <>
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
              </>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-0 relative mb-10">
          <div className="absolute top-4 left-0 w-full h-[2px] bg-outline-variant/30 -z-10" />
          {([
            { value: 1, label: 'Thông tin chung' },
            { value: 2, label: 'Lịch trình' },
            { value: 3, label: 'Giá & Cấu hình' },
            { value: 4, label: 'Tour dự kiến' },
          ] as { value: WizardStep; label: string }[])?.map(item => (
            <button key={item.value} type="button" onClick={() => setStep(item.value)} className="flex flex-col items-center gap-2 flex-1">
              <span className={`w-9 h-9 flex items-center justify-center text-sm font-bold border-2 transition-all bg-[var(--color-background)] ${
                step >= item.value
                  ? 'border-[var(--color-secondary)] text-[var(--color-secondary)] bg-[var(--color-secondary)]/10'
                  : 'border-outline-variant/40 text-primary/30'
              }`}>
                {item.value}
              </span>
              <span className={`text-[10px] uppercase tracking-widest font-label ${
                step >= item.value ? 'text-[var(--color-secondary)]' : 'text-primary/30'
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {step === 1 && (
          <fieldset disabled={readOnly} className="space-y-10 border-0 p-0 m-0">
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
                  Số ngày chỉ được chênh số đêm 0 hoặc 1 ngày
                </p>
              )}
            </section>

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
                      <option value="">Chọn tỉnh/thành</option>
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
                            <button type="button" onClick={() => updateForm('sightseeingSpots', form?.sightseeingSpots?.filter(s => s !== spot))}
                              className="hover:text-red-500">×</button>
                          </span>
                        ))}
                        <select
                          value=""
                          onChange={e => {
                            if (e?.target?.value && !form?.sightseeingSpots?.includes(e?.target?.value)) {
                              updateForm('sightseeingSpots', [...form.sightseeingSpots, e?.target?.value]);
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
                    placeholder="Mô tả ngắn về hành trình, điểm nhấn của tour và phạm vi khởi hành."
                  />
                </div>
              </div>
            </section>

            <section className="bg-white border border-outline-variant/30 p-8">
              <h2 className="font-headline text-lg text-primary mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">commute</span>
                Phương tiện
              </h2>
              <div className="flex flex-wrap gap-4 mb-5">
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
                    <option value="">Chọn điểm đến</option>
                    {PROVINCES_WITH_AIRPORT?.filter(p => p !== form?.departurePoint)?.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
            </section>

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
                      <option value="">Chọn dịp lễ</option>
                      {mockHolidays?.map(h => (
                        <option key={h?.id} value={h?.name}>{h?.name} ({new Date(h?.date)?.toLocaleDateString('vi-VN')})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/60 font-label mb-2">
                      Ngày khởi hành thuộc dịp lễ <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-primary/50 mb-3">Chọn ngày trên lịch thành đúng dịp lễ; các ngày không nằm trong dải lễ sẽ bị khóa.</p>
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
                                  : [...form.selectedDates, dateKey];
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
                        <span className="text-xs text-primary/45">{expectedDepartureDates?.length} ngày đã chọn</span>
                      </div>
                      {expectedDepartureDates.length === 0 ? (
                        <p className="text-sm text-primary/45">Chưa chọn ngày khởi hành nào trong dịp lễ.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                          {expectedDepartureDates?.map(dateKey => (
                            <span key={dateKey} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-outline-variant/25 text-sm text-primary">
                              {formatDate(dateKey)}
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

              {form.tourType === 'quanh_nam' && (
                <div className="space-y-5 border-t border-outline-variant/30 pt-5">
                  <div className="grid md:grid-cols-2 gap-5 max-w-2xl">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                        Ngày bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        aria-label="Ngày bắt đầu"
                        value={form?.yearRoundStartDate}
                        onChange={e => updateForm('yearRoundStartDate', e?.target?.value)}
                        className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                        Ngày kết thúc <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        aria-label="Ngày kết thúc"
                        value={form?.yearRoundEndDate}
                        onChange={e => updateForm('yearRoundEndDate', e?.target?.value)}
                        className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary/60 font-label mb-2">
                      Ngày khởi hành trong tuần
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateForm('weekdays', WEEKDAYS?.map(w => w?.value))}
                        className="px-3 py-1.5 text-xs border border-outline-variant/50 hover:border-[var(--color-secondary)] transition-colors"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm('weekdays', [])}
                        className="px-3 py-1.5 text-xs border border-outline-variant/50 hover:border-[var(--color-secondary)] transition-colors"
                      >
                        Bỏ chọn
                      </button>
                      <div className="flex flex-wrap gap-2 ml-2">
                        {WEEKDAYS?.map(w => {
                          const selected = form?.weekdays?.includes(w?.value);
                          return (
                            <button key={w?.value}
                              type="button"
                              onClick={() => {
                                const next = selected
                                  ? form?.weekdays?.filter(x => x !== w?.value)
                                  : [...form.weekdays, w?.value];
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
                    <p className="text-xs text-primary/40 mt-2">Nếu chưa chọn thứ trong tuần, hệ thống lấy toàn bộ ngày trong khoảng.</p>
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
                      <span className="text-sm text-primary/60">tháng</span>
                    </div>
                  </div>
                  <div className="border border-outline-variant/20 bg-[var(--color-surface)] p-4 max-w-3xl">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-primary/50 font-bold">Danh sách ngày khởi hành dự kiến</p>
                      <span className="text-xs text-primary/45">{expectedDepartureDates?.length} ngày dự kiến</span>
                    </div>
                    {expectedDepartureDates.length === 0 ? (
                      <p className="text-sm text-primary/45">Nhập Ngày bắt đầu và Ngày kết thúc để hệ thống tự tính danh sách ngày dự kiến.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {expectedDepartureDates?.map(dateKey => (
                          <span key={dateKey} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-outline-variant/25 text-sm text-primary">
                            {formatDate(dateKey)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all bg-primary text-surface hover:bg-[var(--color-secondary)]">
                Tiếp theo: Lịch trình
              </button>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset disabled={readOnly} className="space-y-8 border-0 p-0 m-0">
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

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-primary/60 font-label mb-2">
                        Bữa ăn trong ngày
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {(['breakfast', 'lunch', 'dinner'] as const)?.map(m => {
                          const selected = day?.meals?.includes(m);
                          return (
                            <button key={m} type="button" onClick={() => toggleMeal(idx, m)}
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

                    {idx < form?.nights && (
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                          Địa điểm lưu trú
                        </label>
                        <select
                          value={day?.accommodationPoint}
                          onChange={e => updateDay(idx, { accommodationPoint: e?.target?.value })}
                          className="w-full max-w-sm border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                        >
                          <option value="">Chọn một điểm tham quan</option>
                          {form?.sightseeingSpots?.map(spot => (
                            <option key={spot} value={spot}>{spot}</option>
                          ))}
                        </select>
                      </div>
                    )}

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
                Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all bg-primary text-surface hover:bg-[var(--color-secondary)]">
                Tiếp theo: Giá & Cấu hình
              </button>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset disabled={readOnly} className="space-y-8 border-0 p-0 m-0">
            <section className="bg-white border border-outline-variant/30 p-6">
              <h2 className="font-headline text-lg text-primary mb-1 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">payments</span>
                Thông tin cấu hình giá tour
              </h2>
              <p className="text-xs text-primary/50 mb-6">Dành cho <strong>{form?.name || 'chương trình tour'}</strong> - {form?.days} ngày {form?.nights} đêm</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[
                  { label: 'Số lượng khách dự kiến', key: 'expectedGuests' as const, unit: 'khách' },
                  { label: 'Tỷ lệ lợi nhuận mong muốn (%)', key: 'profitMargin' as const, unit: '%' },
                  { label: 'Thuế (%)', key: 'taxRate' as const, unit: '%' },
                  { label: 'Hệ số chi phí khác (%)', key: 'otherCostFactor' as const, unit: '%' },
                ]?.map(item => (
                  <div key={item.key}>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">{item.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={pricingConfig[item.key]}
                        onChange={e => updatePricingConfig(item.key, parseInt(e?.target?.value) || 0)}
                        className="flex-1 border border-outline-variant/50 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none"
                      />
                      <span className="text-xs text-primary/40 shrink-0">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-outline-variant/30 p-6">
              <h3 className="font-headline text-base text-primary mb-5">Bảng kê chi phí dự kiến</h3>
              <div className="overflow-x-auto pb-3">
              <TourProgramPricingTables
                transport={form?.transport}
                departurePoint={form?.departurePoint}
                arrivalPoint={form?.arrivalPoint}
                days={form?.days}
                nights={form?.nights}
                itinerary={form?.itinerary}
                guideUnitPrice={pricingConfig?.guideUnitPrice}
                onGuideUnitPriceChange={value => updatePricingConfig('guideUnitPrice', value)}
              />
              </div>
            </section>
            <section className="bg-white border border-[var(--color-secondary)]/50 shadow-sm p-5">
              <h3 className="font-semibold text-sm text-primary mb-3 bg-amber-50 inline-block px-3 py-1">Tính toán dự kiến</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-3">
                {(['adult', 'child', 'infant', 'singleSupplement'] as EditablePriceKey[])?.map(key => (
                  <div key={key} className="flex items-center gap-3 min-w-0">
                    <span className="text-sm min-w-[138px]">{editablePriceLabels[key]}</span>
                    {manualPricing[key] ? (
                      <input
                        type="number"
                        value={pricingOverrides[key]}
                        onChange={e => setPricingOverrides(prev => ({ ...prev, [key]: parseInt(e?.target?.value) || 0 }))}
                        className="w-32 border border-outline-variant/50 px-2 py-1 text-sm text-right outline-none"
                      />
                    ) : (
                      <span className="font-medium w-32 text-right">{formatMoney(suggestedPrices[key])}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleManualPrice(key)}
                      className="text-secondary hover:text-primary"
                      aria-label={manualPricing[key] ? `Tự động ${editablePriceLabels[key]}` : `Sửa ${editablePriceLabels[key]}`}
                    >
                      <span className="material-symbols-outlined text-base">{manualPricing[key] ? 'restart_alt' : 'edit'}</span>
                    </button>
                    {manualPricing[key] && (
                      <span className="text-[10px] text-primary/40">Gợi ý: {formatMoney(suggestedPrices[key])}</span>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm min-w-[138px]">Giá net</span>
                  <span className="font-medium w-32 text-right">{formatMoney(netPrice)}</span>
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm min-w-[138px]">Tỷ lệ lợi nhuận thực tế</span>
                  <span className="font-medium w-32 text-right">{actualProfitRate?.toFixed(1)}%</span>
                </div>
              </div>
            </section>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)}
                className="px-8 py-4 border border-outline-variant/60 text-primary font-sans uppercase tracking-[0.2em] text-[12px] hover:bg-surface transition-all">
                Quay lại Lịch trình
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all bg-primary text-surface hover:bg-[var(--color-secondary)]">
                Tiếp theo: Tour dự kiến
              </button>
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <fieldset disabled={readOnly} className="space-y-6 border-0 p-0 m-0">
            <section className="bg-white border border-outline-variant/30 p-6">
              <h2 className="font-headline text-lg text-primary mb-1 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">event_available</span>
                Tour dự kiến
              </h2>
              <p className="text-xs text-primary/50 mb-6">Preview danh sách tour được sinh từ lịch khởi hành dự kiến của chương trình.</p>

              <div className="grid grid-cols-2 gap-4 max-w-xl mb-6">
                <label className="text-sm text-primary/70">
                  <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Sinh từ ngày</span>
                  <input
                    type="date"
                    value={form?.tourType === 'quanh_nam' ? form?.yearRoundStartDate : expectedDepartureDates[0] ?? ''}
                    onChange={e => {
                      if (form?.tourType === 'quanh_nam') updateForm('yearRoundStartDate', e?.target?.value);
                    }}
                    readOnly={form?.tourType === 'mua_le'}
                    className="w-full border border-outline-variant/50 px-4 py-2.5 outline-none read-only:bg-[var(--color-surface)]"
                  />
                </label>
                <label className="text-sm text-primary/70">
                  <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Đến ngày</span>
                  <input
                    type="date"
                    value={form?.tourType === 'quanh_nam' ? form?.yearRoundEndDate : expectedDepartureDates?.at(-1) ?? ''}
                    onChange={e => {
                      if (form?.tourType === 'quanh_nam') updateForm('yearRoundEndDate', e?.target?.value);
                    }}
                    readOnly={form?.tourType === 'mua_le'}
                    className="w-full border border-outline-variant/50 px-4 py-2.5 outline-none read-only:bg-[var(--color-surface)]"
                  />
                </label>
              </div>

              <p className="text-sm font-medium text-primary mb-3">Preview danh sách tour</p>
              <div className="overflow-x-auto border border-outline-variant/30">
                <table className="w-full min-w-[1320px]">
                  <thead>
                    <tr className="bg-[var(--color-surface)] border-b border-outline-variant/30">
                      {['Mã tour', 'Ngày khởi hành', 'Ngày kết thúc', 'Loại ngày', 'Số khách dự kiến', 'Giá vốn', 'Giá bán', 'Lợi nhuận', 'Hạn đặt tour', 'Cùng thời điểm', 'Tạo']?.map(header => (
                        <th key={header} className="text-left text-[10px] uppercase tracking-widest text-primary/50 font-medium px-4 py-3 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-sm text-primary/45">
                          Chưa có ngày dự kiến. Quay lại Thông tin chung để nhập khoảng thời gian hoặc chọn ngày mùa lễ.
                        </td>
                      </tr>
                    ) : previewRows?.map(row => (
                      <tr key={row?.id} className={`border-b border-outline-variant/20 last:border-0 ${row?.checked ? 'bg-white' : 'bg-gray-100 text-gray-400'}`}>
                        <td className="px-4 py-3 font-mono text-xs">{row?.id}</td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row?.departureDate}
                            disabled={!row?.checked}
                            onChange={event => setPreviewRow(row?.id, {
                              departureDate: event?.target?.value,
                              endDate: addDays(event?.target?.value, Math.max(0, form?.days - 1)),
                              bookingDeadline: addDays(event?.target?.value, -Math.max(0, form?.bookingDeadline)),
                            })}
                            className="border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row?.endDate}
                            disabled={!row?.checked}
                            onChange={event => setPreviewRow(row?.id, { endDate: event?.target?.value })}
                            className="border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{row?.dayType}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={row?.expectedGuests}
                            disabled={!row?.checked}
                            onChange={event => setPreviewRow(row?.id, { expectedGuests: Math.max(1, Number(event?.target?.value) || 1) })}
                            className="w-24 border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">{formatMoney(row?.costPerAdult)}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={row?.sellPrice}
                            disabled={!row?.checked}
                            onChange={event => setPreviewRow(row?.id, { sellPrice: Math.max(0, Number(event?.target?.value) || 0) })}
                            className="w-28 border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">{row?.profitPercent}%</td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row?.bookingDeadline}
                            disabled={!row?.checked}
                            onChange={event => setPreviewRow(row?.id, { bookingDeadline: event?.target?.value })}
                            className="border border-outline-variant/40 px-2 py-1 text-sm disabled:bg-transparent disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-pre-line" title={row?.conflictDetails?.join('\n')}>
                          {row?.conflictLabel}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={row?.checked}
                            aria-label={`Tạo ${row?.id}`}
                            onChange={() => setPreviewRow(row?.id, { checked: !row?.checked })}
                            className="accent-[var(--color-secondary)] w-4 h-4"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border border-t-0 border-outline-variant/30 bg-[var(--color-surface)] px-4 py-3 text-sm text-primary/70">
                <span>Đã chọn: {selectedPreviewCount} tour</span>
                <span>Chưa chọn: {unselectedPreviewCount} tour</span>
              </div>

              <div className="text-xs text-primary/50 bg-[var(--color-surface)] border border-outline-variant/30 p-3 mt-5">
                <strong>Tóm tắt:</strong> {selectedPreviewCount} tour được tích để gửi duyệt. Bỏ tick sẽ làm xám dòng và khóa chỉnh sửa theo đúng logic preview.
              </div>
            </section>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 border border-outline-variant/50 text-primary font-sans uppercase tracking-wider text-xs hover:bg-surface transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmitForApproval}
                disabled={selectedPreviewCount === 0}
                className={`flex-1 py-3 font-sans uppercase tracking-wider text-xs font-bold transition-colors ${
                  selectedPreviewCount > 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Gửi duyệt
              </button>
            </div>
          </fieldset>
        )}
      </main>
    </div>
  );
}
