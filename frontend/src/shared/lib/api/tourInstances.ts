import type { TourInstance } from '@entities/tour-program/data/tourProgram';
import { apiRequest } from './client';

interface TourInstanceResponse {
  success: boolean;
  tourInstance: TourInstance;
}

export interface TourInstanceMutationPayload {
  id?: string;
  programId: string;
  programName: string;
  departureDate: string;
  status?: TourInstance['status'];
  departurePoint: string;
  sightseeingSpots: string[];
  transport: TourInstance['transport'];
  arrivalPoint?: string;
  expectedGuests: number;
  priceAdult: number;
  priceChild: number;
  priceInfant?: number;
  minParticipants: number;
  bookingDeadline: string;
  warningDate?: string;
  cancelReason?: string;
  createdAt?: string;
}

export function updateTourInstanceCommand(
  token: string,
  id: string,
  command:
    | 'receive'
    | 'assign-guide'
    | 'estimate'
    | 'estimate/approve'
    | 'estimate/request-edit'
    | 'estimate/reject'
    | 'settlement'
    | 'cancel'
    | 'approve-sale'
    | 'request-edit-sale'
    | 'reject-sale'
    | 'extend-deadline'
    | 'continue-insufficient',
  payload?: Record<string, unknown>,
) {
  return apiRequest<TourInstanceResponse>(`/tour-instances/${id}/${command}`, {
    method: 'POST',
    token,
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export function createTourInstance(token: string, payload: TourInstanceMutationPayload) {
  return apiRequest<TourInstanceResponse>('/tour-instances', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function patchTourInstance(token: string, id: string, payload: Partial<TourInstanceMutationPayload>) {
  return apiRequest<TourInstanceResponse>(`/tour-instances/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteTourInstance(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/tour-instances/${id}`, {
    method: 'DELETE',
    token,
  });
}
