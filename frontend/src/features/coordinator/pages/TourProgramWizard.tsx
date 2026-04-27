import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  VIETNAM_PROVINCES,
  PROVINCES_WITH_AIRPORT,
  WEEKDAYS,
  MEAL_LABELS,
} from '@entities/tour-program/data/tourProgram';
import type {
  TourProgram,
  TourProgramManualPricingState,
  TourProgramPreviewRow,
  TourProgramPricingOverrides,
  TourProgramPricingTablesState,
} from '@entities/tour-program/data/tourProgram';
import TourProgramPricingTables, {
  type PricingSummary,
  type PricingTablesValue,
  type PricingValidationState,
} from '@features/coordinator/components/TourProgramPricingTables';
import { createTourProgram, patchTourProgram, submitTourProgram } from '@shared/lib/api/tourPrograms';
import { useAppDataStore } from '@shared/store/useAppDataStore';
import { useAuthStore } from '@shared/store/useAuthStore';

type Transport = 'xe' | 'maybay';
type TourType = 'mua_le' | 'quanh_nam';
type LodgingStandard = '2 sao' | '3 sao' | '4 sao' | '5 sao';
type DayMeals = ('breakfast' | 'lunch' | 'dinner')[];
type WizardStep = 1 | 2 | 3 | 4;
type EditablePriceKey = 'adult' | 'child' | 'infant' | 'singleSupplement';
type NumericFieldValue = number | '';
type FormTourType = TourType | '';
type ValidationErrors = Partial<Record<string, string>>;

type WizardProps = {
  initialProgram?: TourProgram;
  readOnly?: boolean;
  headerTitle?: string;
  headerActions?: ReactNode;
  persistMode?: 'create' | 'edit' | 'readOnly';
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
  days: NumericFieldValue;
  nights: NumericFieldValue;
  departurePoint: string;
  sightseeingSpots: string[];
  lodgingStandard: LodgingStandard | '';
  routeDescription: string;
  bookingDeadline: number;
  transport: Transport;
  arrivalPoint: string;
  tourType: FormTourType;
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

const lodgingStandards: LodgingStandard[] = ['2 sao', '3 sao', '4 sao', '5 sao'];
const YEAR_ROUND_START_ERROR = 'chương trình tour phải tạo ít nhất trước 1 tháng';
const YEAR_ROUND_END_ERROR = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
const EMPTY_PRICING_VALUE: PricingTablesValue = {
  transport: [],
  flight: [],
  hotels: {},
  meals: {},
  attractions: {},
  otherCosts: [],
};
const EMPTY_PRICING_SUMMARY: PricingSummary = {
  currentNetPrice: 0,
  currentSingleSupplement: 0,
  currentFixedCost: 0,
  currentAdultVariableCost: 0,
  minimumOperatingGuests: 0,
  guideCost: 0,
  transportFixedCost: 0,
  flightAdultCost: 0,
  hotelCost: 0,
  mealCost: 0,
  attractionAdultCost: 0,
  otherFixedCost: 0,
  otherVariableAdultCost: 0,
  departurePricing: {},
};
const EMPTY_PRICING_VALIDATION: PricingValidationState = {
  isValid: false,
  messages: [],
};
const EMPTY_MANUAL_PRICING: TourProgramManualPricingState = {
  adult: false,
  child: false,
  infant: false,
  singleSupplement: false,
};
const EMPTY_PRICING_OVERRIDES: TourProgramPricingOverrides = {
  adult: 0,
  child: 0,
  infant: 0,
  singleSupplement: 0,
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

function addCalendarMonths(date: Date, offset: number) {
  const next = new Date(date);
  next?.setMonth(next?.getMonth() + offset);
  return next;
}

function addCalendarDays(date: Date, offset: number) {
  const next = new Date(date);
  next?.setDate(next?.getDate() + offset);
  return next;
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

function isValidDateKey(value: string) {
  if (!value) return false;
  const date = parseLocalDate(value);
  return !Number.isNaN(date?.getTime()) && toDateKey(date) === value;
}

function isBeforeDateKey(left: string, right: string) {
  if (!isValidDateKey(left) || !isValidDateKey(right)) return false;
  return left < right;
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
    accommodationPoint: day?.accommodationPoint ?? '',
  }));

  return {
    name: program?.name ?? '',
    days,
    nights,
    departurePoint: program?.departurePoint ?? '',
    sightseeingSpots: [...(program?.sightseeingSpots ?? [])],
    lodgingStandard: program?.lodgingStandard ?? '',
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

function pricingTablesFromProgram(program: TourProgram): PricingTablesValue {
  return program?.draftPricingTables ?? EMPTY_PRICING_VALUE;
}

function manualPricingFromProgram(program: TourProgram): TourProgramManualPricingState {
  return {
    ...EMPTY_MANUAL_PRICING,
    ...(program?.draftManualPricing ?? {}),
  };
}

function pricingOverridesFromProgram(program: TourProgram): TourProgramPricingOverrides {
  return {
    ...EMPTY_PRICING_OVERRIDES,
    ...(program?.draftPricingOverrides ?? {}),
  };
}

function previewEditMapFromProgram(program: TourProgram) {
  return Object.fromEntries(
    (program?.draftPreviewRows ?? []).map(row => [row.id, row]),
  ) as Record<string, Partial<TourProgramPreviewRow>>;
}

export default function AdminTourProgramWizard({
  initialProgram,
  readOnly = false,
  headerTitle = 'Thêm mới chương trình tour',
  headerActions,
  persistMode = readOnly ? 'readOnly' : (initialProgram ? 'edit' : 'create'),
}: WizardProps) {
  const navigate = useNavigate();
  const upsertTourProgram = useAppDataStore(state => state.upsertTourProgram);
  const existingPrograms = useAppDataStore(state => state.tourPrograms);
  const existingTourInstances = useAppDataStore(state => state.tourInstances);
  const specialDays = useAppDataStore(state => state.specialDays);
  const token = useAuthStore(state => state.accessToken);
  const enforceCreateRules = !initialProgram && !readOnly;
  const minimumYearRoundStartDate = useMemo(() => toDateKey(addCalendarMonths(new Date(), 1)), []);
  const minimumHolidayStartDate = useMemo(() => toDateKey(addCalendarDays(new Date(), 15)), []);
  const holidayOptions = useMemo(() => {
    if (specialDays.length === 0) {
      return [];
    }

    return specialDays.map((day) => {
      const start = new Date(day.startDate);
      const end = new Date(day.endDate);
      const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      return {
        id: day.id,
        name: day.name,
        date: day.startDate,
        durationDays,
      };
    });
  }, [specialDays]);
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<FormState>(() => initialProgram ? formFromProgram(initialProgram) : ({
    name: '',
    days: '',
    nights: '',
    departurePoint: '',
    sightseeingSpots: [],
    lodgingStandard: '',
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
    itinerary: [],
  }));
  const [stepAttempted, setStepAttempted] = useState<Record<1 | 2 | 3, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [holidayMonthAnchor, setHolidayMonthAnchor] = useState(() => {
    if (initialProgram?.holiday) {
      const holiday = holidayOptions?.find(item => item.name === initialProgram.holiday);
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
  const [pricingTableValue, setPricingTableValue] = useState<PricingTablesValue>(() => initialProgram ? pricingTablesFromProgram(initialProgram) : EMPTY_PRICING_VALUE);
  const [pricingSummary, setPricingSummary] = useState<PricingSummary>(EMPTY_PRICING_SUMMARY);
  const [pricingValidation, setPricingValidation] = useState<PricingValidationState>(EMPTY_PRICING_VALIDATION);
  const [manualPricing, setManualPricing] = useState<Record<EditablePriceKey, boolean>>(() => initialProgram ? manualPricingFromProgram(initialProgram) : EMPTY_MANUAL_PRICING);
  const [pricingOverrides, setPricingOverrides] = useState<Record<EditablePriceKey, number>>(() => initialProgram ? pricingOverridesFromProgram(initialProgram) : EMPTY_PRICING_OVERRIDES);
  const [previewEdits, setPreviewEdits] = useState<Record<string, Partial<PreviewRow>>>(() => initialProgram ? previewEditMapFromProgram(initialProgram) : {});
  const dayCount = typeof form?.days === 'number' ? form.days : 0;
  const nightCount = typeof form?.nights === 'number' ? form.nights : 0;
  const airportProvinceSet = useMemo(() => new Set<string>([...(PROVINCES_WITH_AIRPORT as readonly string[])]), []);
  const airportSightseeingSpots = useMemo(
    () => form?.sightseeingSpots?.filter(spot => airportProvinceSet.has(spot)),
    [airportProvinceSet, form?.sightseeingSpots],
  );
  const shouldShowTransportSelector = airportProvinceSet.has(form?.departurePoint) && airportSightseeingSpots.length > 0;
  const availableHolidays = useMemo(
    () => enforceCreateRules
      ? holidayOptions?.filter(holiday => holiday?.date >= minimumHolidayStartDate)
      : holidayOptions,
    [enforceCreateRules, holidayOptions, minimumHolidayStartDate],
  );
  const canGenerateYearRoundDepartureDates = form?.tourType === 'quanh_nam'
    && isValidDateKey(form?.yearRoundStartDate)
    && (!enforceCreateRules || !isBeforeDateKey(form?.yearRoundStartDate, minimumYearRoundStartDate))
    && isValidDateKey(form?.yearRoundEndDate)
    && !isBeforeDateKey(form?.yearRoundEndDate, form?.yearRoundStartDate)
    && form?.weekdays?.length > 0;
  const shouldShowYearRoundDeparturePreview = form?.tourType === 'quanh_nam'
    && Boolean(form?.yearRoundStartDate && form?.yearRoundEndDate && form?.weekdays?.length > 0);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    if (readOnly) return;
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'days') {
        if (typeof value === 'number' && value > 0) {
          const existingByDay = new Map(prev?.itinerary?.map(day => [day.day, day]));
          next.itinerary = Array.from({ length: value }, (_, index) => {
            const existing = existingByDay?.get(index + 1);
            return existing ?? initialItinerary(value)[index];
          });
        } else {
          next.itinerary = [];
        }
      }
      if (key === 'tourType') {
        if (value === 'mua_le') {
          next.yearRoundStartDate = '';
          next.yearRoundEndDate = '';
          next.weekdays = [];
        }
        if (value === 'quanh_nam') {
          next.holiday = '';
          next.selectedDates = [];
        }
      }
      if (key === 'transport' && value === 'xe') {
        next.arrivalPoint = '';
      }
      if (key === 'transport' && value === 'maybay') {
        const nextAirportSightseeingSpots = next.sightseeingSpots.filter(spot => airportProvinceSet.has(spot));
        if (nextAirportSightseeingSpots.length === 1) {
          next.arrivalPoint = nextAirportSightseeingSpots[0];
        } else if (!nextAirportSightseeingSpots.includes(next.arrivalPoint)) {
          next.arrivalPoint = '';
        }
      }
      if (key === 'yearRoundStartDate') {
        const nextStartDate = typeof value === 'string' ? value : '';
        if (
          next.yearRoundEndDate
          && nextStartDate
          && isValidDateKey(next.yearRoundEndDate)
          && isValidDateKey(nextStartDate)
          && isBeforeDateKey(next.yearRoundEndDate, nextStartDate)
        ) {
          next.yearRoundEndDate = '';
        }
      }
      return next;
    });
  };

  useEffect(() => {
    if (readOnly) return;
    setForm(prev => {
      let changed = false;
      const next = { ...prev };

      if (!shouldShowTransportSelector) {
        if (next.transport !== 'xe') {
          next.transport = 'xe';
          changed = true;
        }
        if (next.arrivalPoint) {
          next.arrivalPoint = '';
          changed = true;
        }
      } else if (next.transport === 'maybay') {
        if (airportSightseeingSpots.length === 1 && next.arrivalPoint !== airportSightseeingSpots[0]) {
          next.arrivalPoint = airportSightseeingSpots[0];
          changed = true;
        } else if (next.arrivalPoint && !airportSightseeingSpots.includes(next.arrivalPoint)) {
          next.arrivalPoint = '';
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [airportSightseeingSpots, readOnly, shouldShowTransportSelector]);

  useEffect(() => {
    if (!enforceCreateRules || readOnly) return;
    if (form?.holiday && !availableHolidays.some(holiday => holiday.name === form.holiday)) {
      setForm(prev => ({
        ...prev,
        holiday: '',
        selectedDates: [],
      }));
    }
  }, [availableHolidays, enforceCreateRules, form?.holiday, readOnly]);

  const validateStepOne = (nextForm: FormState): ValidationErrors => {
    const nextErrors: ValidationErrors = {};
    const nextDayCount = typeof nextForm?.days === 'number' ? nextForm.days : 0;
    const nextNightCount = typeof nextForm?.nights === 'number' ? nextForm.nights : 0;
    const nextAirportSightseeingSpots = nextForm?.sightseeingSpots?.filter(spot => airportProvinceSet.has(spot));
    const nextShouldShowTransportSelector = airportProvinceSet.has(nextForm?.departurePoint) && nextAirportSightseeingSpots.length > 0;

    if (nextForm?.days === '') nextErrors.days = 'Vui lòng nhập số ngày';
    if (nextForm?.nights === '') nextErrors.nights = 'Vui lòng nhập số đêm';
    if (nextForm?.days !== '' && nextForm?.nights !== '' && nextDayCount - nextNightCount !== 0 && nextDayCount - nextNightCount !== 1) {
      nextErrors.nights = 'Số ngày chỉ được chênh số đêm 0 hoặc 1 ngày';
    }
    if (!nextForm?.name?.trim()) nextErrors.name = 'Vui lòng nhập tên chương trình tour';
    if (!nextForm?.departurePoint) nextErrors.departurePoint = 'Vui lòng chọn điểm khởi hành';
    if (nextForm?.sightseeingSpots?.length === 0) nextErrors.sightseeingSpots = 'Vui lòng chọn ít nhất một điểm tham quan';
    if (!nextForm?.lodgingStandard) nextErrors.lodgingStandard = 'Vui lòng chọn tiêu chuẩn lưu trú';
    if (!nextForm?.routeDescription?.trim()) nextErrors.routeDescription = 'Vui lòng nhập mô tả chương trình tour';
    if (!nextForm?.tourType) nextErrors.tourType = 'Vui lòng chọn loại tour';

    if (nextShouldShowTransportSelector && nextForm?.transport === 'maybay' && !nextForm?.arrivalPoint) {
      nextErrors.arrivalPoint = 'Vui lòng chọn điểm đến';
    }

    if (nextForm?.tourType === 'mua_le') {
      if (!nextForm?.holiday) {
        nextErrors.holiday = 'Vui lòng chọn dịp lễ';
      } else if (enforceCreateRules) {
        const selected = holidayOptions?.find(holiday => holiday.name === nextForm.holiday);
        if (!selected || selected?.date < minimumHolidayStartDate) {
          nextErrors.holiday = 'Dịp lễ phải bắt đầu từ ít nhất nửa tháng nữa';
        }
      }
      if (nextForm?.selectedDates?.length === 0) {
        nextErrors.selectedDates = 'Vui lòng chọn ít nhất một ngày khởi hành';
      }
    }

    if (nextForm?.tourType === 'quanh_nam') {
      if (!nextForm?.yearRoundStartDate) {
        nextErrors.yearRoundStartDate = 'Vui lòng chọn ngày bắt đầu';
      } else if (enforceCreateRules && isBeforeDateKey(nextForm?.yearRoundStartDate, minimumYearRoundStartDate)) {
        nextErrors.yearRoundStartDate = YEAR_ROUND_START_ERROR;
      }

      if (!nextForm?.yearRoundEndDate) {
        nextErrors.yearRoundEndDate = 'Vui lòng chọn ngày kết thúc';
      } else if (nextForm?.yearRoundStartDate && isValidDateKey(nextForm?.yearRoundStartDate) && isBeforeDateKey(nextForm?.yearRoundEndDate, nextForm?.yearRoundStartDate)) {
        nextErrors.yearRoundEndDate = YEAR_ROUND_END_ERROR;
      }

      if (nextForm?.weekdays?.length === 0) {
        nextErrors.weekdays = 'Vui lòng chọn ít nhất một ngày khởi hành trong tuần';
      }
    }

    return nextErrors;
  };

  const validateStepTwo = (nextForm: FormState): ValidationErrors => {
    const nextErrors: ValidationErrors = {};
    if (nextForm?.itinerary?.length === 0) {
      nextErrors.itinerary = 'Vui lòng nhập thời lượng tour trước khi khai báo lịch trình';
      return nextErrors;
    }

    nextForm?.itinerary?.forEach((day, index) => {
      if (!day?.title?.trim()) {
        nextErrors[`itinerary-title-${index}`] = `Vui lòng nhập tiêu đề ngày ${day.day}`;
      }
      if (!day?.description?.trim()) {
        nextErrors[`itinerary-description-${index}`] = `Vui lòng nhập mô tả ngày ${day.day}`;
      }
    });

    return nextErrors;
  };

  const validateStepThree = (): ValidationErrors => {
    const nextErrors: ValidationErrors = {};
    if (pricingConfig.expectedGuests <= 0) nextErrors.expectedGuests = 'Số lượng khách dự kiến phải lớn hơn 0';
    if (pricingConfig.profitMargin < 0) nextErrors.profitMargin = 'Tỷ lệ lợi nhuận mong muốn không được âm';
    if (pricingConfig.taxRate < 0) nextErrors.taxRate = 'Thuế không được âm';
    if (pricingConfig.otherCostFactor < 0) nextErrors.otherCostFactor = 'Hệ số chi phí khác không được âm';
    if (pricingConfig.guideUnitPrice <= 0) nextErrors.guideUnitPrice = 'Đơn giá hướng dẫn viên phải lớn hơn 0';
    pricingValidation.messages.forEach((message, index) => {
      nextErrors[`pricing-${index}`] = message;
    });
    return nextErrors;
  };

  const stepOneErrors = validateStepOne(form);
  const stepTwoErrors = validateStepTwo(form);
  const stepThreeErrors = validateStepThree();

  const markStepAttempted = (targetStep: 1 | 2 | 3) => {
    setStepAttempted(prev => prev[targetStep] ? prev : { ...prev, [targetStep]: true });
  };

  const getStepErrors = (targetStep: WizardStep) => {
    if (targetStep === 1) return stepOneErrors;
    if (targetStep === 2) return stepTwoErrors;
    if (targetStep === 3) return stepThreeErrors;
    return {};
  };

  const navigateToStep = (targetStep: WizardStep) => {
    if (readOnly || targetStep <= step) {
      setStep(targetStep);
      return;
    }

    let currentStep = step;
    while (currentStep < targetStep) {
      const currentErrors = getStepErrors(currentStep);
      if (Object.keys(currentErrors)?.length > 0) {
        if (currentStep <= 3) markStepAttempted(currentStep as 1 | 2 | 3);
        setStep(currentStep);
        return;
      }
      currentStep = (currentStep + 1) as WizardStep;
    }

    setStep(targetStep);
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

  const buildProgramId = () => {
    if (initialProgram?.id) return initialProgram.id;
    const maxId = existingPrograms.reduce((max, program) => {
      const match = program.id.match(/^TP(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `TP${String(maxId + 1).padStart(3, '0')}`;
  };

  const buildPersistedProgram = (mode: 'draft' | 'submit'): TourProgram => {
    const now = new Date().toISOString();

    return {
      id: buildProgramId(),
      name: form.name.trim(),
      departurePoint: form.departurePoint,
      sightseeingSpots: form.sightseeingSpots,
      duration: { days: Math.max(1, dayCount), nights: Math.max(0, nightCount) },
      lodgingStandard: form.lodgingStandard || undefined,
      transport: form.transport,
      arrivalPoint: form.transport === 'maybay' ? form.arrivalPoint || undefined : undefined,
      tourType: form.tourType || 'quanh_nam',
      routeDescription: form.routeDescription.trim(),
      holiday: form.tourType === 'mua_le' ? form.holiday || undefined : undefined,
      selectedDates: form.tourType === 'mua_le' ? form.selectedDates : [],
      weekdays: form.tourType === 'quanh_nam' ? form.weekdays : [],
      yearRoundStartDate: form.tourType === 'quanh_nam' ? form.yearRoundStartDate || undefined : undefined,
      yearRoundEndDate: form.tourType === 'quanh_nam' ? form.yearRoundEndDate || undefined : undefined,
      coverageMonths: form.tourType === 'quanh_nam' ? form.coverageMonths : undefined,
      bookingDeadline: form.bookingDeadline,
      status: mode === 'submit' ? 'draft' : (initialProgram?.status ?? 'draft'),
      inactiveReason: mode === 'submit' ? undefined : initialProgram?.inactiveReason,
      rejectionReason: mode === 'submit' ? undefined : initialProgram?.rejectionReason,
      approvalStatus: mode === 'submit' ? 'pending' : initialProgram?.approvalStatus,
      itinerary: form.itinerary.map(day => ({
        day: day.day,
        title: day.title,
        description: day.description,
        meals: day.meals,
        accommodationPoint: day.accommodationPoint || undefined,
      })),
      pricingConfig: {
        profitMargin: roundedActualProfitRate,
        taxRate: pricingConfig.taxRate,
        otherCostFactor: pricingConfig.otherCostFactor / 100,
        netPrice: pricingSummary.currentNetPrice,
        sellPriceAdult: actualPrices.adult,
        sellPriceChild: actualPrices.child,
        sellPriceInfant: actualPrices.infant,
        minParticipants: pricingConfig.expectedGuests,
      },
      draftPricingTables: pricingTableValue as TourProgramPricingTablesState,
      draftManualPricing: manualPricing,
      draftPricingOverrides: pricingOverrides,
      draftPreviewRows: previewRows as TourProgramPreviewRow[],
      createdBy: initialProgram?.createdBy ?? 'Điều phối',
      createdAt: initialProgram?.createdAt ?? now,
      updatedAt: now,
      submittedAt: mode === 'submit' ? now : initialProgram?.submittedAt,
      approvedAt: initialProgram?.approvedAt,
      rejectedAt: mode === 'submit' ? undefined : initialProgram?.rejectedAt,
    };
  };

  const persistProgram = async (mode: 'draft' | 'submit') => {
    if (readOnly || !token) return;

    const program = buildPersistedProgram(mode);

    try {
      const draftResponse = initialProgram?.id
        ? await patchTourProgram(token, initialProgram.id, program)
        : await createTourProgram(token, program);

      let persistedProgram = draftResponse.tourProgram;

      if (mode === 'submit') {
        const submitResponse = await submitTourProgram(token, persistedProgram.id);
        persistedProgram = submitResponse.tourProgram;
      }

      upsertTourProgram(persistedProgram);
      navigate(`/coordinator/tour-programs/${persistedProgram.id}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể lưu chương trình tour');
    }
  };

  const handleSaveDraft = () => {
    void persistProgram('draft');
  };

  const handleSubmitForApproval = () => {
    void persistProgram('submit');
  };

  const selectedHoliday = availableHolidays?.find(holiday => holiday.name === form?.holiday)
    ?? holidayOptions?.find(holiday => holiday.name === form?.holiday);

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
    () => canGenerateYearRoundDepartureDates
      ? buildDateRange(form?.yearRoundStartDate, form?.yearRoundEndDate, form?.weekdays)
      : [],
    [canGenerateYearRoundDepartureDates, form?.weekdays, form?.yearRoundEndDate, form?.yearRoundStartDate],
  );
  const expectedDepartureDates = useMemo(
    () => form?.tourType === 'mua_le'
      ? [...form.selectedDates].sort((left, right) => parseLocalDate(left)?.getTime() - parseLocalDate(right)?.getTime())
      : yearRoundDepartureDates,
    [form?.tourType, form.selectedDates, yearRoundDepartureDates],
  );
  const suggestedAdultPrice = roundToThousand(
    pricingSummary.currentNetPrice
      * (1 + pricingConfig.profitMargin / 100),
  );
  const suggestedChildPrice = roundToThousand(suggestedAdultPrice * 0.75);
  const suggestedInfantPrice = 0;
  const suggestedPrices: Record<EditablePriceKey, number> = {
    adult: suggestedAdultPrice,
    child: suggestedChildPrice,
    infant: suggestedInfantPrice,
    singleSupplement: pricingSummary.currentSingleSupplement,
  };
  const actualPrices: Record<EditablePriceKey, number> = {
    adult: manualPricing.adult ? pricingOverrides.adult : suggestedPrices.adult,
    child: manualPricing.child ? pricingOverrides.child : suggestedPrices.child,
    infant: manualPricing.infant ? pricingOverrides.infant : suggestedPrices.infant,
    singleSupplement: manualPricing.singleSupplement ? pricingOverrides.singleSupplement : suggestedPrices.singleSupplement,
  };
  const actualProfitRate = pricingSummary.currentNetPrice > 0
    ? ((actualPrices.adult - pricingSummary.currentNetPrice) / pricingSummary.currentNetPrice) * 100
    : 0;
  const roundedActualProfitRate = Math.round(actualProfitRate);
  const minimumOperatingGuests = actualPrices.adult > pricingSummary.currentAdultVariableCost
    ? Math.ceil(pricingSummary.currentFixedCost / (actualPrices.adult - pricingSummary.currentAdultVariableCost))
    : 0;

  const basePreviewRows = useMemo<PreviewRow[]>(() => expectedDepartureDates.map((departureDate, index) => {
    const departurePricing = pricingSummary.departurePricing[departureDate] ?? {
      adultNet: 0,
      childNet: 0,
      infantNet: 0,
      singleSupplement: 0,
      fixedCost: 0,
      adultVariableCost: 0,
      childVariableCost: 0,
      infantVariableCost: 0,
    };
    const overlappingTours = existingTourInstances
      .filter(instance => instance.departureDate >= departureDate && instance.departureDate <= addDays(departureDate, Math.max(0, dayCount - 1)))
      .map(instance => `${instance.programName} - ${instance.departureDate}`);
    const sellPrice = roundToThousand(departurePricing.adultNet * (1 + roundedActualProfitRate / 100));
    const profitPercent = departurePricing.adultNet > 0
      ? Number((((sellPrice - departurePricing.adultNet) / departurePricing.adultNet) * 100).toFixed(1))
      : 0;
    return {
      id: `T${String(index + 1).padStart(3, '0')}`,
      departureDate,
      endDate: addDays(departureDate, Math.max(0, dayCount - 1)),
      dayType: getDayType(form?.tourType === 'mua_le' ? 'mua_le' : 'quanh_nam', selectedHoliday?.name ?? '', departureDate),
      expectedGuests: pricingConfig.expectedGuests,
      costPerAdult: roundToThousand(departurePricing.adultNet),
      sellPrice,
      profitPercent,
      bookingDeadline: addDays(departureDate, -Math.max(0, form.bookingDeadline)),
      conflictLabel: overlappingTours.length > 0 ? `${overlappingTours.length} chương trình trùng thời điểm` : '0 chương trình trùng thời điểm',
      conflictDetails: overlappingTours,
      checked: true,
    };
  }), [
    dayCount,
    existingTourInstances,
    expectedDepartureDates,
    form.bookingDeadline,
    form?.tourType,
    pricingConfig.expectedGuests,
    pricingSummary.departurePricing,
    roundedActualProfitRate,
    selectedHoliday?.name,
  ]);

  const previewRows = useMemo(() => basePreviewRows.map(row => ({
    ...row,
    checked: previewEdits[row.id]?.checked ?? row.checked,
  })), [basePreviewRows, previewEdits]);

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

        {initialProgram?.rejectionReason && !readOnly && (
          <div className="mb-6 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Lý do từ chối: {initialProgram.rejectionReason}
          </div>
        )}

        <div className="flex items-center gap-0 relative mb-10">
          <div className="absolute top-4 left-0 w-full h-[2px] bg-outline-variant/30 -z-10" />
          {([
            { value: 1, label: 'Thông tin chung' },
            { value: 2, label: 'Lịch trình' },
            { value: 3, label: 'Giá & Cấu hình' },
            { value: 4, label: 'Tour dự kiến' },
          ] as { value: WizardStep; label: string }[])?.map(item => (
            <button key={item.value} type="button" onClick={() => navigateToStep(item.value)} className="flex flex-col items-center gap-2 flex-1">
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
            {stepAttempted[1] && Object.keys(stepOneErrors).length > 0 && (
              <section className="border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">Cần bổ sung thông tin trước khi chuyển bước.</p>
                <ul className="mt-2 space-y-1 text-xs text-red-700 list-disc pl-5">
                  {Array.from(new Set(Object.values(stepOneErrors).filter((message): message is string => Boolean(message)))).map(message => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </section>
            )}
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
                    onChange={e => updateForm('days', e?.target?.value === '' ? '' : Math.max(1, parseInt(e?.target?.value, 10) || 1))}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                  />
                  {stepAttempted[1] && stepOneErrors.days && (
                    <p className="text-xs text-red-500 mt-2">{stepOneErrors.days}</p>
                  )}
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
                    onChange={e => updateForm('nights', e?.target?.value === '' ? '' : Math.max(0, parseInt(e?.target?.value, 10) || 0))}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                  />
                  {stepAttempted[1] && stepOneErrors.nights && (
                    <p className="text-xs text-red-500 mt-2">{stepOneErrors.nights}</p>
                  )}
                </div>
              </div>
              {form?.days !== '' && form?.nights !== '' && dayCount - nightCount !== 0 && dayCount - nightCount !== 1 && (
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
                  {stepAttempted[1] && stepOneErrors.name && (
                    <p className="text-xs text-red-500 mt-2">{stepOneErrors.name}</p>
                  )}
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
                    {stepAttempted[1] && stepOneErrors.departurePoint && (
                      <p className="text-xs text-red-500 mt-2">{stepOneErrors.departurePoint}</p>
                    )}
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
                    {stepAttempted[1] && stepOneErrors.sightseeingSpots && (
                      <p className="text-xs text-red-500 mt-2">{stepOneErrors.sightseeingSpots}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                    Tiêu chuẩn lưu trú <span className="text-red-500">*</span>
                  </label>
                  <select
                    aria-label="Tiêu chuẩn lưu trú"
                    value={form?.lodgingStandard}
                    onChange={e => updateForm('lodgingStandard', e?.target?.value as LodgingStandard | '')}
                    className="w-full max-w-sm border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                  >
                    <option value="">Chọn tiêu chuẩn lưu trú</option>
                    {lodgingStandards.map(standard => (
                      <option key={standard} value={standard}>{standard}</option>
                    ))}
                  </select>
                  {stepAttempted[1] && stepOneErrors.lodgingStandard && (
                    <p className="text-xs text-red-500 mt-2">{stepOneErrors.lodgingStandard}</p>
                  )}
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
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    aria-label="Mô tả"
                    value={form?.routeDescription}
                    onChange={e => updateForm('routeDescription', e?.target?.value)}
                    rows={4}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none resize-none"
                    placeholder="Mô tả ngắn về hành trình, điểm nhấn của tour và phạm vi khởi hành."
                  />
                  {stepAttempted[1] && stepOneErrors.routeDescription && (
                    <p className="text-xs text-red-500 mt-2">{stepOneErrors.routeDescription}</p>
                  )}
                </div>
              </div>
            </section>

            {shouldShowTransportSelector && (
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
                    disabled={airportSightseeingSpots.length === 1}
                    className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none max-w-sm"
                  >
                    <option value="">Chọn điểm đến</option>
                    {airportSightseeingSpots.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {airportSightseeingSpots.length === 1 && (
                    <p className="text-xs text-primary/45 mt-2">Chỉ có một điểm tham quan có sân bay nên hệ thống tự chọn điểm đến.</p>
                  )}
                  {stepAttempted[1] && stepOneErrors.arrivalPoint && (
                    <p className="text-xs text-red-500 mt-2">{stepOneErrors.arrivalPoint}</p>
                  )}
                </div>
              )}
            </section>
            )}

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
                        const nextHoliday = availableHolidays?.find(holiday => holiday.name === e?.target?.value);
                        updateForm('holiday', e?.target?.value);
                        updateForm('selectedDates', []);
                        if (nextHoliday) {
                          setHolidayMonthAnchor(toDateKey(startOfMonth(new Date(nextHoliday?.date))));
                        }
                      }}
                      className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none max-w-sm"
                    >
                      <option value="">Chọn dịp lễ</option>
                      {availableHolidays?.map(h => (
                        <option key={h?.id} value={h?.name}>{h?.name} ({new Date(h?.date)?.toLocaleDateString('vi-VN')})</option>
                      ))}
                    </select>
                    {stepAttempted[1] && stepOneErrors.holiday && (
                      <p className="text-xs text-red-500 mt-2">{stepOneErrors.holiday}</p>
                    )}
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
                    {stepAttempted[1] && stepOneErrors.selectedDates && (
                      <p className="text-xs text-red-500 mt-3">{stepOneErrors.selectedDates}</p>
                    )}
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
                        min={minimumYearRoundStartDate}
                        className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                      />
                      {((form?.yearRoundStartDate && stepOneErrors.yearRoundStartDate) || (stepAttempted[1] && stepOneErrors.yearRoundStartDate)) && (
                        <p className="text-xs text-red-500 mt-2">{stepOneErrors.yearRoundStartDate}</p>
                      )}
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
                        min={form?.yearRoundStartDate || undefined}
                        disabled={!form?.yearRoundStartDate || !!stepOneErrors.yearRoundStartDate}
                        className="w-full border border-outline-variant/50 px-4 py-3 text-sm focus:border-[var(--color-secondary)] outline-none"
                      />
                      {((form?.yearRoundEndDate && stepOneErrors.yearRoundEndDate) || (stepAttempted[1] && stepOneErrors.yearRoundEndDate)) && (
                        <p className="text-xs text-red-500 mt-2">{stepOneErrors.yearRoundEndDate}</p>
                      )}
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
                    {stepAttempted[1] && stepOneErrors.weekdays ? (
                      <p className="text-xs text-red-500 mt-2">{stepOneErrors.weekdays}</p>
                    ) : (
                      <p className="text-xs text-primary/40 mt-2">Chỉ hiển thị ngày khởi hành dự kiến khi đã chọn đủ ngày bắt đầu, ngày kết thúc và ngày khởi hành trong tuần.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">
                      Thời gian mở bán tối thiểu
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
                  {shouldShowYearRoundDeparturePreview && (
                    <div className="border border-outline-variant/20 bg-[var(--color-surface)] p-4 max-w-3xl">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-primary/50 font-bold">Danh sách ngày khởi hành dự kiến</p>
                        <span className="text-xs text-primary/45">{expectedDepartureDates?.length} ngày dự kiến</span>
                      </div>
                      {expectedDepartureDates.length === 0 ? (
                        <p className="text-sm text-primary/45">Không có ngày khởi hành phù hợp trong khoảng thời gian đã chọn.</p>
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
                  )}
                </div>
              )}
            </section>

            <div className="flex justify-end">
              <button
                onClick={() => navigateToStep(2)}
                className="px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all bg-primary text-surface hover:bg-[var(--color-secondary)]">
                Tiếp theo: Lịch trình
              </button>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset disabled={readOnly} className="space-y-8 border-0 p-0 m-0">
            {stepAttempted[2] && Object.keys(stepTwoErrors).length > 0 && (
              <section className="border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">Lịch trình chưa đủ thông tin để chuyển bước.</p>
                <ul className="mt-2 space-y-1 text-xs text-red-700 list-disc pl-5">
                  {Array.from(new Set(Object.values(stepTwoErrors).filter((message): message is string => Boolean(message)))).map(message => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </section>
            )}
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

                    {idx < nightCount && (
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
                onClick={() => navigateToStep(3)}
                className="px-12 py-4 font-sans uppercase tracking-[0.2em] text-[12px] font-bold transition-all bg-primary text-surface hover:bg-[var(--color-secondary)]">
                Tiếp theo: Giá & Cấu hình
              </button>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset disabled={readOnly} className="space-y-8 border-0 p-0 m-0">
            {stepAttempted[3] && Object.keys(stepThreeErrors).length > 0 && (
              <section className="border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">Giá và cấu hình chưa đủ thông tin để chuyển tab.</p>
                <ul className="mt-2 space-y-1 text-xs text-red-700 list-disc pl-5">
                  {Array.from(new Set(Object.values(stepThreeErrors).filter((message): message is string => Boolean(message)))).map(message => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="bg-white border border-outline-variant/30 p-6">
              <h2 className="font-headline text-lg text-primary mb-1 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">payments</span>
                Thông tin cấu hình giá tour
              </h2>
              <p className="text-xs text-primary/50 mb-6">Dành cho <strong>{form?.name || 'chương trình tour'}</strong> - {dayCount} ngày {nightCount} đêm</p>

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
                  days={Math.max(1, dayCount)}
                  nights={Math.max(0, nightCount)}
                  itinerary={form?.itinerary}
                  lodgingStandard={form?.lodgingStandard}
                  sightseeingSpots={form?.sightseeingSpots}
                  departureDates={expectedDepartureDates}
                  expectedGuests={pricingConfig.expectedGuests}
                  taxRate={pricingConfig.taxRate}
                  otherCostFactor={pricingConfig.otherCostFactor}
                  guideUnitPrice={pricingConfig?.guideUnitPrice}
                  onGuideUnitPriceChange={value => updatePricingConfig('guideUnitPrice', value)}
                  value={pricingTableValue}
                  onChange={setPricingTableValue}
                  onSummaryChange={setPricingSummary}
                  onValidationChange={setPricingValidation}
                />
              </div>
            </section>

            <section className="sticky bottom-4 z-10 bg-white border border-[var(--color-secondary)]/50 shadow-sm p-5">
              <h3 className="font-semibold text-sm text-primary mb-3 bg-amber-50 inline-block px-3 py-1">Tính toán dự kiến</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {(['adult', 'child', 'infant', 'singleSupplement'] as EditablePriceKey[])?.map(key => (
                  <div key={key} className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm">{editablePriceLabels[key]}</span>
                      <button
                        type="button"
                        onClick={() => toggleManualPrice(key)}
                        className="text-secondary hover:text-primary"
                        aria-label={manualPricing[key] ? `Tự động ${editablePriceLabels[key]}` : `Sửa ${editablePriceLabels[key]}`}
                      >
                        <span className="material-symbols-outlined text-base">{manualPricing[key] ? 'restart_alt' : 'edit'}</span>
                      </button>
                    </div>
                    {manualPricing[key] ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={pricingOverrides[key]}
                          onChange={e => setPricingOverrides(prev => ({ ...prev, [key]: parseInt(e?.target?.value) || 0 }))}
                          className="w-full border border-outline-variant/50 px-3 py-2 text-sm text-right outline-none"
                        />
                        <p className="text-[10px] text-primary/40">Gợi ý: {formatMoney(suggestedPrices[key])}</p>
                      </div>
                    ) : (
                      <div className="border border-outline-variant/40 bg-[var(--color-surface)] px-3 py-2 text-right text-sm font-medium">
                        {formatMoney(suggestedPrices[key])}
                      </div>
                    )}
                  </div>
                ))}
                <div className="space-y-2">
                  <span className="text-sm">Giá net</span>
                  <div className="border border-outline-variant/40 bg-[var(--color-surface)] px-3 py-2 text-right text-sm font-medium">
                    {formatMoney(pricingSummary.currentNetPrice)}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm">Tỷ lệ lợi nhuận thực tế</span>
                  <div className="border border-outline-variant/40 bg-[var(--color-surface)] px-3 py-2 text-right text-sm font-medium">
                    {actualProfitRate.toFixed(1)}% (lưu tính tour sau: {roundedActualProfitRate}%)
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm">Số khách tối thiểu để triển khai</span>
                  <div className="border border-outline-variant/40 bg-[var(--color-surface)] px-3 py-2 text-right text-sm font-medium">
                    {minimumOperatingGuests > 0 ? formatMoney(minimumOperatingGuests) : '-'}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)}
                className="px-8 py-4 border border-outline-variant/60 text-primary font-sans uppercase tracking-[0.2em] text-[12px] hover:bg-surface transition-all">
                Quay lại Lịch trình
              </button>
              <button
                onClick={() => navigateToStep(4)}
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
              <p className="text-xs text-primary/50 mb-6">Danh sách tour sinh từ lịch khởi hành dự kiến của chương trình.</p>

              <div className="grid grid-cols-2 gap-4 max-w-xl mb-6">
                <label className="text-sm text-primary/70">
                  <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Sinh từ ngày</span>
                  <div className="w-full border border-outline-variant/50 px-4 py-2.5 bg-[var(--color-surface)]">
                    {formatDate(form?.tourType === 'quanh_nam' ? form?.yearRoundStartDate : expectedDepartureDates[0] ?? '')}
                  </div>
                </label>
                <label className="text-sm text-primary/70">
                  <span className="block text-[10px] uppercase tracking-widest text-primary/50 mb-1">Đến ngày</span>
                  <div className="w-full border border-outline-variant/50 px-4 py-2.5 bg-[var(--color-surface)]">
                    {formatDate(form?.tourType === 'quanh_nam' ? form?.yearRoundEndDate : expectedDepartureDates?.at(-1) ?? '')}
                  </div>
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
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row?.departureDate)}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row?.endDate)}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{row?.dayType}</td>
                        <td className="px-4 py-3 text-sm">{row?.expectedGuests}</td>
                        <td className="px-4 py-3 text-sm">{formatMoney(row?.costPerAdult)}</td>
                        <td className="px-4 py-3 text-sm">{formatMoney(row?.sellPrice)}</td>
                        <td className="px-4 py-3 text-sm">{row?.profitPercent}%</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(row?.bookingDeadline)}</td>
                        <td className="px-4 py-3 text-xs">
                          {row?.conflictDetails?.length > 0 ? (
                            <div className="group relative inline-block">
                              <span className="cursor-help text-amber-700 underline decoration-dotted">{row?.conflictLabel}</span>
                              <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden min-w-[260px] border border-outline-variant/30 bg-white p-3 text-primary shadow-lg group-hover:block">
                                <p className="mb-2 text-[10px] uppercase tracking-widest text-primary/45">Danh sách chương trình trùng</p>
                                <div className="space-y-1 text-xs">
                                  {row?.conflictDetails?.map(detail => <p key={`${row.id}-${detail}`}>{detail}</p>)}
                                </div>
                              </div>
                            </div>
                          ) : row?.conflictLabel}
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


