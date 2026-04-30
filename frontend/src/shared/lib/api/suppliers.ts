import type { TourGuide } from '@entities/tour-program/data/tourProgram';
import type { SupplierPriceRow, SupplierRow } from '@shared/store/useAppDataStore';
import { apiRequest } from './client';

interface SupplierResponse {
  success: boolean;
  supplier: SupplierRow;
}

interface GuideResponse {
  success: boolean;
  guide: TourGuide;
}

export interface SupplierPayload {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: 'HOTEL' | 'RESTAURANT' | 'TRANSPORT';
  serviceSummary?: string;
  operatingArea?: string;
  standards?: string[];
  establishedYear?: number | null;
  description?: string;
  isActive: boolean;
  services: Array<{
    id?: string;
    name: string;
    description: string;
    unit: string;
    quantity?: number;
    capacity?: number;
    transportType?: 'XE' | 'MAYBAY';
    priceMode?: 'QUOTED' | 'LISTED';
    menu?: string;
    note?: string;
    prices: SupplierPriceRow[];
  }>;
  mealServices: Array<{
    id?: string;
    name: string;
    description: string;
    unit: string;
    quantity?: number;
    capacity?: number;
    transportType?: 'XE' | 'MAYBAY';
    priceMode?: 'QUOTED' | 'LISTED';
    menu?: string;
    note?: string;
    prices: SupplierPriceRow[];
  }>;
}

export interface GuidePayload {
  code?: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  phone: string;
  email?: string;
  address?: string;
  operatingArea?: string;
  guideCardNumber: string;
  issueDate?: string;
  expiryDate?: string;
  issuePlace?: string;
  note?: string;
  languages: string[];
  active?: boolean;
}

export function createSupplier(token: string, payload: SupplierPayload) {
  return apiRequest<SupplierResponse>('/suppliers', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function patchSupplier(token: string, id: string, payload: SupplierPayload) {
  return apiRequest<SupplierResponse>(`/suppliers/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteSupplier(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/suppliers/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function addSupplierServicePrice(
  token: string,
  supplierId: string,
  serviceId: string,
  payload: SupplierPriceRow,
) {
  return apiRequest<{ success: boolean; price: SupplierPriceRow }>(`/suppliers/${supplierId}/service-variants/${serviceId}/prices`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function patchSupplierServicePrice(
  token: string,
  supplierId: string,
  serviceId: string,
  priceId: string,
  payload: SupplierPriceRow,
) {
  return apiRequest<{ success: boolean; price: SupplierPriceRow }>(`/suppliers/${supplierId}/service-variants/${serviceId}/prices/${priceId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function addSupplierBulkPrices(
  token: string,
  supplierId: string,
  payload: {
    fromDate: string;
    toDate?: string;
    note: string;
    createdBy: string;
    priceMap: Record<string, number>;
  },
) {
  return apiRequest<SupplierResponse>(`/suppliers/${supplierId}/prices`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function createGuide(token: string, payload: GuidePayload) {
  return apiRequest<GuideResponse>('/suppliers/tour-guides', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function patchGuide(token: string, id: string, payload: Partial<GuidePayload>) {
  return apiRequest<GuideResponse>(`/suppliers/tour-guides/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteGuide(token: string, id: string) {
  return apiRequest<{ success: boolean }>(`/suppliers/tour-guides/${id}`, {
    method: 'DELETE',
    token,
  });
}
