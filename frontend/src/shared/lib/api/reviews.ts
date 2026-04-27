import type { CustomerReview } from '@shared/store/useAppDataStore';
import { apiRequest } from './client';

export async function createTourReview(
  payload: {
    bookingId: string;
    rating: number;
    title?: string;
    comment: string;
  },
  token?: string | null,
) {
  return apiRequest<{ success: boolean; review: CustomerReview }>('/reviews', {
    method: 'POST',
    token: token ?? undefined,
    body: JSON.stringify(payload),
  });
}
