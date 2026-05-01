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

async function getBooking(request: APIRequestContext, accessToken: string, bookingId: string) {
  const response = await request.get(`${apiBase}/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.booking as Record<string, unknown>;
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

async function getBookingDraftKeys(page: Page) {
  return page.evaluate(() => (
    Object.keys(localStorage).filter((key) => key.startsWith('travela-public-booking-draft'))
  ));
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

  await expect(page.getByRole('link', { name: /Tra cứu/i })).toHaveCount(0);

  await page.goto('/booking/lookup');
  await expect(page).toHaveURL(/\/booking\/lookup$/);

  await page.goto(halongTourPath);
  await page.waitForLoadState('domcontentloaded');

  const primaryImage = page.locator('main section').first().locator('button').first();
  await primaryImage.click();
  const lightbox = page.getByRole('dialog', { name: /Xem ảnh tour/i });
  await expect(lightbox).toBeVisible();
  await lightbox.getByLabel(/Đóng xem ảnh/i).last().click();
  await expect(lightbox).toHaveCount(0);

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
  await expect.poll(async () => scheduleRows.count()).toBeGreaterThanOrEqual(1);
  const remainingSeatTexts = await scheduleRows.locator('td:nth-child(8)').allInnerTexts();
  for (const seatText of remainingSeatTexts) {
    const [available] = seatText.split('/');
    expect(Number.parseInt(available, 10)).toBeGreaterThan(0);
  }
  expect((await scheduleRows.allInnerTexts()).join(' | ')).toContain('TP001 - TI010');
  await expect(page.locator('body')).not.toContainText(/Tour da het han dat|Tour đã hết hạn đặt/i);

  const freshLogin = await page.request.post(`${apiBase}/auth/login`, {
    data: { email: 'customer@travela.vn', password: '123456' },
  });
  expect(freshLogin.ok()).toBeTruthy();
  const freshAuth = await freshLogin.json() as { accessToken: string; refreshToken: string };
  await page.evaluate((tokens) => {
    localStorage.setItem('__travela_auth_tokens', JSON.stringify(tokens));
  }, { accessToken: freshAuth.accessToken, refreshToken: freshAuth.refreshToken });

  const savedWishlistButton = page.getByRole('button', { name: /^(favorite\s*)?Đã lưu yêu thích$/i });
  if (await savedWishlistButton.isVisible().catch(() => false)) {
    const initialRemoveResponse = page.waitForResponse((response) => (
      response.url().includes('/api/v1/wishlist/') && response.request().method() === 'DELETE'
    ));
    await savedWishlistButton.click();
    expect((await initialRemoveResponse).ok()).toBeTruthy();
    await expect(page.getByRole('button', { name: /^(favorite(?:_border)?\s*)?Lưu yêu thích$/i })).toBeVisible();
  } else {
    const wishlistButton = page.getByRole('button', { name: /^(favorite(?:_border)?\s*)?Lưu yêu thích$/i });
    const addWishlistResponse = page.waitForResponse((response) => (
      response.url().endsWith('/api/v1/wishlist') && response.request().method() === 'POST'
    ));
    await expect(wishlistButton).toBeVisible();
    await wishlistButton.click();
    const addWishlistPayload = await (await addWishlistResponse).json() as { item?: { slug?: string } };
    expect(addWishlistPayload.item?.slug).toBe('kham-pha-vinh-ha-long-du-thuyen-5-sao');
    await expect(page.getByRole('button', { name: /^(favorite\s*)?Đã lưu yêu thích$/i })).toBeVisible();
  }
});

test('public landing removes technical clutter and keeps only working search controls', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('body')).not.toContainText('Dữ liệu từ hệ thống');
  await expect(page.locator('body')).not.toContainText('backend local qua API');
  await expect(page.getByText(/^Thời gian$/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Tour hot/i })).toBeVisible();

  await page.getByPlaceholder('Hạ Long, Ninh Thuận, Kyoto...').fill('Hạ Long');
  await page.getByRole('button', { name: /Tìm kiếm tour/i }).click();
  await expect(page).toHaveURL(/\/tours\?q=/);
});

test('public booking lookup can open booking detail without requiring login', async ({ page }) => {
  await page.goto('/booking/lookup');
  await page.getByPlaceholder('VD: BK-582910').fill('BK-394821');
  await page.getByPlaceholder('0988 123 456').fill('0912345678');
  await page.getByRole('button', { name: /Tra cứu thông tin/i }).click();

  await expect(page.getByText('BK-394821')).toBeVisible();
  await page.getByRole('button', { name: /Xem chi tiết/i }).click();

  await expect(page).toHaveURL(/\/booking\/lookup\/BK-394821\?contact=0912345678$/);
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Chi tiết đơn đặt chỗ/i })).toBeVisible();
  await expect(page.locator('body')).toContainText('BK-394821');

  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Chi tiết đơn đặt chỗ/i })).toBeVisible();
  await expect(page.locator('body')).toContainText('BK-394821');
});

test('customer booking detail still requires login outside the public lookup route', async ({ page }) => {
  await page.goto('/customer/bookings/B003');
  await expect(page).toHaveURL(/\/login\?redirect=/);
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
      scheduleId: 'DS001-4',
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

test('customer can open an existing review in read-only mode from history and booking detail without navigation', async ({ page }) => {
  await loginAsRole(page, 'customer', '/customer/bookings');

  await page.getByRole('button', { name: /Đã hoàn thành/i }).click();
  const reviewedCard = page.locator('div.bg-white').filter({ hasText: 'BK-847291' }).first();
  await reviewedCard.getByRole('button', { name: /Xem đánh giá/i }).click();

  await expect(page).toHaveURL(/\/customer\/bookings$/);
  await expect(page.getByRole('heading', { name: /Đánh giá của bạn/i })).toBeVisible();
  await expect(page.locator('input[readonly]')).toHaveValue('Du thuyền sạch, lịch trình gọn');
  await expect(page.locator('textarea[readonly]')).toHaveValue('Lịch trình rõ ràng, du thuyền sạch và đội ngũ chăm sóc đoàn rất kỹ.');
  await expect(page.getByRole('button', { name: /Gửi đánh giá/i })).toHaveCount(0);
  await page.getByRole('button', { name: /^Đóng$/i }).click();
  await expect(page.getByRole('heading', { name: /Đánh giá của bạn/i })).toHaveCount(0);

  await page.goto('/customer/bookings/B004');
  await page.getByRole('button', { name: /Xem đánh giá/i }).click();

  await expect(page).toHaveURL(/\/customer\/bookings\/B004$/);
  await expect(page.getByRole('heading', { name: /Đánh giá của bạn/i })).toBeVisible();
  await expect(page.locator('input[readonly]')).toHaveValue('Du thuyền sạch, lịch trình gọn');
  await expect(page.locator('textarea[readonly]')).toHaveValue('Lịch trình rõ ràng, du thuyền sạch và đội ngũ chăm sóc đoàn rất kỹ.');
  await expect(page.getByRole('button', { name: /Gửi đánh giá/i })).toHaveCount(0);
});

test('customer checkout clears successful draft for a new booking, resets passenger numbering by type, and queues payment email after success', async ({ page, request }) => {
  await loginAsRole(page, 'customer', `${halongTourPath}/book?scheduleId=DS001-4`);
  const accessToken = await getAccessToken(page);
  const uniqueEmail = `checkout-success-${Date.now()}@test.vn`;

  await page.getByPlaceholder('Nguyễn Văn A').fill('Khách Checkout Mới');
  await page.getByPlaceholder('0901 234 567').fill('0901 234 567');
  await page.getByPlaceholder('email@example.com').fill(uniqueEmail);
  await page.getByRole('button', { name: /^add$/i }).nth(1).click();

  await expect(page.getByText(/^Người lớn 1$/)).toBeVisible();
  await expect(page.getByText(/^Trẻ em 1$/)).toBeVisible();

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(0).fill('Người Lớn Một');
  await page.locator('input[type="date"]').nth(0).fill('1990-01-01');
  await page.getByPlaceholder('Số giấy tờ').nth(0).fill('001090123456');

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(1).fill('Trẻ Em Một');
  await page.locator('input[type="date"]').nth(1).fill('2018-05-01');
  await page.getByPlaceholder('Số giấy tờ').nth(1).fill('001118123456');

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

  const payLinkResponse = await request.post(`${apiBase}/payments/bookings/${bookingId}/payos-link`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(payLinkResponse.ok()).toBeTruthy();
  const payLinkPayload = await payLinkResponse.json();

  const webhookData = {
    orderCode: payLinkPayload.paymentLink.orderCode as number,
    amount: payLinkPayload.paymentLink.amount as number,
    description: `Thanh toan ${bookingCode}`,
    accountNumber: '1234567890',
    reference: `PAY-${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: payLinkPayload.paymentLink.paymentLinkId as string,
    code: '00',
    desc: 'success',
    counterAccountBankId: 'VCB',
    counterAccountBankName: 'Vietcombank',
    counterAccountName: 'CHECKOUT SUCCESS',
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

  await page.goto(`${halongTourPath}/book?scheduleId=DS001-4&bookingId=${bookingId}&payos=return`);
  await expect(page.getByRole('heading', { name: /Đặt tour thành công/i })).toBeVisible();
  await expect.poll(async () => getBookingDraftKeys(page)).toEqual([]);

  const emails = await expectEmailQueued(request, {
    bookingCode,
    template: 'booking_payment_received',
  });
  expect(emails[0]?.recipient).toBe(uniqueEmail);

  await page.goto(`${halongTourPath}/book?scheduleId=DS001-4`);
  await expect(page.getByRole('button', { name: /Tiếp tục thanh toán/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Đặt tour thành công/i })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(bookingCode);

  await expect.poll(async () => getBookingDraftKeys(page)).toEqual([]);
});

test('customer checkout keeps real remaining seats and correct promo totals after going back to edit the booking', async ({ page, request }) => {
  const promoValidationResponse = await request.post(`${apiBase}/bookings/promo/validate`, {
    data: {
      tourSlug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
      scheduleId: 'DS001-4',
      promoCode: 'TRAVELA10',
      passengers: [
        {
          type: 'adult',
          name: 'Người Lớn 1',
          dob: '1990-01-01',
          gender: 'male',
          cccd: '001090123456',
          nationality: 'Việt Nam',
        },
        {
          type: 'adult',
          name: 'Người Lớn 2',
          dob: '1992-02-02',
          gender: 'female',
          cccd: '001092123456',
          nationality: 'Việt Nam',
        },
      ],
    },
  });
  expect(promoValidationResponse.ok()).toBeTruthy();
  const promoPayload = await promoValidationResponse.json();
  const expectedTotal = promoPayload.promo.totalAmount as number;

  await loginAsRole(page, 'customer', `${halongTourPath}/book?scheduleId=DS001-4`);
  const initialSeatText = await page.getByText(/Còn \d+ chỗ trống/).textContent();
  const initialVisibleSeats = Number(initialSeatText?.match(/\d+/)?.[0] ?? '0');

  await page.getByPlaceholder('Nguyễn Văn A').fill('Khách Sửa Đơn');
  await page.getByPlaceholder('0901 234 567').fill('0901 234 567');
  await page.getByPlaceholder('email@example.com').fill(`edit-checkout-${Date.now()}@test.vn`);
  await page.getByRole('button', { name: /^add$/i }).nth(0).click();

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(0).fill('Người Lớn 1');
  await page.locator('input[type="date"]').nth(0).fill('1990-01-01');
  await page.getByPlaceholder('Số giấy tờ').nth(0).fill('001090123456');

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(1).fill('Người Lớn 2');
  await page.locator('input[type="date"]').nth(1).fill('1992-02-02');
  await page.getByPlaceholder('Số giấy tờ').nth(1).fill('001092123456');

  await page.getByRole('button', { name: /Tiếp tục thanh toán/i }).click();
  await expect(page.getByRole('heading', { name: /Thanh toán/i })).toBeVisible();

  await page.getByRole('button', { name: /Quay lại sửa đơn/i }).click();
  await expect(page.getByText(`Còn ${initialVisibleSeats} chỗ trống`)).toBeVisible();
  await expect(page.getByText(`Còn ${initialVisibleSeats + 2} chỗ trống`)).toHaveCount(0);

  await page.getByPlaceholder('Nguyễn Văn A').fill('Khách Sửa Đơn Lần 2');
  await page.getByRole('button', { name: /Tiếp tục thanh toán/i }).click();
  await expect(page.getByRole('heading', { name: /Thanh toán/i })).toBeVisible();

  await page.getByPlaceholder('Nhập mã...').fill('TRAVELA10');
  await page.getByRole('button', { name: /Áp dụng/i }).click();
  await expect(page.getByText(/Đã áp dụng TRAVELA10/i)).toBeVisible();
  await expect(page.locator('body')).toContainText(formatMoney(expectedTotal));
  await expect(page.getByText(/Số lượng hành khách không được vượt quá/i)).toHaveCount(0);
});

test('customer can submit a cancel request, persist bank info, and queue cancellation email', async ({ page, request }) => {
  await loginAsRole(page, 'customer', '/customer/bookings/B009');
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

  const booking = await getBooking(request, accessToken, 'B009');
  expect(booking.status).toBe('pending_cancel');
  expect(booking.bankInfo).toMatchObject({
    bankName: 'BIDV',
    accountNumber: '9876543210',
    accountHolder: 'NGUYEN VAN A',
  });

  const emails = await expectEmailQueued(request, {
    bookingCode: 'BK-401928',
    template: 'booking_cancel_requested',
  });
  expect(emails[0]?.recipient).toBe('vuongminhq@gmail.com');
});
