import type { TourProgram } from '@entities/tour-program/data/tourProgram';
import { apiRequest } from './client';

interface TourProgramResponse {
  success: boolean;
  tourProgram: TourProgram;
}

export function createTourProgram(token: string, payload: TourProgram) {
  return apiRequest<TourProgramResponse>('/tour-programs', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function patchTourProgram(token: string, id: string, payload: Partial<TourProgram>) {
  return apiRequest<TourProgramResponse>(`/tour-programs/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function submitTourProgram(token: string, id: string) {
  return apiRequest<TourProgramResponse>(`/tour-programs/${id}/submit`, {
    method: 'POST',
    token,
  });
}
