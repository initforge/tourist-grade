import type { Prisma } from '@prisma/client';
import type { AuthTokenPayload } from './jwt.js';

const COORDINATOR_ASSIGNED_ONLY_STATUSES = [
  'CHO_DU_TOAN',
  'CHO_DUYET_DU_TOAN',
  'SAN_SANG_TRIEN_KHAI',
  'DANG_TRIEN_KHAI',
  'CHO_QUYET_TOAN',
  'HOAN_THANH',
] as const;

export function getVisibleTourInstanceWhere(auth?: Pick<AuthTokenPayload, 'role' | 'sub'>): Prisma.TourInstanceWhereInput {
  if (auth?.role !== 'coordinator') {
    return {};
  }

  return {
    OR: [
      { status: { notIn: [...COORDINATOR_ASSIGNED_ONLY_STATUSES] } },
      { assignedCoordinatorId: auth.sub },
    ],
  };
}
