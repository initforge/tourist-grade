import { expect, test } from '@playwright/test';
import { loginAs, lookupBooking } from './support/app';

const HALONG_TOUR = '/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao';

test.describe('Customer + Public Booking Verification', () => {
  test('Row 18: tour detail keeps the fixed right booking card, schedule table, notes accordion, and related tours', async ({ page }) => {
    await page.goto(HALONG_TOUR);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /Khám Phá Vịnh Hạ Long/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Lịch khởi hành/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Ngày khởi hành/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Phụ thu phòng đơn/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Mã tour/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Thông tin cần lưu ý/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Tour liên quan/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Chỗ trống/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ngày khác/i })).toBeVisible();

    const bookButton = page.getByRole('button', { name: /Đặt ngay/i });
    await expect(bookButton).toBeEnabled();
    await page.getByRole('row', { name: /01\/05\/2026/ }).click();
    await expect(bookButton).toBeEnabled();

    await page.getByRole('button', { name: /Giá tour bao gồm/i }).click();
    await expect(page.getByText(/Xe Limousine đưa đón khứ hồi/i)).toBeVisible();
    await page.getByRole('button', { name: /Chính sách hủy tour/i }).click();
    await expect(page.getByText(/Hoàn/i).first()).toBeVisible();
  });

  test('Row 19: wishlist redirects guests and toggles for logged-in customers', async ({ page }) => {
    await page.goto(HALONG_TOUR);
    await page.getByRole('button', { name: /Lưu yêu thích/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await loginAs(page, 'customer', undefined, { clearBookings: true });
    await page.goto(HALONG_TOUR);
    await page.getByRole('button', { name: /Lưu yêu thích/i }).click();
    await expect(page.getByRole('button', { name: /Đã lưu yêu thích/i })).toBeVisible();
  });

  test('Row 20: checkout follows the 3-step flow with passenger data, single-room selection, voucher, and payment ratio', async ({ page }) => {
    await page.goto(`${HALONG_TOUR}/book?scheduleId=DS001-4`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /Thông tin liên hệ/i })).toBeVisible();
    await expect(page.getByText(/^Thông tin$/)).toBeVisible();
    await expect(page.getByText(/^Thanh toán$/)).toBeVisible();
    await expect(page.getByText(/^Hoàn tất$/)).toBeVisible();
    await expect(page.getByText(/Mã giảm giá/i)).toBeVisible();

    await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn A');
    await page.getByPlaceholder('0901 234 567').fill('0901 234 567');
    await page.getByPlaceholder('email@example.com').fill('nguyenvana@example.com');

    await expect(page.getByRole('heading', { name: /Số lượng hành khách/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Thông tin hành khách/i })).toBeVisible();
    await page.getByPlaceholder('Đúng theo CCCD/Passport').fill('Nguyễn Văn A');
    await page.locator('input[type="date"]').first().fill('1990-01-01');

    const passengerSection = page.locator('section').filter({ hasText: /Thông tin hành khách/i });
    await passengerSection.getByRole('checkbox').first().check();

    await page.getByPlaceholder('Nhập mã...').fill('TRAVELA10');
    await page.getByRole('button', { name: /Áp dụng/i }).click();
    await expect(page.getByText(/Đã áp dụng/i)).toBeVisible();
    await expect(page.getByText(/Phụ thu phòng đơn/i).first()).toBeVisible();

    await page.getByRole('button', { name: /Tiếp tục thanh toán/i }).first().click();
    await expect(page.getByRole('heading', { name: /Thanh toán/i })).toBeVisible();
    await expect(page.getByText(/Hình thức thanh toán/i)).toBeVisible();
    await expect(page.getByText(/Thanh toán 50%/i)).toBeVisible();
    await expect(page.getByText(/Thanh toán toàn bộ/i)).toBeVisible();
    await expect(page.getByText(/Ưu tiên QR hoặc chuyển khoản qua PayOS/i)).toBeVisible();
    await expect(page.getByText(/Ưu tiên thẻ qua PayOS/i)).toBeVisible();

    await page.getByText(/Thanh toán toàn bộ/i).click();
    await expect(page.getByRole('button', { name: /Thanh toán ?.*đ/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Quay lại sửa đơn/i })).toBeVisible();
  });

  test('Row 21: customer cancellation stays in a popup and uses the requested submit label', async ({ page }) => {
    await loginAs(page, 'customer', undefined, { clearBookings: true });
    await page.goto('/customer/bookings/B001');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /Yêu cầu hủy tour/i }).click();

    const dialog = page.getByRole('dialog', { name: /Gửi yêu cầu hủy/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Gửi yêu cầu hủy/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Xác nhận hủy/i })).toHaveCount(0);
    await expect(page).toHaveURL(/\/customer\/bookings\/B001$/);
  });

  test('Row 22: lookup uses two-column layout, matches contact info, and shows actions by booking status', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/booking/lookup');
    await page.waitForLoadState('domcontentloaded');

    await lookupBooking(page, 'BK-394821', '0000');
    await expect(page.getByText(/Không tìm thấy đơn đặt chỗ/i)).toBeVisible();

    await lookupBooking(page, 'BK-394821', '0912345678');

    const formRegion = page.getByRole('region', { name: /Form tra cứu đơn đặt/i });
    const resultRegion = page.getByRole('region', { name: /Kết quả tra cứu đơn đặt/i });
    await expect(resultRegion.getByText('BK-394821')).toBeVisible();
    await expect(formRegion).toBeVisible();
    await expect(page.getByTestId('lookup-layout')).toHaveClass(/lg:grid-cols-\[minmax\(0,0\.9fr\)_minmax\(0,1\.1fr\)\]/);

    await expect(resultRegion.getByRole('button', { name: /Thanh toán/i })).toBeVisible();
    await expect(resultRegion.getByRole('button', { name: /Hủy/i })).toBeVisible();

    await resultRegion.getByRole('button', { name: /Thanh toán/i }).click();
    const paymentDialog = page.getByRole('dialog', { name: /Thanh toán/i });
    await expect(paymentDialog).toBeVisible();
    await paymentDialog.getByRole('button', { name: /Thanh toán ?.*đ/i }).click();
    await expect(paymentDialog).toHaveCount(0);

    await resultRegion.getByRole('button', { name: /Hủy/i }).click();
    const cancelDialog = page.getByRole('dialog', { name: /Gửi yêu cầu hủy/i });
    await expect(cancelDialog).toBeVisible();
    await expect(cancelDialog.getByRole('button', { name: /Gửi yêu cầu hủy/i })).toBeVisible();
    const dialogBox = await cancelDialog.boundingBox();
    const viewport = page.viewportSize();
    expect(dialogBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(dialogBox!.height).toBeLessThanOrEqual(viewport!.height * 0.92);
    await cancelDialog.getByRole('button', { name: /Giữ lại đơn/i }).click();

    await lookupBooking(page, 'BK-582910', '0988888888');
    await expect(resultRegion.getByText('BK-582910')).toBeVisible();
    await expect(resultRegion.getByRole('button', { name: /Hủy/i })).toBeVisible();
    await expect(resultRegion.getByRole('button', { name: /Thanh toán/i })).toHaveCount(0);

    await lookupBooking(page, 'BK-102938', '0988888888');
    await expect(resultRegion.getByText('BK-102938')).toBeVisible();
    await expect(resultRegion.getByText(/Đã gửi yêu cầu hủy/i)).toBeVisible();
    await expect(resultRegion.getByRole('button', { name: /Hủy/i })).toHaveCount(0);

    await lookupBooking(page, 'BK-847291', '0977654321');
    await expect(resultRegion.getByText('BK-847291')).toBeVisible();
    await expect(resultRegion.getByRole('button', { name: /Đánh giá/i })).toBeVisible();
    await expect(resultRegion.getByRole('button', { name: /Hủy/i })).toHaveCount(0);
    await expect(resultRegion.getByRole('button', { name: /Thanh toán/i })).toHaveCount(0);
  });
});
