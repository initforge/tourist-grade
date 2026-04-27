import type { WishlistItem } from '@shared/store/useAppDataStore';
import { apiRequest } from './client';

export async function fetchWishlist(token?: string | null) {
  return apiRequest<{ success: boolean; wishlist: WishlistItem[] }>('/wishlist', {
    token: token ?? undefined,
  });
}

export async function addWishlistItem(tourId: string, token?: string | null) {
  return apiRequest<{ success: boolean; item: WishlistItem }>('/wishlist', {
    method: 'POST',
    token: token ?? undefined,
    body: JSON.stringify({ tourId }),
  });
}

export async function removeWishlistItem(tourId: string, token?: string | null) {
  return apiRequest<{ success: boolean; removed: boolean }>(`/wishlist/${encodeURIComponent(tourId)}`, {
    method: 'DELETE',
    token: token ?? undefined,
  });
}
