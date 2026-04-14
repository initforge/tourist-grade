import { expect, test } from '@playwright/test';

async function loginAsSales(page: any) {
  await page?.goto('/');
  await page?.waitForLoadState('domcontentloaded');
  await page?.evaluate(() => {
    localStorage?.removeItem('__travela_bookings');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin('sales');
  });
  await page?.goto('/sales/bookings');
  await page?.waitForLoadState('domcontentloaded');
}

test?.describe('Sales Booking Tools Verification', () => {
  test('Pending and confirmed tabs only show 50% or 100% payment labels, never the old unpaid label', async ({ page }) => {
    await loginAsSales(page);

    await expect(page?.getByText('Chưa thanh toán', { exact: true }))?.toHaveCount(0);
    await expect(page?.locator('tbody'))?.toContainText('50%');

    await page?.getByRole('button', { name: /Đã xác nhận/ })?.first()?.click();
    await expect(page?.getByText('Chưa thanh toán', { exact: true }))?.toHaveCount(0);
    await expect(page?.locator('tbody'))?.toContainText('50%');
    await expect(page?.locator('tbody'))?.toContainText('100%');

    await page?.getByRole('button', { name: /Hoàn thành/ })?.first()?.click();
    await expect(page?.getByText('50%', { exact: true }))?.toHaveCount(0);
    await expect(page?.locator('tbody'))?.toContainText('100%');
  });

  test('Search applies to the current tab, persists when switching tabs, and can be cleared', async ({ page }) => {
    await loginAsSales(page);

    const searchBox = page?.getByPlaceholder('Tìm kiếm mã đơn, khách hàng, tour...');
    const tabs = page?.getByRole('button', { name: /Cần xác nhận/ })?.first();

    await expect(page?.getByRole('button', { name: /^Tất cả$/ }))?.toHaveCount(0);
    await expect(searchBox)?.toBeVisible();
    await expect(tabs)?.toBeVisible();
    expect((await searchBox?.boundingBox())?.y ?? 0)?.toBeLessThan((await tabs?.boundingBox())?.y ?? 0);

    await searchBox?.fill('BK-394821');
    await page?.getByTitle('Tìm kiếm', { exact: true })?.click();

    await expect(page?.getByText(/Kết quả: "BK-394821"/))?.toBeVisible();
    await expect(page?.locator('tbody'))?.toContainText('BK-394821');

    await page?.getByRole('button', { name: /Đã xác nhận/ })?.first()?.click();
    await expect(searchBox)?.toHaveValue('BK-394821');
    await expect(page?.getByText(/Kết quả: "BK-394821"/))?.toBeVisible();
    await expect(page?.locator('tbody'))?.not?.toContainText('BK-394821');

    await page?.getByTitle('Xóa tìm kiếm')?.click();
    await expect(searchBox)?.toHaveValue('');
    await expect(page?.getByText(/Kết quả:/))?.toHaveCount(0);
  });

  test('Search box replaces the old export action on the booking list page', async ({ page }) => {
    await loginAsSales(page);

    const searchBox = page?.getByPlaceholder('Tìm kiếm mã đơn, khách hàng, tour...');
    const table = page?.locator('table')?.first();

    await expect(searchBox)?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Xuất Excel/i }))?.toHaveCount(0);
    expect((await searchBox?.boundingBox())?.y ?? 0)?.toBeLessThan((await table?.boundingBox())?.y ?? 0);
  });

  test('Booking list shows pagination and range summary whenever a tab has rows', async ({ page }) => {
    await loginAsSales(page);

    await expect(page?.locator('.ant-pagination'))?.toBeVisible();
    await expect(page?.getByText(/Hiển thị .* trong .* đơn/))?.toBeVisible();
    await expect(page?.getByText(/1–\d+ của \d+ đơn/))?.toBeVisible();
    await expect(page?.locator('tbody td[title]')?.first())?.toBeVisible();

    await page?.getByRole('button', { name: /Đã hủy/ })?.first()?.click();
    await expect(page?.locator('.ant-pagination'))?.toBeVisible();
    await expect(page?.getByText(/Hiển thị .* trong .* đơn/))?.toBeVisible();
    await expect(page?.locator('tbody td[title]')?.first())?.toBeVisible();
  });

  test('Pending and cancelled filters isolate the expected booking states and preserve long-note hover titles', async ({ page }) => {
    await loginAsSales(page);

    await page?.getByRole('button', { name: /Cần xác nhận đơn đặt/i })?.click();
    await expect(page?.locator('tbody'))?.toContainText('BK-394821');
    await expect(page?.locator('tbody'))?.toContainText('BK-509182');
    await expect(page?.locator('tbody'))?.not?.toContainText('BK-102938');

    await page?.getByRole('button', { name: /Cần xác nhận hủy/i })?.click();
    await expect(page?.locator('tbody'))?.toContainText('BK-102938');
    await expect(page?.locator('tbody'))?.not?.toContainText('BK-394821');
    await expect(page?.locator('tbody td[title=\"Thay đổi kế hoạch công tác\"]'))?.toBeVisible();

    await page?.getByRole('button', { name: /Đã hủy/ })?.first()?.click();
    await page?.locator('select')?.selectOption('refunded');
    await expect(page?.locator('tbody'))?.toContainText('Đã hoàn');
    await expect(page?.locator('tbody'))?.not?.toContainText('Không cần hoàn');

    await page?.locator('select')?.selectOption('not_required');
    await expect(page?.locator('tbody'))?.toContainText('Không cần hoàn');
    await expect(page?.locator('tbody'))?.not?.toContainText('Đã hoàn');
  });
});
