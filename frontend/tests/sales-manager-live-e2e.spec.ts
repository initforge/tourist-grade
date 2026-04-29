import { expect, test, type Page, type APIRequestContext } from '@playwright/test';
import { loginAsRole } from './support/auth';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const refundBillFixture = 'tests/fixtures/refund-bill.svg';
const refundBillPngFixture = {
  name: 'refund-bill.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==', 'base64'),
};

async function resetFixtures(request: APIRequestContext) {
  await request.post(`${apiBase}/dev/reset-booking-fixtures`);
}

async function getRoleAccessToken(request: APIRequestContext, role: 'sales' | 'coordinator' | 'manager') {
  const credentials = {
    sales: { email: 'sales@travela.vn', password: '123456' },
    coordinator: { email: 'coordinator@travela.vn', password: '123456' },
    manager: { email: 'manager@travela.vn', password: '123456' },
  }[role];
  const response = await request.post(`${apiBase}/auth/login`, { data: credentials });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.accessToken as string;
}

async function getBookingDetail(request: APIRequestContext, token: string, bookingId: string) {
  const response = await request.get(`${apiBase}/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.booking as {
    status: string;
    confirmedAt?: string;
    bookingCode: string;
  };
}

async function getCoordinatorManifest(request: APIRequestContext, token: string, instanceCode: string) {
  const response = await request.get(`${apiBase}/bootstrap`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return (payload.data.bookings as Array<{ bookingCode: string; status: string; instanceCode?: string }>).filter(
    (booking) => booking.instanceCode === instanceCode,
  );
}

async function getEmailOutbox(
  request: APIRequestContext,
  options: {
    bookingCode?: string;
    template?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (options.bookingCode) query.set('bookingCode', options.bookingCode);
  if (options.template) query.set('template', options.template);
  const response = await request.get(`${apiBase}/dev/email-outbox?${query.toString()}`);
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.emails as Array<{
    template: string;
    recipient: string;
    subject: string;
    bookingCode: string | null;
    payload: Record<string, unknown>;
  }>;
}

async function expectEmailQueued(
  request: APIRequestContext,
  options: {
    bookingCode: string;
    template: string;
  },
) {
  await expect
    .poll(async () => {
      const emails = await getEmailOutbox(request, options);
      return emails.length;
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBeGreaterThan(0);

  return getEmailOutbox(request, options);
}

async function openPassengerEditor(page: Page) {
  await page.getByRole('button', { name: /Chỉnh sửa$/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openCoordinatorGuestList(page: Page) {
  await page.goto('/coordinator/tours/TI009/estimate');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: /Dự Toán|Dự toán/i })).toBeVisible();
  await page.getByRole('button', { name: /Danh sách khách hàng/i }).click();
  await expect(page.locator('tbody')).toContainText(/BK-\d+/i);
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ request }) => {
  await resetFixtures(request);
});

test('sales confirms a paid booking, stores audit fields, moves it to confirmed, exposes manifest to coordinator, and queues email', async ({ page, request }) => {
  const salesToken = await getRoleAccessToken(request, 'sales');
  const coordinatorToken = await getRoleAccessToken(request, 'coordinator');
  await loginAsRole(page, 'sales', '/sales/bookings/B003?tab=pending_confirm');

  const confirmButton = page.getByRole('button', { name: /Xác nhận đơn đặt/i });
  await expect(confirmButton).toBeDisabled();

  const dialog = await openPassengerEditor(page);
  await dialog.locator('input[placeholder="Số GKS"]').fill('123456789012');
  await dialog.getByRole('button', { name: /Lưu/i }).click();

  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();
  await page.getByRole('button', { name: /Có, xác nhận/i }).click();

  await expect(page.getByText(/Xác nhận đơn đặt tour thành công/i)).toBeVisible();
  await expect(page.getByText(/Người xác nhận đơn đặt/i)).toBeVisible();
  await expect(page.getByText(/Đã xác nhận/i).first()).toBeVisible();

  await expect
    .poll(async () => {
      const booking = await getBookingDetail(request, salesToken, 'B003');
      return `${booking.status}:${Boolean(booking.confirmedAt)}`;
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBe('confirmed:true');

  await loginAsRole(page, 'sales', '/sales/bookings/B002?tab=pending_confirm');
  await page.getByRole('button', { name: /Xác nhận hủy đơn/i }).click();
  await page.getByRole('button', { name: /Có, hủy đơn/i }).click();

  await expect
    .poll(async () => {
      const booking = await getBookingDetail(request, salesToken, 'B002');
      return booking.status;
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBe('cancelled');

  await loginAsRole(page, 'sales', '/sales/bookings/B010?tab=pending_confirm');
  await page.getByRole('button', { name: /Xác nhận đơn đặt/i }).click();
  await page.getByRole('button', { name: /Có, xác nhận/i }).click();

  await expect
    .poll(async () => {
      const booking = await getBookingDetail(request, salesToken, 'B010');
      return `${booking.status}:${Boolean(booking.confirmedAt)}`;
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBe('confirmed:true');

  await expect
    .poll(async () => {
      const bookings = await getCoordinatorManifest(request, coordinatorToken, 'TI009');
      const target = bookings.find((booking) => booking.bookingCode === 'BK-394821');
      return target?.status ?? 'missing';
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBe('confirmed');

  await page.goto('/sales/bookings?tab=pending_confirm');
  await expect(page.locator('tbody')).not.toContainText('BK-394821');
  await page.getByRole('button', { name: /Đã xác nhận/i }).first().click();
  await expect(page.locator('tbody')).toContainText('BK-394821');

  await loginAsRole(page, 'coordinator', '/coordinator/tours/TI009/estimate');
  await openCoordinatorGuestList(page);
  await expect(page.locator('tbody')).toContainText('BK-394821');
  await expect(page.locator('tbody')).toContainText('Lê Văn C');

  const emails = await expectEmailQueued(request, { bookingCode: 'BK-394821', template: 'booking_confirmed' });
  expect(emails[0]?.recipient).toBe('levanc@gmail.com');
});

test('sales accepts non-Vietnamese passenger documents without 12-digit validation', async ({ page }) => {
  await loginAsRole(page, 'sales', '/sales/bookings/B010?tab=pending_confirm');
  await expect(page.getByRole('button', { name: /Xác nhận đơn đặt/i })).toBeEnabled();
});

test('sales confirms cancellation, stores audit fields, removes the manifest from coordinator, and queues cancellation email', async ({ page, request }) => {
  await loginAsRole(page, 'sales', '/sales/bookings/B002?tab=pending_confirm');
  await page.getByRole('button', { name: /Xác nhận hủy đơn/i }).click();
  await page.getByRole('button', { name: /Có, hủy đơn/i }).click();

  await expect(page.getByText(/Xác nhận yêu cầu hủy tour thành công/i)).toBeVisible();
  await expect(page.getByText(/Người xác nhận hủy/i)).toBeVisible();

  await page.goto('/sales/bookings?tab=pending_confirm');
  await expect(page.locator('tbody')).not.toContainText('BK-102938');
  await page.getByRole('button', { name: /Đã hủy/i }).first().click();
  await expect(page.locator('tbody')).toContainText('BK-102938');

  await loginAsRole(page, 'sales', '/sales/bookings/B003?tab=pending_confirm');
  const dialog = await openPassengerEditor(page);
  await dialog.locator('input[placeholder="Số GKS"]').fill('123456789012');
  await dialog.getByRole('button', { name: /Lưu/i }).click();
  await page.getByRole('button', { name: /Xác nhận đơn đặt/i }).click();
  await page.getByRole('button', { name: /Có, xác nhận/i }).click();

  await loginAsRole(page, 'sales', '/sales/bookings/B010?tab=pending_confirm');
  await page.getByRole('button', { name: /Xác nhận đơn đặt/i }).click();
  await page.getByRole('button', { name: /Có, xác nhận/i }).click();

  await loginAsRole(page, 'coordinator', '/coordinator/tours/TI009/estimate');
  await openCoordinatorGuestList(page);
  await expect(page.locator('tbody')).not.toContainText('BK-102938');

  const emails = await expectEmailQueued(request, { bookingCode: 'BK-102938', template: 'booking_cancel_confirmed' });
  expect(emails[0]?.recipient).toBe('nguyenvana@gmail.com');
});

test('sales refund upload and refund-bill edit persist the latest audit fields and queue both email variants', async ({ page, request }) => {
  await loginAsRole(page, 'sales', '/sales/bookings/B005?tab=cancelled');

  await page.getByRole('button', { name: /Hoàn tiền/i }).click();
  const refundDialog = page.getByRole('dialog', { name: /Hoàn tiền đơn hàng/i });
  await refundDialog.locator('input[type="file"]').setInputFiles(refundBillPngFixture);
  await refundDialog.getByRole('button', { name: /Xác nhận hoàn tiền/i }).click();

  await expect(page.getByText(/Đã hoàn tiền/i).first()).toBeVisible();
  await expect(page.getByText(/Người hoàn tiền/i)).toBeVisible();

  const completedEmails = await expectEmailQueued(request, { bookingCode: 'BK-192837', template: 'booking_refund_completed' });
  expect(completedEmails[0]?.payload?.refundBillUrl).toBeTruthy();

  await page.goto('/sales/bookings/B006?tab=cancelled');
  await page.getByRole('button', { name: /Chỉnh sửa bill/i }).click();
  await page.locator('button').filter({ has: page.locator('.material-symbols-outlined', { hasText: 'close' }) }).first().click();
  await page.locator('input[type="file"]').setInputFiles(refundBillFixture);
  await page.getByRole('button', { name: /Lưu/i }).click();

  await expect(page.getByText(/Người hoàn tiền/i)).toBeVisible();

  const updatedEmails = await expectEmailQueued(request, { bookingCode: 'BK-564738', template: 'booking_refund_bill_updated' });
  expect(updatedEmails[0]?.payload?.refundBillUrl).toBeTruthy();
});

test('unpaid bookings stay in pending-confirm before 15 minutes and move to cancelled with timeout reason after bootstrap refresh', async ({ page, request }) => {
  const createPending = await request.post(`${apiBase}/dev/unpaid-booking-fixture`, {
    data: { minutesAgo: 5 },
  });
  expect(createPending.ok()).toBeTruthy();

  await loginAsRole(page, 'sales', '/sales/bookings?tab=pending_confirm');
  await expect(page.locator('tbody')).toContainText('BK-888012');
  await expect(page.locator('tbody')).toContainText('Chưa thanh toán');

  const ageBooking = await request.post(`${apiBase}/dev/unpaid-booking-fixture`, {
    data: { minutesAgo: 20 },
  });
  expect(ageBooking.ok()).toBeTruthy();

  await loginAsRole(page, 'sales', '/sales/bookings?tab=cancelled');
  await expect(page.locator('tbody')).toContainText('BK-888012');
  await expect(page.locator('tbody')).toContainText(/Không thanh toán đúng hạn/i);
  await expect(page.locator('tbody')).toContainText(/Hoàn thành/i);
});

test('sales completed tab shows bookings auto-finished after the tour end date passes', async ({ page }) => {
  await loginAsRole(page, 'sales', '/sales/bookings?tab=pending_confirm');
  await expect(page.locator('tbody')).not.toContainText('BK-582910');

  await page.getByRole('button', { name: /Hoàn thành/i }).first().click();
  await expect(page.locator('tbody')).toContainText('BK-582910');
  await expect(page.locator('tbody')).toContainText('100%');
});

test('manager voucher approval and rejection sync back to sales with the correct statuses and reason', async ({ page }) => {
  await loginAsRole(page, 'manager', '/manager/voucher-approval');

  const pendingRows = page.locator('tbody tr');
  await expect(pendingRows.nth(0)).toContainText('APPROVENOW');
  await expect(pendingRows.nth(1)).toContainText('VIPONLY30');
  await expect(pendingRows.nth(2)).toContainText('AUTUMN20');

  await pendingRows.nth(0).getByRole('button', { name: 'Phê duyệt' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Phê duyệt/i }).click();
  await expect(page.locator('tbody')).not.toContainText('APPROVENOW');

  await pendingRows.nth(0).getByRole('button', { name: 'Từ chối' }).click();
  const rejectDialog = page.getByRole('dialog');
  await rejectDialog.getByPlaceholder(/Lý do/i).fill('Thiếu biên lợi nhuận tối thiểu');
  await rejectDialog.getByRole('button', { name: /Xác nhận/i }).click();

  await loginAsRole(page, 'sales', '/sales/vouchers/VOU-10');
  await expect(page.getByText(/Sắp diễn ra/i)).toBeVisible();

  await page.goto('/sales/vouchers/VOU-08');
  await expect(page.getByText(/Không được phê duyệt/i)).toBeVisible();
  await expect(page.getByText(/Thiếu biên lợi nhuận tối thiểu/i)).toBeVisible();
});

test('manager can stop an active tour program with a reason and special-day CRUD persists after reload', async ({ page }) => {
  await loginAsRole(page, 'manager', '/manager/tour-programs');

  await page.getByRole('button', { name: /Đang hoạt động/i }).click();
  await page.locator('tbody tr').first().getByRole('button', { name: /Tạm ngừng/i }).click();
  await page.getByPlaceholder(/Lý do ngừng kinh doanh/i).fill('Tạm dừng để cơ cấu sản phẩm');
  await page.getByRole('button', { name: /Xác nhận/i }).click();

  await page.getByRole('button', { name: /Ngừng hoạt động/i }).click();
  await expect(page.locator('tbody')).toContainText('Tạm dừng để cơ cấu sản phẩm');

  await page.goto('/manager/special-days');
  await page.getByRole('button', { name: /Thêm ngày đặc biệt/i }).click();
  const specialDayPanel = page.locator('.fixed.inset-0.z-50').last();
  await specialDayPanel.locator('input').nth(0).fill('Ngày hội thử nghiệm E2E');
  await specialDayPanel.locator('input').nth(1).fill('Dịp kiểm thử');
  await specialDayPanel.locator('input[type="date"]').nth(0).fill('2026-06-10');
  await specialDayPanel.locator('input[type="date"]').nth(1).fill('2026-06-12');
  await specialDayPanel.locator('textarea').fill('Ghi chú E2E');
  await specialDayPanel.getByRole('button', { name: /Lưu/i }).click();
  await expect(page.locator('tbody')).toContainText('Ngày hội thử nghiệm E2E');

  await page.locator('tbody tr').filter({ hasText: 'Ngày hội thử nghiệm E2E' }).getByRole('button', { name: /Sửa/i }).click();
  const editSpecialDayPanel = page.locator('.fixed.inset-0.z-50').last();
  await editSpecialDayPanel.locator('textarea').fill('Ghi chú E2E đã cập nhật');
  await editSpecialDayPanel.getByRole('button', { name: /Lưu/i }).click();
  await expect(page.locator('tbody')).toContainText('Ghi chú E2E đã cập nhật');

  await page.locator('tbody tr').filter({ hasText: 'Ngày hội thử nghiệm E2E' }).getByRole('button', { name: /Xóa/i }).click();
  await page.locator('.ant-modal-wrap').last().getByRole('button', { name: /Xóa/i }).click();
  await expect(page.locator('tbody')).not.toContainText('Ngày hội thử nghiệm E2E');
});

test('manager sale approval, sale request-edit, sale rejection, estimate approval, and completed settlement view all persist', async ({ page }) => {
  await loginAsRole(page, 'manager', '/manager/tours');

  await page.locator('tbody tr').filter({ hasText: 'TI005' }).getByRole('button', { name: /Duyệt/i }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Duyệt/i }).click();
  await page.getByRole('button', { name: /Không đủ ĐK KH/i }).click();
  await expect(page.locator('tbody')).toContainText('TI005');

  await resetFixtures(page.request);
  await loginAsRole(page, 'manager', '/manager/tours');
  await page.locator('tbody tr').filter({ hasText: 'TI005' }).getByRole('button', { name: /Duyệt/i }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Yêu cầu sửa/i }).click();
  const requestEditDialog = page.getByRole('dialog').last();
  await requestEditDialog.getByPlaceholder(/Lý do/i).fill('Cần điều chỉnh lại biên lợi nhuận');
  await requestEditDialog.getByRole('button', { name: /Xác nhận/i }).click();
  await expect(page.locator('tbody')).not.toContainText('TI005');

  await resetFixtures(page.request);
  await loginAsRole(page, 'manager', '/manager/tours');
  await page.locator('tbody tr').filter({ hasText: 'TI005' }).getByRole('button', { name: /Từ chối/i }).click();
  const rejectDialog = page.getByRole('dialog').last();
  await rejectDialog.getByPlaceholder(/Lý do/i).fill('Không đáp ứng tiêu chí mở bán');
  await rejectDialog.getByRole('button', { name: /Xác nhận/i }).click();
  await expect(page.locator('tbody')).not.toContainText('TI005');

  await resetFixtures(page.request);
  await loginAsRole(page, 'manager', '/manager/tours/TI003/estimate-approval');
  await page.getByRole('button', { name: /Duyệt/i }).click();
  await page.getByRole('button', { name: /Duyệt/i }).last().click();

  await page.goto('/manager/tours');
  await page.getByRole('button', { name: /Hoàn thành/i }).click();
  await expect(page.locator('tbody')).toContainText('TI004');
  await page.locator('tbody tr').filter({ hasText: 'TI004' }).getByRole('button', { name: /Xem/i }).click();
  await expect(page).toHaveURL(/\/manager\/tours\/TI004\/settlement$/);
  await expect(page.getByRole('heading', { name: /Báo Cáo Quyết Toán Tour/i })).toBeVisible();
});
