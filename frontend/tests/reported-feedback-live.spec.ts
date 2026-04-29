import crypto from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { HALONG_TOUR_PATH, loginAs } from './support/app';

const apiBase = 'http://localhost:4000/api/v1';
const payosChecksumKey = 'a0a7d4538af3a6e44e5fd70273b1653855eaedbec579688d28e0d4864d93e972';

function createPayOSWebhookSignature(data: Record<string, string | number>) {
  const sortedEntries = Object.entries(data)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`);
  const query = sortedEntries.join('&');
  return crypto.createHmac('sha256', payosChecksumKey).update(query).digest('hex');
}

async function getAccessToken(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('__travela_auth_tokens');
    return raw ? JSON.parse(raw).accessToken as string : '';
  });
}

async function expectNoMojibake(page: Page) {
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/[ÃÂÄÆÒ]|á»|áº|â€¦|â€”/);
}

test.describe.configure({ mode: 'serial' });

test.describe('Reported feedback live audit', () => {
  test('booking amount stays aligned with UI and successful PayOS payment sends the booking into sales pending confirmation', async ({ page, request }) => {
    const publicToursResponse = await request.get(`${apiBase}/public/tours`);
    expect(publicToursResponse.ok()).toBeTruthy();
    const publicToursPayload = await publicToursResponse.json();
    const halongTour = (publicToursPayload.tours as Array<{ slug: string; departureSchedule?: Array<{ id: string; priceAdult?: number }> }>)
      .find((tour) => tour.slug === 'kham-pha-vinh-ha-long-du-thuyen-5-sao');
    const targetSchedule = halongTour?.departureSchedule?.find((schedule) => String(schedule.id).includes('TI009')) ?? halongTour?.departureSchedule?.[0];
    const scheduleId = targetSchedule?.id ?? '';
    const uiAdultPrice = targetSchedule?.priceAdult ?? 0;
    expect(uiAdultPrice).toBeGreaterThan(0);
    expect(scheduleId).not.toBe('');

    await loginAs(page, 'customer', `${HALONG_TOUR_PATH}/book?scheduleId=${encodeURIComponent(scheduleId)}`, { clearBookings: true });
    const accessToken = await getAccessToken(page);

    const createResponse = await request.post(`${apiBase}/bookings/public`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        tourSlug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
        scheduleId,
        contact: {
          name: 'Audit PayOS',
          phone: '0901234567',
          email: 'audit-payos@test.vn',
          note: '',
        },
        passengers: [
          {
            type: 'adult',
            name: 'Audit PayOS',
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
    const createdPayload = await createResponse.json();
    const bookingId = createdPayload.booking.id as string;
    const bookingCode = createdPayload.booking.bookingCode as string;
    expect(createdPayload.booking.totalAmount).toBe(uiAdultPrice);

    const payLinkResponse = await request.post(`${apiBase}/payments/bookings/${bookingId}/payos-link`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(payLinkResponse.ok()).toBeTruthy();
    const payLinkPayload = await payLinkResponse.json();
    expect(payLinkPayload.paymentLink.amount).toBe(uiAdultPrice);

    const webhookData = {
      orderCode: payLinkPayload.paymentLink.orderCode as number,
      amount: payLinkPayload.paymentLink.amount as number,
      description: `Audit ${bookingCode}`,
      accountNumber: '1234567890',
      reference: `PAY-${Date.now()}`,
      transactionDateTime: new Date().toISOString(),
      currency: 'VND',
      paymentLinkId: payLinkPayload.paymentLink.paymentLinkId as string,
      code: '00',
      desc: 'success',
      counterAccountBankId: 'VCB',
      counterAccountBankName: 'Vietcombank',
      counterAccountName: 'AUDIT PAYOS',
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

    const bookingResponse = await request.get(`${apiBase}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const persistedBooking = await bookingResponse.json();
    expect(persistedBooking.booking.paymentStatus).toBe('paid');
    expect(persistedBooking.booking.paidAmount).toBe(uiAdultPrice);
    expect(persistedBooking.booking.remainingAmount).toBe(0);

    await loginAs(page, 'sales', '/sales/bookings?tab=pending_confirm');
    const pendingRow = page.locator('tbody tr').filter({ hasText: bookingCode });
    await expect(pendingRow).toBeVisible();
    await expect(pendingRow).toContainText(/Chờ xác nhận|Cần xác nhận|pending/i);
  });

  test('tour program create uses DB-backed provinces and DB-backed supplier-service lists, hides lodging point for one sightseeing province, and can submit', async ({ page, request }) => {
    const suffix = Date.now().toString().slice(-6);
    await loginAs(page, 'coordinator', '/coordinator/tour-programs/create', { clearBookings: true });
    const accessToken = await getAccessToken(page);

    const bootstrapResponse = await request.get(`${apiBase}/bootstrap`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const bootstrapPayload = await bootstrapResponse.json();
    const provinceRows = bootstrapPayload.data.provinces as Array<{ name: string; hasAirport: boolean }>;
    expect(provinceRows.some((province) => province.name === 'Quảng Ninh' && province.hasAirport)).toBe(true);

    const durationSection = page.locator('section').filter({ hasText: /Thời lượng tour/i }).first();
    await durationSection.locator('input[type="number"]').nth(0).fill('2');
    await durationSection.locator('input[type="number"]').nth(1).fill('1');

    const routeSection = page.locator('section').filter({ hasText: /Tên chương trình tour/i }).first();
    await routeSection.locator('input').first().fill(`Audit submit ${suffix}`);
    await routeSection.locator('select').nth(0).selectOption({ label: 'Hà Nội' });
    await routeSection.locator('select').nth(1).selectOption({ label: 'Quảng Ninh' });
    await routeSection.getByLabel(/Tiêu chuẩn lưu trú/i).selectOption({ label: '4 sao' });
    await routeSection.locator('textarea').fill('Audit wizard submit with DB-backed data.');

    const startInput = page.getByLabel(/Ngày bắt đầu/i);
    const endInput = page.getByLabel(/Ngày kết thúc/i);
    const startDate = (await startInput.getAttribute('min')) ?? await startInput.inputValue();
    const endDate = new Date(`${startDate}T00:00:00`);
    endDate.setDate(endDate.getDate() + 7);
    await startInput.fill(startDate);
    await endInput.fill(endDate.toISOString().slice(0, 10));
    await page.getByRole('button', { name: /T2|T3|T4|T5|T6|T7|CN/ }).first().click();
    await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();

    await expect(page.getByLabel(/Địa điểm lưu trú/i)).toHaveCount(0);
    await page.locator('fieldset input[placeholder^="VD:"]').nth(0).fill('Ng\u00e0y 1 audit');
    await page.locator('fieldset textarea').nth(0).fill('M\u00f4 t\u1ea3 ng\u00e0y 1');
    await page.getByRole('button', { name: /B\u1eefa tr\u01b0a/i }).nth(0).click();
    await page.locator('fieldset input[placeholder^="VD:"]').nth(1).fill('Ng\u00e0y 2 audit');
    await page.locator('fieldset textarea').nth(1).fill('M\u00f4 t\u1ea3 ng\u00e0y 2');
    await page.getByRole('button', { name: /B\u1eefa t\u1ed1i/i }).nth(1).click();
    await page.getByRole('button', { name: /Ti\u1ebfp theo: Gi\u00e1 & C\u1ea5u h\u00ecnh/i }).click();

    await page.getByRole('button', { name: /Th\u00eam nh\u00e0 cung c\u1ea5p xe tham quan/i }).click();
    let picker = page.getByRole('dialog');
    await expect(picker.getByText(/V\u1eadn t\u1ea3i Xuy\u00ean Vi\u1ec7t/i)).toBeVisible();
    await picker.getByRole('checkbox').first().check();
    await picker.getByRole('button', { name: /Th\u00eam \u0111\u00e3 ch\u1ecdn/i }).click();
    const transportEditableRow = page.locator('tr')
      .filter({ hasText: /Xe tham quan|Xuy\u00ean Vi\u1ec7t|hardening|Xe 45/i })
      .filter({ has: page.locator('input[type="number"]') })
      .first();
    await expect(transportEditableRow).toBeVisible();
    await transportEditableRow.getByRole('spinbutton').fill('8100000');

    await page.getByRole('button', { name: /Th\u00eam kh\u00e1ch s\u1ea1n cho L\u01b0u tr\u00fa - \u0110\u00eam 1/i }).click();
    picker = page.getByRole('dialog');
    await expect(picker.getByText(/Kh\u00e1ch s\u1ea1n Di S\u1ea3n Vi\u1ec7t/i)).toBeVisible();
    await picker.getByRole('checkbox').first().check();
    await picker.getByRole('button', { name: /Th\u00eam \u0111\u00e3 ch\u1ecdn/i }).click();

    await page.getByRole('button', { name: /Th\u00eam d\u1ecbch v\u1ee5 \u0103n u\u1ed1ng cho Ng\u00e0y 1 - B\u1eefa tr\u01b0a/i }).click();
    picker = page.getByRole('dialog');
    await expect(picker.getByText(/H\u1ea1 Long Harbor Dining/i)).toBeVisible();
    await picker.getByRole('checkbox').first().check();
    await picker.getByRole('button', { name: /Th\u00eam \u0111\u00e3 ch\u1ecdn/i }).click();

    await page.getByRole('button', { name: /Th\u00eam d\u1ecbch v\u1ee5 \u0103n u\u1ed1ng cho Ng\u00e0y 2 - B\u1eefa t\u1ed1i/i }).click();
    picker = page.getByRole('dialog');
    await expect(picker.getByRole('checkbox').first()).toBeVisible();
    await picker.getByRole('checkbox').first().check();
    await picker.getByRole('button', { name: /Th\u00eam \u0111\u00e3 ch\u1ecdn/i }).click();

    await page.getByRole('button', { name: /Th\u00eam v\u00e9 tham quan cho Ng\u00e0y 1/i }).click();
    picker = page.getByRole('dialog');
    await expect(picker.getByText(/V\u00e9 tham quan Sun World/i)).toBeVisible();
    await picker.getByRole('checkbox').first().check();
    await picker.getByRole('button', { name: /Th\u00eam \u0111\u00e3 ch\u1ecdn/i }).click();

    await page.getByRole('button', { name: /Th\u00eam v\u00e9 tham quan cho Ng\u00e0y 2/i }).click();
    picker = page.getByRole('dialog');
    const secondTicketOption = picker.getByRole('checkbox').first();
    if (await secondTicketOption.isVisible().catch(() => false)) {
      await secondTicketOption.check();
      await picker.getByRole('button', { name: /Th\u00eam \u0111\u00e3 ch\u1ecdn/i }).click();
    } else {
      await picker.getByRole('button', { name: /H\u1ee7y/i }).click();
    }

    await expect(page.getByText(/Số khách tối thiểu để triển khai/i)).toHaveCount(0);
    await expect(page.getByText(/^Giá trẻ em$/i)).toHaveCount(0);
    await expect(page.getByText(/Giá trẻ sơ sinh/i)).toHaveCount(0);
    await expect(page.getByText(/Phụ phí phòng đơn/i)).toHaveCount(0);

    await page.getByLabel(/Đơn giá hướng dẫn viên/i).fill('1200000');
    await page.getByRole('button', { name: /Tiếp theo: Tour dự kiến/i }).click();
    await page.getByRole('button', { name: /^Gửi duyệt$/i }).click();
    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP\d+$/);
  });

  test('TP003 and TP004 load from backend data on direct visit and open the edit wizard with preview data', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tour-programs/TP003', { clearBookings: true });
    await expect(page.getByText(/L\u00fd do t\u1eeb ch\u1ed1i/i)).toBeVisible();
    await page.getByRole('button', { name: /Ch\u1ec9nh s\u1eeda/i }).click();
    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP003\/edit$/);
    await expect(page.getByRole('button', { name: /^4\s+Tour d\u1ef1 ki\u1ebfn$/i })).toBeVisible();
    await page.getByRole('button', { name: /^4\s+Tour d\u1ef1 ki\u1ebfn$/i }).click();
    await expect(page.getByText(/Preview danh s\u00e1ch tour/i)).toBeVisible();

    await loginAs(page, 'coordinator', '/coordinator/tour-programs/TP004', { clearBookings: false });
    await expect(page.getByText(/L\u00fd do t\u1eeb ch\u1ed1i|L\u00fd do ng\u1eebng/i)).toBeVisible();
    await page.getByRole('button', { name: /Ch\u1ec9nh s\u1eeda/i }).click();
    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP004\/edit$/);
    await expect(page.getByRole('button', { name: /^4\s+Tour d\u1ef1 ki\u1ebfn$/i })).toBeVisible();
    await page.getByRole('button', { name: /^4\s+Tour d\u1ef1 ki\u1ebfn$/i }).click();
    await expect(page.getByText(/Preview danh s\u00e1ch tour/i)).toBeVisible();
  });

  test('reviewing one completed booking keeps review buttons for other completed bookings', async ({ page }) => {
    await loginAs(page, 'customer', '/customer/bookings', { clearBookings: true });
    await page.getByRole('button', { name: /Hoàn thành/i }).click();

    const reviewButtonsBefore = page.getByRole('button', { name: /Đánh giá tour/i });
    const countBefore = await reviewButtonsBefore.count();
    expect(countBefore).toBeGreaterThan(1);

    await reviewButtonsBefore.first().click();
    const reviewComment = `Audit review ${Date.now()}`;
    await page.getByLabel(/Nội dung đánh giá/i).fill(reviewComment);
    await page.getByRole('button', { name: /Gửi đánh giá/i }).click();
    await expect(page.getByRole('heading', { name: /Đánh giá tour/i })).toHaveCount(0);

    await expect(page.getByRole('button', { name: /Xem đánh giá/i })).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Đánh giá tour/i })).toHaveCount(countBefore - 1);
  });

  test('coordinator estimate has clean Vietnamese text and sales dashboard keeps the top-booking layout readable on desktop', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tours/TI009/estimate', { clearBookings: true });
    await expect(page.getByText(/Lập Dự Toán Chi Phí/i)).toBeVisible();
    await expectNoMojibake(page);

    await page.setViewportSize({ width: 1536, height: 864 });
    await loginAs(page, 'sales', '/sales/dashboard', { clearBookings: false });
    await expect(page.getByRole('heading', { name: /Top 5 chương trình tour có số lượt booking nhiều nhất/i })).toBeVisible();

    const topProgramsCard = page.getByRole('heading', { name: /Top 5 chương trình tour có số lượt booking nhiều nhất/i }).locator('..').locator('..');
    const firstRow = topProgramsCard.locator('div').filter({ hasText: /booking/i }).nth(0);
    await expect(firstRow).toBeVisible();

    const hasNoHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
    expect(hasNoHorizontalOverflow).toBe(true);

    const firstRowBox = await firstRow.boundingBox();
    expect(firstRowBox?.width ?? 0).toBeGreaterThan(320);
    const rowText = (await firstRow.innerText()).trim();
    expect(rowText.length).toBeGreaterThan(20);
  });
});
