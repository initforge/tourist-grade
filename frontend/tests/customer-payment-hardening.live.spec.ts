import crypto from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { loginAsRole } from './support/auth';

const apiBase = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const tourPath = '/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao';
const payosChecksumKey = 'a0a7d4538af3a6e44e5fd70273b1653855eaedbec579688d28e0d4864d93e972';

type CreatedBooking = {
  id: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
};

function createPayOSWebhookSignature(data: Record<string, string | number>) {
  const query = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('&');

  return crypto.createHmac('sha256', payosChecksumKey).update(query).digest('hex');
}

function buildAdultPassenger(index: number) {
  return {
    type: 'adult',
    name: `Khach ${index + 1}`,
    dob: '1990-01-01',
    gender: index % 2 === 0 ? 'male' : 'female',
    cccd: `0010901234${String(index).padStart(2, '0')}`,
    nationality: 'Việt Nam',
  };
}

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
  options: { bookingCode: string; template: string },
) {
  const query = new URLSearchParams(options);
  const response = await request.get(`${apiBase}/dev/email-outbox?${query.toString()}`);
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.emails as Array<{
    template: string;
    recipient: string;
    bookingCode: string | null;
    payload: Record<string, unknown>;
  }>;
}

async function getBooking(request: APIRequestContext, accessToken: string, bookingId: string) {
  const response = await request.get(`${apiBase}/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.booking as Record<string, unknown>;
}

async function createBooking(
  request: APIRequestContext,
  accessToken: string,
  scheduleId: string,
  passengers: Array<ReturnType<typeof buildAdultPassenger>>,
  contactSuffix: string,
) {
  const numericSuffix = contactSuffix.replace(/\D/g, '').slice(-4).padStart(4, '0');
  const response = await request.post(`${apiBase}/bookings/public`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      tourSlug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
      scheduleId,
      contact: {
        name: `Khach ${contactSuffix}`,
        phone: `0901${numericSuffix}56`,
        email: `khach-${contactSuffix}@test.vn`,
        note: '',
      },
      passengers,
      roomCounts: { single: 0, double: 1, triple: 0 },
      promoCode: '',
      paymentRatio: 'full',
      paymentMethod: 'bank',
    },
  });
  expect(response.status()).toBe(201);
  const payload = await response.json();
  return payload.booking as CreatedBooking;
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ request }) => {
  await resetFixtures(request);
});

test('successful PayOS payment keeps booking status pending, marks it paid, and queues payment email', async ({ page, request }) => {
  await loginAsRole(page, 'customer', '/');
  const customerToken = await getAccessToken(page);

  const booking = await createBooking(request, customerToken, 'DS001-2', [buildAdultPassenger(0)], 'pay');
  expect(booking.status).toBe('pending');
  expect(booking.paymentStatus).toBe('unpaid');

  const payLinkResponse = await request.post(`${apiBase}/payments/bookings/${booking.id}/payos-link`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  expect(payLinkResponse.ok()).toBeTruthy();
  const payLinkPayload = await payLinkResponse.json();

  const webhookData = {
    orderCode: payLinkPayload.paymentLink.orderCode as number,
    amount: payLinkPayload.paymentLink.amount as number,
    description: `Thanh toan ${booking.bookingCode}`,
    accountNumber: '1234567890',
    reference: `PAY-${Date.now()}`,
    transactionDateTime: new Date().toISOString(),
    currency: 'VND',
    paymentLinkId: payLinkPayload.paymentLink.paymentLinkId as string,
    code: '00',
    desc: 'success',
    counterAccountBankId: 'VCB',
    counterAccountBankName: 'Vietcombank',
    counterAccountName: 'PAY TEST',
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

  await expect
    .poll(async () => {
      const items = await getEmailOutbox(request, {
        bookingCode: booking.bookingCode,
        template: 'booking_payment_received',
      });
      return items.length;
    }, { timeout: 15000, intervals: [500, 1000, 2000] })
    .toBeGreaterThan(0);

  const persistedBooking = await getBooking(request, customerToken, booking.id);
  expect(persistedBooking.status).toBe('pending');
  expect(persistedBooking.paymentStatus).toBe('paid');
  expect(persistedBooking.remainingAmount).toBe(0);

  await loginAsRole(page, 'sales', '/sales/bookings?tab=pending_confirm');
  const row = page.locator('tbody tr').filter({ hasText: booking.bookingCode });
  await expect(row).toBeVisible();
  await expect(row).toContainText(/Cần xác nhận đơn đặt/i);
});

test('editing a held booking can increase passenger count up to remaining seats plus the booking own seats', async ({ page, request }) => {
  await loginAsRole(page, 'customer', '/');
  const customerToken = await getAccessToken(page);

  const publicToursResponse = await request.get(`${apiBase}/public/tours`);
  expect(publicToursResponse.ok()).toBeTruthy();
  const publicToursPayload = await publicToursResponse.json();
  const halongTour = (publicToursPayload.tours as Array<{ slug: string; departureSchedule: Array<{ id: string; availableSeats: number }> }>)
    .find((tour) => tour.slug === 'kham-pha-vinh-ha-long-du-thuyen-5-sao');
  const schedule = halongTour?.departureSchedule.find((item) => item.availableSeats >= 3)
    ?? halongTour?.departureSchedule.find((item) => item.availableSeats >= 2);
  expect(schedule).toBeTruthy();

  const initialAvailable = schedule!.availableSeats;
  const targetBooking = await createBooking(request, customerToken, schedule!.id, [buildAdultPassenger(0)], 'edit1');
  const fillerPassengerCount = Math.max(initialAvailable - 2, 0);
  if (fillerPassengerCount > 0) {
    await createBooking(
      request,
      customerToken,
      schedule!.id,
      Array.from({ length: fillerPassengerCount }, (_, index) => buildAdultPassenger(index + 1)),
      'fill1',
    );
  }

  await page.goto(`${tourPath}/book?scheduleId=${encodeURIComponent(schedule!.id)}&bookingId=${encodeURIComponent(targetBooking.id)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => null);

  await expect(page.locator('body')).toContainText('Còn 2 chỗ trống');

  await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Xuân Mai');
  await page.getByPlaceholder('0901 234 567').fill('0834948714');
  await page.getByPlaceholder('email@example.com').fill('maidvt1401@gmail.com');

  await page.getByRole('button', { name: /^add$/i }).nth(0).click();

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(0).fill('Nguyễn Xuân Mai');
  await page.locator('input[type="date"]').nth(0).fill('1990-01-01');
  await page.getByPlaceholder('Số giấy tờ').nth(0).fill('001090123456');

  await page.getByPlaceholder('Đúng theo CCCD/Passport').nth(1).fill('Mai Test 2');
  await page.locator('input[type="date"]').nth(1).fill('1991-02-02');
  await page.getByPlaceholder('Số giấy tờ').nth(1).fill('001091123456');

  const updateResponse = await request.put(`${apiBase}/bookings/${targetBooking.id}/checkout`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    data: {
      scheduleId: schedule!.id,
      contact: {
        name: 'Nguyễn Xuân Mai',
        phone: '0834948714',
        email: 'maidvt1401@gmail.com',
        note: '',
      },
      passengers: [
        {
          type: 'adult',
          name: 'Nguyễn Xuân Mai',
          dob: '1990-01-01',
          gender: 'male',
          cccd: '001090123456',
          nationality: 'Việt Nam',
        },
        {
          type: 'adult',
          name: 'Mai Test 2',
          dob: '1991-02-02',
          gender: 'female',
          cccd: '001091123456',
          nationality: 'Việt Nam',
        },
      ],
      roomCounts: { single: 0, double: 1, triple: 0 },
      promoCode: '',
      paymentRatio: 'full',
      paymentMethod: 'bank',
    },
  });
  expect(updateResponse.status()).toBe(200);

  const persistedBooking = await getBooking(request, customerToken, targetBooking.id);
  expect(persistedBooking.passengers).toHaveLength(2);
  expect(persistedBooking.status).toBe('pending');
});
