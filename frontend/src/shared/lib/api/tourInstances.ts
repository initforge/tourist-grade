import type { TourInstance } from '@entities/tour-program/data/tourProgram';
import { apiRequest } from './client';

interface TourInstanceResponse {
  success: boolean;
  tourInstance: TourInstance;
}

export function updateTourInstanceCommand(
  token: string,
  id: string,
  command:
    | 'receive'
    | 'estimate'
    | 'estimate/approve'
    | 'settlement'
    | 'cancel'
    | 'approve-sale'
    | 'reject-sale'
    | 'extend-deadline',
  payload?: Record<string, unknown>,
) {
  return apiRequest<TourInstanceResponse>(`/tour-instances/${id}/${command}`, {
    method: 'POST',
    token,
    body: payload ? JSON.stringify(payload) : undefined,
  });
}
