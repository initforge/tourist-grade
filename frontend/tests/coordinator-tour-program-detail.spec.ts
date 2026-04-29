import { expect, test, type Locator, type Page } from '@playwright/test';

const coordinatorUser = {
  id: 'U-COORDINATOR',
  name: 'Điều phối kiểm thử',
  email: 'coordinator@travela.vn',
  phone: '0900000000',
  role: 'coordinator',
  avatar: '',
  active: true,
} as const;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildBootstrapPayload() {
  const now = new Date();
  const start003 = addDays(now, 42);
  const end003 = addDays(start003, 35);
  const departure003 = toDateKey(start003);

  const start004 = addDays(now, 48);
  const end004 = addDays(start004, 42);

  return {
    users: [coordinatorUser],
    tourPrograms: [
      {
        id: 'TP003',
        name: 'Tour draft bị từ chối',
        departurePoint: 'Hà Nội',
        sightseeingSpots: ['Đà Nẵng'],
        duration: { days: 3, nights: 2 },
        lodgingStandard: '4 sao',
        transport: 'xe',
        tourType: 'quanh_nam',
        routeDescription: 'Bản nháp cần bổ sung lại cấu hình giá.',
        weekdays: ['t2'],
        yearRoundStartDate: toDateKey(start003),
        yearRoundEndDate: toDateKey(end003),
        coverageMonths: 3,
        bookingDeadline: 7,
        status: 'draft',
        rejectionReason: 'Thiếu thông tin giá bán và cần rà lại danh sách ngày khởi hành.',
        approvalStatus: 'rejected',
        itinerary: [
          { day: 1, title: 'Ngày 1', description: 'Ngày 1', meals: ['lunch'], accommodationPoint: 'Đà Nẵng' },
          { day: 2, title: 'Ngày 2', description: 'Ngày 2', meals: ['dinner'], accommodationPoint: 'Đà Nẵng' },
          { day: 3, title: 'Ngày 3', description: 'Ngày 3', meals: [], accommodationPoint: '' },
        ],
        pricingConfig: {
          profitMargin: 15,
          taxRate: 10,
          otherCostFactor: 0.15,
          netPrice: 2517350,
          sellPriceAdult: 2895000,
          sellPriceChild: 2171000,
          sellPriceInfant: 0,
          minParticipants: 25,
        },
        draftPricingTables: {
          transport: [{ optionId: 'transport-van-tai-viet-29', manualPrice: 8100000, isDefault: true }],
          flight: [],
          hotels: {
            'stay-1': [{ optionId: 'hotel-da-nang-4-pearl', isDefault: true }],
          },
          meals: {
            'meal-1-lunch': [{ optionId: 'meal-da-nang-ocean', isDefault: true }],
            'meal-2-dinner': [{ optionId: 'meal-da-nang-ocean', isDefault: true }],
          },
          attractions: {
            'attraction-1': [{ optionId: 'ticket-ba-na', isDefault: true }],
            'attraction-2': [{ optionId: 'ticket-ba-na', isDefault: true }],
            'attraction-3': [{ optionId: 'ticket-ba-na', isDefault: true }],
          },
          otherCosts: [{ optionId: 'other-insurance' }],
        },
        draftManualPricing: { adult: false, child: false, infant: false, singleSupplement: false },
        draftPricingOverrides: { adult: 0, child: 0, infant: 0, singleSupplement: 0 },
        draftPreviewRows: [
          {
            id: 'T001',
            departureDate: departure003,
            endDate: toDateKey(addDays(start003, 2)),
            dayType: 'Ngày thường',
            expectedGuests: 25,
            costPerAdult: 2517000,
            sellPrice: 2895000,
            profitPercent: 15,
            bookingDeadline: toDateKey(addDays(start003, -7)),
            conflictLabel: '0 chương trình trùng thời điểm',
            conflictDetails: [],
            checked: true,
          },
        ],
        createdBy: 'Điều phối A',
        createdAt: toDateKey(addDays(now, -10)),
        updatedAt: toDateKey(addDays(now, -2)),
        submittedAt: toDateKey(addDays(now, -8)),
        rejectedAt: toDateKey(addDays(now, -5)),
      },
      {
        id: 'TP004',
        name: 'Tour ngừng kinh doanh cần gửi lại',
        departurePoint: 'Hồ Chí Minh',
        sightseeingSpots: ['Đà Nẵng'],
        duration: { days: 3, nights: 2 },
        lodgingStandard: '4 sao',
        transport: 'xe',
        tourType: 'quanh_nam',
        routeDescription: 'Tour tạm ngừng và chờ cấu hình lại.',
        weekdays: ['t3'],
        yearRoundStartDate: toDateKey(start004),
        yearRoundEndDate: toDateKey(end004),
        coverageMonths: 2,
        bookingDeadline: 6,
        status: 'inactive',
        inactiveReason: 'Ngừng kinh doanh tạm thời để cập nhật lại cấu hình bán.',
        rejectionReason: 'Quản lý yêu cầu bổ sung ngày khởi hành dự kiến và cấu hình giá.',
        approvalStatus: 'rejected',
        itinerary: [
          { day: 1, title: 'Ngày 1', description: 'Ngày 1', meals: ['lunch'], accommodationPoint: 'Đà Nẵng' },
          { day: 2, title: 'Ngày 2', description: 'Ngày 2', meals: ['dinner'], accommodationPoint: 'Đà Nẵng' },
          { day: 3, title: 'Ngày 3', description: 'Ngày 3', meals: [], accommodationPoint: '' },
        ],
        pricingConfig: {
          profitMargin: 14,
          taxRate: 10,
          otherCostFactor: 0.15,
          netPrice: 2400000,
          sellPriceAdult: 2740000,
          sellPriceChild: 2055000,
          sellPriceInfant: 0,
          minParticipants: 22,
        },
        draftPricingTables: {
          transport: [{ optionId: 'transport-van-tai-viet-29', manualPrice: 7900000, isDefault: true }],
          flight: [],
          hotels: {
            'stay-1': [{ optionId: 'hotel-da-nang-4-pearl', isDefault: true }],
          },
          meals: {
            'meal-1-lunch': [{ optionId: 'meal-da-nang-ocean', isDefault: true }],
            'meal-2-dinner': [{ optionId: 'meal-da-nang-ocean', isDefault: true }],
          },
          attractions: {
            'attraction-1': [{ optionId: 'ticket-ba-na', isDefault: true }],
            'attraction-2': [{ optionId: 'ticket-ba-na', isDefault: true }],
            'attraction-3': [{ optionId: 'ticket-ba-na', isDefault: true }],
          },
          otherCosts: [{ optionId: 'other-insurance' }],
        },
        draftManualPricing: { adult: false, child: false, infant: false, singleSupplement: false },
        draftPricingOverrides: { adult: 0, child: 0, infant: 0, singleSupplement: 0 },
        createdBy: 'Điều phối B',
        createdAt: toDateKey(addDays(now, -12)),
        updatedAt: toDateKey(addDays(now, -3)),
      },
    ],
    tourInstances: [],
    suppliers: [],
    services: [],
    guides: [],
    vouchers: [],
    blogs: [],
    tours: [],
    bookings: [],
  };
}

async function mockCoordinatorSession(page: Page, bootstrapPayload = buildBootstrapPayload()) {
  const state = JSON.parse(JSON.stringify(bootstrapPayload)) as ReturnType<typeof buildBootstrapPayload>;
  let nextProgramId = 5;
  const getProgramIdFromRoute = (routeUrl: string) => {
    const segments = new URL(routeUrl).pathname.split('/').filter(Boolean);
    return segments[segments.length - 1];
  };

  await page.addInitScript(() => {
    localStorage.setItem('__travela_auth_tokens', JSON.stringify({
      accessToken: 'playwright-access-token',
      refreshToken: 'playwright-refresh-token',
    }));
  });

  await page.route('**/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, user: coordinatorUser }),
    });
  });

  await page.route('**/bootstrap', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: state }),
    });
  });

  await page.route('**/tour-programs/*/submit', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const segments = new URL(route.request().url()).pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 2];
    const index = state.tourPrograms.findIndex(program => program.id === id);
    if (index < 0) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Not found' }) });
      return;
    }
    const updated = {
      ...state.tourPrograms[index],
      approvalStatus: 'pending',
      rejectionReason: '',
      submittedAt: toDateKey(new Date()),
    };
    state.tourPrograms[index] = updated;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourProgram: updated }) });
  });

  await page.route('**/tour-programs/*', async route => {
    const method = route.request().method();
    if (method !== 'PATCH') {
      await route.fallback();
      return;
    }
    const id = getProgramIdFromRoute(route.request().url());
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const index = state.tourPrograms.findIndex(program => program.id === id);
    if (index < 0) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Not found' }) });
      return;
    }
    const updated = { ...state.tourPrograms[index], ...payload, id };
    state.tourPrograms[index] = updated;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourProgram: updated }) });
  });

  await page.route('**/tour-programs', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const id = typeof payload.id === 'string' && payload.id ? payload.id : `TP${String(nextProgramId).padStart(3, '0')}`;
    nextProgramId += 1;
    const created = {
      ...payload,
      id,
      approvalStatus: 'draft',
      status: 'draft',
    };
    state.tourPrograms.push(created as (typeof state.tourPrograms)[number]);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourProgram: created }) });
  });

  await page.route('**/public/tours', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, tours: [] }),
    });
  });

  await page.route('**/public/blogs', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, blogs: [] }),
    });
  });
}

function durationSection(page: Page) {
  return page.locator('section').filter({ hasText: /Thời lượng tour/i }).first();
}

function routeSection(page: Page) {
  return page.locator('section').filter({ hasText: /Tên chương trình tour/i }).first();
}

function tourTypeSection(page: Page) {
  return page.locator('section').filter({ hasText: /Loại tour/i }).first();
}

async function addSightseeingSpot(section: Locator, label: string) {
  await section.locator('select').nth(1).selectOption({ label });
}

async function getDateRules(page: Page) {
  return page.evaluate(() => {
    const toKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const addMonths = (date: Date, value: number) => {
      const next = new Date(date);
      next.setMonth(next.getMonth() + value);
      return next;
    };
    const addDays = (date: Date, value: number) => {
      const next = new Date(date);
      next.setDate(next.getDate() + value);
      return next;
    };

    const now = new Date();
    const minimumStart = addMonths(now, 1);
    const validEnd = addDays(minimumStart, 5);
    const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return {
      minimumStart: toKey(minimumStart),
      validEnd: toKey(validEnd),
      weekdayLabel: weekdayLabels[minimumStart.getDay()],
    };
  });
}

async function fillBaseInfo(page: Page, { days, nights }: { days: number; nights: number }) {
  const duration = durationSection(page);
  await duration.locator('input[type="number"]').nth(0).fill(String(days));
  await duration.locator('input[type="number"]').nth(1).fill(String(nights));

  const route = routeSection(page);
  await route.locator('input').first().fill('Tour tạo để test persist');
  await route.locator('select').nth(0).selectOption({ label: 'Hà Nội' });
  await addSightseeingSpot(route, 'Đà Nẵng');
  if (nights > 0) {
    await route.getByLabel('Tiêu chuẩn lưu trú').selectOption({ label: '4 sao' });
  }
  await route.locator('textarea').fill('Mô tả kiểm thử lưu và sửa chương trình tour.');

  const rules = await getDateRules(page);
  const tourType = tourTypeSection(page);
  await tourType.locator('input[type="date"]').nth(0).fill(rules.minimumStart);
  await tourType.locator('input[type="date"]').nth(1).fill(rules.validEnd);
  await page.getByRole('button', { name: rules.weekdayLabel }).click();
}

async function goToStep3(page: Page) {
  await fillBaseInfo(page, { days: 1, nights: 0 });
  await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();

  await page.locator('fieldset input[placeholder^="VD:"]').first().fill('Ngày 1 test');
  await page.locator('fieldset textarea').first().fill('Mô tả ngày 1');
  await page.getByRole('button', { name: /Bữa trưa/i }).first().click();

  await page.getByRole('button', { name: /Tiếp theo: Giá & Cấu hình/i }).click();
}

test.describe('Coordinator tour program persistence and detail edit flow', () => {
  test('persists a created program locally after submit and reopens it in the 4-step edit wizard', async ({ page }) => {
    await mockCoordinatorSession(page);
    await page.goto('/coordinator/tour-programs/create');
    await page.waitForLoadState('networkidle').catch(() => null);

    await goToStep3(page);

    await page.getByLabel(/Thêm nhà cung cấp xe tham quan/i).click();
    await page.getByLabel(/Chọn Vận tải Việt Tourist/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();
    await page.getByLabel(/Đơn giá xe tham quan Vận tải Việt Tourist/i).fill('8100000');

    await page.getByLabel(/Thêm dịch vụ ăn uống cho Ngày 1 - Bữa trưa/i).click();
    await page.getByLabel(/Chọn Set menu miền Trung/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();

    await page.getByLabel(/Thêm vé tham quan cho Ngày 1/i).click();
    await page.getByLabel(/Chọn Vé tham quan Bà Nà Hills/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();
    await page.getByLabel(/Đơn giá hướng dẫn viên/i).fill('400000');

    await page.getByRole('button', { name: /Tiếp theo: Tour dự kiến/i }).click();
    await page.getByRole('button', { name: /^Gửi duyệt$/i }).click();

    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP005$/);
    await expect(page.getByText('Tour tạo để test persist')).toBeVisible();

    await page.getByRole('button', { name: 'Chỉnh sửa' }).click();
    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP005\/edit$/);
    await expect(page.getByText(/Bước 1 \/ 4/i)).toBeVisible();

    await page.getByRole('button', { name: /3.*Giá & Cấu hình/i }).click();
    await expect(page.getByText(/Vận tải Việt Tourist/i)).toBeVisible();
    await expect(page.getByText(/Set menu miền Trung/i)).toBeVisible();
    await expect(page.getByText(/Vé tham quan Bà Nà Hills/i)).toBeVisible();
  });

  test('shows TP003 rejection reason on detail and opens the full edit wizard with saved pricing and planned tours', async ({ page }) => {
    await mockCoordinatorSession(page);
    await page.goto('/coordinator/tour-programs/TP003');
    await page.waitForLoadState('networkidle').catch(() => null);

    await expect(page.getByText(/Lý do từ chối: Thiếu thông tin giá bán/i)).toBeVisible();

    await page.getByRole('button', { name: 'Chỉnh sửa' }).click();
    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP003\/edit$/);
    await expect(page.getByText(/Lý do từ chối: Thiếu thông tin giá bán/i)).toBeVisible();

    await page.getByRole('button', { name: /3.*Giá & Cấu hình/i }).click();
    await expect(page.getByText(/Vận tải Việt Tourist/i)).toBeVisible();
    await expect(page.getByText(/Pearl Beach Hotel/i)).toBeVisible();

    await page.getByRole('button', { name: /4.*Tour dự kiến/i }).click();
    await expect(page.getByText(/Preview danh sách tour/i)).toBeVisible();
    await expect(page.getByText('T001')).toBeVisible();
    await expect(page.getByText(/Chưa có ngày dự kiến/i)).toHaveCount(0);
  });

  test('shows TP004 reasons on detail and opens edit wizard with departure preview, editable pricing, and submit flow', async ({ page }) => {
    await mockCoordinatorSession(page);
    await page.goto('/coordinator/tour-programs/TP004');
    await page.waitForLoadState('networkidle').catch(() => null);

    await expect(page.getByText(/Lý do từ chối: Quản lý yêu cầu bổ sung ngày khởi hành dự kiến/i)).toBeVisible();
    await expect(page.getByText(/Lý do ngừng kinh doanh: Ngừng kinh doanh tạm thời/i)).toBeVisible();

    await page.getByRole('button', { name: 'Chỉnh sửa' }).click();
    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP004\/edit$/);
    await expect(page.getByText(/Danh sách ngày khởi hành dự kiến/i).first()).toBeVisible();

    await page.getByRole('button', { name: /3.*Giá & Cấu hình/i }).click();
    await expect(page.getByLabel(/Đơn giá hướng dẫn viên/i)).toBeEnabled();
    await page.getByLabel(/Đơn giá hướng dẫn viên/i).fill('400000');
    await expect(page.getByText(/Tính toán dự kiến/i)).toBeVisible();

    await page.getByRole('button', { name: /4.*Tour dự kiến/i }).click();
    await expect(page.getByText(/Preview danh sách tour/i)).toBeVisible();
    await expect(page.getByText(/Tóm tắt:/i)).toHaveCount(0);
    await page.getByRole('button', { name: /^Gửi duyệt$/i }).click();

    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP004$/);
    await expect(page.getByText(/Lý do từ chối:/i)).toHaveCount(0);
  });
});
