import type { Passenger } from '@entities/booking/data/bookings';

export const NATIONALITY_OPTIONS = [
  'Việt Nam',
  'Nhật Bản',
  'Hàn Quốc',
  'Trung Quốc',
  'Singapore',
  'Thái Lan',
  'Malaysia',
  'Hoa Kỳ',
  'Úc',
  'Anh',
  'Pháp',
  'Đức',
  'Khác',
] as const;

const phonePattern = /^(0|\+84)\d{9,10}$/;

export function validatePhoneNumber(value: string) {
  return phonePattern.test(value.replace(/\s+/g, ''));
}

export function calculateAgeOnDate(dob: string, referenceDate: string) {
  if (!dob || !referenceDate) {
    return null;
  }

  const birthDate = new Date(dob);
  const departureDate = new Date(referenceDate);
  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(departureDate.getTime())) {
    return null;
  }

  let age = departureDate.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    departureDate.getMonth() > birthDate.getMonth()
    || (departureDate.getMonth() === birthDate.getMonth() && departureDate.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return age;
}

export function validatePassengerAgeByType(passenger: Passenger, departureDate: string) {
  const age = calculateAgeOnDate(passenger.dob, departureDate);
  if (age == null) {
    return '';
  }

  if (passenger.type === 'adult' && age < 12) {
    return 'Tuổi không phù hợp';
  }

  if (passenger.type === 'child' && (age < 2 || age > 11)) {
    return 'Tuổi không phù hợp';
  }

  if (passenger.type === 'infant' && age >= 2) {
    return 'Tuổi không phù hợp';
  }

  return '';
}

export function requiresVietnameseDocumentValidation(passenger: Passenger) {
  const nationality = passenger.nationality?.trim().toLowerCase() ?? '';
  return !nationality || nationality === 'việt nam' || nationality === 'viet nam' || nationality === 'vietnam';
}

export function validatePassengerDocument(passenger: Passenger) {
  if (!passenger.cccd?.trim()) {
    return '';
  }

  if (!requiresVietnameseDocumentValidation(passenger)) {
    return '';
  }

  return /^\d{12}$/.test(passenger.cccd.trim()) ? '' : 'CCCD/GKS phải gồm 12 chữ số';
}

export function getPassengerTypeLabel(type: Passenger['type']) {
  if (type === 'adult') return 'Người lớn';
  if (type === 'child') return 'Trẻ em';
  return 'Em bé';
}
