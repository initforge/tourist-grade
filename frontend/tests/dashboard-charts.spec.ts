import { expect, test } from '@playwright/test';
import { loginAs } from './support/app';

test.describe('Dashboard revenue charts', () => {
  test('sales, manager, and coordinator dashboards render daily revenue as a line chart', async ({ page }) => {
    const cases = [
      { role: 'sales' as const, path: '/sales/dashboard' },
      { role: 'manager' as const, path: '/manager/dashboard' },
      { role: 'coordinator' as const, path: '/coordinator/dashboard' },
    ];

    for (const item of cases) {
      await loginAs(page, item.role, item.path);
      await expect(page.getByText(/Báo cáo doanh thu theo ngày/i)).toBeVisible();
      await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
      await expect(page.locator('.recharts-surface').first()).toBeVisible();
    }
  });
});
