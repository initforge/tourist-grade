import type { SpecialDay } from '@entities/tour-program/data/tourProgram';
import { apiRequest } from './client';

interface SpecialDayResponse {
  success: boolean;
  specialDay: SpecialDay;
}

export function listSpecialDays(token: string) {
  return apiRequest<{ success: boolean; specialDays: SpecialDay[] }>('/special-days', { token });
}

export function createSpecialDay(token: string, payload: SpecialDay) {
  return apiRequest<SpecialDayResponse>('/special-days', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function updateSpecialDay(token: string, id: string, payload: Partial<SpecialDay>) {
  return apiRequest<SpecialDayResponse>(`/special-days/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteSpecialDay(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/special-days/${id}`, {
    method: 'DELETE',
    token,
  });
}
