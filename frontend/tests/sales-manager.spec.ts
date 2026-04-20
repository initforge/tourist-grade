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

async function loginAsManager(page: any) {
  await page?.goto('/');
  await page?.waitForLoadState('domcontentloaded');
  await page?.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin('manager');
  });
  await page?.goto('/manager/voucher-approval');
  await page?.waitForLoadState('domcontentloaded');
}

async function fillPendingPassengerData(page: any) {
  await page?.getByRole('button', { name: 'Chỉnh sửa danh sách HK' })?.click();

  const modal = page?.getByRole('dialog');
  await modal?.locator('input[placeholder="Số GKS"]')?.fill('GKS-2018-0001');
  await modal?.getByRole('combobox')?.last()?.click();
  await page?.keyboard?.type('Việt Nam');
  await page?.keyboard?.press('Enter');
  await modal?.getByRole('button', { name: /Lưu/ })?.click();
}

test?.describe('Sales + Manager Verification', () => {
  test('Sales sidebar and booking tabs match the booking-management flow', async ({ page }) => {
    await loginAsSales(page);

    await expect(page?.getByRole('heading', { name: /Quản lý Booking/ }))?.toBeVisible();
    await expect(page?.getByRole('link', { name: 'Dashboard' }))?.toBeVisible();
    await expect(page?.getByRole('link', { name: /Quản lý Booking/ }))?.toBeVisible();

    await page?.getByTitle(/Thu gọn sidebar/)?.click();
    await expect(page?.getByRole('link', { name: /Quản lý Booking/ }))?.toHaveCount(0);

    await expect(page?.getByRole('button', { name: /Cần xác nhận/ })?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Đã xác nhận/ })?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Hoàn thành/ })?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Đã hủy/ })?.first())?.toBeVisible();
  });

  test('Sales booking list removes row-level confirm buttons and renders the revised tab columns', async ({ page }) => {
    await loginAsSales(page);

    await expect(page?.getByRole('button', { name: /^Xác nhận$/ }))?.toHaveCount(0);
    await expect(page?.getByRole('columnheader', { name: 'TT thanh toán' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'Ngày tạo' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'Ghi chú' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'Trạng thái đơn' }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Xuất Excel/i }))?.toHaveCount(0);

    await page?.getByRole('button', { name: /Đã xác nhận/ })?.first()?.click();
    await expect(page?.getByText('Đã đặt'))?.toBeVisible();

    await page?.getByRole('button', { name: /Hoàn thành/ })?.first()?.click();
    await expect(page?.getByRole('columnheader', { name: 'Trạng thái đơn' }))?.toBeVisible();
    await expect(page?.getByText('100%')?.first())?.toBeVisible();

    await page?.getByRole('button', { name: /Đã hủy/ })?.first()?.click();
    await expect(page?.getByRole('columnheader', { name: 'Trạng thái đơn' }))?.toHaveCount(0);
    await expect(page?.getByRole('columnheader', { name: 'TT hoàn tiền' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'TT thanh toán' }))?.toHaveCount(0);
  });

  test('Sales passenger edit popup keeps supplement read-only and exposes the added passenger fields', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B003?tab=pending_confirm');
    await page?.waitForLoadState('domcontentloaded');

    await page?.getByRole('button', { name: 'Chỉnh sửa danh sách HK' })?.click();

    const modal = page?.getByRole('dialog');

    await expect(modal?.getByRole('columnheader', { name: 'Giới tính' }))?.toBeVisible();
    await expect(modal?.getByRole('columnheader', { name: 'Quốc tịch' }))?.toBeVisible();
    await expect(modal?.getByRole('columnheader', { name: 'Phụ thu đơn' }))?.toBeVisible();
    await expect(modal?.getByRole('columnheader', { name: 'CCCD / GKS *' }))?.toBeVisible();
    await expect(modal?.locator('input[type="number"]'))?.toHaveCount(0);
  });

  test('Sales confirm action persists from detail back to the list tabs', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B003?tab=pending_confirm');
    await page?.waitForLoadState('domcontentloaded');

    await fillPendingPassengerData(page);
    await page?.getByRole('button', { name: 'Xác nhận đơn đặt' })?.click();
    await page?.getByRole('button', { name: 'Có, xác nhận' })?.click();

    await expect(page?.getByText('Đã xác nhận')?.first())?.toBeVisible();

    await page?.getByRole('link', { name: /Danh sách đơn booking/ })?.click();
    await expect(page?.locator('text=BK-394821'))?.toHaveCount(0);

    await page?.getByRole('button', { name: /Đã xác nhận/ })?.first()?.click();
    await expect(page?.locator('text=BK-394821'))?.toBeVisible();
  });

  test('Manager voucher approval stays on the list page and shows applied tour names', async ({ page }) => {
    await loginAsManager(page);

    await expect(page?.getByRole('columnheader', { name: 'Thời gian áp dụng' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'Ghi chú' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'Số lượng được dùng' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'Ngày gửi phê duyệt' }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: 'Ngày tạo' }))?.toHaveCount(0);
    await expect(page?.getByRole('columnheader', { name: 'Tour áp dụng' }))?.toBeVisible();
    const approvalWarning = page?.getByText('Sắp đến ngày bắt đầu')?.first();
    await expect(approvalWarning)?.toBeVisible();
    await expect(approvalWarning)?.toHaveAttribute('title', 'Voucher sắp đến hạn bắt đầu, cần phải phê duyệt ngay.');
    await expect(page?.getByText('Mùa Thu Kyoto & Osaka'))?.toBeVisible();
    await expect(page?.getByText('Chi tiết'))?.toHaveCount(0);

    const firstRow = page?.locator('tbody tr')?.first();
    const firstCode = (await firstRow?.locator('td')?.first()?.textContent())?.trim() ?? '';

    await firstRow?.getByRole('button', { name: 'Phê duyệt' })?.click();
    const modal = page?.getByRole('dialog');
    await expect(modal?.getByRole('heading', { name: 'Phê duyệt Voucher' }))?.toBeVisible();
    await modal?.getByRole('button', { name: 'Phê duyệt' })?.click();

    await expect(page?.locator('tbody'))?.not?.toContainText(firstCode);
  });

  test('Manager reject popup requires a reason and pending vouchers stay sorted by the earliest start date', async ({ page }) => {
    await loginAsManager(page);

    const rows = page?.locator('tbody tr');
    await expect(rows?.nth(0))?.toContainText('APPROVENOW');
    await expect(rows?.nth(1))?.toContainText('VIPONLY30');
    await expect(rows?.nth(2))?.toContainText('AUTUMN20');

    await rows?.nth(0)?.getByRole('button', { name: 'Từ chối' })?.click();
    const modal = page?.getByRole('dialog');
    const confirmReject = modal?.getByRole('button', { name: 'Xác nhận' });
    await expect(confirmReject)?.toBeDisabled();

    await modal?.getByPlaceholder(/Lý do không phê duyệt/i)?.fill('Thiếu điều kiện áp dụng rõ ràng');
    await expect(confirmReject)?.toBeEnabled();
  });
});
