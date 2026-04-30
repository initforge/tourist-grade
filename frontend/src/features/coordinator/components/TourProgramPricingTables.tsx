import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MEAL_LABELS } from '@entities/tour-program/data/tourProgram';
import { useAppDataStore } from '@shared/store/useAppDataStore';

type Transport = 'xe' | 'maybay';
type LodgingStandard = '2 sao' | '3 sao' | '4 sao' | '5 sao' | '';
type DayMeals = ('breakfast' | 'lunch' | 'dinner')[];
type PickerKind = 'transport' | 'flight' | 'hotel' | 'meal' | 'attraction' | 'other';

interface DayFormLike {
  day: number;
  title: string;
  meals: DayMeals;
  accommodationPoint: string;
}

interface BaseSelection {
  optionId: string;
  isDefault?: boolean;
  manualPrice?: number;
}

interface OtherCostSelection extends BaseSelection {
  occurrences?: number | '';
  note?: string;
}

export interface PricingTablesValue {
  transport: BaseSelection[];
  flight: BaseSelection[];
  hotels: Record<string, BaseSelection[]>;
  meals: Record<string, BaseSelection[]>;
  attractions: Record<string, BaseSelection[]>;
  otherCosts: OtherCostSelection[];
}

export interface PricingValidationState {
  isValid: boolean;
  messages: string[];
}

export interface DeparturePricing {
  adultNet: number;
  childNet: number;
  infantNet: number;
  singleSupplement: number;
  fixedCost: number;
  adultVariableCost: number;
  childVariableCost: number;
  infantVariableCost: number;
}

export interface PricingSummary {
  currentNetPrice: number;
  currentSingleSupplement: number;
  currentFixedCost: number;
  currentAdultVariableCost: number;
  minimumOperatingGuests: number;
  guideCost: number;
  transportFixedCost: number;
  flightAdultCost: number;
  hotelCost: number;
  mealCost: number;
  attractionAdultCost: number;
  otherFixedCost: number;
  otherVariableAdultCost: number;
  departurePricing: Record<string, DeparturePricing>;
}

interface Props {
  transport: Transport;
  departurePoint: string;
  arrivalPoint: string;
  days: number;
  nights: number;
  itinerary: DayFormLike[];
  lodgingStandard?: LodgingStandard;
  sightseeingSpots?: string[];
  departureDates?: string[];
  expectedGuests?: number;
  taxRate?: number;
  otherCostFactor?: number;
  guideUnitPrice: number;
  onGuideUnitPriceChange: (value: number) => void;
  value?: PricingTablesValue;
  onChange?: (value: PricingTablesValue) => void;
  onSummaryChange?: (summary: PricingSummary) => void;
  onValidationChange?: (validation: PricingValidationState) => void;
  hideActionColumn?: boolean;
}

interface DatedPrice {
  startDate: string;
  endDate?: string;
  price: number;
}

interface HotelOption {
  id: string;
  supplierName: string;
  address: string;
  city: string;
  standard: Exclude<LodgingStandard, ''>;
  standards: Exclude<LodgingStandard, ''>[];
  singlePrices: DatedPrice[];
  doublePrices: DatedPrice[];
  triplePrices: DatedPrice[];
}

interface TransportOption {
  id: string;
  supplierName: string;
  operatingArea: string;
  serviceName: string;
  serviceLabel: string;
  capacity: number;
  suggestedPrice: number;
}

interface FlightOption {
  id: string;
  supplierName: string;
  collaborationCount: number;
  lastCollaboration: string;
}

interface MealOption {
  id: string;
  supplierName: string;
  serviceName: string;
  description: string;
  address: string;
  spots: string[];
  prices: DatedPrice[];
}

interface AttractionOption {
  id: string;
  serviceName: string;
  description: string;
  address: string;
  spots: string[];
  adultPrices: DatedPrice[];
  childPrices: DatedPrice[];
}

interface OtherOption {
  id: string;
  supplierName: string;
  serviceName: string;
  priceMode: 'Báo giá' | 'Giá niêm yết';
  formulaCount: 'Theo ngày' | 'Giá trị mặc định' | 'Nhập tay';
  formulaCountDefault?: number;
  formulaQuantity: 'Theo số người' | 'Giá trị mặc định' | 'Nhập tay';
  formulaQuantityDefault?: number;
  prices: DatedPrice[];
  isInsurance?: boolean;
}

interface HotelGroup {
  id: string;
  label: string;
  city: string;
  nights: number;
  startNight: number;
}

interface MealGroup {
  id: string;
  label: string;
  day: number;
}

interface AttractionGroup {
  id: string;
  label: string;
  day: number;
  spot: string;
}

interface PickerOption {
  id: string;
  title: string;
  columns: string[];
}

interface PickerState {
  kind: PickerKind;
  title: string;
  groupId?: string;
}

const fallbackTransportOptions: TransportOption[] = [
  {
    id: 'transport-van-tai-viet-29',
    supplierName: 'Vận tải Việt Tourist',
    operatingArea: 'Hà Nội, Đà Nẵng, Quảng Ninh',
    serviceName: 'Xe 29 chỗ',
    serviceLabel: 'Xe 29 chỗ, Xe 35 chỗ',
    capacity: 29,
    suggestedPrice: 0,
  },
  {
    id: 'transport-hoang-gia-29',
    supplierName: 'Hoàng Gia Travel Bus',
    operatingArea: 'Hà Nội, Ninh Bình, Quảng Ninh',
    serviceName: 'Xe 29 chỗ',
    serviceLabel: 'Xe 29 chỗ, Xe 45 chỗ',
    capacity: 29,
    suggestedPrice: 0,
  },
];

const fallbackFlightOptions: FlightOption[] = [
  {
    id: 'flight-vietnam-airlines',
    supplierName: 'Vietnam Airlines Corp',
    collaborationCount: 24,
    lastCollaboration: '2026-04-18',
  },
  {
    id: 'flight-vietravel-air',
    supplierName: 'Vietravel Airlines',
    collaborationCount: 12,
    lastCollaboration: '2026-03-29',
  },
];

const fallbackHotelOptions: HotelOption[] = [
  {
    id: 'hotel-da-nang-4-pearl',
    supplierName: 'Pearl Beach Hotel',
    address: '12 Võ Nguyên Giáp, Đà Nẵng',
    city: 'Đà Nẵng',
    standard: '4 sao',
    standards: ['4 sao'],
    singlePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1550000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 1750000 },
      { startDate: '2026-09-01', price: 1600000 },
    ],
    doublePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1250000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 1450000 },
      { startDate: '2026-09-01', price: 1300000 },
    ],
    triplePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1500000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 1700000 },
      { startDate: '2026-09-01', price: 1550000 },
    ],
  },
  {
    id: 'hotel-da-nang-4-riviera',
    supplierName: 'Riviera Đà Nẵng',
    address: '81 Trần Bạch Đằng, Đà Nẵng',
    city: 'Đà Nẵng',
    standard: '4 sao',
    standards: ['4 sao'],
    singlePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1480000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 1680000 },
      { startDate: '2026-09-01', price: 1520000 },
    ],
    doublePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1180000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 1380000 },
      { startDate: '2026-09-01', price: 1220000 },
    ],
    triplePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1440000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 1640000 },
      { startDate: '2026-09-01', price: 1490000 },
    ],
  },
  {
    id: 'hotel-ha-long-4-heritage',
    supplierName: 'Khách sạn Di Sản Việt',
    address: '12 Bãi Cháy, Hạ Long',
    city: 'Quảng Ninh',
    standard: '4 sao',
    standards: ['4 sao'],
    singlePrices: [
      { startDate: '2026-01-01', endDate: '2026-04-30', price: 1500000 },
      { startDate: '2026-05-01', endDate: '2026-08-31', price: 1760000 },
      { startDate: '2026-09-01', price: 1550000 },
    ],
    doublePrices: [
      { startDate: '2026-01-01', endDate: '2026-04-30', price: 1200000 },
      { startDate: '2026-05-01', endDate: '2026-08-31', price: 1450000 },
      { startDate: '2026-09-01', price: 1250000 },
    ],
    triplePrices: [
      { startDate: '2026-01-01', endDate: '2026-04-30', price: 1440000 },
      { startDate: '2026-05-01', endDate: '2026-08-31', price: 1680000 },
      { startDate: '2026-09-01', price: 1490000 },
    ],
  },
  {
    id: 'hotel-ha-noi-3-old-quarter',
    supplierName: 'Old Quarter Central',
    address: '15 Hàng Gà, Hà Nội',
    city: 'Hà Nội',
    standard: '3 sao',
    standards: ['3 sao'],
    singlePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1200000 },
      { startDate: '2026-06-01', price: 1280000 },
    ],
    doublePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 980000 },
      { startDate: '2026-06-01', price: 1050000 },
    ],
    triplePrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 1180000 },
      { startDate: '2026-06-01', price: 1250000 },
    ],
  },
];

const fallbackMealOptions: MealOption[] = [
  {
    id: 'meal-da-nang-ocean',
    supplierName: 'Nhà hàng Biển Xanh',
    serviceName: 'Set menu miền Trung',
    description: 'Thực đơn đoàn 8 món',
    address: '95 Võ Nguyên Giáp, Đà Nẵng',
    spots: ['Đà Nẵng'],
    prices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 165000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 185000 },
      { startDate: '2026-09-01', price: 170000 },
    ],
  },
  {
    id: 'meal-ha-long-harbor',
    supplierName: 'Hạ Long Harbor',
    serviceName: 'Set hải sản đoàn',
    description: 'Hải sản địa phương, phục vụ đoàn',
    address: '28 Bãi Cháy, Hạ Long',
    spots: ['Quảng Ninh'],
    prices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 178000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 198000 },
      { startDate: '2026-09-01', price: 182000 },
    ],
  },
  {
    id: 'meal-ha-noi-lotus',
    supplierName: 'Lotus Hà Nội',
    serviceName: 'Set menu đoàn',
    description: 'Bữa ăn đoàn 10 khách / bàn',
    address: '88 Tràng Tiền, Hà Nội',
    spots: ['Hà Nội', 'Ninh Bình'],
    prices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 150000 },
      { startDate: '2026-06-01', price: 162000 },
    ],
  },
];

const fallbackAttractionOptions: AttractionOption[] = [
  {
    id: 'ticket-ba-na',
    serviceName: 'Vé tham quan Bà Nà Hills',
    description: 'Cáp treo + tham quan',
    address: 'Hòa Ninh, Hòa Vang, Đà Nẵng',
    spots: ['Đà Nẵng'],
    adultPrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 820000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 860000 },
      { startDate: '2026-09-01', price: 830000 },
    ],
    childPrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 650000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 690000 },
      { startDate: '2026-09-01', price: 660000 },
    ],
  },
  {
    id: 'ticket-sunworld-halong',
    serviceName: 'Vé Sun World Hạ Long',
    description: 'Công viên + cáp treo',
    address: 'Bãi Cháy, Hạ Long',
    spots: ['Quảng Ninh'],
    adultPrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 450000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 520000 },
      { startDate: '2026-09-01', price: 470000 },
    ],
    childPrices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 320000 },
      { startDate: '2026-06-01', endDate: '2026-08-31', price: 360000 },
      { startDate: '2026-09-01', price: 330000 },
    ],
  },
  {
    id: 'ticket-van-mieu',
    serviceName: 'Vé Văn Miếu',
    description: 'Tham quan di tích',
    address: '58 Quốc Tử Giám, Hà Nội',
    spots: ['Hà Nội'],
    adultPrices: [{ startDate: '2026-01-01', price: 70000 }],
    childPrices: [{ startDate: '2026-01-01', price: 35000 }],
  },
];

const defaultOtherOptions: OtherOption[] = [
  {
    id: 'other-insurance',
    supplierName: 'Bảo Việt Travel Care',
    serviceName: 'Bảo hiểm du lịch',
    priceMode: 'Giá niêm yết',
    formulaCount: 'Giá trị mặc định',
    formulaCountDefault: 1,
    formulaQuantity: 'Theo số người',
    prices: [
      { startDate: '2026-01-01', endDate: '2026-06-30', price: 40000 },
      { startDate: '2026-07-01', price: 50000 },
    ],
    isInsurance: true,
  },
  {
    id: 'other-water',
    supplierName: 'Aqua Tour Supply',
    serviceName: 'Nước uống trên xe',
    priceMode: 'Giá niêm yết',
    formulaCount: 'Theo ngày',
    formulaQuantity: 'Theo số người',
    prices: [
      { startDate: '2026-01-01', endDate: '2026-05-31', price: 12000 },
      { startDate: '2026-06-01', price: 15000 },
    ],
  },
  {
    id: 'other-team-building',
    supplierName: 'Event House',
    serviceName: 'Đạo cụ team building',
    priceMode: 'Báo giá',
    formulaCount: 'Nhập tay',
    formulaQuantity: 'Giá trị mặc định',
    formulaQuantityDefault: 1,
    prices: [],
  },
];

const emptyValue = (): PricingTablesValue => ({
  transport: [],
  flight: [],
  hotels: {},
  meals: {},
  attractions: {},
  otherCosts: [],
});

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function formatDate(value: string) {
  return parseLocalDate(value).toLocaleDateString('vi-VN');
}

function formatMoney(value: number) {
  return Math.round(value).toLocaleString('vi-VN');
}

function roundToThousand(value: number) {
  return Math.ceil(value / 1000) * 1000;
}

function extractSpotsFromText(source: string, sightseeingSpots: string[]) {
  const normalizedSource = source.toLowerCase();
  return sightseeingSpots.filter((spot) => normalizedSource.includes(spot.toLowerCase()));
}

function extractHotelStandard(source: string): Exclude<LodgingStandard, ''> {
  const matched = source.match(/([2-5])\s*sao/i);
  const value = matched?.[1];
  if (value === '2' || value === '3' || value === '4' || value === '5') {
    return `${value} sao`;
  }
  return '3 sao';
}

function extractHotelStandards(source: string): Exclude<LodgingStandard, ''>[] {
  const matches = Array.from(source.matchAll(/([2-5])\s*sao/gi))
    .map(match => `${match[1]} sao` as Exclude<LodgingStandard, ''>);
  return matches.length > 0 ? Array.from(new Set(matches)) : [extractHotelStandard(source)];
}

function normalizeDefaults<T extends BaseSelection>(rows: T[]) {
  if (rows.length === 0) return rows;
  const existingDefaultIndex = rows.findIndex(row => row.isDefault);
  const defaultIndex = existingDefaultIndex >= 0 ? existingDefaultIndex : 0;
  return rows.map((row, index) => ({ ...row, isDefault: index === defaultIndex }));
}

function resolveApplicablePrice(prices: DatedPrice[], dateKey: string) {
  const active = prices.find(price => price.startDate <= dateKey && (!price.endDate || price.endDate >= dateKey));
  if (active) return active.price;

  const fallback = prices
    .filter(price => price.startDate <= dateKey && !price.endDate)
    .sort((left, right) => right.startDate.localeCompare(left.startDate))[0];
  return fallback?.price ?? 0;
}

function getServiceCapacity(service: { capacity?: number; name: string }) {
  if (typeof service.capacity === 'number' && service.capacity > 0) {
    return service.capacity;
  }

  const matched = service.name.match(/(\d+)\s*chỗ/i);
  return matched ? Number(matched[1]) : 0;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function SelectionModal({
  title,
  options,
  onClose,
  onConfirm,
}: {
  title: string;
  options: PickerOption[];
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter(option =>
      [option.title, ...option.columns].join(' ').toLowerCase().includes(keyword),
    );
  }, [options, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-selector-title"
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-8 py-6">
          <div>
            <h2 id="pricing-selector-title" className="font-serif text-3xl text-primary">{title}</h2>
            <p className="mt-2 text-sm text-primary/55">Cho phép tìm kiếm và chọn nhiều mục cùng lúc.</p>
          </div>
          <button onClick={onClose} className="text-primary/50 hover:text-primary" aria-label="Đóng popup chọn dịch vụ">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-5 p-8">
          <div className="max-w-md">
            <label className="text-[10px] uppercase tracking-widest text-primary/55 font-bold mb-2 block">
              Tìm kiếm
            </label>
            <input
              aria-label="Tìm kiếm dịch vụ"
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="w-full border border-outline-variant/40 px-4 py-3 text-sm outline-none"
              placeholder="Tên nhà cung cấp, dịch vụ, địa chỉ..."
            />
          </div>
          <div className="overflow-hidden border border-outline-variant/20">
            <table className="w-full text-left text-sm">
              <tbody>
                {filteredOptions.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-primary/45">Không có lựa chọn phù hợp.</td>
                  </tr>
                ) : filteredOptions.map(option => {
                  const checked = selectedIds.includes(option.id);
                  return (
                    <tr key={option.id} className="border-t border-outline-variant/10 first:border-t-0 align-top">
                      <td className="w-14 px-5 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedIds(current => (
                            checked ? current.filter(id => id !== option.id) : [...current, option.id]
                          ))}
                          aria-label={`Chọn ${option.title}`}
                          className="h-4 w-4 accent-[var(--color-secondary)]"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-primary">{option.title}</p>
                        <div className="mt-1 grid gap-1 text-xs text-primary/55">
                          {option.columns.map((column, index) => (
                            <p key={`${option.id}-${index}`}>{column}</p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-outline-variant/40 text-xs font-bold uppercase tracking-widest text-primary/70"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedIds)}
              disabled={selectedIds.length === 0}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-widest ${
                selectedIds.length > 0
                  ? 'bg-primary text-white hover:bg-[var(--color-secondary)]'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              Thêm đã chọn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TourProgramPricingTables({
  transport,
  departurePoint,
  arrivalPoint,
  days,
  nights,
  itinerary,
  lodgingStandard = '',
  sightseeingSpots = [],
  departureDates = [],
  expectedGuests = 1,
  taxRate = 0,
  otherCostFactor = 0,
  guideUnitPrice,
  onGuideUnitPriceChange,
  value,
  onChange,
  onSummaryChange,
  onValidationChange,
  hideActionColumn = false,
}: Props) {
  const suppliers = useAppDataStore((state) => state.suppliers);
  const services = useAppDataStore((state) => state.services);
  const [internalValue, setInternalValue] = useState<PricingTablesValue>(() => emptyValue());
  const [picker, setPicker] = useState<PickerState | null>(null);
  const lastSummaryRef = useRef('');
  const lastValidationRef = useRef('');
  const pricingValue = value ?? internalValue;
  const firstDepartureDate = departureDates[0] ?? toDateKey(new Date());
  const allDepartureDates = departureDates.length > 0 ? departureDates : [firstDepartureDate];
  const transportOptions: TransportOption[] = (() => {
    const transportSuppliers = suppliers.filter((supplier) => supplier.category === 'Vận chuyển');
    const derived = transportSuppliers
      .flatMap((supplier) => {
      const roadServices = supplier.services
        .filter((item) => item.transportType === 'Xe' || item.name.toLowerCase().includes('xe'))
        .map((item) => ({ service: item, capacity: getServiceCapacity(item) }))
        .filter((item) => item.capacity >= expectedGuests)
        .sort((left, right) => left.capacity - right.capacity);
      const best = roadServices[0];
      if (!best) return [];
      const suggestedPrice = resolveApplicablePrice(
        best.service.prices.map((price) => ({ startDate: price.fromDate, endDate: price.toDate || undefined, price: price.unitPrice })),
        firstDepartureDate,
      );
      return [{
        id: `${supplier.id}-${best.service.id}`,
        supplierName: supplier.name,
        operatingArea: supplier.operatingArea || supplier.address || '-',
        serviceName: best.service.name,
        serviceLabel: `${best.service.name} (${best.capacity} chỗ)`,
        capacity: best.capacity,
        suggestedPrice,
      }];
      })
      .filter((item) => item.serviceLabel.trim().length > 0);
    return derived.length > 0 ? derived : (transportSuppliers.length === 0 ? fallbackTransportOptions : []);
  })();
  const flightOptions = useMemo<FlightOption[]>(() => {
    const derived = suppliers
      .filter((supplier) => supplier.category === 'Vận chuyển')
      .map((supplier) => {
      const flightServices = supplier.services.filter((item) => item.transportType === 'Máy bay' || item.name.toLowerCase().includes('vé'));
      const lastCollaboration = flightServices
        .flatMap((item) => item.prices)
        .map((item) => item.fromDate)
        .sort()
        .at(-1) ?? '';
      return {
        id: `${supplier.id}-flight`,
        supplierName: supplier.name,
        collaborationCount: flightServices.reduce((sum, item) => sum + Math.max(1, item.prices.length), 0),
        lastCollaboration,
      };
      })
      .filter((item) => item.collaborationCount > 0);
    return derived.length > 0 ? derived : fallbackFlightOptions;
  }, [suppliers]);
  const hotelOptions = useMemo<HotelOption[]>(() => {
    const derived = suppliers
      .filter((supplier) => supplier.category === 'Khách sạn')
      .reduce<HotelOption[]>((result, supplier) => {
      const single = supplier.services.find((item) => item.name.toLowerCase().includes('đơn'));
      const double = supplier.services.find((item) => item.name.toLowerCase().includes('đôi'));
      const triple = supplier.services.find((item) => item.name.toLowerCase().includes('ba'));
      if (!single || !double || !triple) return result;
      const standards = extractHotelStandards(`${supplier.standards?.join(' ') ?? ''} ${supplier.service} ${supplier.description}`);
      result.push({
        id: supplier.id,
        supplierName: supplier.name,
        address: supplier.address || supplier.operatingArea || '-',
        city: extractSpotsFromText(`${supplier.address} ${supplier.operatingArea}`, sightseeingSpots)[0] ?? supplier.operatingArea.split(',')[0]?.trim() ?? '',
        standard: standards[0],
        standards,
        singlePrices: single.prices.map((price): DatedPrice => ({ startDate: price.fromDate, endDate: price.toDate || undefined, price: price.unitPrice })),
        doublePrices: double.prices.map((price): DatedPrice => ({ startDate: price.fromDate, endDate: price.toDate || undefined, price: price.unitPrice })),
        triplePrices: triple.prices.map((price): DatedPrice => ({ startDate: price.fromDate, endDate: price.toDate || undefined, price: price.unitPrice })),
      });
      return result;
      }, []);
    return derived.length > 0 ? derived : fallbackHotelOptions;
  }, [sightseeingSpots, suppliers]);
  const mealOptions = useMemo<MealOption[]>(() => {
    const derived = suppliers
      .flatMap((supplier) => {
      const sourceServices = supplier.category === 'Nhà hàng'
        ? [...supplier.mealServices, ...supplier.services]
        : supplier.mealServices;
      const uniqueServices = Array.from(new Map(sourceServices.map((service) => [service.id, service])).values());
      return uniqueServices.map((service) => ({
        id: service.id,
        supplierName: supplier.name,
        serviceName: service.name,
        description: service.description || service.menu || '',
        address: supplier.address || supplier.operatingArea || '-',
        spots: extractSpotsFromText(`${supplier.address} ${supplier.operatingArea}`, sightseeingSpots),
        prices: service.prices.map((price) => ({ startDate: price.fromDate, endDate: price.toDate || undefined, price: price.unitPrice })),
      }));
    });
    return derived.length > 0 ? derived : fallbackMealOptions;
  }, [sightseeingSpots, suppliers]);
  const attractionOptions = useMemo<AttractionOption[]>(() => {
    const derived = services
      .filter((service) => service.category === 'Vé tham quan')
      .map((service) => {
      const adultPrices = service.prices
        .filter((price) => !price.note || price.note.toLowerCase().includes('người lớn'))
        .map((price) => ({ startDate: price.effectiveDate, endDate: price.endDate || undefined, price: price.unitPrice }));
      const childPrices = service.setup === 'Theo độ tuổi'
        ? service.prices
          .filter((price) => price.note.toLowerCase().includes('trẻ em'))
          .map((price) => ({ startDate: price.effectiveDate, endDate: price.endDate || undefined, price: price.unitPrice }))
        : adultPrices;
      return {
        id: service.id,
        serviceName: service.name,
        description: service.description,
        address: service.province || service.contactInfo || '-',
        spots: service.province ? [service.province] : sightseeingSpots,
        adultPrices,
        childPrices: childPrices.length > 0 ? childPrices : adultPrices,
      };
      });
    return derived.length > 0 ? derived : fallbackAttractionOptions;
  }, [services, sightseeingSpots]);
  const otherOptions = useMemo<OtherOption[]>(() => {
    const serviceOptions = services
      .filter((service) => service.category !== 'Vé tham quan')
      .map((service) => ({
      id: service.id,
      supplierName: service.supplierName || '-',
      serviceName: service.name,
      priceMode: service.priceMode as OtherOption['priceMode'],
      formulaCount: (service.formulaCount as OtherOption['formulaCount']) ?? 'Giá trị mặc định',
      formulaCountDefault: service.formulaCountDefault ? Number(service.formulaCountDefault) : undefined,
      formulaQuantity: (service.formulaQuantity as OtherOption['formulaQuantity']) ?? 'Theo số người',
      formulaQuantityDefault: service.formulaQuantityDefault && !Number.isNaN(Number(service.formulaQuantityDefault))
        ? Number(service.formulaQuantityDefault)
        : undefined,
      prices: service.prices.map((price) => ({ startDate: price.effectiveDate, endDate: price.endDate || undefined, price: price.unitPrice })),
      isInsurance: service.name.toLowerCase().includes('bảo hiểm'),
    }));
    return serviceOptions.some((option) => option.isInsurance)
      ? serviceOptions
      : [...defaultOtherOptions.filter((option) => option.isInsurance), ...serviceOptions];
  }, [services]);

  const updateValue = useCallback((updater: PricingTablesValue | ((current: PricingTablesValue) => PricingTablesValue)) => {
    const next = typeof updater === 'function' ? updater(pricingValue) : updater;
    const nextSerialized = JSON.stringify(next);
    const currentSerialized = JSON.stringify(pricingValue);
    if (nextSerialized === currentSerialized) {
      return;
    }
    if (value) {
      onChange?.(next);
      return;
    }
    setInternalValue(next);
    onChange?.(next);
  }, [onChange, pricingValue, value]);

  const hotelGroups = useMemo<HotelGroup[]>(() => {
    const groups: HotelGroup[] = [];
    let current: HotelGroup | null = null;

    for (const day of itinerary.slice(0, Math.max(0, nights))) {
      if (!day.accommodationPoint) continue;
      if (current && current.city === day.accommodationPoint) {
        current.nights += 1;
        continue;
      }
      if (current) groups.push(current);
      current = {
        id: `stay-${day.day}`,
        label: `Lưu trú - Đêm ${day.day}`,
        city: day.accommodationPoint,
        nights: 1,
        startNight: day.day,
      };
    }

    if (current) groups.push(current);
    return groups.map(group => ({
      ...group,
      label: group.nights > 1
        ? `Lưu trú - Đêm ${group.startNight}${group.nights > 1 ? `, ${group.startNight + group.nights - 1}` : ''}`
        : `Lưu trú - Đêm ${group.startNight}`,
    }));
  }, [itinerary, nights]);

  const mealGroups = useMemo<MealGroup[]>(() => itinerary.flatMap(day =>
    day.meals.map(meal => ({
      id: `meal-${day.day}-${meal}`,
      label: `Ngày ${day.day} - ${MEAL_LABELS[meal]}`,
      day: day.day,
    })),
  ), [itinerary]);

  const attractionGroups = useMemo<AttractionGroup[]>(() => itinerary.slice(0, Math.max(1, days)).map((day, index) => ({
    id: `attraction-${day.day}`,
    label: `Ngày ${day.day}`,
    day: day.day,
    spot: day.accommodationPoint || sightseeingSpots[index] || sightseeingSpots[0] || '',
  })), [days, itinerary, sightseeingSpots]);

  const hotelOptionsByGroup = useMemo(() => Object.fromEntries(
    hotelGroups.map(group => [
      group.id,
      hotelOptions.filter(option => option.city === group.city && (!lodgingStandard || option.standards.includes(lodgingStandard))),
    ]),
  ) as Record<string, HotelOption[]>, [hotelGroups, hotelOptions, lodgingStandard]);

  const mealOptionsByGroup = useMemo(() => Object.fromEntries(
    mealGroups.map(group => [
      group.id,
      mealOptions.filter(option => option.spots.some(spot => sightseeingSpots.includes(spot))),
    ]),
  ) as Record<string, MealOption[]>, [mealGroups, mealOptions, sightseeingSpots]);

  const attractionOptionsByGroup = useMemo(() => Object.fromEntries(
    attractionGroups.map(group => [
      group.id,
      attractionOptions.filter(option => !group.spot || option.spots.includes(group.spot)),
    ]),
  ) as Record<string, AttractionOption[]>, [attractionGroups, attractionOptions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      updateValue(current => {
        const normalized: PricingTablesValue = {
          transport: normalizeDefaults(current.transport.filter(selection => transportOptions.some(option => option.id === selection.optionId))),
          flight: transport === 'maybay'
            ? normalizeDefaults(current.flight.filter(selection => flightOptions.some(option => option.id === selection.optionId)))
            : [],
          hotels: {},
          meals: {},
          attractions: {},
          otherCosts: current.otherCosts.filter(selection => otherOptions.some(option => option.id === selection.optionId)),
        };

        const defaultInsuranceOption = otherOptions.find(option => option.isInsurance);
        if (defaultInsuranceOption && !normalized.otherCosts.some(selection => otherOptions.find(option => option.id === selection.optionId)?.isInsurance)) {
          normalized.otherCosts.unshift({ optionId: defaultInsuranceOption.id });
        }

        if (hideActionColumn && normalized.transport.length === 0 && transportOptions.length > 0) {
          normalized.transport = [{ optionId: transportOptions[0].id, isDefault: true, manualPrice: 0 }];
        }

        if (hideActionColumn && transport === 'maybay' && normalized.flight.length === 0 && flightOptions.length > 0) {
          normalized.flight = [{ optionId: flightOptions[0].id, isDefault: true, manualPrice: 0 }];
        }

        hotelGroups.forEach(group => {
          const kept = current.hotels[group.id]?.filter(selection =>
            (hotelOptionsByGroup[group.id] ?? []).some(option => option.id === selection.optionId),
          ) ?? [];
          normalized.hotels[group.id] = normalizeDefaults(
            hideActionColumn && kept.length === 0 && (hotelOptionsByGroup[group.id] ?? []).length > 0
              ? [{ optionId: hotelOptionsByGroup[group.id][0].id, isDefault: true }]
              : kept,
          );
        });

        mealGroups.forEach(group => {
          const kept = current.meals[group.id]?.filter(selection =>
            (mealOptionsByGroup[group.id] ?? []).some(option => option.id === selection.optionId),
          ) ?? [];
          normalized.meals[group.id] = normalizeDefaults(
            hideActionColumn && kept.length === 0 && (mealOptionsByGroup[group.id] ?? []).length > 0
              ? [{ optionId: mealOptionsByGroup[group.id][0].id, isDefault: true }]
              : kept,
          );
        });

        attractionGroups.forEach(group => {
          const kept = current.attractions[group.id]?.filter(selection =>
            (attractionOptionsByGroup[group.id] ?? []).some(option => option.id === selection.optionId),
          ) ?? [];
          normalized.attractions[group.id] = normalizeDefaults(
            hideActionColumn && kept.length === 0 && (attractionOptionsByGroup[group.id] ?? []).length > 0
              ? [{ optionId: attractionOptionsByGroup[group.id][0].id, isDefault: true }]
              : kept,
          );
        });

        const currentSerialized = JSON.stringify(current);
        const normalizedSerialized = JSON.stringify(normalized);
        return currentSerialized === normalizedSerialized ? current : normalized;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    attractionGroups,
    attractionOptionsByGroup,
    flightOptions,
    hideActionColumn,
    hotelGroups,
    hotelOptionsByGroup,
    mealGroups,
    mealOptionsByGroup,
    otherOptions,
    transport,
    transportOptions,
    updateValue,
  ]);

  const defaultTransport = normalizeDefaults(pricingValue.transport).find(item => item.isDefault);
  const defaultFlight = normalizeDefaults(pricingValue.flight).find(item => item.isDefault);
  const selectedMealOptionIds = useMemo(
    () => new Set(Object.values(pricingValue.meals).flatMap((rows) => rows.map((row) => row.optionId))),
    [pricingValue.meals],
  );
  const selectedAttractionOptionIds = useMemo(
    () => new Set(Object.values(pricingValue.attractions).flatMap((rows) => rows.map((row) => row.optionId))),
    [pricingValue.attractions],
  );

  const getHotelDisplayPrices = (selection: BaseSelection, group: HotelGroup, departureDate: string) => {
    const option = hotelOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
    if (!option) return { doublePrice: 0, singleSupplement: 0 };
    const nightlyDates = Array.from({ length: group.nights }, (_, index) => addDays(departureDate, group.startNight - 1 + index));
    const doublePrice = roundToThousand(average(nightlyDates.map(date => resolveApplicablePrice(option.doublePrices, date))));
    const singlePrice = roundToThousand(average(nightlyDates.map(date => resolveApplicablePrice(option.singlePrices, date))));
    return {
      doublePrice,
      singleSupplement: Math.max(0, roundToThousand(singlePrice - doublePrice / 2)),
    };
  };

  const buildDeparturePricing = (departureDate: string): DeparturePricing => {
    const transportFixedCost = defaultTransport?.manualPrice ?? 0;
    const flightAdultCost = transport === 'maybay' ? (defaultFlight?.manualPrice ?? 0) : 0;
    const hotelPriceRows = hotelGroups.map(group => {
      const selected = normalizeDefaults(pricingValue.hotels[group.id] ?? []).find(item => item.isDefault);
      return selected ? getHotelDisplayPrices(selected, group, departureDate) : { doublePrice: 0, singleSupplement: 0 };
    });
    const hotelCost = hotelPriceRows.reduce((sum, item) => sum + item.doublePrice / 2, 0);
    const singleSupplement = hotelPriceRows.reduce((sum, item) => sum + item.singleSupplement, 0);
    const mealCost = mealGroups.reduce((sum, group) => {
      const selected = normalizeDefaults(pricingValue.meals[group.id] ?? []).find(item => item.isDefault);
      const option = mealOptionsByGroup[group.id]?.find(item => item.id === selected?.optionId);
      return sum + (option ? resolveApplicablePrice(option.prices, addDays(departureDate, group.day - 1)) : 0);
    }, 0);
    const attractionAdultCost = attractionGroups.reduce((sum, group) => {
      const selections = pricingValue.attractions[group.id] ?? [];
      return sum + selections.reduce((groupSum, selection) => {
        const option = attractionOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
        return groupSum + (option ? resolveApplicablePrice(option.adultPrices, addDays(departureDate, group.day - 1)) : 0);
      }, 0);
    }, 0);
    const attractionChildCost = attractionGroups.reduce((sum, group) => {
      const selections = pricingValue.attractions[group.id] ?? [];
      return sum + selections.reduce((groupSum, selection) => {
        const option = attractionOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
        return groupSum + (option ? resolveApplicablePrice(option.childPrices, addDays(departureDate, group.day - 1)) : 0);
      }, 0);
    }, 0);
    const otherBreakdown = pricingValue.otherCosts.reduce((acc, selection) => {
      const option = otherOptions.find(item => item.id === selection.optionId);
      if (!option) return acc;
      const manualPrice = selection.manualPrice ?? 0;
      const listedPrice = option.priceMode === 'Giá niêm yết'
        ? (
          option.formulaCount === 'Theo ngày'
            ? roundToThousand(average(Array.from({ length: Math.max(1, days) }, (_, index) =>
              resolveApplicablePrice(option.prices, addDays(departureDate, index)),
            )))
            : resolveApplicablePrice(option.prices, departureDate)
        )
        : manualPrice;
      const occurrences = option.formulaCount === 'Nhập tay'
        ? Number(selection.occurrences || 0)
        : option.formulaCount === 'Theo ngày'
          ? Math.max(1, days)
          : Math.max(1, option.formulaCountDefault ?? 1);
      const quantity = option.formulaQuantity === 'Theo số người'
        ? Math.max(1, expectedGuests)
        : Math.max(1, option.formulaQuantityDefault ?? 1);
      const total = listedPrice * Math.max(1, occurrences) * quantity;
      const perGuest = option.formulaQuantity === 'Theo số người'
        ? listedPrice * Math.max(1, occurrences)
        : total / Math.max(1, expectedGuests);
      acc.variableAdult += perGuest;
      acc.variableChild += perGuest;
      acc.variableInfant += perGuest;
      return acc;
    }, { variableAdult: 0, variableChild: 0, variableInfant: 0 });
    const fixedCost = transportFixedCost + guideUnitPrice;
    const variableAdult = flightAdultCost + hotelCost + mealCost + attractionAdultCost + otherBreakdown.variableAdult;
    const variableChild = (transport === 'maybay' ? Math.round(flightAdultCost * 0.75) : 0) + Math.round(hotelCost * 0.75) + mealCost + attractionChildCost + otherBreakdown.variableChild;
    const variableInfant = (transport === 'maybay' ? Math.round(flightAdultCost * 0.1) : 0) + otherBreakdown.variableInfant;
    const netMultiplier = (1 + taxRate / 100) * (1 + otherCostFactor / 100);
    return {
      adultNet: Math.round((fixedCost / Math.max(1, expectedGuests) + variableAdult) * netMultiplier),
      childNet: Math.round((fixedCost / Math.max(1, expectedGuests) + variableChild) * netMultiplier),
      infantNet: Math.round((fixedCost / Math.max(1, expectedGuests) + variableInfant) * netMultiplier),
      singleSupplement,
      fixedCost,
      adultVariableCost: variableAdult,
      childVariableCost: variableChild,
      infantVariableCost: variableInfant,
    };
  };

  const summary: PricingSummary = (() => {
    const currentPricing = buildDeparturePricing(firstDepartureDate);
    const currentHotel = hotelGroups.reduce((sum, group) => {
      const selected = normalizeDefaults(pricingValue.hotels[group.id] ?? []).find(item => item.isDefault);
      return selected ? sum + getHotelDisplayPrices(selected, group, firstDepartureDate).doublePrice / 2 : sum;
    }, 0);
    const currentMeal = mealGroups.reduce((sum, group) => {
      const selected = normalizeDefaults(pricingValue.meals[group.id] ?? []).find(item => item.isDefault);
      const option = mealOptionsByGroup[group.id]?.find(item => item.id === selected?.optionId);
      return sum + (option ? resolveApplicablePrice(option.prices, addDays(firstDepartureDate, group.day - 1)) : 0);
    }, 0);
    const currentAttraction = attractionGroups.reduce((sum, group) => {
      const selections = pricingValue.attractions[group.id] ?? [];
      return sum + selections.reduce((groupSum, selection) => {
        const option = attractionOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
        return groupSum + (option ? resolveApplicablePrice(option.adultPrices, addDays(firstDepartureDate, group.day - 1)) : 0);
      }, 0);
    }, 0);
    const otherBreakdown = pricingValue.otherCosts.reduce((acc, selection) => {
      const option = otherOptions.find(item => item.id === selection.optionId);
      if (!option) return acc;
      const price = option.priceMode === 'Giá niêm yết'
        ? (
          option.formulaCount === 'Theo ngày'
            ? roundToThousand(average(Array.from({ length: Math.max(1, days) }, (_, index) =>
              resolveApplicablePrice(option.prices, addDays(firstDepartureDate, index)),
            )))
            : resolveApplicablePrice(option.prices, firstDepartureDate)
        )
        : selection.manualPrice ?? 0;
      const occurrences = option.formulaCount === 'Nhập tay'
        ? Number(selection.occurrences || 0)
        : option.formulaCount === 'Theo ngày'
          ? Math.max(1, days)
          : Math.max(1, option.formulaCountDefault ?? 1);
      const total = price * Math.max(1, occurrences) * (option.formulaQuantity === 'Theo số người' ? Math.max(1, expectedGuests) : Math.max(1, option.formulaQuantityDefault ?? 1));
      const perGuest = option.formulaQuantity === 'Theo số người'
        ? price * Math.max(1, occurrences)
        : total / Math.max(1, expectedGuests);
      acc.variableAdult += perGuest;
      return acc;
    }, { variableAdult: 0 });
    const minimumOperatingGuests = currentPricing.adultNet > currentPricing.adultVariableCost
      ? Math.ceil(currentPricing.fixedCost / (currentPricing.adultNet - currentPricing.adultVariableCost))
      : 0;
    return {
      currentNetPrice: currentPricing.adultNet,
      currentSingleSupplement: currentPricing.singleSupplement,
      currentFixedCost: currentPricing.fixedCost,
      currentAdultVariableCost: currentPricing.adultVariableCost,
      minimumOperatingGuests,
      guideCost: guideUnitPrice,
      transportFixedCost: defaultTransport?.manualPrice ?? 0,
      flightAdultCost: transport === 'maybay' ? (defaultFlight?.manualPrice ?? 0) : 0,
      hotelCost: currentHotel,
      mealCost: currentMeal,
      attractionAdultCost: currentAttraction,
      otherFixedCost: 0,
      otherVariableAdultCost: otherBreakdown.variableAdult,
      departurePricing: Object.fromEntries(allDepartureDates.map(date => [date, buildDeparturePricing(date)])),
    };
  })();

  useEffect(() => {
    const serialized = JSON.stringify(summary);
    if (serialized === lastSummaryRef.current) {
      return;
    }
    lastSummaryRef.current = serialized;
    onSummaryChange?.(summary);
  }, [onSummaryChange, summary]);

  const validation: PricingValidationState = (() => {
    const messages: string[] = [];

    if (transportOptions.length === 0) {
      messages.push('Không có dịch vụ xe đủ sức chứa số lượng khách dự kiến. Vui lòng giảm số khách hoặc chọn phương án vận chuyển khác.');
    } else if (pricingValue.transport.length === 0) {
      messages.push('Xe tham quan chưa có nhà cung cấp.');
    } else if ((defaultTransport?.manualPrice ?? 0) <= 0) {
      messages.push('Xe tham quan chưa nhập đơn giá.');
    }

    if (transport === 'maybay') {
      if (pricingValue.flight.length === 0) {
        messages.push('Vé máy bay chưa có nhà cung cấp.');
      } else if ((defaultFlight?.manualPrice ?? 0) <= 0) {
        messages.push('Vé máy bay chưa nhập đơn giá.');
      }
    }

    hotelGroups.forEach(group => {
      if ((pricingValue.hotels[group.id] ?? []).length === 0) {
        messages.push(`${group.label} chưa có khách sạn.`);
      }
    });

    mealGroups.forEach(group => {
      if ((pricingValue.meals[group.id] ?? []).length === 0) {
        const selectableOptions = (mealOptionsByGroup[group.id] ?? [])
          .filter(option => !selectedMealOptionIds.has(option.id));
        if (selectableOptions.length > 0) {
          messages.push(`${group.label} chưa có dịch vụ ăn uống.`);
        }
      }
    });

    attractionGroups.forEach(group => {
      if ((pricingValue.attractions[group.id] ?? []).length === 0) {
        const selectableOptions = (attractionOptionsByGroup[group.id] ?? [])
          .filter(option => !selectedAttractionOptionIds.has(option.id));
        if (selectableOptions.length > 0) {
          messages.push(`${group.label} chưa có vé tham quan.`);
        }
      }
    });

    pricingValue.otherCosts.forEach(selection => {
      const option = otherOptions.find(item => item.id === selection.optionId);
      if (!option) return;
      if (option.priceMode === 'Báo giá' && (selection.manualPrice ?? 0) <= 0) {
        messages.push(`${option.serviceName} chưa nhập đơn giá.`);
      }
      if (option.formulaCount === 'Nhập tay' && (!selection.occurrences || Number(selection.occurrences) <= 0)) {
        messages.push(`${option.serviceName} chưa nhập số lần.`);
      }
    });

    return {
      isValid: messages.length === 0,
      messages,
    };
  })();

  useEffect(() => {
    const serialized = JSON.stringify(validation);
    if (serialized === lastValidationRef.current) {
      return;
    }
    lastValidationRef.current = serialized;
    onValidationChange?.(validation);
  }, [onValidationChange, validation]);

  const openPicker = (kind: PickerKind, title: string, groupId?: string) => {
    if (hideActionColumn) return;
    setPicker({ kind, title, groupId });
  };

  const pickerOptions = useMemo<PickerOption[]>(() => {
    if (!picker) return [];
    if (picker.kind === 'transport') {
      return transportOptions.map(option => ({
        id: option.id,
        title: option.supplierName,
        columns: [`Khu vực hoạt động: ${option.operatingArea}`, `Dịch vụ: ${option.serviceLabel}`],
      }));
    }
    if (picker.kind === 'flight') {
      return flightOptions.map(option => ({
        id: option.id,
        title: option.supplierName,
        columns: [`Số lần hợp tác: ${option.collaborationCount}`, `Lần hợp tác gần nhất: ${formatDate(option.lastCollaboration)}`],
      }));
    }
    if (picker.kind === 'hotel') {
      return (hotelOptionsByGroup[picker.groupId ?? ''] ?? []).map(option => ({
        id: option.id,
        title: option.supplierName,
        columns: [`Địa chỉ: ${option.address}`, `Tiêu chuẩn: ${option.standard}`],
      }));
    }
    if (picker.kind === 'meal') {
      return (mealOptionsByGroup[picker.groupId ?? ''] ?? [])
        .filter(option => !selectedMealOptionIds.has(option.id))
        .map(option => ({
        id: option.id,
        title: option.serviceName,
        columns: [`Mô tả: ${option.description}`, `Địa chỉ: ${option.address}`, `Nhà cung cấp: ${option.supplierName}`],
      }));
    }
    if (picker.kind === 'attraction') {
      return (attractionOptionsByGroup[picker.groupId ?? ''] ?? [])
        .filter(option => !selectedAttractionOptionIds.has(option.id))
        .map(option => ({
        id: option.id,
        title: option.serviceName,
        columns: [`Mô tả: ${option.description}`, `Địa chỉ: ${option.address}`],
      }));
    }
    return otherOptions.filter(option => !option.isInsurance).map(option => ({
      id: option.id,
      title: option.serviceName,
      columns: [`Nhà cung cấp: ${option.supplierName}`],
    }));
  }, [attractionOptionsByGroup, flightOptions, hotelOptionsByGroup, mealOptionsByGroup, otherOptions, picker, selectedAttractionOptionIds, selectedMealOptionIds, transportOptions]);

  const appendSelections = (kind: PickerKind, selectedIds: string[], groupId?: string) => {
    updateValue(current => {
      if (kind === 'transport') {
        const existing = new Set(current.transport.map(item => item.optionId));
        return {
          ...current,
          transport: normalizeDefaults([
            ...current.transport,
            ...selectedIds.filter(id => !existing.has(id)).map(id => ({
              optionId: id,
              manualPrice: transportOptions.find(option => option.id === id)?.suggestedPrice ?? 0,
            })),
          ]),
        };
      }
      if (kind === 'flight') {
        const existing = new Set(current.flight.map(item => item.optionId));
        return {
          ...current,
          flight: normalizeDefaults([
            ...current.flight,
            ...selectedIds.filter(id => !existing.has(id)).map(id => ({ optionId: id, manualPrice: 0 })),
          ]),
        };
      }
      if (kind === 'hotel' && groupId) {
        const existing = new Set((current.hotels[groupId] ?? []).map(item => item.optionId));
        return {
          ...current,
          hotels: {
            ...current.hotels,
            [groupId]: normalizeDefaults([
              ...(current.hotels[groupId] ?? []),
              ...selectedIds.filter(id => !existing.has(id)).map(id => ({ optionId: id })),
            ]),
          },
        };
      }
      if (kind === 'meal' && groupId) {
        const existing = new Set(Object.values(current.meals).flatMap(rows => rows.map(item => item.optionId)));
        return {
          ...current,
          meals: {
            ...current.meals,
            [groupId]: normalizeDefaults([
              ...(current.meals[groupId] ?? []),
              ...selectedIds.filter(id => !existing.has(id)).map(id => ({ optionId: id })),
            ]),
          },
        };
      }
      if (kind === 'attraction' && groupId) {
        const existing = new Set(Object.values(current.attractions).flatMap(rows => rows.map(item => item.optionId)));
        return {
          ...current,
          attractions: {
            ...current.attractions,
            [groupId]: normalizeDefaults([
              ...(current.attractions[groupId] ?? []),
              ...selectedIds.filter(id => !existing.has(id)).map(id => ({ optionId: id })),
            ]),
          },
        };
      }

      const existing = new Set(current.otherCosts.map(item => item.optionId));
      return {
        ...current,
        otherCosts: [
          ...current.otherCosts,
          ...selectedIds.filter(id => !existing.has(id)).map(id => ({
            optionId: id,
            occurrences: (otherOptions.find(option => option.id === id)?.formulaCountDefault ?? '') as number | '',
          })),
        ],
      };
    });
    setPicker(null);
  };

  const selectedTransportLabel = transportOptions.find(option => option.id === defaultTransport?.optionId)?.serviceLabel ?? '-';
  const selectedFlightLabel = flightOptions.find(option => option.id === defaultFlight?.optionId)?.supplierName ?? '-';

  const sectionButton = (label: string, onClick: () => void, ariaLabel: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="text-secondary font-medium hover:text-primary"
    >
      {label}
    </button>
  );

  const deleteSelection = (kind: Exclude<PickerKind, 'hotel' | 'meal' | 'attraction'>, optionId: string) => {
    updateValue(current => {
      if (kind === 'transport') {
        return { ...current, transport: normalizeDefaults(current.transport.filter(item => item.optionId !== optionId)) };
      }
      if (kind === 'flight') {
        return { ...current, flight: normalizeDefaults(current.flight.filter(item => item.optionId !== optionId)) };
      }
      if (kind === 'other') {
        return { ...current, otherCosts: current.otherCosts.filter(item => item.optionId !== optionId) };
      }
      return current;
    });
  };

  const deleteGroupedSelection = (kind: 'hotel' | 'meal' | 'attraction', groupId: string, optionId: string) => {
    updateValue(current => ({
      ...current,
      [kind === 'hotel' ? 'hotels' : kind === 'meal' ? 'meals' : 'attractions']: {
        ...(kind === 'hotel' ? current.hotels : kind === 'meal' ? current.meals : current.attractions),
        [groupId]: normalizeDefaults(((kind === 'hotel' ? current.hotels : kind === 'meal' ? current.meals : current.attractions)[groupId] ?? []).filter(item => item.optionId !== optionId)),
      },
    }));
  };

  return (
    <div className="space-y-7">
      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">I. Vận chuyển</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {['Nhà cung cấp', 'Dịch vụ', 'Đơn giá', 'Mặc định', ...(hideActionColumn ? [] : ['Thao tác'])].map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="border border-outline-variant/20 px-3 py-2 font-medium">Xe tham quan</td>
              <td className="border border-outline-variant/20 px-3 py-2">{selectedTransportLabel}</td>
              <td className="border border-outline-variant/20 px-3 py-2 text-right">Đơn giá áp dụng: {formatMoney(defaultTransport?.manualPrice ?? 0)}</td>
              <td className="border border-outline-variant/20 px-3 py-2" />
              {!hideActionColumn && (
                <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50">
                  {sectionButton('Chọn NCC +', () => openPicker('transport', 'Chọn xe tham quan'), 'Thêm nhà cung cấp xe tham quan')}
                </td>
              )}
            </tr>
            {pricingValue.transport.map(selection => {
              const option = transportOptions.find(item => item.id === selection.optionId);
              if (!option) return null;
              return (
                <tr key={selection.optionId}>
                  <td className="border border-outline-variant/20 px-3 py-2">{option.supplierName}</td>
                  <td className="border border-outline-variant/20 px-3 py-2">
                    <div className="space-y-1 text-xs text-primary/60">
                      <p>Khu vực hoạt động: {option.operatingArea}</p>
                      <p>Dịch vụ: {option.serviceName}</p>
                      <p>Sức chứa: {option.capacity} khách</p>
                    </div>
                  </td>
                  <td className="border border-outline-variant/20 px-3 py-2">
                    <input
                      aria-label={`Đơn giá xe tham quan ${option.supplierName}`}
                      type="number"
                      value={selection.manualPrice ?? ''}
                      onChange={event => updateValue(current => ({
                        ...current,
                        transport: current.transport.map(item => item.optionId === selection.optionId ? { ...item, manualPrice: Number(event.target.value) || 0 } : item),
                      }))}
                      className="w-full border border-outline-variant/30 px-3 py-2 text-right outline-none"
                    />
                  </td>
                  <td className="border border-outline-variant/20 px-3 py-2 text-center">
                    <input
                      type="radio"
                      checked={Boolean(selection.isDefault)}
                      onChange={() => updateValue(current => ({
                        ...current,
                        transport: current.transport.map(item => ({ ...item, isDefault: item.optionId === selection.optionId })),
                      }))}
                      className="h-4 w-4 accent-[var(--color-secondary)]"
                      aria-label={`Mặc định xe tham quan ${option.supplierName}`}
                    />
                  </td>
                  {!hideActionColumn && (
                    <td className="border border-outline-variant/20 px-3 py-2 text-center">
                      <button type="button" onClick={() => deleteSelection('transport', selection.optionId)} className="text-red-500 hover:text-red-700" aria-label={`Xóa ${option.supplierName}`}>×</button>
                    </td>
                  )}
                </tr>
              );
            })}

            {transport === 'maybay' && (
              <>
                <tr className="bg-gray-50">
                  <td className="border border-outline-variant/20 px-3 py-2 font-medium">Vé máy bay</td>
                  <td className="border border-outline-variant/20 px-3 py-2">
                    {departurePoint || '-'} đến {arrivalPoint || '-'}
                  </td>
                  <td className="border border-outline-variant/20 px-3 py-2 text-right">Đơn giá áp dụng: {formatMoney(defaultFlight?.manualPrice ?? 0)}</td>
                  <td className="border border-outline-variant/20 px-3 py-2 text-primary/45">{selectedFlightLabel}</td>
                  {!hideActionColumn && (
                    <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50">
                      {sectionButton('Chọn NCC +', () => openPicker('flight', 'Chọn vé máy bay'), 'Thêm nhà cung cấp vé máy bay')}
                    </td>
                  )}
                </tr>
                {pricingValue.flight.map(selection => {
                  const option = flightOptions.find(item => item.id === selection.optionId);
                  if (!option) return null;
                  return (
                    <tr key={selection.optionId}>
                      <td className="border border-outline-variant/20 px-3 py-2">{option.supplierName}</td>
                      <td className="border border-outline-variant/20 px-3 py-2">
                        <div className="space-y-1 text-xs text-primary/60">
                          <p>Số lần hợp tác: {option.collaborationCount}</p>
                          <p>Lần hợp tác gần nhất: {formatDate(option.lastCollaboration)}</p>
                        </div>
                      </td>
                      <td className="border border-outline-variant/20 px-3 py-2">
                        <input
                          aria-label={`Đơn giá vé máy bay ${option.supplierName}`}
                          type="number"
                          value={selection.manualPrice ?? ''}
                          onChange={event => updateValue(current => ({
                            ...current,
                            flight: current.flight.map(item => item.optionId === selection.optionId ? { ...item, manualPrice: Number(event.target.value) || 0 } : item),
                          }))}
                          className="w-full border border-outline-variant/30 px-3 py-2 text-right outline-none"
                        />
                      </td>
                      <td className="border border-outline-variant/20 px-3 py-2 text-center">
                        <input
                          type="radio"
                          checked={Boolean(selection.isDefault)}
                          onChange={() => updateValue(current => ({
                            ...current,
                            flight: current.flight.map(item => ({ ...item, isDefault: item.optionId === selection.optionId })),
                          }))}
                          className="h-4 w-4 accent-[var(--color-secondary)]"
                          aria-label={`Mặc định vé máy bay ${option.supplierName}`}
                        />
                      </td>
                      {!hideActionColumn && (
                        <td className="border border-outline-variant/20 px-3 py-2 text-center">
                          <button type="button" onClick={() => deleteSelection('flight', selection.optionId)} className="text-red-500 hover:text-red-700" aria-label={`Xóa ${option.supplierName}`}>×</button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

      {nights > 0 && (
      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">II. Khách sạn</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {['Nhà cung cấp', 'Địa chỉ', 'Thành tiền', 'Mặc định', ...(hideActionColumn ? [] : ['Thao tác'])].map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hotelGroups.length === 0 ? (
              <tr>
                <td colSpan={hideActionColumn ? 4 : 5} className="border border-outline-variant/20 px-3 py-4 text-primary/45 italic">
                  Chọn địa điểm lưu trú trong lịch trình để hiển thị khách sạn.
                </td>
              </tr>
            ) : hotelGroups.map(group => {
              const defaultSelection = normalizeDefaults(pricingValue.hotels[group.id] ?? []).find(item => item.isDefault);
              const display = defaultSelection ? getHotelDisplayPrices(defaultSelection, group, firstDepartureDate) : null;
              return (
                <FragmentRows
                  key={group.id}
                  rows={[
                    <tr key={`${group.id}-header`} className="bg-gray-50">
                      <td className="border border-outline-variant/20 px-3 py-2 font-medium">{group.label}</td>
                      <td className="border border-outline-variant/20 px-3 py-2">Điểm lưu trú: {group.city}</td>
                      <td className="border border-outline-variant/20 px-3 py-2 text-right">Thành tiền: {formatMoney(display?.doublePrice ?? 0)}</td>
                      <td className="border border-outline-variant/20 px-3 py-2" />
                      {!hideActionColumn && (
                        <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50">
                          {sectionButton('Chọn khách sạn +', () => openPicker('hotel', `Chọn khách sạn - ${group.label}`, group.id), `Thêm khách sạn cho ${group.label}`)}
                        </td>
                      )}
                    </tr>,
                    ...(pricingValue.hotels[group.id] ?? []).map(selection => {
                      const option = hotelOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
                      if (!option) return null;
                      const price = getHotelDisplayPrices(selection, group, firstDepartureDate);
                      return (
                        <tr key={`${group.id}-${selection.optionId}`}>
                          <td className="border border-outline-variant/20 px-3 py-2">{option.supplierName}</td>
                          <td className="border border-outline-variant/20 px-3 py-2">{option.address}</td>
                          <td className="border border-outline-variant/20 px-3 py-2 text-right">
                            <input readOnly value={formatMoney(price.doublePrice)} className="w-full border border-outline-variant/30 bg-[var(--color-surface)] px-3 py-2 text-right outline-none" />
                          </td>
                          <td className="border border-outline-variant/20 px-3 py-2 text-center">
                            <input
                              type="radio"
                              checked={Boolean(selection.isDefault)}
                              onChange={() => updateValue(current => ({
                                ...current,
                                hotels: {
                                  ...current.hotels,
                                  [group.id]: (current.hotels[group.id] ?? []).map(item => ({ ...item, isDefault: item.optionId === selection.optionId })),
                                },
                              }))}
                              className="h-4 w-4 accent-[var(--color-secondary)]"
                              aria-label={`Mặc định ${group.label} ${option.supplierName}`}
                            />
                          </td>
                          {!hideActionColumn && (
                            <td className="border border-outline-variant/20 px-3 py-2 text-center">
                              <button type="button" onClick={() => deleteGroupedSelection('hotel', group.id, selection.optionId)} className="text-red-500 hover:text-red-700" aria-label={`Xóa ${option.supplierName}`}>×</button>
                            </td>
                          )}
                        </tr>
                      );
                    }),
                  ].filter(Boolean)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">III. Dịch vụ ăn uống</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {['Nhà cung cấp', 'Địa chỉ', 'Tên dịch vụ', 'Đơn giá', 'Mặc định', ...(hideActionColumn ? [] : ['Thao tác'])].map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mealGroups.length === 0 ? (
              <tr>
                <td colSpan={hideActionColumn ? 5 : 6} className="border border-outline-variant/20 px-3 py-4 text-primary/45 italic">
                  Chọn bữa ăn trong lịch trình để hiển thị các khoản mục ăn uống.
                </td>
              </tr>
            ) : mealGroups.map(group => {
              const defaultSelection = normalizeDefaults(pricingValue.meals[group.id] ?? []).find(item => item.isDefault);
              const defaultOption = mealOptionsByGroup[group.id]?.find(item => item.id === defaultSelection?.optionId);
              const displayPrice = defaultOption ? resolveApplicablePrice(defaultOption.prices, addDays(firstDepartureDate, group.day - 1)) : 0;
              return (
                <FragmentRows
                  key={group.id}
                  rows={[
                    <tr key={`${group.id}-header`} className="bg-gray-50">
                      <td className="border border-outline-variant/20 px-3 py-2 font-medium">{group.label}</td>
                      <td className="border border-outline-variant/20 px-3 py-2" />
                      <td className="border border-outline-variant/20 px-3 py-2" />
                      <td className="border border-outline-variant/20 px-3 py-2 text-right">Đơn giá áp dụng: {formatMoney(displayPrice)}</td>
                      <td className="border border-outline-variant/20 px-3 py-2" />
                      {!hideActionColumn && (
                        <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50">
                          {sectionButton('Chọn dịch vụ +', () => openPicker('meal', `Chọn dịch vụ ăn uống - ${group.label}`, group.id), `Thêm dịch vụ ăn uống cho ${group.label}`)}
                        </td>
                      )}
                    </tr>,
                    ...(pricingValue.meals[group.id] ?? []).map(selection => {
                      const option = mealOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
                      if (!option) return null;
                      const price = resolveApplicablePrice(option.prices, addDays(firstDepartureDate, group.day - 1));
                      return (
                        <tr key={`${group.id}-${selection.optionId}`}>
                          <td className="border border-outline-variant/20 px-3 py-2">{option.supplierName}</td>
                          <td className="border border-outline-variant/20 px-3 py-2">{option.address}</td>
                          <td className="border border-outline-variant/20 px-3 py-2">{option.serviceName}</td>
                          <td className="border border-outline-variant/20 px-3 py-2 text-right">
                            <input readOnly value={formatMoney(price)} className="w-full border border-outline-variant/30 bg-[var(--color-surface)] px-3 py-2 text-right outline-none" />
                          </td>
                          <td className="border border-outline-variant/20 px-3 py-2 text-center">
                            <input
                              type="radio"
                              checked={Boolean(selection.isDefault)}
                              onChange={() => updateValue(current => ({
                                ...current,
                                meals: {
                                  ...current.meals,
                                  [group.id]: (current.meals[group.id] ?? []).map(item => ({ ...item, isDefault: item.optionId === selection.optionId })),
                                },
                              }))}
                              className="h-4 w-4 accent-[var(--color-secondary)]"
                              aria-label={`Mặc định ${group.label} ${option.serviceName}`}
                            />
                          </td>
                          {!hideActionColumn && (
                            <td className="border border-outline-variant/20 px-3 py-2 text-center">
                              <button type="button" onClick={() => deleteGroupedSelection('meal', group.id, selection.optionId)} className="text-red-500 hover:text-red-700" aria-label={`Xóa ${option.serviceName}`}>×</button>
                            </td>
                          )}
                        </tr>
                      );
                    }),
                  ].filter(Boolean)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">IV. Vé tham quan</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {['Tên dịch vụ', 'Mô tả / Địa chỉ', 'Đơn giá', ...(hideActionColumn ? [] : ['Thao tác'])].map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attractionGroups.map(group => {
              const displayPrice = (pricingValue.attractions[group.id] ?? []).reduce((sum, selection) => {
                const option = attractionOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
                return sum + (option ? resolveApplicablePrice(option.adultPrices, addDays(firstDepartureDate, group.day - 1)) : 0);
              }, 0);
              return (
                <FragmentRows
                  key={group.id}
                  rows={[
                    <tr key={`${group.id}-header`} className="bg-gray-50">
                      <td className="border border-outline-variant/20 px-3 py-2 font-medium">{group.label}</td>
                      <td className="border border-outline-variant/20 px-3 py-2">Điểm tham quan: {group.spot || '-'}</td>
                      <td className="border border-outline-variant/20 px-3 py-2 text-right">Đơn giá áp dụng: {formatMoney(displayPrice)}</td>
                      {!hideActionColumn && (
                        <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50">
                          {sectionButton('Chọn dịch vụ +', () => openPicker('attraction', `Chọn vé tham quan - ${group.label}`, group.id), `Thêm vé tham quan cho ${group.label}`)}
                        </td>
                      )}
                    </tr>,
                    ...(pricingValue.attractions[group.id] ?? []).map(selection => {
                      const option = attractionOptionsByGroup[group.id]?.find(item => item.id === selection.optionId);
                      if (!option) return null;
                      const price = resolveApplicablePrice(option.adultPrices, addDays(firstDepartureDate, group.day - 1));
                      return (
                        <tr key={`${group.id}-${selection.optionId}`}>
                          <td className="border border-outline-variant/20 px-3 py-2">{option.serviceName}</td>
                          <td className="border border-outline-variant/20 px-3 py-2">
                            <div className="space-y-1 text-xs text-primary/60">
                              <p>Mô tả: {option.description}</p>
                              <p>Địa chỉ: {option.address}</p>
                            </div>
                          </td>
                          <td className="border border-outline-variant/20 px-3 py-2 text-right">
                            <input readOnly value={formatMoney(price)} className="w-full border border-outline-variant/30 bg-[var(--color-surface)] px-3 py-2 text-right outline-none" />
                          </td>
                          {!hideActionColumn && (
                            <td className="border border-outline-variant/20 px-3 py-2 text-center">
                              <button type="button" onClick={() => deleteGroupedSelection('attraction', group.id, selection.optionId)} className="text-red-500 hover:text-red-700" aria-label={`Xóa ${option.serviceName}`}>×</button>
                            </td>
                          )}
                        </tr>
                      );
                    }),
                  ].filter(Boolean)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">V. Hướng dẫn viên</h4>
        <div className="grid grid-cols-[220px_80px] gap-4 items-end max-w-xl">
          <label>
            <span className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Đơn giá</span>
            <input
              aria-label="Đơn giá hướng dẫn viên"
              type="number"
              value={guideUnitPrice > 0 ? guideUnitPrice : ''}
              onChange={event => onGuideUnitPriceChange(Number(event.target.value) || 0)}
              className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <span className="text-sm text-primary/45 pb-3">đ</span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">VI. Chi phí khác</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {['Nhà cung cấp', 'Tên dịch vụ', 'Đơn giá', 'Số lần', 'Ghi chú', 'Mặc định', ...(hideActionColumn ? [] : ['Thao tác'])].map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricingValue.otherCosts.map(selection => {
              const option = otherOptions.find(item => item.id === selection.optionId);
              if (!option) return null;
              const listedPrice = option.priceMode === 'Giá niêm yết'
                ? (
                  option.formulaCount === 'Theo ngày'
                    ? roundToThousand(average(Array.from({ length: Math.max(1, days) }, (_, index) =>
                      resolveApplicablePrice(option.prices, addDays(firstDepartureDate, index)),
                    )))
                    : resolveApplicablePrice(option.prices, firstDepartureDate)
                )
                : 0;
              const isManualCount = option.formulaCount === 'Nhập tay';
              const occurrencesValue = isManualCount
                ? selection.occurrences ?? ''
                : option.formulaCount === 'Theo ngày'
                  ? days
                  : option.formulaCountDefault ?? 1;
              return (
                <tr key={selection.optionId}>
                  <td className="border border-outline-variant/20 px-3 py-2">{option.supplierName}</td>
                  <td className="border border-outline-variant/20 px-3 py-2">{option.serviceName}</td>
                  <td className="border border-outline-variant/20 px-3 py-2">
                    <input
                      aria-label={`Đơn giá ${option.serviceName}`}
                      type="number"
                      readOnly={option.priceMode === 'Giá niêm yết'}
                      value={option.priceMode === 'Giá niêm yết' ? listedPrice : (selection.manualPrice ?? '')}
                      onChange={event => updateValue(current => ({
                        ...current,
                        otherCosts: current.otherCosts.map(item => item.optionId === selection.optionId ? { ...item, manualPrice: Number(event.target.value) || 0 } : item),
                      }))}
                      className={`w-full border px-3 py-2 text-right outline-none ${option.priceMode === 'Giá niêm yết' ? 'border-outline-variant/30 bg-[var(--color-surface)]' : 'border-outline-variant/50'}`}
                    />
                  </td>
                  <td className="border border-outline-variant/20 px-3 py-2">
                    <input
                      aria-label={`Số lần ${option.serviceName}`}
                      type="number"
                      readOnly={!isManualCount}
                      value={occurrencesValue}
                      onChange={event => updateValue(current => ({
                        ...current,
                        otherCosts: current.otherCosts.map(item => item.optionId === selection.optionId ? { ...item, occurrences: event.target.value === '' ? '' : Number(event.target.value) || 0 } : item),
                      }))}
                      className={`w-full border px-3 py-2 text-right outline-none ${isManualCount ? 'border-outline-variant/50' : 'border-outline-variant/30 bg-[var(--color-surface)]'}`}
                    />
                  </td>
                  <td className="border border-outline-variant/20 px-3 py-2">
                    <input
                      aria-label={`Ghi chú ${option.serviceName}`}
                      value={selection.note ?? ''}
                      onChange={event => updateValue(current => ({
                        ...current,
                        otherCosts: current.otherCosts.map(item => item.optionId === selection.optionId ? { ...item, note: event.target.value } : item),
                      }))}
                      className="w-full border border-outline-variant/30 px-3 py-2 outline-none"
                    />
                  </td>
                  <td className="border border-outline-variant/20 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(option.isInsurance)}
                      readOnly
                      aria-label={`Mặc định ${option.serviceName}`}
                      className="h-4 w-4 accent-[var(--color-secondary)]"
                    />
                  </td>
                  {!hideActionColumn && (
                    <td className="border border-outline-variant/20 px-3 py-2 text-center">
                      {!option.isInsurance && (
                        <button type="button" onClick={() => deleteSelection('other', selection.optionId)} className="text-red-500 hover:text-red-700" aria-label={`Xóa ${option.serviceName}`}>×</button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {!hideActionColumn && (
              <tr className="bg-gray-50">
                <td className="border border-outline-variant/20 px-3 py-2" colSpan={6} />
                <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50">
                  {sectionButton('Chọn dịch vụ +', () => openPicker('other', 'Chọn chi phí khác'), 'Thêm chi phí khác')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {picker && (
        <SelectionModal
          title={picker.title}
          options={pickerOptions}
          onClose={() => setPicker(null)}
          onConfirm={(selectedIds) => appendSelections(picker.kind, selectedIds, picker.groupId)}
        />
      )}
    </div>
  );
}

function FragmentRows({ rows }: { rows: ReactNode[] }) {
  return <>{rows}</>;
}

