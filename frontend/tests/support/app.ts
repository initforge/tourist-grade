import type { Page } from '@playwright/test';
import { loginAsRole, type TestRole } from './auth';

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
  const shouldResetSalesFixtures =
    options?.clearBookings
    || destination?.includes('/vouchers')
    || destination?.includes('/voucher-approval');
  const shouldResetWorkflowFixtures = role === 'manager' || role === 'coordinator';

  if (shouldResetSalesFixtures || shouldResetWorkflowFixtures) {
    await gotoApp(page, '/');
    await page.evaluate(() => {
      localStorage?.removeItem('__travela_bookings');
      localStorage?.removeItem('__travela_sales_vouchers');
      localStorage?.removeItem('__travela_sales_vouchers_seed_version');
      localStorage?.removeItem('__travela_tour_programs');
    });
    await page.request.post(`${process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000/api/v1'}/dev/reset-booking-fixtures`).catch(() => null);
  }

  await loginAsRole(page, role, destination);
}

export async function lookupBooking(page: Page, code: string, contact: string) {
  await page.getByPlaceholder('VD: BK-582910').fill(code);
  await page.getByPlaceholder('0988 123 456').fill(contact);
  await page.getByRole('button', { name: /Tra cứu thông tin|Tra cuu thong tin|Tra Cuu Thong Tin/i }).click();
}
