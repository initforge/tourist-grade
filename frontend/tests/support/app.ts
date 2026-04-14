import type { Page } from '@playwright/test';

export type TestRole = 'admin' | 'customer' | 'sales' | 'coordinator' | 'manager';

export const HALONG_TOUR_PATH = '/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao';

export async function gotoApp(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

export async function loginAs(
  page: Page,
  role: TestRole,
  destination?: string,
  options?: {
    clearBookings?: boolean;
  },
) {
  await gotoApp(page, '/');
  await page.evaluate(
    ({ selectedRole, shouldClearBookings }) => {
      if (shouldClearBookings) {
        localStorage?.removeItem('__travela_bookings');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)?.__authLogin(selectedRole);
    },
    {
      selectedRole: role,
      shouldClearBookings: options?.clearBookings ?? false,
    },
  );

  if (destination) {
    await gotoApp(page, destination);
  }
}

export async function lookupBooking(page: Page, code: string, contact: string) {
  await page.getByPlaceholder('VD: BK-582910').fill(code);
  await page.getByPlaceholder('0988 123 456').fill(contact);
  await page.getByRole('button', { name: /Tra Cuu Thong Tin|Tra Cứu Thông Tin/i }).click();
}
