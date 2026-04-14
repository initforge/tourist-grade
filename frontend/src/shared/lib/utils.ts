export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes?.filter(Boolean)?.join(' ');
}

export function formatPrice(price: number): string {
  return price?.toLocaleString('vi-VN') + '₫';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr)?.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-50' },
  confirmed: { label: 'Đã xác nhận', color: 'text-emerald-600 bg-emerald-50' },
  cancelled: { label: 'Đã hủy', color: 'text-red-600 bg-red-50' },
  completed: { label: 'Hoàn thành', color: 'text-blue-600 bg-blue-50' },
  refunded: { label: 'Đã hoàn tiền', color: 'text-purple-600 bg-purple-50' },
  open: { label: 'Đang mở bán', color: 'text-emerald-600 bg-emerald-50' },
  full: { label: 'Đã đầy', color: 'text-red-600 bg-red-50' },
  draft: { label: 'Nháp', color: 'text-slate-600 bg-slate-50' },
  review: { label: 'Chờ duyệt', color: 'text-amber-600 bg-amber-50' },
  approved: { label: 'Đã duyệt', color: 'text-emerald-600 bg-emerald-50' },
  rejected: { label: 'Từ chối', color: 'text-red-600 bg-red-50' },
  discontinued: { label: 'Ngừng KD', color: 'text-slate-600 bg-slate-50' },
};
