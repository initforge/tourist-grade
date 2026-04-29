import { expect, test, type Page } from '@playwright/test';
import { loginAs } from './support/app';

const refundBillFixture = 'tests/fixtures/refund-bill.svg';

async function loginAsSales(page: Page) {
  await loginAs(page, 'sales', undefined, { clearBookings: true });
}

async function fillPendingPassengerData(page: Page) {
  await page?.getByRole('button', { name: /Chỉnh sửa$/ })?.first()?.click();

  const modal = page?.getByRole('dialog');
  await expect(modal?.getByRole('columnheader', { name: 'CCCD / GKS *' }))?.toBeVisible();

  await modal?.locator('input[placeholder="Số GKS"]')?.fill('001201800001');
  await modal?.getByRole('button', { name: /Lưu/ })?.click();
}

test?.describe('Sales Booking Detail Verification', () => {
  test('Pending booking allows saving partial passenger data, but confirm stays locked until passenger documents are valid', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B003?tab=pending_confirm');
    await page?.waitForLoadState('domcontentloaded');

    const confirmButton = page?.getByRole('button', { name: /Xác nhận đơn đặt/i });

    await page?.getByRole('button', { name: /Chỉnh sửa$/ })?.first()?.click();
    const modal = page?.getByRole('dialog');
    const saveButton = modal?.getByRole('button', { name: /Lưu/ });
    const childDocumentInput = modal?.locator('input[placeholder="Số GKS"]');

    await expect(saveButton)?.toBeEnabled();
    await childDocumentInput?.fill('@@');
    await expect(saveButton)?.toBeEnabled();
    await saveButton?.click();
    await expect(confirmButton)?.toBeDisabled();

    await page?.getByRole('button', { name: /Chỉnh sửa$/ })?.first()?.click();
    await modal?.locator('input[placeholder="Số GKS"]')?.fill('001201800001');
    await modal?.getByRole('button', { name: /Lưu/ })?.click();
    await expect(confirmButton)?.toBeEnabled();
  });

  test('Booking detail is a full page with breadcrumb back to the same list tab', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B003?tab=pending_confirm');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('heading', { name: /Đơn hàng #BK-394821/i }))?.toBeVisible();
    await expect(page?.getByRole('dialog'))?.toHaveCount(0);

    await page?.getByRole('link', { name: /Danh sách đơn booking/i })?.click();
    await expect(page)?.toHaveURL(/\/sales\/bookings\?tab=pending_confirm$/);
    await expect(page?.getByRole('button', { name: /Cần xác nhận/i })?.first())?.toBeVisible();
  });

  test('Pending booking detail keeps confirm disabled until room counts and passenger data are valid, then persists the values', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B003?tab=pending_confirm');
    await page?.waitForLoadState('domcontentloaded');

    const confirmButton = page?.getByRole('button', { name: /Xác nhận đơn đặt/i });
    await expect(confirmButton)?.toBeDisabled();

    await page?.getByRole('textbox', { name: 'Đơn' })?.fill('0');
    await page?.getByRole('textbox', { name: 'Đôi' })?.fill('0');
    await page?.getByRole('textbox', { name: 'Ba' })?.fill('0');
    const invalidRoomSave = page?.waitForResponse(response =>
      response.request().method() === 'PATCH' && response.url().includes('/api/v1/bookings/B003'),
    );
    await page?.getByRole('button', { name: /Lưu số phòng/i })?.click();
    await invalidRoomSave;
    await expect(confirmButton)?.toBeDisabled();

    await page?.getByRole('textbox', { name: 'Đơn' })?.fill('1');
    await page?.getByRole('textbox', { name: 'Đôi' })?.fill('1');
    await page?.getByRole('textbox', { name: 'Ba' })?.fill('0');
    await expect(page?.getByRole('textbox', { name: 'Đơn' }))?.toHaveValue('1');
    await expect(page?.getByRole('textbox', { name: 'Đôi' }))?.toHaveValue('1');
    const validRoomSave = page?.waitForResponse(response =>
      response.request().method() === 'PATCH' && response.url().includes('/api/v1/bookings/B003'),
    );
    await page?.getByRole('button', { name: /Lưu số phòng/i })?.click();
    await validRoomSave;
    await expect(page?.getByRole('textbox', { name: 'Đơn' }))?.toHaveValue('1');
    await expect(page?.getByRole('textbox', { name: 'Đôi' }))?.toHaveValue('1');
    await expect(confirmButton)?.toBeDisabled();

    await fillPendingPassengerData(page);
    await expect(confirmButton)?.toBeEnabled();

    await page?.reload();
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('textbox', { name: 'Đơn' }))?.toHaveValue('1');
    await expect(page?.getByRole('textbox', { name: 'Đôi' }))?.toHaveValue('1');
    await expect(page?.getByRole('textbox', { name: 'Ba' }))?.toHaveValue('0');
    await expect(page?.locator('tbody tr').nth(2))?.toContainText('001201800001');
    await expect(page?.locator('tbody tr').nth(2))?.toContainText('Việt Nam');
  });

  test('Passenger list download uses Excel format from booking detail', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B003?tab=pending_confirm');
    await page?.waitForLoadState('domcontentloaded');

    const downloadPromise = page?.waitForEvent('download');
    await page?.getByRole('button', { name: /Tải về DSHK/i })?.click();
    const download = await downloadPromise;

    expect(download?.suggestedFilename())?.toBe('DSHK_BK-394821.xls');
  });

  test('Confirmed booking keeps note in one place and shows payment method in itinerary and payment card', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B001?tab=confirmed');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByText(/Dị ứng hải sản nhẹ/i))?.toHaveCount(1);
    await expect(page?.getByText(/PayOS/i))?.toHaveCount(2);
  });

  test('Pending-cancel booking shows cancellation reason and only the confirm-cancel action', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B002?tab=cancelled');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByText(/Lý do hủy/i))?.toBeVisible();
    await expect(page?.getByText(/Thay đổi kế hoạch công tác/i))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Xác nhận hủy đơn/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Từ chối hủy/i }))?.toHaveCount(0);
    await expect(page?.getByText(/Thẻ \/ Stripe/i))?.toHaveCount(2);
  });

  test('Pending-cancel booking preserves banking and cancellation info while hiding passenger editing', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B002?tab=cancelled');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByText(/Thông tin Ngân hàng/i))?.toBeVisible();
    await expect(page?.getByText(/1234567890/i))?.toBeVisible();
    await expect(page?.getByText(/Vietcombank/i))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Chỉnh sửa$/i }))?.toHaveCount(0);
  });

  test('Cancelled pending-refund booking requires a bill before refund confirmation', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B005?tab=cancelled');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByText('100%')?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Hoàn tiền/i }))?.toBeVisible();

    await page?.getByRole('button', { name: /Hoàn tiền/i })?.click();
    const modal = page?.getByRole('dialog', { name: /Hoàn tiền đơn hàng/i });
    const confirmButton = modal?.getByRole('button', { name: /Xác nhận hoàn tiền/i });

    await expect(confirmButton)?.toBeDisabled();
    await modal?.locator('input[type="file"]')?.setInputFiles(refundBillFixture);
    await expect(modal?.getByAltText('Bill'))?.toBeVisible();
    await expect(confirmButton)?.toBeEnabled();

    await confirmButton?.click();

    await expect(page?.getByText(/Đã hoàn tiền/i)?.first())?.toBeVisible();
    await expect(page?.getByText(/Người hoàn tiền/i))?.toBeVisible();
    await expect(page?.getByText(/Đã gửi email thông báo cho khách/i))?.toBeVisible();
  });

  test('Refunded booking keeps existing bill when edit is cancelled after clearing the preview', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B006?tab=cancelled');
    await page?.waitForLoadState('domcontentloaded');

    const currentBill = page?.getByAltText(/Bill hoàn tiền/i);
    await expect(currentBill)?.toBeVisible();

    const previousRefundLog = await page?.getByRole('heading', { name: /Người hoàn tiền/i })?.locator('..')?.innerText() ?? '';

    await page?.getByRole('button', { name: /Chỉnh sửa bill/i })?.click();
    const saveButton = page?.getByRole('button', { name: /Lưu/i });
    await expect(saveButton)?.toBeDisabled();
    await expect(page?.getByAltText(/Bill hiện tại/i))?.toBeVisible();

    await page?.getByRole('button', { name: /^close$/i })?.click();
    await page?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    await expect(currentBill)?.toBeVisible();
    await expect(page?.getByText(previousRefundLog))?.toBeVisible();
  });

  test('Refunded booking keeps payment percentage and allows bill replacement with edit log', async ({ page }) => {
    await loginAsSales(page);
    await page?.goto('/sales/bookings/B006?tab=cancelled');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByText('100%')?.first())?.toBeVisible();
    await page?.getByRole('button', { name: /Chỉnh sửa bill/i })?.click();

    const saveButton = page?.getByRole('button', { name: /Lưu/i });
    await expect(saveButton)?.toBeDisabled();
    await expect(page?.getByAltText(/Bill hiện tại/i))?.toBeVisible();
    await page?.getByRole('button', { name: /^close$/i })?.click();

    await page?.locator('input[type="file"]')?.setInputFiles(refundBillFixture);
    await expect(page?.getByAltText(/Bill mới/i))?.toBeVisible();
    await expect(saveButton)?.toBeEnabled();

    await saveButton?.click();

    await expect(page?.getByText(/Đã gửi email thông báo cho khách/i))?.toBeVisible();
    await expect(page?.getByRole('heading', { name: /Người hoàn tiền/i }))?.toBeVisible();

    await page?.reload();
    await page?.waitForLoadState('domcontentloaded');
    await expect(page?.getByAltText(/Bill hoàn tiền/i))?.toBeVisible();
    await expect(page?.getByRole('heading', { name: /Người hoàn tiền/i }))?.toBeVisible();
  });
});
