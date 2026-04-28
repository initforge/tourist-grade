import crypto from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { loginAsRole } from './support/auth';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const halongTourPath = '/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao';
const payosChecksumKey = 'a0a7d4538af3a6e44e5fd70273b1653855eaedbec579688d28e0d4864d93e972';

async function resetFixtures(request: APIRequestContext) {
  const response = await request.post(`${apiBase}/dev/reset-booking-fixtures`);
  expect(response.ok()).toBeTruthy();
}

async function getAccessToken(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('__travela_auth_tokens');
    return raw ? JSON.parse(raw).accessToken as string : '';
  });
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
      const items = await getEmailOutbox(request, options);
      return items.length;
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBeGreaterThan(0);

  return getEmailOutbox(request, options);
}

async function getWishlist(request: APIRequestContext, accessToken: string) {
  const response = await request.get(`${apiBase}/wishlist`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.wishlist as Array<{ tourId: string }>;
}

async function getBooking(request: APIRequestContext, accessToken: string, bookingId: string) {
  const response = await request.get(`${apiBase}/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.booking as Record<string, unknown>;
}

function createPayOSWebhookSignature(data: Record<string, string | number>) {
  const query = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('&');

  return crypto.createHmac('sha256', payosChecksumKey).update(query).digest('hex');
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ request }) => {
  await resetFixtures(request);
});

test('customer public surfaces hide lookup for logged-in users, persist wishlist, keep sticky booking card, and show DB-backed tour data', async ({ page }) => {
  await loginAsRole(page, 'customer', '/');
  const accessToken = await getAccessToken(page);

  await expect(page.getByRole('link', { name: /Tra cứu/i })).toHaveCount(0);

  await page.goto('/booking/lookup');
  await expect(page).toHaveURL(/\/customer\/bookings$/);

  await page.goto(halongTourPath);
  await page.waitForLoadState('domcontentloaded');

  const primaryImage = page.locator('main section').first().locator('button').first();
  await primaryImage.click();
  await expect(page.getByLabel(/Đóng xem ảnh/i)).toBeVisible();
  await page.locator('.fixed.inset-0.z-50 button').nth(1).click();
  await expect(page.getByLabel(/Đóng xem ảnh/i)).toHaveCount(0);

  const stickyMeta = await page.getByRole('button', { name: /Đặt ngay/i }).evaluate((button) => {
    let current: HTMLElement | null = button.parentElement;
    while (current && getComputedStyle(current).position !== 'sticky') {
      current = current.parentElement;
    }

    if (!current) {
      return null;
    }

    const style = getComputedStyle(current);
    return {
      position: style.position,
      top: style.top,
    };
  });
  expect(stickyMeta?.position).toBe('sticky');
  expect(stickyMeta?.top).not.toBe('auto');

  const scheduleRows = page.locator('#tour-schedule-table tbody tr');
  await expect(scheduleRows).toHaveCount(2);
  const remainingSeatTexts = await scheduleRows.locator('td:nth-child(8)').allInnerTexts();
  for (const seatText of remainingSeatTexts) {
    const [available] = seatText.split('/');
    expect(Number.parseInt(available, 10)).toBeGreaterThan(0);
  }
  await expect(scheduleRows.first()).toContainText('TP001 - TI010');
  await expect(page.getByRole('heading', { name: /Tour liên quan/i })).toBeVisible();

  const wishlistButton = page.getByRole('button', { name: /Đã lưu yêu thích/i });
  await expect(wishlistButton).toBeVisible();
  await wishlistButton.click();
  await expect(page.getByRole('button', { name: /Lưu yêu thích/i })).toBeVisible();
  await expect.poll(async () => {
    const items = await getWishlist(page.request, accessToken);
    return items.some((item) => item.tourId === 'T001');
  }).toBe(false);

  await page.getByRole('button', { name: /Lưu yêu thích/i }).click();
  await expect(page.getByRole('button', { name: /Đã lưu yêu thích/i })).toBeVisible();
  await expect.poll(async () => {
    const items = await getWishlist(page.request, accessToken);
    return items.some((item) => item.tourId === 'T001');
  }).toBe(true);
});

test('customer checkout validates age and phone, applies promo, creates and updates booking draft, disables 50% payment inside 7 days, and can create a PayOS payment request', async ({ page, request }) => {
  await loginAsRole(page, 'customer', `${halongTourPath}/book?scheduleId=DS001-4`);
  const accessToken = await getAccessToken(page);

  await expect(page.getByRole('heading', { name: /Thông tin liên hệ/i })).toBeVisible();

  await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn A');
  await page.getByPlaceholder('0901 234 567').fill('abc');
  await page.getByPlaceholder('email@example.com').fill('nguyenvana@example.com');
  await page.getByRole('button', { name: /Tiếp tục thanh toán/i }).click();
  await expect(page.getByText(/Số điện thoại không hợp lệ/i)).toBeVisible();

  await page.getByPlaceholder('0901 234 567').fill('0901 234 567');
  await page.getByRole('button', { name: /^add$/i }).nth(1).click();
  await expect(page.getByText(/Trẻ em.*2 - 11 tuổi/i)).toBeVisible();

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(0).fill('Nguyễn Văn A');
  await page.locator('input[type="date"]').nth(0).fill('1990-01-01');
  await page.locator('select').filter({ has: page.locator('option', { hasText: 'Việt Nam' }) }).nth(0).selectOption('Việt Nam');
  await page.getByPlaceholder('Số giấy tờ').nth(0).fill('001090123456');

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(1).fill('Bé Thử Nghiệm');
  await page.locator('input[type="date"]').nth(1).fill('1990-01-01');
  await page.getByPlaceholder('Số giấy tờ').nth(1).fill('123');
  await page.getByRole('button', { name: /Tiếp tục thanh toán/i }).click();
  await expect(page.getByText(/Tuổi không phù hợp/i)).toBeVisible();

  await page.locator('input[type="date"]').nth(1).fill('2018-05-01');
  await page.getByPlaceholder('Số giấy tờ').nth(1).fill('123456789012');

  await page.getByPlaceholder('Nhập mã...').fill('TRAVELA10');
  await page.getByRole('button', { name: /Áp dụng/i }).click();
  await expect(page.getByText(/Đã áp dụng TRAVELA10/i)).toBeVisible();

  const createResponsePromise = page.waitForResponse((response) => (
    response.url() === `${apiBase}/bookings/public`
    && response.request().method() === 'POST'
  ));
  await page.getByRole('button', { name: /Tiếp tục thanh toán/i }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const createPayload = await createResponse.json();
  const bookingId = createPayload.booking.id as string;
  const bookingCode = createPayload.booking.bookingCode as string;

  await expect(page.getByRole('heading', { name: /Thanh toán/i })).toBeVisible();
  await expect(page.getByText(/Đã tạo đơn đặt chỗ/i)).toBeVisible();
  await expect(page.getByLabel(/Thanh toán 50%/i)).toBeDisabled();
  await expect(page.getByRole('button', { name: /Thanh toán .*đ/i })).toBeVisible();

  const createdEmails = await expectEmailQueued(request, {
    bookingCode,
    template: 'booking_created',
  });
  expect(createdEmails[0]?.recipient).toBe('nguyenvana@example.com');

  await page.getByRole('button', { name: /Quay lại sửa đơn/i }).click();
  await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn A - cập nhật');
  const updateResponsePromise = page.waitForResponse((response) => (
    response.url() === `${apiBase}/bookings/${bookingId}/checkout`
    && response.request().method() === 'PUT'
  ));
  await page.getByRole('button', { name: /Tiếp tục thanh toán/i }).click();
  const updateResponse = await updateResponsePromise;
  expect(updateResponse.status()).toBe(200);

  const persistedBooking = await getBooking(request, accessToken, bookingId);
  expect(persistedBooking.contactInfo).toMatchObject({
    name: 'Nguyễn Văn A - cập nhật',
    email: 'nguyenvana@example.com',
  });
  expect(persistedBooking.promoCode).toBe('TRAVELA10');

  const payLinkResponse = await request.post(`${apiBase}/payments/bookings/${bookingId}/payos-link`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(payLinkResponse.ok()).toBeTruthy();
  const payLinkPayload = await payLinkResponse.json();
  expect(String(payLinkPayload.paymentLink.checkoutUrl ?? '')).toContain('payos');
});

test('a successful PayOS webhook marks the booking paid and moves it into sales pending confirmation', async ({ page, request }) => {
  const createResponse = await request.post(`${apiBase}/bookings/public`, {
    data: {
      tourSlug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
      scheduleId: 'DS001-2',
      contact: {
        name: 'Webhook Test',
        phone: '0901234567',
        email: 'webhook@test.vn',
        note: '',
      },
      passengers: [
        {
          type: 'adult',
          name: 'Webhook Adult',
          dob: '1990-01-01',
          gender: 'male',
          cccd: '001090123456',
          nationality: 'Việt Nam',
        },
      ],
      roomCounts: { single: 0, double: 1, triple: 0 },
      promoCode: '',
      paymentRatio: 'full',
      paymentMethod: 'bank',
    },
  });
  expect(createResponse.status()).toBe(201);
  const createPayload = await createResponse.json();
  const bookingId = createPayload.booking.id as string;
  const bookingCode = createPayload.booking.bookingCode as string;

  const payLinkResponse = await request.post(`${apiBase}/payments/bookings/${bookingId}/payos-link`);
  expect(payLinkResponse.ok()).toBeTruthy();
  const payLinkPayload = await payLinkResponse.json();
  const paymentLink = payLinkPayload.paymentLink as {
    amount: number;
    orderCode: number;
    paymentLinkId: string;
  };

  const webhookData = {
    orderCode: paymentLink.orderCode,
    amount: paymentLink.amount,
    description: `Webhook ${bookingCode}`,
    accountNumber: '1234567890',
    reference: `PAY-${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: paymentLink.paymentLinkId,
    code: '00',
    desc: 'success',
    counterAccountBankId: 'VCB',
    counterAccountBankName: 'Vietcombank',
    counterAccountName: 'WEBHOOK TEST',
    counterAccountNumber: '1234567890',
    virtualAccountName: 'TRAVELA',
    virtualAccountNumber: '9999999999',
  } satisfies Record<string, string | number>;

  const webhookResponse = await request.post(`${apiBase}/payments/payos/webhook`, {
    data: {
      code: '00',
      desc: 'success',
      success: true,
      data: webhookData,
      signature: createPayOSWebhookSignature(webhookData),
    },
  });
  expect(webhookResponse.ok()).toBeTruthy();

  await loginAsRole(page, 'sales', '/sales/bookings?tab=pending_confirm');
  const pendingRow = page.locator('tbody tr').filter({ hasText: bookingCode });
  await expect(pendingRow).toContainText(/Cần xác nhận đơn đặt|Can xac nhan don dat/i);

  const salesToken = await getAccessToken(page);
  const booking = await getBooking(request, salesToken, bookingId);
  expect(booking.status).toBe('pending');
  expect(booking.paymentStatus).toBe('paid');
  expect(booking.remainingAmount).toBe(0);
});

test('customer history shows upcoming payment notes, auto-cancels unpaid and overdue-deposit bookings, persists reviews to DB/public tour, and displays refund sync from sales', async ({ page, request }) => {
  const unpaidFixture = await request.post(`${apiBase}/dev/unpaid-booking-fixture`, {
    data: { minutesAgo: 20 },
  });
  expect(unpaidFixture.ok()).toBeTruthy();

  await loginAsRole(page, 'customer', '/customer/bookings');
  const accessToken = await getAccessToken(page);

  await expect(page.locator('body')).toContainText('BK-401928');
  await expect(page.locator('body')).toContainText(/Thanh toán phần còn lại trước ngày/i);
  await expect(page.locator('body')).not.toContainText('BK-140014');

  await page.getByRole('button', { name: /Đã hủy/i }).click();
  await expect(page.locator('body')).toContainText('BK-888012');
  await expect(page.locator('body')).toContainText('BK-140014');
  await expect(page.locator('body')).toContainText(/Hoàn thành/i);
  await expect(page.locator('body')).toContainText(/Đã hoàn tiền/i);

  await page.goto('/customer/bookings/B006');
  await expect(page.getByText(/Trạng thái hoàn tiền/i)).toBeVisible();
  await expect(page.getByText(/Đã hoàn tiền/i).first()).toBeVisible();
  await expect(page.getByText(/Số tiền hoàn/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Xem ảnh bill/i })).toBeVisible();

  await page.goto('/customer/bookings');
  await page.getByRole('button', { name: /Đã hoàn thành/i }).click();
  await expect(page.locator('body')).toContainText('BK-130013');
  const reviewedCard = page.locator('div.bg-white').filter({ hasText: 'BK-130013' }).first();
  await reviewedCard.getByRole('button', { name: /Đánh giá tour/i }).click();
  await page.getByLabel(/Tiêu đề/i).fill('Trải nghiệm ổn');
  const reviewComment = `Đánh giá live E2E ${Date.now()}`;
  await page.getByLabel(/Nội dung đánh giá/i).fill(`${reviewComment} với dịch vụ đúng như mô tả.`);
  await page.getByRole('button', { name: /Gửi đánh giá/i }).click();
  await expect(reviewedCard.getByRole('button', { name: /Xem đánh giá/i })).toBeVisible();
  const unreviewedCard = page.locator('div.bg-white').filter({ hasText: 'BK-291045' }).first();
  await expect(unreviewedCard.getByRole('button', { name: /Đánh giá tour/i })).toBeVisible();

  await expect.poll(async () => {
    const response = await request.get(`${apiBase}/public/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao`);
    const payload = await response.json();
    return (payload.tour.reviews as Array<{ comment: string }>).some((review) => review.comment.includes(reviewComment));
  }).toBe(true);

  const reviewedBooking = await getBooking(request, accessToken, 'B013');
  expect((reviewedBooking.review as Record<string, unknown>)?.comment).toEqual(expect.stringContaining(reviewComment));
});

test('customer can submit a cancel request, persist bank info, and queue cancellation email', async ({ page, request }) => {
  await loginAsRole(page, 'customer', '/customer/bookings/B001');
  const accessToken = await getAccessToken(page);

  await page.getByRole('button', { name: /Yêu cầu hủy tour/i }).click();
  const dialog = page.getByRole('dialog', { name: /Gửi yêu cầu hủy/i });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Vietcombank').fill('BIDV');
  await dialog.getByPlaceholder('1234567890').fill('9876543210');
  await dialog.getByPlaceholder('NGUYEN VAN A').fill('NGUYEN VAN A');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: /Gửi yêu cầu hủy/i }).click();

  await expect(page.getByText(/Đã gửi yêu cầu hủy/i)).toBeVisible();

  const booking = await getBooking(request, accessToken, 'B001');
  expect(booking.status).toBe('pending_cancel');
  expect(booking.bankInfo).toMatchObject({
    bankName: 'BIDV',
    accountNumber: '9876543210',
    accountHolder: 'NGUYEN VAN A',
  });

  const emails = await expectEmailQueued(request, {
    bookingCode: 'BK-582910',
    template: 'booking_cancel_requested',
  });
  expect(emails[0]?.recipient).toBe('nguyenvana@gmail.com');
});
