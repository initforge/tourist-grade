export const NATIONALITIES = [
  'Việt Nam',
  'Nhật Bản',
  'Hàn Quốc',
  'Trung Quốc',
  'Đài Loan',
  'Thái Lan',
  'Singapore',
  'Malaysia',
  'Indonesia',
  'Philippines',
  'Ấn Độ',
  'Úc',
  'Mỹ',
  'Canada',
  'Anh',
  'Pháp',
  'Đức',
  'Ý',
  'Tây Ban Nha',
  'Khác',
];

export const NATIONALITY_OPTIONS = NATIONALITIES.map(nationality => ({
  value: nationality,
  label: nationality,
}));

export function normalizeNationalitySearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
