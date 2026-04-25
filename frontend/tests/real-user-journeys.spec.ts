import { expect, test, type Page } from '@playwright/test';
import { loginAs } from './support/app';

const MOJIBAKE_PATTERN = /(?:\u00c3\u0192|\u00c3\u201a|\u00c3\u201e|\u00c3\u2019|\u00c2\u00a9|\u00c2\u00b7|\u00c4\u0090|\u00c4\u0192|\u00e1\u00ba|\u00e1\u00bb|\u00c6\u00b0|\u00c6\u00a1|\u00ef\u00bf\u00bd|\?\?|Kh\?|H\? N\?i|Tr\? em)/;

async function expectNoVisibleMojibake(page: Page, scopeName: string) {
  const text = await page.locator('body').innerText();
  expect.soft(text, `${scopeName} has mojibake text`).not.toMatch(MOJIBAKE_PATTERN);
}

async function resetFixtures(page: Page) {
  await page.request.post(`${process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000/api/v1'}/dev/reset-booking-fixtures`).catch(() => null);
}

test.describe.serial('Real user role journeys', () => {
  test.setTimeout(90000);
  test('customer journey: browse, wishlist, checkout, lookup, booking detail, cancel popup, profile', async ({ page }) => {
    await resetFixtures(page);

    await page.goto('/tours');
    await expect(page.getByRole('heading', { name: /Tour|Khám phá/i }).first()).toBeVisible();
    await expectNoVisibleMojibake(page, 'public tour list');

    await page.goto('/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao');
    await expect(page.getByRole('button', { name: /Đặt ngay/i })).toBeEnabled();
    await page.getByRole('button', { name: /Lưu yêu thích/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await loginAs(page, 'customer');
    await expect(page.getByText(/Khách hàng/)).toBeVisible();
    await page.goto('/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao');
    await page.getByRole('button', { name: /Lưu yêu thích/i }).click();
    await expect(page.getByRole('button', { name: /Đã lưu yêu thích/i })).toBeVisible();

    await page.goto('/customer/wishlist');
    await expect(page.getByRole('heading', { name: /Wishlist|Y?u th?ch/i })).toBeVisible();
    await expect(page.getByText(/Hạ Long/i)).toBeVisible();

    await page.goto('/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao/book?scheduleId=DS001-4');
    await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn A');
    await page.getByPlaceholder('0901 234 567').fill('0901 234 567');
    await page.getByPlaceholder('email@example.com').fill('nguyenvana@example.com');
    await page.getByPlaceholder('Đúng theo CCCD/Passport').fill('Nguyễn Văn A');
    await page.locator('input[type="date"]').first().fill('1990-01-01');
    await page.getByPlaceholder('Nhập mã...').fill('TRAVELA10');
    await page.getByRole('button', { name: /Áp dụng/i }).click();
    await expect(page.getByText(/Đã áp dụng/i)).toBeVisible();
    await page.getByRole('button', { name: /Tiếp tục: Thanh toán/i }).first().click();
    await expect(page.getByRole('heading', { name: /Xác nhận thông tin/i })).toBeVisible();
    await expect(page.getByText(/Thanh toán 50%/i)).toBeVisible();
    await expect(page.getByText(/Thanh toán toàn bộ/i)).toBeVisible();

    await page.goto('/booking/lookup');
    await page.getByPlaceholder('VD: BK-582910').fill('BK-394821');
    await page.getByPlaceholder('0988 123 456').fill('0912345678');
    await page.getByRole('button', { name: /Tra cứu thông tin/i }).click();
    await expect(page.getByText('BK-394821')).toBeVisible();
    await expect(page.getByRole('button', { name: /Thanh toán/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hủy/i })).toBeVisible();

    await page.goto('/customer/bookings/B001');
    await expect(page.getByRole('button', { name: /Yêu cầu hủy tour/i })).toBeVisible();
    await page.getByRole('button', { name: /Yêu cầu hủy tour/i }).click();
    await expect(page.getByRole('dialog', { name: /Gửi yêu cầu hủy/i })).toBeVisible();

    await page.goto('/customer/profile');
    await expect(page.locator('input[value="customer@travela.vn"]')).toBeVisible();
    await expectNoVisibleMojibake(page, 'customer surfaces');
  });

  test('staff journey: sales booking and voucher, manager approval, coordinator operation, admin users', async ({ page }) => {
    await resetFixtures(page);

    await loginAs(page, 'sales', '/sales/bookings');
    await expect(page.getByRole('heading', { name: /Booking/i })).toBeVisible();
    await expect(page.getByText(/Chưa thanh toán/, { exact: true })).toHaveCount(0);
    await page.goto('/sales/bookings/B001');

    await loginAs(page, 'sales', '/sales/vouchers');
    await page.goto('/sales/vouchers');
    await expect(page.locator('tbody').first()).toBeVisible();
    await page.goto('/sales/vouchers/VOU-07');
    await expect(page.getByRole('button', { name: /Gửi phê duyệt/i })).toHaveCount(0);

    await loginAs(page, 'manager', '/manager/voucher-approval');
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await page.locator('tbody tr').first().getByRole('button', { name: /Từ chối/i }).click();
    const rejectDialog = page.getByRole('dialog');
    await expect(rejectDialog.getByRole('button', { name: /Xác nhận/i })).toBeDisabled();
    await rejectDialog.getByPlaceholder(/Lý do/i).fill('Thiếu phạm vi áp dụng rõ ràng');
    await expect(rejectDialog.getByRole('button', { name: /Xác nhận/i })).toBeEnabled();
    await rejectDialog.getByRole('button', { name: /Hủy bỏ/i }).click();

    await page.goto('/manager/tour-programs/TP003/approval');
    await expect(page.getByRole('button', { name: /Duyệt chương trình tour/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Từ chối/i })).toBeVisible();

    await loginAs(page, 'coordinator', '/coordinator/tours');
    await expect(page.getByText(/Điều hành tour|Quản lý Tour/i).first()).toBeVisible();
    await page.goto('/coordinator/tours/TI009/estimate');
    await page.getByRole('button', { name: /Dự toán/i }).click();
    await expect(page.getByRole('button', { name: /Thêm hạng mục/i })).toHaveCount(0);
    await page.goto('/coordinator/services');
    await expect(page.getByRole('heading', { name: /Kho Dịch vụ|Dịch vụ/i }).first()).toBeVisible();
    await page.goto('/coordinator/suppliers');
    await expect(page.getByText(/Khách sạn Di Sản Việt|Vận tải Xuyên Việt/i).first()).toBeVisible();

    await loginAs(page, 'admin', '/admin/users');
    await expect(page.getByText('Quản trị viên')).toBeVisible();
    await expect(page.getByText('Quản lý kinh doanh')).toBeVisible();
    await expect(page.getByText('Điều phối viên')).toBeVisible();
    await expect(page.getByText('Nhân viên kinh doanh')).toBeVisible();
    await page.getByRole('button', { name: /Khách hàng/i }).click();
    await expect(page.getByText('customer@travela.vn')).toBeVisible();
    await expectNoVisibleMojibake(page, 'staff/admin surfaces');
  });
});
