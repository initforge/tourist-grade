import { Prisma } from '@prisma/client';

export const OPEN_ENDED_DATE = new Date('9999-12-31T00:00:00.000Z');

export function isOpenEndedDate(date: Date | null | undefined) {
  if (!date) return false;
  return date.getUTCFullYear() >= 9999;
}

export function toDateKey(date: Date | null | undefined) {
  if (!date || isOpenEndedDate(date)) return '';
  return date.toISOString().slice(0, 10);
}

export function toOptionalDate(value?: string | null) {
  if (!value) return null;
  return new Date(value);
}

export function toRequiredDate(value?: string | null) {
  if (!value) return OPEN_ENDED_DATE;
  return new Date(value);
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function nextCode(prefix: string, existingCodes: string[]) {
  const max = existingCodes.reduce((currentMax, code) => {
    const match = code.match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);

  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function toPrismaJson<T>(value: T) {
  return value as Prisma.InputJsonValue;
}

export function toPrismaObject<T extends Record<string, unknown>>(value: T) {
  return value as Prisma.InputJsonObject;
}

export function unwrapEstimatePayload(value: unknown): {
  estimate: unknown;
  assignedGuide?: { id: string; name: string; email?: string } | null;
  saleRequest?: Record<string, unknown> | null;
  warningState?: Record<string, unknown> | null;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { estimate: value };
  }

  const record = value as Record<string, unknown>;
  if ('estimate' in record || 'assignedGuide' in record || 'saleRequest' in record || 'warningState' in record) {
    return {
      estimate: record.estimate,
      assignedGuide: (record.assignedGuide as { id: string; name: string; email?: string } | null | undefined) ?? undefined,
      saleRequest: (record.saleRequest as Record<string, unknown> | null | undefined) ?? undefined,
      warningState: (record.warningState as Record<string, unknown> | null | undefined) ?? undefined,
    };
  }

  return { estimate: value };
}

export function wrapEstimatePayload(
  estimate: unknown,
  assignedGuide?: { id: string; name: string; email?: string } | null,
  metadata: {
    saleRequest?: Record<string, unknown> | null;
    warningState?: Record<string, unknown> | null;
  } = {},
) {
  if (estimate == null && assignedGuide == null && metadata.saleRequest == null && metadata.warningState == null) {
    return null;
  }

  return {
    estimate: estimate ?? null,
    assignedGuide: assignedGuide ?? null,
    saleRequest: metadata.saleRequest ?? null,
    warningState: metadata.warningState ?? null,
  };
}
