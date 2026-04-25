import { useMemo, useState } from 'react';
import { MEAL_LABELS } from '@entities/tour-program/data/tourProgram';

type Transport = 'xe' | 'maybay';
type DayMeals = ('breakfast' | 'lunch' | 'dinner')[];

interface DayFormLike {
  day: number;
  title: string;
  meals: DayMeals;
  accommodationPoint: string;
}

interface Props {
  transport: Transport;
  departurePoint: string;
  arrivalPoint: string;
  days: number;
  nights: number;
  itinerary: DayFormLike[];
  guideUnitPrice: number;
  onGuideUnitPriceChange: (value: number) => void;
  hideActionColumn?: boolean;
}

interface TransportQuoteRow {
  id: string;
  supplierName: string;
  serviceName: string;
  price: number;
  note: string;
  isDefault: boolean;
}

interface FlightQuoteRow {
  id: string;
  supplierName: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  note: string;
  isDefault: boolean;
}

interface HotelQuoteRow {
  id: string;
  supplierName: string;
  address: string;
  singlePrice: number;
  doublePrice: number;
  triplePrice: number;
  isDefault: boolean;
}

interface MealQuoteRow {
  id: string;
  supplierName: string;
  address: string;
  serviceName: string;
  price: number;
  isDefault: boolean;
}

interface AttractionQuoteRow {
  id: string;
  supplierName: string;
  address: string;
  serviceName: string;
  adultPrice: number;
  childPrice: number;
}

interface OtherCostQuoteRow {
  id: string;
  supplierName: string;
  serviceName: string;
  price: number;
  unit: string;
  note: string;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatMoney(value: number) {
  return Math.round(value).toLocaleString('vi-VN');
}

function normalizeDefaultRows<T extends { isDefault: boolean }>(rows: T[]) {
  if (rows.length === 0) return rows;
  const defaultIndex = rows.findIndex(row => row.isDefault);
  const nextDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;
  return rows.map((row, index) => ({ ...row, isDefault: index === nextDefaultIndex }));
}

function buildTransportQuoteRow(index: number, isDefault = false): TransportQuoteRow {
  const prices = [8500000, 7200000, 8100000];
  return {
    id: createId('transport'),
    supplierName: `NCC ${String.fromCharCode(65 + index)}`,
    serviceName: 'Xe 29 chỗ',
    price: prices[index] ?? 0,
    note: '',
    isDefault,
  };
}

function buildFlightQuoteRow(index: number, isDefault = false): FlightQuoteRow {
  const defaults = [
    { adultPrice: 4400000, childPrice: 4200000, infantPrice: 440000 },
    { adultPrice: 4500000, childPrice: 4300000, infantPrice: 450000 },
  ];
  const current = defaults[index] ?? { adultPrice: 0, childPrice: 0, infantPrice: 0 };
  return {
    id: createId('flight'),
    supplierName: index === 0 ? 'Đại lý bán vé máy bay A' : `Hãng ${index + 1}`,
    ...current,
    note: '',
    isDefault,
  };
}

function buildHotelQuoteRow(index: number, city: string, isDefault = false): HotelQuoteRow {
  return {
    id: createId('hotel'),
    supplierName: `Khách sạn ${String.fromCharCode(65 + index)}`,
    address: `xx đường ${city}`,
    singlePrice: 1200000,
    doublePrice: 1300000,
    triplePrice: 1400000,
    isDefault,
  };
}

function buildMealQuoteRow(label: string, index: number, isDefault = false): MealQuoteRow {
  const isBreakfast = label.toLowerCase().includes('sáng');
  const isLunch = label.toLowerCase().includes('trưa');
  return {
    id: createId('meal'),
    supplierName: `NCC ${String.fromCharCode(65 + index)}`,
    address: `xx phố ${index + 1}`,
    serviceName: isBreakfast ? 'Set buffet sáng' : isLunch ? 'Set 1' : 'Set tối',
    price: isBreakfast ? 90000 : 120000,
    isDefault,
  };
}

function buildAttractionQuoteRow(serviceName: string): AttractionQuoteRow {
  return {
    id: createId('attraction'),
    supplierName: 'NCC A',
    address: 'Địa chỉ 1',
    serviceName,
    adultPrice: 250000,
    childPrice: 150000,
  };
}

function buildOtherCostQuoteRow(index: number): OtherCostQuoteRow {
  return {
    id: createId('other'),
    supplierName: `NCC ${String.fromCharCode(65 + index)}`,
    serviceName: index === 0 ? 'Bảo hiểm du lịch' : 'Chi phí khác',
    price: index === 0 ? 200000 : 0,
    unit: index === 0 ? 'Người' : 'Gói',
    note: '',
  };
}

export default function TourProgramPricingTables({
  transport,
  departurePoint,
  arrivalPoint,
  days,
  nights,
  itinerary,
  guideUnitPrice,
  onGuideUnitPriceChange,
  hideActionColumn = false,
}: Props) {
  const [transportQuotes, setTransportQuotes] = useState<TransportQuoteRow[]>(() => [
    buildTransportQuoteRow(0, true),
    buildTransportQuoteRow(1),
    buildTransportQuoteRow(2),
  ]);
  const [flightQuotes, setFlightQuotes] = useState<FlightQuoteRow[]>(() => [
    buildFlightQuoteRow(0, true),
    buildFlightQuoteRow(1),
  ]);
  const [hotelQuoteDrafts, setHotelQuoteDrafts] = useState<Record<string, HotelQuoteRow[]>>({});
  const [mealQuoteDrafts, setMealQuoteDrafts] = useState<Record<string, MealQuoteRow[]>>({});
  const [attractionQuoteDrafts, setAttractionQuoteDrafts] = useState<Record<string, AttractionQuoteRow[]>>({});
  const [otherCostRows, setOtherCostRows] = useState<OtherCostQuoteRow[]>(() => [buildOtherCostQuoteRow(0)]);

  const mealRows = useMemo(() =>
    itinerary.flatMap(day =>
      day.meals.map(meal => ({
        id: `${day.day}-${meal}`,
        label: `Ngày ${day.day} - ${MEAL_LABELS[meal]}`,
        service: meal === 'breakfast' ? 'Set buffet sáng' : meal === 'lunch' ? 'Set ăn trưa' : 'Set ăn tối',
        price: meal === 'breakfast' ? 90000 : 120000,
      })),
    ),
  [itinerary]);

  const hotelGroups = useMemo(() => {
    const groups: { id: string; label: string; city: string; nights: number }[] = [];
    let current: { id: string; city: string; startDay: number; endDay: number; nights: number } | null = null;

    for (const day of itinerary.slice(0, Math.max(0, nights))) {
      if (!day.accommodationPoint) continue;
      if (current && current.city === day.accommodationPoint && day.day === current.endDay + 1) {
        current.endDay = day.day;
        current.nights += 1;
        continue;
      }
      if (current) {
        groups.push({
          id: current.id,
          label: `Lưu trú - Đêm ${current.startDay}${current.endDay > current.startDay ? `, ${current.endDay}` : ''}`,
          city: current.city,
          nights: current.nights,
        });
      }
      current = {
        id: `stay-${day.day}`,
        city: day.accommodationPoint,
        startDay: day.day,
        endDay: day.day,
        nights: 1,
      };
    }

    if (current) {
      groups.push({
        id: current.id,
        label: `Lưu trú - Đêm ${current.startDay}${current.endDay > current.startDay ? `, ${current.endDay}` : ''}`,
        city: current.city,
        nights: current.nights,
      });
    }

    return groups;
  }, [itinerary, nights]);

  const attractionSections = useMemo(() =>
    itinerary.slice(0, Math.max(1, days)).map(day => ({
      id: `day-${day.day}`,
      label: `Ngày ${day.day}`,
      serviceName: `Vé tham quan ${day.title || '...'}`,
    })),
  [days, itinerary]);

  const hotelQuotesByGroup = useMemo(() => {
    const next: Record<string, HotelQuoteRow[]> = {};
    hotelGroups.forEach((group, index) => {
      next[group.id] = hotelQuoteDrafts[group.id]?.length
        ? normalizeDefaultRows(hotelQuoteDrafts[group.id])
        : [buildHotelQuoteRow(index, group.city, true)];
    });
    return next;
  }, [hotelGroups, hotelQuoteDrafts]);

  const mealQuotesBySection = useMemo(() => {
    const next: Record<string, MealQuoteRow[]> = {};
    mealRows.forEach((meal, index) => {
      next[meal.id] = mealQuoteDrafts[meal.id]?.length
        ? normalizeDefaultRows(mealQuoteDrafts[meal.id])
        : [buildMealQuoteRow(meal.label, index, true)];
    });
    return next;
  }, [mealRows, mealQuoteDrafts]);

  const attractionQuotesBySection = useMemo(() => {
    const next: Record<string, AttractionQuoteRow[]> = {};
    attractionSections.forEach(section => {
      next[section.id] = attractionQuoteDrafts[section.id]?.length
        ? attractionQuoteDrafts[section.id]
        : [buildAttractionQuoteRow(section.serviceName)];
    });
    return next;
  }, [attractionSections, attractionQuoteDrafts]);

  const setHotelQuotesByGroup = (updater: (prev: Record<string, HotelQuoteRow[]>) => Record<string, HotelQuoteRow[]>) => {
    setHotelQuoteDrafts(updater(hotelQuotesByGroup));
  };

  const setMealQuotesBySection = (updater: (prev: Record<string, MealQuoteRow[]>) => Record<string, MealQuoteRow[]>) => {
    setMealQuoteDrafts(updater(mealQuotesBySection));
  };

  const setAttractionQuotesBySection = (updater: (prev: Record<string, AttractionQuoteRow[]>) => Record<string, AttractionQuoteRow[]>) => {
    setAttractionQuoteDrafts(updater(attractionQuotesBySection));
  };

  const selectedTransportQuote = transportQuotes.find(row => row.isDefault) ?? transportQuotes[0];
  const selectedFlightQuote = flightQuotes.find(row => row.isDefault) ?? flightQuotes[0];

  const renderDeleteButton = (label: string, onClick: () => void, disabled = false) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="text-red-500 text-lg leading-none hover:text-red-700 disabled:text-red-200"
    >
      ×
    </button>
  );

  const renderDefaultCheckbox = (checked: boolean, onChange: () => void, label: string) => (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      className="accent-[var(--color-secondary)] w-4 h-4"
    />
  );

  const showActionColumn = !hideActionColumn;
  const withActionHeader = (headers: string[]) => showActionColumn ? [...headers, 'Thao tác'] : headers;

  return (
    <div className="min-w-[900px] space-y-7">
      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">I. Vận chuyển</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {withActionHeader(['Nhà cung cấp', 'Dịch vụ', 'Báo giá', 'Ghi chú', 'Mặc định']).map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="border border-outline-variant/20 px-3 py-2 font-medium" colSpan={2}>Xe tham quan</td>
              <td className="border border-outline-variant/20 px-3 py-2 text-right" colSpan={2}>Đơn giá áp dụng: {formatMoney(selectedTransportQuote?.price ?? 0)}</td>
              <td className="border border-outline-variant/20 px-3 py-2" />
              {showActionColumn && (
                <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50 text-secondary font-medium">
                  <button type="button" onClick={() => setTransportQuotes(rows => [...rows, buildTransportQuoteRow(rows.length)])} className="hover:underline" aria-label="Thêm mới NCC xe tham quan">Thêm mới NCC +</button>
                </td>
              )}
            </tr>
            {transportQuotes.map(row => (
              <tr key={row.id}>
                <td className="border border-outline-variant/20 px-3 py-2"><input value={row.supplierName} onChange={e => setTransportQuotes(rows => rows.map(item => item.id === row.id ? { ...item, supplierName: e.target.value } : item))} className="w-full border-0 bg-transparent outline-none" /></td>
                <td className="border border-outline-variant/20 px-3 py-2"><input value={row.serviceName} onChange={e => setTransportQuotes(rows => rows.map(item => item.id === row.id ? { ...item, serviceName: e.target.value } : item))} className="w-full border-0 bg-transparent outline-none" /></td>
                <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.price || ''} onChange={e => setTransportQuotes(rows => rows.map(item => item.id === row.id ? { ...item, price: parseInt(e.target.value) || 0 } : item))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                <td className="border border-outline-variant/20 px-3 py-2"><input value={row.note} onChange={e => setTransportQuotes(rows => rows.map(item => item.id === row.id ? { ...item, note: e.target.value } : item))} placeholder="Nhập ghi chú" className="w-full border-0 bg-transparent outline-none" /></td>
                <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDefaultCheckbox(row.isDefault, () => setTransportQuotes(rows => rows.map(item => ({ ...item, isDefault: item.id === row.id }))), `Mặc định ${row.supplierName}`)}</td>
                {showActionColumn && (
                  <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDeleteButton(`Xóa ${row.supplierName}`, () => setTransportQuotes(rows => normalizeDefaultRows(rows.filter(item => item.id !== row.id))), transportQuotes.length === 1)}</td>
                )}
              </tr>
            ))}
            {transport === 'maybay' && (
              <>
                <tr className="bg-gray-50">
                  <td className="border border-outline-variant/20 px-3 py-2 font-medium" colSpan={2}>Vé máy bay từ {departurePoint || 'Hà Nội'} đến {arrivalPoint || 'Đà Nẵng'}</td>
                  <td className="border border-outline-variant/20 px-3 py-2 text-right" colSpan={2}>Đơn giá áp dụng: {formatMoney(selectedFlightQuote?.adultPrice ?? 0)}</td>
                  <td className="border border-outline-variant/20 px-3 py-2" />
                  {showActionColumn && (
                    <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50 text-secondary font-medium">
                      <button type="button" onClick={() => setFlightQuotes(rows => [...rows, buildFlightQuoteRow(rows.length)])} className="hover:underline" aria-label="Thêm mới NCC vé máy bay">Thêm mới NCC +</button>
                    </td>
                  )}
                </tr>
                {flightQuotes.flatMap(row => ([
                  <tr key={`${row.id}-adult`}>
                    <td className="border border-outline-variant/20 px-3 py-2"><input value={row.supplierName} onChange={e => setFlightQuotes(rows => rows.map(item => item.id === row.id ? { ...item, supplierName: e.target.value } : item))} className="w-full border-0 bg-transparent outline-none" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2">Người lớn</td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.adultPrice || ''} onChange={e => setFlightQuotes(rows => rows.map(item => item.id === row.id ? { ...item, adultPrice: parseInt(e.target.value) || 0 } : item))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input value={row.note} onChange={e => setFlightQuotes(rows => rows.map(item => item.id === row.id ? { ...item, note: e.target.value } : item))} placeholder="Nhập ghi chú" className="w-full border-0 bg-transparent outline-none" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDefaultCheckbox(row.isDefault, () => setFlightQuotes(rows => rows.map(item => ({ ...item, isDefault: item.id === row.id }))), `Mặc định ${row.supplierName}`)}</td>
                    {showActionColumn && (
                      <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDeleteButton(`Xóa ${row.supplierName}`, () => setFlightQuotes(rows => normalizeDefaultRows(rows.filter(item => item.id !== row.id))), flightQuotes.length === 1)}</td>
                    )}
                  </tr>,
                  <tr key={`${row.id}-child`}>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2">Trẻ em</td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.childPrice || ''} onChange={e => setFlightQuotes(rows => rows.map(item => item.id === row.id ? { ...item, childPrice: parseInt(e.target.value) || 0 } : item))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2" />
                    {showActionColumn && <td className="border border-outline-variant/20 px-3 py-2" />}
                  </tr>,
                  <tr key={`${row.id}-infant`}>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2">Trẻ sơ sinh</td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.infantPrice || ''} onChange={e => setFlightQuotes(rows => rows.map(item => item.id === row.id ? { ...item, infantPrice: parseInt(e.target.value) || 0 } : item))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2" />
                    {showActionColumn && <td className="border border-outline-variant/20 px-3 py-2" />}
                  </tr>,
                ]))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">II. Khách sạn</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {withActionHeader(['Nhà cung cấp', 'Địa chỉ', 'Dịch vụ', 'Đơn giá', 'Mặc định']).map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hotelGroups.length === 0 ? (
              <tr>
                <td colSpan={showActionColumn ? 6 : 5} className="border border-outline-variant/20 px-3 py-4 text-primary/45 italic">Chọn Địa điểm lưu trú ở Lịch trình trước khi thêm nhà cung cấp.</td>
              </tr>
            ) : hotelGroups.map(group => {
              const providerRows = hotelQuotesByGroup[group.id] ?? [];
              const selectedProvider = providerRows.find(row => row.isDefault) ?? providerRows[0];
              return [
                <tr key={`${group.id}-header`} className="bg-gray-50">
                  <td className="border border-outline-variant/20 px-3 py-2 font-medium">{group.label}</td>
                  <td className="border border-outline-variant/20 px-3 py-2">Tỉnh thành: {group.city}</td>
                  <td className="border border-outline-variant/20 px-3 py-2 text-primary/45">Phòng đôi đang áp dụng</td>
                  <td className="border border-outline-variant/20 px-3 py-2 text-right">Thành tiền: {formatMoney((selectedProvider?.doublePrice ?? 0) * group.nights)}</td>
                  <td className="border border-outline-variant/20 px-3 py-2" />
                  {showActionColumn && (
                    <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50 text-secondary font-medium">
                      <button type="button" onClick={() => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: [...(prev[group.id] ?? []), buildHotelQuoteRow((prev[group.id] ?? []).length, group.city)] }))} className="hover:underline" aria-label={`Thêm mới NCC ${group.label}`}>Thêm mới NCC +</button>
                    </td>
                  )}
                </tr>,
                ...providerRows.flatMap(provider => ([
                  <tr key={`${provider.id}-single`}>
                    <td className="border border-outline-variant/20 px-3 py-2"><input value={provider.supplierName} onChange={e => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: (prev[group.id] ?? []).map(item => item.id === provider.id ? { ...item, supplierName: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input value={provider.address} onChange={e => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: (prev[group.id] ?? []).map(item => item.id === provider.id ? { ...item, address: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2">Phòng đơn</td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={provider.singlePrice || ''} onChange={e => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: (prev[group.id] ?? []).map(item => item.id === provider.id ? { ...item, singlePrice: parseInt(e.target.value) || 0 } : item) }))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDefaultCheckbox(provider.isDefault, () => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: (prev[group.id] ?? []).map(item => ({ ...item, isDefault: item.id === provider.id })) })), `Mặc định ${provider.supplierName}`)}</td>
                    {showActionColumn && (
                      <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDeleteButton(`Xóa ${provider.supplierName}`, () => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: normalizeDefaultRows((prev[group.id] ?? []).filter(item => item.id !== provider.id)) })), providerRows.length === 1)}</td>
                    )}
                  </tr>,
                  <tr key={`${provider.id}-double`}>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2">Phòng đôi</td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={provider.doublePrice || ''} onChange={e => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: (prev[group.id] ?? []).map(item => item.id === provider.id ? { ...item, doublePrice: parseInt(e.target.value) || 0 } : item) }))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2" />
                    {showActionColumn && <td className="border border-outline-variant/20 px-3 py-2" />}
                  </tr>,
                  <tr key={`${provider.id}-triple`}>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2 text-primary/30">Theo cùng NCC</td>
                    <td className="border border-outline-variant/20 px-3 py-2">Phòng ba</td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={provider.triplePrice || ''} onChange={e => setHotelQuotesByGroup(prev => ({ ...prev, [group.id]: (prev[group.id] ?? []).map(item => item.id === provider.id ? { ...item, triplePrice: parseInt(e.target.value) || 0 } : item) }))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2" />
                    {showActionColumn && <td className="border border-outline-variant/20 px-3 py-2" />}
                  </tr>,
                ])),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">III. Chi phí ăn</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {withActionHeader(['Nhà cung cấp', 'Địa chỉ', 'Tên dịch vụ', 'Đơn giá', 'Mặc định']).map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mealRows.length === 0 ? (
              <tr>
                <td colSpan={showActionColumn ? 6 : 5} className="border border-outline-variant/20 px-3 py-4 text-primary/45 italic">Chọn bữa ăn ở Lịch trình để sinh dòng chi phí ăn.</td>
              </tr>
            ) : mealRows.map(meal => {
              const providerRows = mealQuotesBySection[meal.id] ?? [];
              const selectedProvider = providerRows.find(row => row.isDefault) ?? providerRows[0];
              return [
                <tr key={`${meal.id}-header`} className="bg-gray-50">
                  <td className="border border-outline-variant/20 px-3 py-2 font-medium">{meal.label}</td>
                  <td className="border border-outline-variant/20 px-3 py-2" />
                  <td className="border border-outline-variant/20 px-3 py-2" />
                  <td className="border border-outline-variant/20 px-3 py-2 text-right">Đơn giá áp dụng: {formatMoney(selectedProvider?.price ?? meal.price)}</td>
                  <td className="border border-outline-variant/20 px-3 py-2" />
                  {showActionColumn && (
                    <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50 text-secondary font-medium">
                      <button type="button" onClick={() => setMealQuotesBySection(prev => ({ ...prev, [meal.id]: [...(prev[meal.id] ?? []), buildMealQuoteRow(meal.label, (prev[meal.id] ?? []).length)] }))} className="hover:underline" aria-label={`Thêm mới dịch vụ ${meal.label}`}>Thêm DV +</button>
                    </td>
                  )}
                </tr>,
                ...providerRows.map(row => (
                  <tr key={row.id}>
                    <td className="border border-outline-variant/20 px-3 py-2"><input value={row.supplierName} onChange={e => setMealQuotesBySection(prev => ({ ...prev, [meal.id]: (prev[meal.id] ?? []).map(item => item.id === row.id ? { ...item, supplierName: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input value={row.address} onChange={e => setMealQuotesBySection(prev => ({ ...prev, [meal.id]: (prev[meal.id] ?? []).map(item => item.id === row.id ? { ...item, address: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input value={row.serviceName} onChange={e => setMealQuotesBySection(prev => ({ ...prev, [meal.id]: (prev[meal.id] ?? []).map(item => item.id === row.id ? { ...item, serviceName: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.price || ''} onChange={e => setMealQuotesBySection(prev => ({ ...prev, [meal.id]: (prev[meal.id] ?? []).map(item => item.id === row.id ? { ...item, price: parseInt(e.target.value) || 0 } : item) }))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                    <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDefaultCheckbox(row.isDefault, () => setMealQuotesBySection(prev => ({ ...prev, [meal.id]: (prev[meal.id] ?? []).map(item => ({ ...item, isDefault: item.id === row.id })) })), `Mặc định ${row.supplierName}`)}</td>
                    {showActionColumn && (
                      <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDeleteButton(`Xóa ${row.supplierName}`, () => setMealQuotesBySection(prev => ({ ...prev, [meal.id]: normalizeDefaultRows((prev[meal.id] ?? []).filter(item => item.id !== row.id)) })), providerRows.length === 1)}</td>
                    )}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">IV. Vé tham quan</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {withActionHeader(['Nhà cung cấp', 'Địa chỉ', 'Tên dịch vụ', 'Đơn giá người lớn', 'Đơn giá trẻ em']).map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attractionSections.map(section => [
              <tr key={`${section.id}-header`} className="bg-gray-50">
                <td className="border border-outline-variant/20 px-3 py-2 font-medium">{section.label}</td>
                <td className="border border-outline-variant/20 px-3 py-2" />
                <td className="border border-outline-variant/20 px-3 py-2" />
                <td className="border border-outline-variant/20 px-3 py-2" />
                <td className="border border-outline-variant/20 px-3 py-2" />
                {showActionColumn && (
                  <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50 text-secondary font-medium">
                    <button type="button" onClick={() => setAttractionQuotesBySection(prev => ({ ...prev, [section.id]: [...(prev[section.id] ?? []), buildAttractionQuoteRow(section.serviceName)] }))} className="hover:underline" aria-label={`Thêm mới dịch vụ ${section.label}`}>Thêm mới DV +</button>
                  </td>
                )}
              </tr>,
              ...(attractionQuotesBySection[section.id] ?? []).map(row => (
                <tr key={row.id}>
                  <td className="border border-outline-variant/20 px-3 py-2"><input value={row.supplierName} onChange={e => setAttractionQuotesBySection(prev => ({ ...prev, [section.id]: (prev[section.id] ?? []).map(item => item.id === row.id ? { ...item, supplierName: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                  <td className="border border-outline-variant/20 px-3 py-2"><input value={row.address} onChange={e => setAttractionQuotesBySection(prev => ({ ...prev, [section.id]: (prev[section.id] ?? []).map(item => item.id === row.id ? { ...item, address: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                  <td className="border border-outline-variant/20 px-3 py-2"><input value={row.serviceName} onChange={e => setAttractionQuotesBySection(prev => ({ ...prev, [section.id]: (prev[section.id] ?? []).map(item => item.id === row.id ? { ...item, serviceName: e.target.value } : item) }))} className="w-full border-0 bg-transparent outline-none" /></td>
                  <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.adultPrice || ''} onChange={e => setAttractionQuotesBySection(prev => ({ ...prev, [section.id]: (prev[section.id] ?? []).map(item => item.id === row.id ? { ...item, adultPrice: parseInt(e.target.value) || 0 } : item) }))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                  <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.childPrice || ''} onChange={e => setAttractionQuotesBySection(prev => ({ ...prev, [section.id]: (prev[section.id] ?? []).map(item => item.id === row.id ? { ...item, childPrice: parseInt(e.target.value) || 0 } : item) }))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                  {showActionColumn && (
                    <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDeleteButton(`Xóa ${row.serviceName}`, () => setAttractionQuotesBySection(prev => ({ ...prev, [section.id]: (prev[section.id] ?? []).filter(item => item.id !== row.id) })), (attractionQuotesBySection[section.id] ?? []).length === 1)}</td>
                  )}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">V. Hướng dẫn viên</h4>
        <div className="grid grid-cols-[220px_180px_1fr] gap-4 items-end max-w-2xl">
          <label>
            <span className="text-[10px] uppercase tracking-widest text-primary/60 font-label block mb-1">Đơn giá</span>
            <input
              type="number"
              value={guideUnitPrice}
              onChange={e => onGuideUnitPriceChange(parseInt(e.target.value) || 0)}
              className="w-full border border-outline-variant/50 px-3 py-2.5 text-sm outline-none"
            />
          </label>
          <span className="text-sm text-primary/45 pb-3">đ / ngày tour</span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm text-primary mb-2">VI. Chi phí khác</h4>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--color-surface)] text-left">
              {withActionHeader(['Nhà cung cấp', 'Tên dịch vụ', 'Đơn giá', 'Đơn vị', 'Ghi chú']).map(header => (
                <th key={header} className="border border-outline-variant/20 px-3 py-2 font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {otherCostRows.map(row => (
              <tr key={row.id}>
                <td className="border border-outline-variant/20 px-3 py-2"><input value={row.supplierName} onChange={e => setOtherCostRows(rows => rows.map(item => item.id === row.id ? { ...item, supplierName: e.target.value } : item))} className="w-full border-0 bg-transparent outline-none" /></td>
                <td className="border border-outline-variant/20 px-3 py-2"><input value={row.serviceName} onChange={e => setOtherCostRows(rows => rows.map(item => item.id === row.id ? { ...item, serviceName: e.target.value } : item))} className="w-full border-0 bg-transparent outline-none" /></td>
                <td className="border border-outline-variant/20 px-3 py-2"><input type="number" value={row.price || ''} onChange={e => setOtherCostRows(rows => rows.map(item => item.id === row.id ? { ...item, price: parseInt(e.target.value) || 0 } : item))} className="w-full border-0 bg-transparent outline-none text-right" /></td>
                <td className="border border-outline-variant/20 px-3 py-2"><input value={row.unit} onChange={e => setOtherCostRows(rows => rows.map(item => item.id === row.id ? { ...item, unit: e.target.value } : item))} className="w-full border-0 bg-transparent outline-none" /></td>
                <td className="border border-outline-variant/20 px-3 py-2"><input value={row.note} onChange={e => setOtherCostRows(rows => rows.map(item => item.id === row.id ? { ...item, note: e.target.value } : item))} placeholder="Nhập ghi chú" className="w-full border-0 bg-transparent outline-none" /></td>
                {showActionColumn && (
                  <td className="border border-outline-variant/20 px-3 py-2 text-center">{renderDeleteButton(`Xóa ${row.serviceName}`, () => setOtherCostRows(rows => rows.filter(item => item.id !== row.id)), otherCostRows.length === 1)}</td>
                )}
              </tr>
            ))}
            {showActionColumn && (
              <tr className="bg-gray-50">
                <td className="border border-outline-variant/20 px-3 py-2" colSpan={5} />
                <td className="border border-outline-variant/20 px-3 py-2 bg-blue-50 text-secondary font-medium">
                  <button type="button" onClick={() => setOtherCostRows(rows => [...rows, buildOtherCostQuoteRow(rows.length)])} className="hover:underline" aria-label="Thêm mới dịch vụ chi phí khác">Thêm mới DV +</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
