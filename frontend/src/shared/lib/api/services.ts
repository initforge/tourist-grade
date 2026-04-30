import type { ServicePriceRow, ServiceRow } from '@shared/store/useAppDataStore';
import { apiRequest } from './client';

interface ServiceResponse {
  success: boolean;
  service: ServiceRow;
}

export interface ServicePayload {
  code?: string;
  name: string;
  category: 'ATTRACTION_TICKET' | 'OTHER';
  unit: string;
  priceMode: 'QUOTED' | 'LISTED';
  priceSetup: 'COMMON' | 'BY_AGE' | 'NONE';
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  supplierName?: string;
  contactInfo?: string;
  province?: string;
  formulaCount?: 'BY_DAY' | 'DEFAULT_VALUE' | 'MANUAL' | null;
  formulaCountDefault?: string;
  formulaQuantity?: 'BY_DAY' | 'DEFAULT_VALUE' | 'MANUAL' | null;
  formulaQuantityDefault?: string;
  prices?: ServicePriceRow[];
}

export function createService(token: string, payload: ServicePayload) {
  return apiRequest<ServiceResponse>('/services', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function patchService(token: string, id: string, payload: Partial<ServicePayload>) {
  return apiRequest<ServiceResponse>(`/services/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteService(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/services/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function addServicePrice(token: string, id: string, payload: ServicePriceRow) {
  return apiRequest<{ success: boolean; price: ServicePriceRow }>(`/services/${id}/prices`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function patchServicePrice(token: string, id: string, priceId: string, payload: ServicePriceRow) {
  return apiRequest<{ success: boolean; price: ServicePriceRow }>(`/services/${id}/prices/${priceId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}
