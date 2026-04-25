import type { Voucher } from '@entities/voucher/data/vouchers';
import { apiRequest } from './client';

interface VoucherResponse {
  success: boolean;
  voucher: Voucher;
}

export function listVouchers(token: string) {
  return apiRequest<{ success: boolean; vouchers: Voucher[] }>('/vouchers', { token });
}

export function createVoucher(token: string, payload: Partial<Voucher>) {
  return apiRequest<VoucherResponse>('/vouchers', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function updateVoucher(token: string, id: string, payload: Partial<Voucher>) {
  return apiRequest<VoucherResponse>(`/vouchers/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function approveVoucher(token: string, id: string) {
  return apiRequest<VoucherResponse>(`/vouchers/${id}/approve`, {
    method: 'POST',
    token,
  });
}

export function rejectVoucher(token: string, id: string, reason: string) {
  return apiRequest<VoucherResponse>(`/vouchers/${id}/reject`, {
    method: 'POST',
    token,
    body: JSON.stringify({ reason }),
  });
}

export function deleteVoucher(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/vouchers/${id}`, {
    method: 'DELETE',
    token,
  });
}
