import React, { useEffect, useMemo, useState } from 'react';
import { Breadcrumb, message } from 'antd';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Booking } from '@entities/booking/data/bookings';
import type {
  CostCategory,
  CostEstimate,
  CostItem,
  PricingConfig,
  TourInstance,
  TourProgram,
} from '@entities/tour-program/data/tourProgram';
import { addServicePrice } from '@shared/lib/api/services';
import { addSupplierBulkPrices } from '@shared/lib/api/suppliers';
import { updateTourInstanceCommand } from '@shared/lib/api/tourInstances';
import {
  getRetainedAmountFromCancelledBooking,
  isBookingConfirmedForOperations,
  isBookingFinanciallyRelevantForOperations,
} from '@shared/lib/bookingLifecycle';
import { useAuthStore } from '@shared/store/useAuthStore';
import {
  useAppDataStore,
  type ServicePriceRow,
  type ServiceRow,
  type SupplierPriceRow,
  type SupplierRow,
  type SupplierServiceLine,
} from '@shared/store/useAppDataStore';

type DatedPrice = { startDate: string; endDate?: string; price: number };
type RowTarget = 'all' | 'adult' | 'child' | 'infant';
type RowCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

type EstimateChoice = {
  id: string;
  supplierName: string;
  serviceVariant: string;
  unitPrice: number;
  childUnitPrice?: number;
  unit: string;
  systemManagedPrice: boolean;
  unitPriceEditable: boolean;
  formulaCount?: 'Theo ngày' | 'Giá trị mặc định' | 'Nhập tay';
  formulaCountDefault?: number;
  formulaQuantity?: 'Theo số người' | 'Giá trị mặc định' | 'Nhập tay';
  formulaQuantityDefault?: number;
  supplierId?: string;
  serviceId?: string;
  serviceLineId?: string;
  mealLine?: boolean;
};

type EstimateRow = {
  rowId: string;
  groupId?: string;
  categoryId: RowCategory;
  categoryName: string;
  itemName: string;
  supplierName: string;
  serviceVariant: string;
  unit: string;
  target: RowTarget;
  quantity: number;
  occurrences: number;
  quantityEditable: boolean;
  occurrencesEditable: boolean;
  unitPrice: number;
  unitPriceEditable: boolean;
  systemManagedPrice: boolean;
  total: number;
  note: string;
  optionId?: string;
  optionChoices: EstimateChoice[];
};

const transportCatalog: Record<string, { supplierName: string; serviceVariant: string; unitPrice: number }> = {
  'transport-van-tai-viet-29': { supplierName: 'Vận tải Việt Tourist', serviceVariant: 'Xe 29 chỗ', unitPrice: 8100000 },
  'transport-hoang-gia-29': { supplierName: 'Hoàng Gia Travel Bus', serviceVariant: 'Xe 29 chỗ', unitPrice: 9600000 },
};

const flightCatalog: Record<string, { supplierName: string; serviceVariant: string; unitPrice: number }> = {
  'flight-vietnam-airlines': { supplierName: 'Vietnam Airlines Corp', serviceVariant: 'Vé máy bay đoàn', unitPrice: 3200000 },
  'flight-vietravel-air': { supplierName: 'Vietravel Airlines', serviceVariant: 'Vé máy bay đoàn', unitPrice: 2800000 },
};

const hotelCatalog: Record<string, { supplierName: string; city: string; single: DatedPrice[]; double: DatedPrice[]; triple: DatedPrice[] }> = {
  'hotel-da-nang-4-pearl': {
    supplierName: 'Pearl Beach Hotel',
    city: 'Đà Nẵng',
    single: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 1550000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 1750000 }, { startDate: '2026-09-01', price: 1600000 }],
    double: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 1250000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 1450000 }, { startDate: '2026-09-01', price: 1300000 }],
    triple: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 1500000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 1700000 }, { startDate: '2026-09-01', price: 1550000 }],
  },
  'hotel-da-nang-4-riviera': {
    supplierName: 'Riviera Đà Nẵng',
    city: 'Đà Nẵng',
    single: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 1480000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 1680000 }, { startDate: '2026-09-01', price: 1520000 }],
    double: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 1180000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 1380000 }, { startDate: '2026-09-01', price: 1220000 }],
    triple: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 1440000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 1640000 }, { startDate: '2026-09-01', price: 1490000 }],
  },
  'hotel-ha-long-4-heritage': {
    supplierName: 'Khách sạn Di Sản Việt',
    city: 'Quảng Ninh',
    single: [{ startDate: '2026-01-01', endDate: '2026-04-30', price: 1500000 }, { startDate: '2026-05-01', endDate: '2026-08-31', price: 1760000 }, { startDate: '2026-09-01', price: 1550000 }],
    double: [{ startDate: '2026-01-01', endDate: '2026-04-30', price: 1200000 }, { startDate: '2026-05-01', endDate: '2026-08-31', price: 1450000 }, { startDate: '2026-09-01', price: 1250000 }],
    triple: [{ startDate: '2026-01-01', endDate: '2026-04-30', price: 1440000 }, { startDate: '2026-05-01', endDate: '2026-08-31', price: 1680000 }, { startDate: '2026-09-01', price: 1490000 }],
  },
};

const mealCatalog: Record<string, { supplierName: string; serviceVariant: string; prices: DatedPrice[] }> = {
  'meal-da-nang-ocean': { supplierName: 'Nhà hàng Biển Xanh', serviceVariant: 'Set menu miền Trung', prices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 165000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 185000 }, { startDate: '2026-09-01', price: 170000 }] },
  'meal-ha-long-harbor': { supplierName: 'Hạ Long Harbor', serviceVariant: 'Set hải sản đoàn', prices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 178000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 198000 }, { startDate: '2026-09-01', price: 182000 }] },
  'meal-ha-noi-lotus': { supplierName: 'Lotus Hà Nội', serviceVariant: 'Set menu đoàn', prices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 150000 }, { startDate: '2026-06-01', price: 162000 }] },
};

const attractionCatalog: Record<string, { supplierName: string; serviceVariant: string; adultPrices: DatedPrice[]; childPrices: DatedPrice[] }> = {
  'ticket-ba-na': { supplierName: 'Sun World', serviceVariant: 'Vé Bà Nà Hills', adultPrices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 820000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 860000 }, { startDate: '2026-09-01', price: 830000 }], childPrices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 650000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 690000 }, { startDate: '2026-09-01', price: 660000 }] },
  'ticket-sunworld-halong': { supplierName: 'Sun World', serviceVariant: 'Vé Sun World Hạ Long', adultPrices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 450000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 520000 }, { startDate: '2026-09-01', price: 470000 }], childPrices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 320000 }, { startDate: '2026-06-01', endDate: '2026-08-31', price: 360000 }, { startDate: '2026-09-01', price: 330000 }] },
  'ticket-van-mieu': { supplierName: 'Văn Miếu', serviceVariant: 'Vé Văn Miếu', adultPrices: [{ startDate: '2026-01-01', price: 70000 }], childPrices: [{ startDate: '2026-01-01', price: 35000 }] },
};

const otherCatalog: Record<string, { supplierName: string; serviceVariant: string; priceMode: 'Báo giá' | 'Giá niêm yết'; formulaCount: 'Theo ngày' | 'Giá trị mặc định' | 'Nhập tay'; formulaCountDefault?: number; formulaQuantity: 'Theo số người' | 'Giá trị mặc định' | 'Nhập tay'; formulaQuantityDefault?: number; prices: DatedPrice[] }> = {
  'other-insurance': { supplierName: 'Bảo Việt Travel Care', serviceVariant: 'Bảo hiểm du lịch', priceMode: 'Giá niêm yết', formulaCount: 'Giá trị mặc định', formulaCountDefault: 1, formulaQuantity: 'Theo số người', prices: [{ startDate: '2026-01-01', endDate: '2026-06-30', price: 40000 }, { startDate: '2026-07-01', price: 50000 }] },
  'other-water': { supplierName: 'Aqua Tour Supply', serviceVariant: 'Nước uống trên xe', priceMode: 'Giá niêm yết', formulaCount: 'Theo ngày', formulaQuantity: 'Theo số người', prices: [{ startDate: '2026-01-01', endDate: '2026-05-31', price: 12000 }, { startDate: '2026-06-01', price: 15000 }] },
  'other-team-building': { supplierName: 'Event Lab', serviceVariant: 'Đạo cụ team building', priceMode: 'Báo giá', formulaCount: 'Nhập tay', formulaQuantity: 'Giá trị mặc định', formulaQuantityDefault: 1, prices: [{ startDate: '2026-01-01', price: 0 }] },
};

function formatCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`;
}

function cleanText(value?: string) {
  return (value ?? '-').replace(/\?\./g, '.').replace(/\s+\?/g, '');
}

function roundThousand(value: number) {
  return Math.round(value / 1000) * 1000;
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const next = parseDateKey(value);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function pickDatedPrice(prices: DatedPrice[], dateKey: string) {
  const target = parseDateKey(dateKey).getTime();
  const included = prices.find((price) => {
    const start = parseDateKey(price.startDate).getTime();
    const end = price.endDate ? parseDateKey(price.endDate).getTime() : Number.POSITIVE_INFINITY;
    return start <= target && target <= end;
  });
  if (included) return included.price;
  const openEnded = prices.find((price) => parseDateKey(price.startDate).getTime() <= target && !price.endDate);
  return openEnded?.price ?? prices.at(-1)?.price ?? 0;
}

function pickSupplierPrice(prices: SupplierPriceRow[], dateKey: string) {
  const target = parseDateKey(dateKey).getTime();
  const included = prices.find((price) => {
    const start = parseDateKey(price.fromDate).getTime();
    const end = price.toDate ? parseDateKey(price.toDate).getTime() : Number.POSITIVE_INFINITY;
    return start <= target && target <= end;
  });
  if (included) return included.unitPrice;
  const openEnded = prices.find((price) => parseDateKey(price.fromDate).getTime() <= target && !price.toDate);
  return openEnded?.unitPrice ?? prices.at(-1)?.unitPrice ?? 0;
}

function pickServicePrice(prices: ServicePriceRow[], targetLabel: RowTarget, dateKey: string) {
  const loweredTarget = targetLabel === 'adult' ? 'người lớn' : targetLabel === 'child' ? 'trẻ em' : '';
  const matchingPool = loweredTarget ? prices.filter((price) => price.note.toLowerCase().includes(loweredTarget)) : prices;
  const target = parseDateKey(dateKey).getTime();
  const included = matchingPool.find((price) => {
    const start = parseDateKey(price.effectiveDate).getTime();
    const end = price.endDate ? parseDateKey(price.endDate).getTime() : Number.POSITIVE_INFINITY;
    return start <= target && target <= end;
  });
  if (included) return included.unitPrice;
  const openEnded = matchingPool.find((price) => parseDateKey(price.effectiveDate).getTime() <= target && !price.endDate);
  return openEnded?.unitPrice ?? matchingPool.at(-1)?.unitPrice ?? prices.at(-1)?.unitPrice ?? 0;
}

function closeOpenEndedServicePrices(prices: ServicePriceRow[], effectiveDate: string, targetLabel?: string) {
  return prices.map((price) => {
    if (price.endDate) return price;
    if (targetLabel && !price.note.toLowerCase().includes(targetLabel.toLowerCase())) return price;
    return { ...price, endDate: effectiveDate };
  });
}

function closeOpenEndedSupplierPrices(prices: SupplierPriceRow[], effectiveDate: string) {
  return prices.map((price) => (!price.toDate ? { ...price, toDate: effectiveDate } : price));
}

function isListedPriceMode(mode?: string) {
  return mode === 'Niêm yết' || mode === 'Niêm yết' || mode === 'Giá niêm yết' || mode === 'Giá niêm yết';
}

function isQuotedPriceMode(mode?: string) {
  return !isListedPriceMode(mode);
}

function getBookingStats(bookings: Booking[]) {
  const stats = {
    adults: 0,
    children: 0,
    infants: 0,
    totalGuests: 0,
    roomCounts: { single: 0, double: 0, triple: 0 },
  };
  bookings.forEach((booking) => {
    stats.roomCounts.single += booking.roomCounts?.single ?? 0;
    stats.roomCounts.double += booking.roomCounts?.double ?? 0;
    stats.roomCounts.triple += booking.roomCounts?.triple ?? 0;
    booking.passengers.forEach((passenger) => {
      stats.totalGuests += 1;
      if (passenger.type === 'adult') stats.adults += 1;
      if (passenger.type === 'child') stats.children += 1;
      if (passenger.type === 'infant') stats.infants += 1;
    });
  });
  return stats;
}

function hasBookingDeadlinePassed(instance: TourInstance) {
  const deadline = new Date(instance.bookingDeadline);
  return !Number.isNaN(deadline.getTime()) && deadline <= new Date();
}

function isBookingResolvedForManifestGate(booking: Booking) {
  return booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'cancelled';
}

function canShowPassengerManifest(instance: TourInstance, relatedBookings: Booking[]) {
  const confirmedBookings = relatedBookings.filter(isBookingConfirmedForOperations);
  const confirmedGuestCount = confirmedBookings.reduce((sum, booking) => sum + booking.passengers.length, 0);
  return hasBookingDeadlinePassed(instance)
    && confirmedGuestCount >= instance.minParticipants
    && relatedBookings.length > 0
    && relatedBookings.every(isBookingResolvedForManifestGate);
}

function getGroupedAccommodation(program: TourProgram) {
  const groups: Array<{ id: string; label: string; city: string; nights: number; startNight: number }> = [];
  let current: { city: string; nights: number; startNight: number } | undefined;
  program.itinerary.forEach((day) => {
    if (!day.accommodationPoint) return;
    if (!current || current.city !== day.accommodationPoint) {
      if (current) {
        groups.push({
          id: `stay-${groups.length + 1}`,
          label: current.nights === 1 ? `Lưu trú - Đêm ${current.startNight}` : `Lưu trú - Đêm ${current.startNight}, ${current.startNight + current.nights - 1}`,
          city: current.city,
          nights: current.nights,
          startNight: current.startNight,
        });
      }
      current = { city: day.accommodationPoint, nights: 1, startNight: day.day };
    } else {
      current.nights += 1;
    }
  });
  if (current) {
    groups.push({
      id: `stay-${groups.length + 1}`,
      label: current.nights === 1 ? `Lưu trú - Đêm ${current.startNight}` : `Lưu trú - Đêm ${current.startNight}, ${current.startNight + current.nights - 1}`,
      city: current.city,
      nights: current.nights,
      startNight: current.startNight,
    });
  }
  return groups;
}

function getMealGroups(program: TourProgram) {
  return program.itinerary.flatMap((day) => day.meals.map((meal) => ({
    id: `meal-${day.day}-${meal}`,
    label: `Ngày ${day.day} - ${meal === 'breakfast' ? 'Bữa sáng' : meal === 'lunch' ? 'Bữa trưa' : 'Bữa tối'}`,
    day: day.day,
  })));
}

function fallbackTransportChoices(): EstimateChoice[] {
  return Object.entries(transportCatalog).map(([id, option]) => ({
    id,
    supplierName: option.supplierName,
    serviceVariant: option.serviceVariant,
    unitPrice: option.unitPrice,
    unit: 'chuyến',
    systemManagedPrice: false,
    unitPriceEditable: true,
  }));
}

function fallbackFlightChoices(): EstimateChoice[] {
  return Object.entries(flightCatalog).map(([id, option]) => ({
    id,
    supplierName: option.supplierName,
    serviceVariant: option.serviceVariant,
    unitPrice: option.unitPrice,
    unit: 'khách',
    systemManagedPrice: false,
    unitPriceEditable: true,
  }));
}

function fallbackHotelChoices(city: string, roomType: 'single' | 'double' | 'triple', dateKeys: string[]): EstimateChoice[] {
  return Object.entries(hotelCatalog)
    .filter(([, option]) => option.city === city)
    .map(([id, option]) => {
      const prices = option[roomType];
      const average = roundThousand(dateKeys.reduce((sum, dateKey) => sum + pickDatedPrice(prices, dateKey), 0) / Math.max(1, dateKeys.length));
      return {
        id,
        supplierName: option.supplierName,
        serviceVariant: roomType === 'single' ? 'Phòng đơn' : roomType === 'double' ? 'Phòng đôi' : 'Phòng ba',
        unitPrice: average,
        unit: 'phòng',
        systemManagedPrice: true,
        unitPriceEditable: false,
      };
    });
}

function fallbackMealChoices(dateKey: string): EstimateChoice[] {
  return Object.entries(mealCatalog).map(([id, option]) => ({
    id,
    supplierName: option.supplierName,
    serviceVariant: option.serviceVariant,
    unitPrice: pickDatedPrice(option.prices, dateKey),
    unit: 'khách',
    systemManagedPrice: true,
    unitPriceEditable: false,
  }));
}

function fallbackAttractionChoices(dateKey: string): EstimateChoice[] {
  return Object.entries(attractionCatalog).map(([id, option]) => ({
    id,
    supplierName: option.supplierName,
    serviceVariant: option.serviceVariant,
    unitPrice: pickDatedPrice(option.adultPrices, dateKey),
    childUnitPrice: pickDatedPrice(option.childPrices, dateKey),
    unit: 'khách',
    systemManagedPrice: true,
    unitPriceEditable: false,
  }));
}

function fallbackOtherChoices(dateKey: string): EstimateChoice[] {
  return Object.entries(otherCatalog).map(([id, option]) => ({
    id,
    supplierName: option.supplierName,
    serviceVariant: option.serviceVariant,
    unitPrice: pickDatedPrice(option.prices, dateKey),
    unit: 'lần',
    systemManagedPrice: option.priceMode === 'Giá niêm yết',
    unitPriceEditable: isQuotedPriceMode(option.priceMode),
    formulaCount: option.formulaCount,
    formulaCountDefault: option.formulaCountDefault,
    formulaQuantity: option.formulaQuantity,
    formulaQuantityDefault: option.formulaQuantityDefault,
  }));
}

function supplierTransportChoices(suppliers: SupplierRow[], dateKey: string, type: 'Xe' | 'Máy bay'): EstimateChoice[] {
  return suppliers.flatMap((supplier) => (
    supplier.category === 'Vận chuyển'
      ? supplier.services
        .filter((service) => (service.transportType ?? 'Xe') === type)
        .map((service) => ({
          id: `supplier-${supplier.id}-${service.id}`,
          supplierName: supplier.name,
          serviceVariant: service.name,
          unitPrice: pickSupplierPrice(service.prices, dateKey),
          unit: service.unit.toLowerCase(),
          systemManagedPrice: isListedPriceMode(service.priceMode),
          unitPriceEditable: type !== 'Xe' || isQuotedPriceMode(service.priceMode),
          supplierId: supplier.id,
          serviceLineId: service.id,
        }))
      : []
  ));
}

function supplierHotelChoices(suppliers: SupplierRow[], city: string, roomName: string, dateKey: string): EstimateChoice[] {
  return suppliers.flatMap((supplier) => (
    supplier.category === 'Khách sạn' && supplier.operatingArea.toLowerCase().includes(city.toLowerCase())
      ? supplier.services
        .filter((service) => service.name === roomName)
        .map((service) => ({
          id: `supplier-${supplier.id}-${service.id}`,
          supplierName: supplier.name,
          serviceVariant: service.name,
          unitPrice: pickSupplierPrice(service.prices, dateKey),
          unit: 'phòng',
          systemManagedPrice: true,
          unitPriceEditable: false,
          supplierId: supplier.id,
          serviceLineId: service.id,
        }))
      : []
  ));
}

function supplierMealChoices(suppliers: SupplierRow[], dateKey: string): EstimateChoice[] {
  return suppliers.flatMap((supplier) => {
    const serviceLines = [
      ...supplier.services.map((service) => ({ ...service, mealLine: false })),
      ...supplier.mealServices.map((service) => ({ ...service, mealLine: true })),
    ];
    if (supplier.category !== 'Nhà hàng' && supplier.category !== 'Khách sạn') return [];
    return serviceLines.map((service) => ({
      id: `supplier-${supplier.id}-${service.id}-${service.mealLine ? 'meal' : 'main'}`,
      supplierName: supplier.name,
      serviceVariant: service.name,
      unitPrice: pickSupplierPrice(service.prices, dateKey),
      unit: 'khách',
      systemManagedPrice: true,
      unitPriceEditable: false,
      supplierId: supplier.id,
      serviceLineId: service.id,
      mealLine: service.mealLine,
    }));
  });
}

function serviceChoices(services: ServiceRow[], category: 'Vé tham quan' | 'Các dịch vụ khác' | 'Hướng dẫn viên', target: RowTarget, dateKey: string): EstimateChoice[] {
  return services
    .filter((service) => service.category === category)
    .map((service) => ({
      id: `service-${service.id}-${target}`,
      supplierName: service.supplierName ?? service.name,
      serviceVariant: service.name,
      unitPrice: pickServicePrice(service.prices, target === 'child' ? 'child' : 'adult', dateKey),
      childUnitPrice: service.setup === 'Theo độ tuổi' ? pickServicePrice(service.prices, 'child', dateKey) : undefined,
      unit: service.unit,
      systemManagedPrice: service.priceMode === 'Giá niêm yết',
      unitPriceEditable: isQuotedPriceMode(service.priceMode),
      formulaCount: service.formulaCount as EstimateChoice['formulaCount'],
      formulaCountDefault: Number(service.formulaCountDefault || 0) || undefined,
      formulaQuantity: service.formulaQuantity as EstimateChoice['formulaQuantity'],
      formulaQuantityDefault: Number(service.formulaQuantityDefault || 0) || undefined,
      serviceId: service.id,
    }));
}

function mergeChoices(primary: EstimateChoice[], secondary: EstimateChoice[]) {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((choice) => {
    const key = `${choice.supplierName}|${choice.serviceVariant}|${choice.unit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function recalcRow(row: EstimateRow) {
  return { ...row, total: row.quantity * row.occurrences * row.unitPrice };
}

function resolveDefaultQuantity(choice: EstimateChoice, stats: ReturnType<typeof getBookingStats>) {
  if (choice.formulaQuantity === 'Theo số người') return Math.max(1, stats.totalGuests);
  if (choice.formulaQuantity === 'Giá trị mặc định') return Math.max(1, choice.formulaQuantityDefault ?? 1);
  return 0;
}

function resolveDefaultOccurrences(choice: EstimateChoice, durationDays: number) {
  if (choice.formulaCount === 'Theo ngày') return Math.max(1, durationDays);
  if (choice.formulaCount === 'Giá trị mặc định') return Math.max(1, choice.formulaCountDefault ?? 1);
  return 0;
}

function applyChoice(row: EstimateRow, choice: EstimateChoice, stats: ReturnType<typeof getBookingStats>, durationDays: number) {
  let quantity = row.quantity;
  let occurrences = row.occurrences;
  let quantityEditable = row.quantityEditable;
  let occurrencesEditable = row.occurrencesEditable;
  const unitPrice = row.target === 'child' && choice.childUnitPrice != null ? choice.childUnitPrice : choice.unitPrice;

  if (row.categoryId === 'F') {
    quantity = choice.formulaQuantity === 'Nhập tay' ? Math.max(0, row.quantity) : Math.max(1, resolveDefaultQuantity(choice, stats) || 1);
    occurrences = choice.formulaCount === 'Nhập tay' ? Math.max(0, row.occurrences) : Math.max(1, resolveDefaultOccurrences(choice, durationDays) || 1);
    quantityEditable = choice.formulaQuantity === 'Nhập tay';
    occurrencesEditable = choice.formulaCount === 'Nhập tay';
  }

  return recalcRow({
    ...row,
    supplierName: choice.supplierName,
    serviceVariant: choice.serviceVariant,
    unit: choice.unit,
    unitPrice,
    unitPriceEditable: choice.unitPriceEditable || row.categoryId === 'A',
    systemManagedPrice: choice.systemManagedPrice,
    quantity,
    occurrences,
    quantityEditable,
    occurrencesEditable,
    optionId: choice.id,
  });
}

function rowsFromCostEstimate(instance: TourInstance) {
  return instance.costEstimate?.categories.flatMap((category) => (
    category.items.flatMap((item) => item.suppliers.map((supplier) => ({
      rowId: supplier.supplierId,
      categoryId: category.id as RowCategory,
      categoryName: category.name,
      itemName: item.name,
      supplierName: supplier.supplierName,
      serviceVariant: supplier.serviceVariant,
      unit: item.unit,
      target: item.target,
      quantity: item.quantity,
      occurrences: item.nightsOrRuns ?? 1,
      quantityEditable: false,
      occurrencesEditable: false,
      unitPrice: supplier.quotedPrice,
      unitPriceEditable: category.id === 'A' || category.id === 'E',
      systemManagedPrice: false,
      total: item.total,
      note: supplier.notes ?? '',
      optionId: undefined,
      optionChoices: [],
    })))
  )) ?? [];
}

function buildFallbackRows(
  instance: TourInstance,
  program: TourProgram,
  bookings: Booking[],
  suppliers: SupplierRow[],
  services: ServiceRow[],
) {
  const departureDate = instance.departureDate;
  const stats = getBookingStats(bookings);
  const pricingTables = program.draftPricingTables;
  const rows: EstimateRow[] = [];
  const pushRow = (row: EstimateRow) => rows.push(recalcRow(row));

  pricingTables?.transport?.forEach((selection, index) => {
    const choices = mergeChoices(supplierTransportChoices(suppliers, departureDate, 'Xe'), fallbackTransportChoices());
    const selected = choices.find((choice) => choice.id === selection.optionId) ?? choices[0];
    if (!selected) return;
    pushRow({
      rowId: `A-transport-${index}`,
      categoryId: 'A',
      categoryName: 'Vận chuyển',
      itemName: 'Xe vận chuyển',
      supplierName: selected.supplierName,
      serviceVariant: selected.serviceVariant,
      unit: 'chuyến',
      target: 'all',
      quantity: 1,
      occurrences: 1,
      quantityEditable: false,
      occurrencesEditable: false,
      unitPrice: selection.manualPrice ?? selected.unitPrice,
      unitPriceEditable: true,
      systemManagedPrice: false,
      total: 0,
      note: '',
      optionId: selected.id,
      optionChoices: choices,
    });
  });

  pricingTables?.flight?.forEach((selection, index) => {
    const choices = mergeChoices(supplierTransportChoices(suppliers, departureDate, 'Máy bay'), fallbackFlightChoices());
    const selected = choices.find((choice) => choice.id === selection.optionId) ?? choices[0];
    if (!selected) return;
    pushRow({
      rowId: `A-flight-${index}`,
      categoryId: 'A',
      categoryName: 'Vận chuyển',
      itemName: 'Vé máy bay',
      supplierName: selected.supplierName,
      serviceVariant: selected.serviceVariant,
      unit: 'khách',
      target: 'all',
      quantity: Math.max(1, stats.totalGuests),
      occurrences: 1,
      quantityEditable: false,
      occurrencesEditable: false,
      unitPrice: selection.manualPrice ?? selected.unitPrice,
      unitPriceEditable: true,
      systemManagedPrice: false,
      total: 0,
      note: '',
      optionId: selected.id,
      optionChoices: choices,
    });
  });

  getGroupedAccommodation(program).forEach((group) => {
    const selections = pricingTables?.hotels?.[group.id] ?? [];
    const roomConfigs: Array<{ roomType: 'single' | 'double' | 'triple'; roomName: string; roomCount: number }> = [
      { roomType: 'single', roomName: 'Phòng đơn', roomCount: stats.roomCounts.single },
      { roomType: 'double', roomName: 'Phòng đôi', roomCount: stats.roomCounts.double },
      { roomType: 'triple', roomName: 'Phòng ba', roomCount: stats.roomCounts.triple },
    ];
    const nightlyDateKeys = Array.from({ length: group.nights }, (_, offset) => addDays(departureDate, group.startNight - 1 + offset));

    roomConfigs.forEach(({ roomType, roomName, roomCount }) => {
      if (roomCount <= 0) return;
      const storeChoices = supplierHotelChoices(suppliers, group.city, roomName, nightlyDateKeys[0]);
      const fallbackChoices = fallbackHotelChoices(group.city, roomType, nightlyDateKeys);
      const choices = mergeChoices(storeChoices, fallbackChoices);
      const defaultSelection = selections.find((item) => item.isDefault) ?? selections[0];
      const selected = choices.find((choice) => choice.id === defaultSelection?.optionId || choice.supplierName === hotelCatalog[defaultSelection?.optionId ?? '']?.supplierName) ?? choices[0];
      if (!selected) return;
      pushRow({
        rowId: `B-${group.id}-${roomType}`,
        groupId: group.id,
        categoryId: 'B',
        categoryName: 'Khách sạn',
        itemName: `${group.label} - ${roomName}`,
        supplierName: selected.supplierName,
        serviceVariant: roomName,
        unit: 'phòng',
        target: 'adult',
        quantity: roomCount,
        occurrences: group.nights,
        quantityEditable: false,
        occurrencesEditable: false,
        unitPrice: selected.unitPrice,
        unitPriceEditable: false,
        systemManagedPrice: true,
        total: 0,
        note: '',
        optionId: selected.id,
        optionChoices: choices,
      });
    });
  });

  getMealGroups(program).forEach((group) => {
    const selections = pricingTables?.meals?.[group.id] ?? [];
    const dateKey = addDays(departureDate, group.day - 1);
    const choices = mergeChoices(supplierMealChoices(suppliers, dateKey), fallbackMealChoices(dateKey));
    const defaultSelection = selections.find((item) => item.isDefault) ?? selections[0];
    const selected = choices.find((choice) => choice.id === defaultSelection?.optionId) ?? choices[0];
    if (!selected) return;
    pushRow({
      rowId: `C-${group.id}`,
      groupId: group.id,
      categoryId: 'C',
      categoryName: 'Chi phí ăn',
      itemName: group.label,
      supplierName: selected.supplierName,
      serviceVariant: selected.serviceVariant,
      unit: 'khách',
      target: 'all',
      quantity: Math.max(1, stats.totalGuests),
      occurrences: 1,
      quantityEditable: false,
      occurrencesEditable: false,
      unitPrice: selected.unitPrice,
      unitPriceEditable: false,
      systemManagedPrice: true,
      total: 0,
      note: '',
      optionId: selected.id,
      optionChoices: choices,
    });
  });

  Object.entries(pricingTables?.attractions ?? {}).forEach(([groupId, selections], index) => {
    const day = Number(groupId.split('-')[1] || index + 1);
    const dateKey = addDays(departureDate, day - 1);
    const choices = mergeChoices(serviceChoices(services, 'Vé tham quan', 'adult', dateKey), fallbackAttractionChoices(dateKey));
    const defaultSelection = selections.find((item) => item.isDefault) ?? selections[0];
    const selected = choices.find((choice) => choice.id === defaultSelection?.optionId) ?? choices[0];
    if (!selected) return;
    if (stats.adults > 0) {
      pushRow({
        rowId: `D-${groupId}-adult`,
        groupId,
        categoryId: 'D',
        categoryName: 'Vé thắng cảnh',
        itemName: `Ngày ${day} - Người lớn`,
        supplierName: selected.supplierName,
        serviceVariant: selected.serviceVariant,
        unit: 'khách',
        target: 'adult',
        quantity: stats.adults,
        occurrences: 1,
        quantityEditable: false,
        occurrencesEditable: false,
        unitPrice: selected.unitPrice,
        unitPriceEditable: false,
        systemManagedPrice: true,
        total: 0,
        note: '',
        optionId: selected.id,
        optionChoices: choices,
      });
    }
    if (stats.children > 0) {
      pushRow({
        rowId: `D-${groupId}-child`,
        groupId,
        categoryId: 'D',
        categoryName: 'Vé thắng cảnh',
        itemName: `Ngày ${day} - Trẻ em`,
        supplierName: selected.supplierName,
        serviceVariant: selected.serviceVariant,
        unit: 'khách',
        target: 'child',
        quantity: stats.children,
        occurrences: 1,
        quantityEditable: false,
        occurrencesEditable: false,
        unitPrice: selected.childUnitPrice ?? selected.unitPrice,
        unitPriceEditable: false,
        systemManagedPrice: true,
        total: 0,
        note: '',
        optionId: selected.id,
        optionChoices: choices,
      });
    }
  });

  const guideChoices = mergeChoices(serviceChoices(services, 'Hướng dẫn viên', 'adult', departureDate), [
    {
      id: 'guide-default',
      supplierName: instance.assignedGuide?.name ?? 'Chưa phân công',
      serviceVariant: 'Hướng dẫn viên',
      unitPrice: 400000,
      unit: 'đ',
      systemManagedPrice: false,
      unitPriceEditable: true,
    },
  ]);
  const selectedGuideChoice = guideChoices[0];
  pushRow({
    rowId: 'E-guide',
    categoryId: 'E',
    categoryName: 'Hướng dẫn viên',
    itemName: 'Hướng dẫn viên',
    supplierName: selectedGuideChoice.supplierName,
    serviceVariant: selectedGuideChoice.serviceVariant,
    unit: 'đ',
    target: 'all',
    quantity: 1,
    occurrences: 1,
    quantityEditable: false,
    occurrencesEditable: false,
    unitPrice: selectedGuideChoice.unitPrice,
    unitPriceEditable: true,
    systemManagedPrice: false,
    total: 0,
    note: '',
    optionId: selectedGuideChoice.id,
    optionChoices: guideChoices,
  });

  pricingTables?.otherCosts?.forEach((selection, index) => {
    const choices = mergeChoices(serviceChoices(services, 'Các dịch vụ khác', 'adult', departureDate), fallbackOtherChoices(departureDate));
    const selected = choices.find((choice) => choice.id === selection.optionId) ?? choices[0];
    if (!selected) return;
    const quantity = selected.formulaQuantity === 'Theo số người'
      ? Math.max(1, stats.totalGuests)
      : selected.formulaQuantity === 'Giá trị mặc định'
        ? Math.max(1, selected.formulaQuantityDefault ?? 1)
        : Number(selection.note?.match(/\d+/)?.[0] ?? 0);
    const occurrences = selected.formulaCount === 'Theo ngày'
      ? Math.max(1, program.duration.days)
      : selected.formulaCount === 'Giá trị mặc định'
        ? Math.max(1, selected.formulaCountDefault ?? 1)
        : Number(selection.occurrences ?? 0);

    pushRow({
      rowId: `F-other-${index}`,
      categoryId: 'F',
      categoryName: 'Chi phí khác',
      itemName: selected.serviceVariant,
      supplierName: selected.supplierName,
      serviceVariant: selected.serviceVariant,
      unit: 'lần',
      target: 'all',
      quantity: Math.max(1, quantity || 1),
      occurrences: Math.max(1, occurrences || 1),
      quantityEditable: selected.formulaQuantity === 'Nhập tay',
      occurrencesEditable: selected.formulaCount === 'Nhập tay',
      unitPrice: selection.manualPrice ?? selected.unitPrice,
      unitPriceEditable: selected.unitPriceEditable,
      systemManagedPrice: selected.systemManagedPrice,
      total: 0,
      note: selection.note ?? '',
      optionId: selected.id,
      optionChoices: choices,
    });
  });

  return rows;
}

function hydrateRows(
  baseRows: EstimateRow[],
  instance: TourInstance,
  stats: ReturnType<typeof getBookingStats>,
  durationDays: number,
) {
  if (!instance.costEstimate) return baseRows;
  const persisted = new Map(rowsFromCostEstimate(instance).map((row) => [row.rowId, row]));
  return baseRows.map((row) => {
    const saved = persisted.get(row.rowId);
    if (!saved) return row;
    const matchingChoice = row.optionChoices.find((choice) => (
      choice.supplierName === saved.supplierName && choice.serviceVariant === saved.serviceVariant
    ));
    const next = {
      ...row,
      supplierName: saved.supplierName,
      serviceVariant: saved.serviceVariant,
      quantity: saved.quantity,
      occurrences: saved.occurrences,
      unitPrice: saved.unitPrice,
      note: saved.note,
      optionId: matchingChoice?.id ?? row.optionId,
    };
    const applied = applyChoice(next, matchingChoice ?? {
      id: next.optionId ?? 'saved',
      supplierName: next.supplierName,
      serviceVariant: next.serviceVariant,
      unitPrice: next.unitPrice,
      unit: next.unit,
      systemManagedPrice: next.systemManagedPrice,
      unitPriceEditable: next.unitPriceEditable,
    }, stats, durationDays);
    return recalcRow({
      ...applied,
      supplierName: saved.supplierName,
      serviceVariant: saved.serviceVariant,
      quantity: saved.quantity,
      occurrences: saved.occurrences,
      unitPrice: saved.unitPrice,
      note: saved.note,
    });
  });
}

function getGroupedRows(rows: EstimateRow[]) {
  const byCategory = new Map<string, { categoryId: string; categoryName: string; rows: EstimateRow[] }>();
  rows.forEach((row) => {
    if (!byCategory.has(row.categoryId)) {
      byCategory.set(row.categoryId, { categoryId: row.categoryId, categoryName: row.categoryName, rows: [] });
    }
    byCategory.get(row.categoryId)!.rows.push(row);
  });
  return Array.from(byCategory.values());
}

export default function TourEstimate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePrefix = location.pathname.startsWith('/manager') ? '/manager' : '/coordinator';
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const currentUser = user?.name || 'Điều phối viên';
  const initializeProtected = useAppDataStore((state) => state.initializeProtected);
  const upsertTourInstance = useAppDataStore((state) => state.upsertTourInstance);
  const tourInstances = useAppDataStore((state) => state.tourInstances);
  const tourPrograms = useAppDataStore((state) => state.tourPrograms);
  const bookings = useAppDataStore((state) => state.bookings);
  const suppliers = useAppDataStore((state) => state.suppliers);
  const setSuppliers = useAppDataStore((state) => state.setSuppliers);
  const services = useAppDataStore((state) => state.services);
  const setServices = useAppDataStore((state) => state.setServices);
  const role = user?.role || 'guest';

  const instance = tourInstances.find((item) => item.id === id);
  const program = instance ? tourPrograms.find((item) => item.id === instance.programId) : undefined;

  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'itinerary' | 'estimate'>('overview');
  const [guestPopup, setGuestPopup] = useState<Booking | null>(null);
  const relatedBookings = useMemo(() => instance ? bookings.filter((booking) => (
    booking.instanceCode === instance.id || (!booking.instanceCode && booking.tourId === instance.id)
  )) : [], [bookings, instance]);
  const canDisplayManifest = instance ? canShowPassengerManifest(instance, relatedBookings) : false;
  const manifestBookings = useMemo(
    () => canDisplayManifest ? relatedBookings.filter(isBookingConfirmedForOperations) : [],
    [canDisplayManifest, relatedBookings],
  );
  const financialBookings = useMemo(
    () => relatedBookings.filter(isBookingFinanciallyRelevantForOperations),
    [relatedBookings],
  );
  const bookingStats = useMemo(() => getBookingStats(manifestBookings), [manifestBookings]);

  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>(() => (
    instance && program
      ? hydrateRows(buildFallbackRows(instance, program, manifestBookings, suppliers, services), instance, bookingStats, program.duration.days)
      : []
  ));

  useEffect(() => {
    if (!instance || !program) return;
    const timer = window.setTimeout(() => {
      setEstimateRows((current) => (
        current.length > 0
          ? current
          : hydrateRows(buildFallbackRows(instance, program, manifestBookings, suppliers, services), instance, bookingStats, program.duration.days)
      ));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bookingStats, instance, manifestBookings, program, services, suppliers]);

  const groupedRows = useMemo(() => getGroupedRows(estimateRows), [estimateRows]);
  const totalCost = estimateRows.reduce((sum, row) => sum + row.total, 0);
  const expectedRevenue = financialBookings.reduce((sum, booking) => (
    sum + (booking.status === 'cancelled' ? getRetainedAmountFromCancelledBooking(booking) : booking.totalAmount)
  ), 0);
  const profit = expectedRevenue - totalCost;
  const margin = expectedRevenue > 0 ? (profit / expectedRevenue) * 100 : 0;

  if (!instance || !program) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-8">
        <div className="space-y-3 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--color-primary)]/20">calculate</span>
          <h1 className="font-serif text-2xl text-[var(--color-primary)]">Chưa có dữ liệu dự toán</h1>
          <p className="text-sm text-[var(--color-primary)]/50">API tour instance và tour program chưa được kết nối hoặc chưa có dữ liệu khả dụng.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview' as const, label: 'Tổng quan' },
    { key: 'guests' as const, label: 'Danh sách khách hàng', badge: manifestBookings.length || null },
    { key: 'itinerary' as const, label: 'Lịch trình' },
    { key: 'estimate' as const, label: 'Dự toán' },
  ];

  const updateRow = (rowId: string, changes: Partial<EstimateRow>) => {
    setEstimateRows((previous) => previous.map((row) => (
      row.rowId === rowId ? recalcRow({ ...row, ...changes }) : row
    )));
  };

  const updateRowChoice = (rowId: string, nextChoiceId: string) => {
    setEstimateRows((previous) => {
      const sourceRow = previous.find((row) => row.rowId === rowId);
      if (!sourceRow) return previous;
      const selectedChoice = sourceRow.optionChoices.find((choice) => choice.id === nextChoiceId);
      if (!selectedChoice) return previous;
      const affectedGroupId = sourceRow.categoryId === 'B' || sourceRow.categoryId === 'D' ? sourceRow.groupId : undefined;
      return previous.map((row) => {
        const shouldUpdate = row.rowId === rowId || (affectedGroupId && row.groupId === affectedGroupId);
        if (!shouldUpdate) return row;
        const sameGroupChoice = row.optionChoices.find((choice) => (
          choice.supplierName === selectedChoice.supplierName && choice.serviceVariant === selectedChoice.serviceVariant
        )) ?? selectedChoice;
        return applyChoice(row, sameGroupChoice, bookingStats, program.duration.days);
      });
    });
  };

  const handleSupplierChange = (row: EstimateRow, supplierName: string) => {
    const candidate = row.optionChoices.find((choice) => (
      choice.supplierName === supplierName && choice.serviceVariant === row.serviceVariant
    )) ?? row.optionChoices.find((choice) => choice.supplierName === supplierName);
    if (candidate) updateRowChoice(row.rowId, candidate.id);
  };

  const buildCostEstimate = () => {
    const categories: CostCategory[] = groupedRows.map((category) => {
      const items: CostItem[] = category.rows.map((row, index) => ({
        id: index + 1,
        name: row.itemName,
        unit: row.unit,
        target: row.target,
        quantity: row.quantity,
        nightsOrRuns: row.occurrences,
        unitPrice: row.unitPrice,
        total: row.total,
        suppliers: [{
          supplierId: row.rowId,
          supplierName: row.supplierName,
          serviceVariant: row.serviceVariant,
          quotedPrice: row.unitPrice,
          notes: row.note,
          isPrimary: true,
        }],
        primarySupplierId: row.rowId,
      }));
      return {
        id: category.categoryId as CostCategory['id'],
        name: category.categoryName,
        items,
        subtotal: items.reduce((sum, item) => sum + item.total, 0),
        isFixed: category.categoryId === 'A' || category.categoryId === 'E',
      };
    });
    const totalFixedCost = categories.filter((category) => category.isFixed).reduce((sum, category) => sum + category.subtotal, 0);
    const totalVariableCost = categories.filter((category) => !category.isFixed).reduce((sum, category) => sum + category.subtotal, 0);
    const pricingConfig: PricingConfig = {
      profitMargin: program.pricingConfig.profitMargin,
      taxRate: program.pricingConfig.taxRate,
      otherCostFactor: program.pricingConfig.otherCostFactor,
      netPrice: program.pricingConfig.netPrice,
      sellPriceAdult: instance.priceAdult,
      sellPriceChild: instance.priceChild,
      sellPriceInfant: instance.priceInfant ?? 0,
      minParticipants: instance.minParticipants,
    };
    const estimate: CostEstimate = {
      categories,
      totalFixedCost,
      totalVariableCost,
      totalCost,
      pricingConfig,
      estimatedGuests: instance.expectedGuests,
    };
    return estimate;
  };

  const persistEstimate = async (markSubmitted: boolean) => {
    if (!token) return undefined;

    try {
      const response = await updateTourInstanceCommand(token, instance.id, 'estimate', {
        costEstimate: buildCostEstimate(),
        submit: markSubmitted,
      });
      upsertTourInstance(response.tourInstance);
      return response.tourInstance;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể lưu dự toán tour');
      return undefined;
    }
  };

  const updatePricesToSystem = async () => {
    if (!token) {
      message.error('Phiên đăng nhập đã hết hạn. Không thể cập nhật giá lên hệ thống.');
      return;
    }

    const apiEffectiveDate = todayKey();
    const apiRows = Array.from(new Map(
      estimateRows
        .filter((row) => row.unitPriceEditable || row.systemManagedPrice)
        .map((row) => [`${row.categoryId}|${row.supplierName}|${row.serviceVariant}|${row.target}`, row]),
    ).values());
    const supplierPayloads = new Map<string, Record<string, number>>();
    const serviceCalls: Array<Promise<unknown>> = [];
    let changedCount = 0;

    apiRows.forEach((row) => {
      const selectedChoice = row.optionChoices.find((choice) => (
        choice.supplierName === row.supplierName && choice.serviceVariant === row.serviceVariant
      ));

      if (selectedChoice?.supplierId && selectedChoice.serviceLineId) {
        const currentMap = supplierPayloads.get(selectedChoice.supplierId) ?? {};
        currentMap[selectedChoice.serviceLineId] = row.unitPrice;
        supplierPayloads.set(selectedChoice.supplierId, currentMap);
        changedCount += 1;
        return;
      }

      if (selectedChoice?.serviceId) {
        const service = services.find((item) => item.id === selectedChoice.serviceId);
        const note = service?.setup === 'Theo độ tuổi'
          ? (row.target === 'child' ? 'Trẻ em' : 'Người lớn')
          : `Cập nhật từ dự toán ${instance.id}`;
        serviceCalls.push(addServicePrice(token, selectedChoice.serviceId, {
          id: '',
          unitPrice: row.unitPrice,
          note,
          effectiveDate: apiEffectiveDate,
          endDate: '',
          createdBy: currentUser,
        }));
        changedCount += 1;
      }
    });

    if (changedCount === 0) {
      message.warning('Chưa tìm thấy bảng giá hệ thống tương ứng để cập nhật');
      return;
    }

    try {
      await Promise.all([
        ...Array.from(supplierPayloads.entries()).map(([supplierId, priceMap]) => addSupplierBulkPrices(token, supplierId, {
          fromDate: apiEffectiveDate,
          toDate: '',
          note: `Cập nhật từ dự toán ${instance.id}`,
          createdBy: currentUser,
          priceMap,
        })),
        ...serviceCalls,
      ]);

      await initializeProtected();
      message.success(`Đã cập nhật ${changedCount} bản ghi giá lên hệ thống`);
      return;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Không thể cập nhật giá lên hệ thống');
      return;
    }

    const effectiveDate = todayKey();
    let supplierChanged = 0;
    let serviceChanged = 0;

    const uniqueRows = Array.from(new Map(
      estimateRows
        .filter((row) => row.unitPriceEditable || row.systemManagedPrice)
        .map((row) => [`${row.categoryId}|${row.supplierName}|${row.serviceVariant}|${row.target}`, row]),
    ).values());

    const nextSuppliers = suppliers.map((supplier) => {
      const applyLine = (line: SupplierServiceLine, mealLine = false) => {
        const matchedRows = uniqueRows.filter((row) => row.supplierName === supplier.name && row.serviceVariant === line.name);
        if (matchedRows.length === 0) return line;
        supplierChanged += matchedRows.length;
        const latest = matchedRows.at(-1)!;
        return {
          ...line,
          prices: [
            ...closeOpenEndedSupplierPrices(line.prices, effectiveDate),
            {
              id: `${line.id}-${Date.now()}-${mealLine ? 'meal' : 'main'}`,
              fromDate: effectiveDate,
              toDate: '',
              unitPrice: latest.unitPrice,
              note: `Cập nhật từ dự toán ${instance!.id}`,
              createdBy: currentUser,
            },
          ],
        };
      };
      return {
        ...supplier,
        services: supplier.services.map((line) => applyLine(line)),
        mealServices: supplier.mealServices.map((line) => applyLine(line, true)),
      };
    });

    const nextServices = services.map((service) => {
      const matchedRows = uniqueRows.filter((row) => row.serviceVariant === service.name);
      if (matchedRows.length === 0) return service;
      const latestAdult = matchedRows.findLast((row) => row.target === 'adult' || row.target === 'all');
      const latestChild = matchedRows.findLast((row) => row.target === 'child');
      if (!latestAdult && !latestChild) return service;
      serviceChanged += matchedRows.length;
      let prices = [...service.prices];
      if (service.setup === 'Theo độ tuổi') {
        if (latestAdult) {
          prices = [
            ...closeOpenEndedServicePrices(prices, effectiveDate, 'người lớn'),
            {
              id: `${service.id}-${Date.now()}-adult`,
              effectiveDate,
              endDate: '',
              unitPrice: latestAdult.unitPrice,
              note: 'Người lớn',
              createdBy: currentUser,
            },
          ];
        }
        if (latestChild) {
          prices = [
            ...closeOpenEndedServicePrices(prices, effectiveDate, 'trẻ em'),
            {
              id: `${service.id}-${Date.now()}-child`,
              effectiveDate,
              endDate: '',
              unitPrice: latestChild.unitPrice,
              note: 'Trẻ em',
              createdBy: currentUser,
            },
          ];
        }
      } else if (latestAdult) {
        prices = [
          ...closeOpenEndedServicePrices(prices, effectiveDate),
          {
            id: `${service.id}-${Date.now()}-general`,
            effectiveDate,
            endDate: '',
            unitPrice: latestAdult.unitPrice,
            note: `Cập nhật từ dự toán ${instance!.id}`,
            createdBy: currentUser,
          },
        ];
      }
      return { ...service, prices };
    });

    if (supplierChanged === 0 && serviceChanged === 0) {
      message.warning('Chưa tìm thấy bảng giá hệ thống tương ứng để cập nhật');
      return;
    }

    setSuppliers(nextSuppliers);
    setServices(nextServices);
    message.success(`Đã cập nhật ${supplierChanged + serviceChanged} bản ghi giá lên hệ thống`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <Breadcrumb
        className="mb-4 text-xs"
        items={[
          { title: <Link to={`${basePrefix}/tours`} className="text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">Điều hành tour</Link> },
          { title: <span className="text-[var(--color-primary)]/30">Dự toán</span> },
        ]}
      />

      <div className="mb-8 flex items-end justify-between">
        <div>
          <nav className="mb-4 flex cursor-pointer items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-primary)]/50" onClick={() => navigate(`${basePrefix}/tours`)}>
            <span>Quản lý Tour</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-bold text-[var(--color-primary)]">{id ?? instance.id}</span>
          </nav>
          <h1 className="font-serif text-3xl text-[var(--color-primary)]">Lập Dự Toán Chi Phí</h1>
          <p className="mt-1 text-sm text-[var(--color-primary)]/50">{instance.programName} - {instance.departureDate}</p>
        </div>
        <div className="flex gap-4">
          {role === 'manager' ? (
            <button onClick={() => navigate(`${basePrefix}/tours`)} className="bg-[#2C5545] px-6 py-2 text-sm font-medium uppercase tracking-widest text-white shadow-md transition-colors hover:bg-[#1a382b]">
              Phê duyệt dự toán
            </button>
          ) : (
            <>
              <button
                onClick={updatePricesToSystem}
                className="border border-[var(--color-secondary)] px-6 py-2 text-sm font-medium uppercase tracking-widest text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-secondary)]/5"
              >
                Cập nhật giá lên hệ thống
              </button>
              <button
                onClick={async () => {
                  const persisted = await persistEstimate(false);
                  if (!persisted) return;
                  message.success('Đã lưu nháp dự toán');
                }}
                className="border border-[var(--color-primary)] px-6 py-2 text-sm font-medium uppercase tracking-widest text-[var(--color-primary)] transition-colors hover:bg-black/5"
              >
                Lưu Nháp
              </button>
              <button
                onClick={async () => {
                  const persisted = await persistEstimate(true);
                  if (!persisted) return;
                  message.success('Đã gửi dự toán phê duyệt');
                  navigate(`${basePrefix}/tours`);
                }}
                className="bg-[var(--color-tertiary)] px-6 py-2 text-sm font-medium uppercase tracking-widest text-white shadow-md transition-colors hover:bg-[var(--color-tertiary)]/90"
              >
                Gửi Phê Duyệt
              </button>
            </>
          )}
        </div>
      </div>

      {instance.status === 'yeu_cau_chinh_sua' && (
        <div className="mb-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Dự toán này đang ở trạng thái yêu cầu chỉnh sửa. Cần rà soát lại danh sách chi phí và cập nhật lại trước khi gửi duyệt.
        </div>
      )}

      <div className="mb-8 flex gap-8 border-b border-[#D0C5AF]/40">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-2 pb-4 text-sm font-medium uppercase tracking-widest transition-colors ${
              activeTab === tab.key ? 'border-b-2 border-[var(--color-secondary)] text-[var(--color-primary)]' : 'text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'
            }`}
          >
            {tab.label}
            {tab.badge != null && <span className="rounded-full bg-[var(--color-secondary)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-secondary)]">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5 border border-[#D0C5AF]/40 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
            {[
              ['Mã tour', instance.id],
              ['Tên chương trình', instance.programName],
              ['Thời lượng tour', `${program.duration.days} ngày ${program.duration.nights} đêm`],
              ['Ngày khởi hành', new Date(instance.departureDate).toLocaleDateString('vi-VN')],
              ['Điểm khởi hành', instance.departurePoint],
              ['Điểm tham quan', instance.sightseeingSpots.join(', ')],
              ['Phương tiện', instance.transport === 'xe' ? 'Xe' : 'Máy bay'],
              ['Người tạo chương trình', program.createdBy],
              ['Mô tả', cleanText(program.itinerary[0]?.description)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-[#D0C5AF]/15 pb-3 text-sm">
                <span className="text-[var(--color-primary)]/50">{label}</span>
                <span className="text-right font-medium text-[var(--color-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'guests' && (
        <div className="animate-in overflow-hidden border border-[#D0C5AF]/40 bg-white shadow-sm duration-300 fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#D0C5AF]/40 bg-[var(--color-surface)] text-[10px] uppercase tracking-widest text-[var(--color-primary)]/50">
                  <th className="px-6 py-4 font-bold">STT</th>
                  <th className="px-6 py-4 font-bold">Họ và tên</th>
                  <th className="px-6 py-4 font-bold">Loại khách</th>
                  <th className="px-6 py-4 font-bold">Ngày sinh</th>
                  <th className="px-6 py-4 font-bold">CCCD / GKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D0C5AF]/20 text-sm">
                {manifestBookings.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm text-[var(--color-primary)]/40">Chưa có booking nào cho tour này</td></tr>
                ) : (
                  manifestBookings.flatMap((booking) => [
                    <tr key={`${booking.id}-group`} className="bg-[var(--color-surface)] font-medium text-[var(--color-primary)]">
                      <td colSpan={5} className="px-6 py-3">
                        Nhóm khách [{booking.id}] - Mã đơn <button onClick={() => setGuestPopup(booking)} className="font-mono text-[var(--color-secondary)] hover:underline">[{booking.bookingCode}]</button>
                      </td>
                    </tr>,
                    ...booking.passengers.map((passenger, index) => (
                      <tr key={`${booking.id}-${index}`} className="bg-white">
                        <td className="px-6 py-3">{index + 1}</td>
                        <td className="px-6 py-3">{passenger.name}</td>
                        <td className="px-6 py-3">{passenger.type}</td>
                        <td className="px-6 py-3">{passenger.dob}</td>
                        <td className="px-6 py-3">{passenger.cccd ?? '-'}</td>
                      </tr>
                    )),
                  ])
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'itinerary' && (
        <div className="animate-in space-y-0 duration-300 fade-in">
          {program.itinerary.map((day, index) => (
            <div key={index} className="flex gap-0 border-b border-[#D0C5AF]/20">
              <div className="w-20 shrink-0 border-r border-[#D0C5AF]/20 bg-[var(--color-surface)] pt-6 pb-6">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]/40">Ngày</span>
                  <span className="font-serif text-2xl font-bold text-[var(--color-secondary)]">{day.day}</span>
                </div>
              </div>
              <div className="flex-1 p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h4 className="font-medium text-[var(--color-primary)]">{day.title}</h4>
                </div>
                <p className="leading-relaxed text-sm text-[var(--color-primary)]/60">{cleanText(day.description)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'estimate' && (
        <>
          <div className="sticky top-0 z-10 mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { label: 'Tổng chi phí dự toán', value: formatCurrency(totalCost) },
              { label: 'Doanh thu dự kiến', value: formatCurrency(expectedRevenue) },
              { label: 'Lợi nhuận dự kiến', value: formatCurrency(profit) },
              { label: 'Tỷ suất lợi nhuận', value: `${margin.toFixed(1)}%` },
            ].map((card) => (
              <div key={card.label} className="border border-[#D4AF37] bg-[#D4AF37] px-5 py-4 text-white shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{card.label}</p>
                <p className="mt-1 font-serif text-xl">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap gap-6 text-xs text-[var(--color-primary)]/55">
            <span>Người lớn: <strong className="text-[var(--color-primary)]">{bookingStats.adults}</strong></span>
            <span>Trẻ em: <strong className="text-[var(--color-primary)]">{bookingStats.children}</strong></span>
            <span>Trẻ sơ sinh: <strong className="text-[var(--color-primary)]">{bookingStats.infants}</strong></span>
            <span>Phòng đơn/đôi/ba: <strong className="text-[var(--color-primary)]">{bookingStats.roomCounts.single}/{bookingStats.roomCounts.double}/{bookingStats.roomCounts.triple}</strong></span>
          </div>

          <div className="mb-6 overflow-hidden border border-[#D0C5AF]/40 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#D4AF37] text-white shadow-sm">
                    {['STT', 'Khoản mục', 'Nhà cung cấp', 'Dịch vụ', 'Đơn vị', 'Đối tượng', 'Số lượng', 'Số lần', 'Đơn giá áp dụng', 'Thành tiền'].map((header) => (
                      <th key={header} className="whitespace-nowrap px-4 py-4 text-[10px] font-bold uppercase tracking-widest">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {groupedRows.map((category) => (
                    <React.Fragment key={category.categoryId}>
                      <tr className="border-t border-[#D0C5AF]/30 bg-[var(--color-surface)]">
                        <td colSpan={10} className="px-6 py-3 font-bold text-[var(--color-primary)]">{category.categoryId}. {category.categoryName}</td>
                      </tr>
                      {category.rows.map((row, index) => {
                        const supplierNames = Array.from(new Set(row.optionChoices.map((choice) => choice.supplierName)));
                        const serviceOptions = row.optionChoices.filter((choice) => choice.supplierName === row.supplierName);
                        return (
                          <tr key={row.rowId} className="border-t border-[#D0C5AF]/10 bg-white">
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3 font-medium">{row.itemName}</td>
                            <td className="px-4 py-3">
                              {supplierNames.length > 1 ? (
                                <select
                                  value={row.supplierName}
                                  onChange={(event) => handleSupplierChange(row, event.target.value)}
                                  className="w-full border border-[#D0C5AF]/40 px-2 py-1"
                                >
                                  {supplierNames.map((supplierName) => <option key={supplierName} value={supplierName}>{supplierName}</option>)}
                                </select>
                              ) : row.supplierName}
                            </td>
                            <td className="px-4 py-3">
                              {serviceOptions.length > 1 ? (
                                <select
                                  value={row.optionId}
                                  onChange={(event) => updateRowChoice(row.rowId, event.target.value)}
                                  className="w-full border border-[#D0C5AF]/40 px-2 py-1"
                                >
                                  {serviceOptions.map((choice) => <option key={choice.id} value={choice.id}>{choice.serviceVariant}</option>)}
                                </select>
                              ) : row.serviceVariant}
                            </td>
                            <td className="px-4 py-3">{row.unit}</td>
                            <td className="px-4 py-3">{row.target}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.quantity}
                                disabled={!row.quantityEditable}
                                onChange={(event) => updateRow(row.rowId, { quantity: Math.max(0, Number(event.target.value || 0)) })}
                                className={`w-24 border px-2 py-1 text-center ${row.quantityEditable ? 'border-[#D0C5AF]/40' : 'border-transparent bg-stone-50'}`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.occurrences}
                                disabled={!row.occurrencesEditable}
                                onChange={(event) => updateRow(row.rowId, { occurrences: Math.max(0, Number(event.target.value || 0)) })}
                                className={`w-24 border px-2 py-1 text-center ${row.occurrencesEditable ? 'border-[#D0C5AF]/40' : 'border-transparent bg-stone-50'}`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.unitPrice}
                                disabled={!row.unitPriceEditable}
                                onChange={(event) => updateRow(row.rowId, { unitPrice: Math.max(0, Number(event.target.value || 0)) })}
                                className={`w-32 border px-2 py-1 text-right ${row.unitPriceEditable ? 'border-[#D0C5AF]/40' : 'border-transparent bg-stone-50'}`}
                              />
                              {!row.unitPriceEditable && row.systemManagedPrice && (
                                <p className="mt-1 text-[10px] text-[var(--color-primary)]/40">Đơn giá hệ thống theo bảng giá áp dụng</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.total)}</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--color-surface)]">
                  <tr className="border-t-2 border-[#D0C5AF]/50">
                    <td colSpan={9} className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Tổng dự chi:</td>
                    <td className="px-6 py-5 text-right text-lg font-bold text-[var(--color-primary)]">{formatCurrency(totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {guestPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--color-primary)]/40 backdrop-blur-sm" onClick={() => setGuestPopup(null)} />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl space-y-5 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-2xl text-[var(--color-primary)]">Thông tin khách hàng đặt tour</h3>
                <p className="mt-1 font-mono text-xs text-[var(--color-primary)]/50">{guestPopup.bookingCode}</p>
              </div>
              <button onClick={() => setGuestPopup(null)} className="text-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--color-primary)]/50">Tên liên hệ:</span> <strong>{guestPopup.contactInfo.name}</strong></div>
              <div><span className="text-[var(--color-primary)]/50">Số điện thoại:</span> <strong>{guestPopup.contactInfo.phone}</strong></div>
              <div><span className="text-[var(--color-primary)]/50">Email:</span> <strong>{guestPopup.contactInfo.email}</strong></div>
              <div><span className="text-[var(--color-primary)]/50">Tổng tiền:</span> <strong>{formatCurrency(guestPopup.totalAmount)}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
