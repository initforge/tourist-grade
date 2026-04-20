import { expect, test, type Page, type TestInfo } from '@playwright/test';

function installRuntimeAudit(page: Page) {
  const issues: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push(`console.error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText ?? '';
    const resourceType = request.resourceType();
    const isNavigationAbort = errorText === 'net::ERR_ABORTED' && ['image', 'font'].includes(resourceType);
    if (!url.startsWith('data:') && !url.startsWith('blob:') && !isNavigationAbort) {
      issues.push(`requestfailed: ${request.resourceType()} ${url} ${request.failure()?.errorText ?? ''}`);
    }
  });
  page.on('response', (response) => {
    const resourceType = response.request().resourceType();
    if (['document', 'script', 'stylesheet', 'fetch', 'xhr', 'image'].includes(resourceType) && response.status() >= 400) {
      issues.push(`http ${response.status()}: ${resourceType} ${response.url()}`);
    }
  });

  return issues;
}

async function expectCleanRuntime(issues: string[], testInfo: TestInfo) {
  await testInfo.attach('strict-runtime-audit', {
    body: issues.length ? issues.join('\n') : 'clean',
    contentType: 'text/plain',
  });
  expect(issues).toEqual([]);
}

async function loginAs(page: Page, role: 'customer' | 'sales' | 'coordinator' | 'manager') {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((selectedRole) => {
    localStorage?.removeItem('__travela_bookings');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin(selectedRole);
  }, role);
}

test.describe('Strict role hardening audit', () => {
  test('customer role keeps cancellation in-popup, preserves lookup actions by state, and stays runtime-clean', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await loginAs(page, 'customer');
    await page.goto('/customer/bookings/B001');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: /Yêu Cầu Hủy Tour/i })).toBeVisible();
    await page.getByRole('button', { name: /Yêu Cầu Hủy Tour/i }).click();
    const cancelDialog = page.getByRole('dialog', { name: /Gửi yêu cầu hủy/i });
    await expect(cancelDialog).toBeVisible();
    await expect(cancelDialog.getByRole('button', { name: /Xác nhận hủy/i })).toHaveCount(0);
    await cancelDialog.getByRole('button', { name: /Giữ lại đơn/i }).click();

    await page.goto('/booking/lookup');
    await page.waitForLoadState('domcontentloaded');
    await page.getByPlaceholder('VD: BK-582910').fill('BK-847291');
    await page.getByPlaceholder('0988 123 456').fill('0977654321');
    await page.getByRole('button', { name: /Tra Cuu Thong Tin|Tra Cứu Thông Tin/i }).click();
    const resultRegion = page.getByRole('region', { name: /Kết quả tra cứu đơn đặt/i });
    await expect(resultRegion.getByRole('button', { name: /Đánh giá/i })).toBeVisible();
    await expect(resultRegion.getByRole('button', { name: /Thanh toán/i })).toHaveCount(0);
    await expect(resultRegion.getByRole('button', { name: /Hủy/i })).toHaveCount(0);

    await expectCleanRuntime(issues, testInfo);
  });

  test('sales role enforces booking and voucher restrictions exactly as requested and stays runtime-clean', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await loginAs(page, 'sales');
    await page.goto('/sales/bookings');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('button', { name: /^Tất cả$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Xuất Excel/i })).toHaveCount(0);
    await expect(page.getByText('Chưa thanh toán', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: /Đã hủy/i }).first().click();
    await page.locator('select').selectOption('completed');
    await expect(page.locator('tbody')).toContainText('Hoàn thành');
    await expect(page.locator('tbody')).not.toContainText('Không cần hoàn');
    await expect(page.locator('tbody')).not.toContainText('Đã hoàn');

    await page.goto('/sales/vouchers/VOU-07');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /Chỉnh sửa/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Gửi phê duyệt/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Xóa/i })).toHaveCount(0);

    await page.goto('/sales/vouchers/VOU-06');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /Chỉnh sửa/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Xóa/i })).toBeVisible();

    await expectCleanRuntime(issues, testInfo);
  });

  test('coordinator role keeps estimate/settlement/program flows constrained to the revised wireframes and stays runtime-clean', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await loginAs(page, 'coordinator');
    await page.goto('/coordinator/tours/TI009/estimate');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Dự toán/i }).click();
    await expect(page.getByRole('button', { name: /Thêm hạng mục/i })).toHaveCount(0);
    await expect(page.getByText(/Đêm\/Lượt\/Bữa/i)).toBeVisible();

    await page.goto('/coordinator/tours/TI004/settle');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /Thêm hạng mục/i })).toHaveCount(0);
    await expect(page.locator('tbody input[type="number"]').first()).toBeVisible();

    await page.goto('/coordinator/tour-programs/create');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /Lưu nháp/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Gửi phê duyệt/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Tiếp theo/i })).toBeVisible();

    await expectCleanRuntime(issues, testInfo);
  });

  test('manager role keeps approval routes read-only where required, forces reject reasons, and stays runtime-clean', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await loginAs(page, 'manager');
    await page.goto('/manager/voucher-approval');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText('Chi tiết')).toHaveCount(0);
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByRole('button', { name: /Từ chối/i }).click();
    const rejectDialog = page.getByRole('dialog', { name: /Từ chối Voucher/i });
    await expect(rejectDialog.getByRole('button', { name: /Xác nhận/i })).toBeDisabled();
    await rejectDialog.getByPlaceholder(/Lý do không phê duyệt/i).fill('Thiếu phạm vi áp dụng rõ ràng');
    await expect(rejectDialog.getByRole('button', { name: /Xác nhận/i })).toBeEnabled();
    await rejectDialog.getByRole('button', { name: /Hủy bỏ/i }).click();

    await page.goto('/manager/tour-programs/TP003/approval');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /Lưu/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Chỉnh sửa/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Duyệt chương trình tour/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Từ chối/i })).toBeVisible();

    await expectCleanRuntime(issues, testInfo);
  });
});
