import { expect, test, type Page } from '@playwright/test';

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

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function nextWeekdayFrom(base: Date, weekday: number) {
  const next = new Date(base);
  while (next.getDay() !== weekday) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function buildTourRulesBootstrap() {
  const now = new Date();
  const warningNearest = nextWeekdayFrom(addDays(now, 40), 1);
  const warningFarthest = addDays(warningNearest, 14);
  const warningNextAfterFarthest = addDays(warningFarthest, 7);
  const warningOlderNearest = nextWeekdayFrom(addDays(now, 45), 4);
  const warningOlderFarthest = addDays(warningOlderNearest, 7);

  const enoughNearest = nextWeekdayFrom(addDays(now, 35), 2);
  const enoughFarthest = addDays(enoughNearest, 63);
  const editRequestDate = addDays(enoughNearest, 7);
  const enoughOlderNearest = nextWeekdayFrom(addDays(now, 33), 5);
  const enoughOlderFarthest = addDays(enoughOlderNearest, 35);

  const programs = [
    {
      id: 'TP-WARN',
      name: 'Tour cảnh báo mở bán',
      departurePoint: 'Hà Nội',
      sightseeingSpots: ['Đà Nẵng'],
      duration: { days: 3, nights: 2 },
      transport: 'xe',
      tourType: 'quanh_nam',
      routeDescription: 'Rule warning',
      weekdays: ['t2'],
      yearRoundStartDate: toDateKey(warningNearest),
      yearRoundEndDate: toDateKey(addMonths(warningFarthest, 2)),
      coverageMonths: 3,
      bookingDeadline: 7,
      status: 'active',
      itinerary: [],
      pricingConfig: {
        profitMargin: 15,
        taxRate: 10,
        otherCostFactor: 15,
        netPrice: 2123456,
        sellPriceAdult: 2654321,
        sellPriceChild: 1990000,
        sellPriceInfant: 0,
        minParticipants: 20,
      },
      createdBy: 'Điều phối A',
      createdAt: toDateKey(addDays(now, -20)),
      updatedAt: toDateKey(addDays(now, -5)),
    },
    {
      id: 'TP-ENOUGH',
      name: 'Tour đã đủ mở bán',
      departurePoint: 'Hồ Chí Minh',
      sightseeingSpots: ['Phú Yên'],
      duration: { days: 4, nights: 3 },
      transport: 'xe',
      tourType: 'quanh_nam',
      routeDescription: 'Rule enough',
      weekdays: ['t3'],
      yearRoundStartDate: toDateKey(enoughNearest),
      yearRoundEndDate: toDateKey(addMonths(enoughFarthest, 1)),
      coverageMonths: 1,
      bookingDeadline: 10,
      status: 'active',
      itinerary: [],
      pricingConfig: {
        profitMargin: 12,
        taxRate: 10,
        otherCostFactor: 15,
        netPrice: 1899000,
        sellPriceAdult: 2299000,
        sellPriceChild: 1724000,
        sellPriceInfant: 0,
        minParticipants: 18,
      },
      createdBy: 'Điều phối B',
      createdAt: toDateKey(addDays(now, -25)),
      updatedAt: toDateKey(addDays(now, -6)),
    },
    {
      id: 'TP-WARN-OLDER',
      name: 'Tour cảnh báo cũ hơn',
      departurePoint: 'Hà Nội',
      sightseeingSpots: ['Quảng Ninh'],
      duration: { days: 2, nights: 1 },
      transport: 'xe',
      tourType: 'quanh_nam',
      routeDescription: 'Rule warning older',
      weekdays: ['t5'],
      yearRoundStartDate: toDateKey(warningOlderNearest),
      yearRoundEndDate: toDateKey(addMonths(warningOlderFarthest, 2)),
      coverageMonths: 2,
      bookingDeadline: 5,
      status: 'active',
      itinerary: [],
      pricingConfig: {
        profitMargin: 10,
        taxRate: 10,
        otherCostFactor: 15,
        netPrice: 1555000,
        sellPriceAdult: 1888000,
        sellPriceChild: 1416000,
        sellPriceInfant: 0,
        minParticipants: 16,
      },
      createdBy: 'Điều phối C',
      createdAt: toDateKey(addDays(now, -30)),
      updatedAt: toDateKey(addDays(now, -7)),
    },
    {
      id: 'TP-ENOUGH-OLDER',
      name: 'Tour đã đủ cũ hơn',
      departurePoint: 'Cần Thơ',
      sightseeingSpots: ['Khánh Hòa'],
      duration: { days: 3, nights: 2 },
      transport: 'xe',
      tourType: 'quanh_nam',
      routeDescription: 'Rule enough older',
      weekdays: ['t6'],
      yearRoundStartDate: toDateKey(enoughOlderNearest),
      yearRoundEndDate: toDateKey(addMonths(enoughOlderFarthest, 1)),
      coverageMonths: 1,
      bookingDeadline: 8,
      status: 'active',
      itinerary: [],
      pricingConfig: {
        profitMargin: 11,
        taxRate: 10,
        otherCostFactor: 15,
        netPrice: 1777000,
        sellPriceAdult: 2111000,
        sellPriceChild: 1583000,
        sellPriceInfant: 0,
        minParticipants: 17,
      },
      createdBy: 'Điều phối D',
      createdAt: toDateKey(addDays(now, -28)),
      updatedAt: toDateKey(addDays(now, -9)),
    },
  ] as const;

  const instances = [
    {
      id: 'TI-WARN-1',
      programId: 'TP-WARN',
      programName: 'Tour cảnh báo mở bán',
      departureDate: toDateKey(warningNearest),
      status: 'dang_mo_ban',
      departurePoint: 'Hà Nội',
      sightseeingSpots: ['Đà Nẵng'],
      transport: 'xe',
      expectedGuests: 22,
      priceAdult: 2654000,
      priceChild: 1990000,
      minParticipants: 20,
      bookingDeadline: toDateKey(addDays(warningNearest, -7)),
      createdBy: 'Điều phối A',
      createdAt: toDateKey(addDays(now, -12)),
      warningDate: toDateKey(addDays(now, -10)),
    },
    {
      id: 'TI-WARN-2',
      programId: 'TP-WARN',
      programName: 'Tour cảnh báo mở bán',
      departureDate: toDateKey(warningFarthest),
      status: 'cho_duyet_ban',
      departurePoint: 'Hà Nội',
      sightseeingSpots: ['Đà Nẵng'],
      transport: 'xe',
      expectedGuests: 24,
      priceAdult: 2654000,
      priceChild: 1990000,
      minParticipants: 20,
      bookingDeadline: toDateKey(addDays(warningFarthest, -7)),
      createdBy: 'Điều phối A',
      createdAt: toDateKey(addDays(now, -8)),
      warningDate: toDateKey(addDays(now, -9)),
    },
    {
      id: 'TI-ENOUGH-1',
      programId: 'TP-ENOUGH',
      programName: 'Tour đã đủ mở bán',
      departureDate: toDateKey(enoughNearest),
      status: 'dang_mo_ban',
      departurePoint: 'Hồ Chí Minh',
      sightseeingSpots: ['Phú Yên'],
      transport: 'xe',
      expectedGuests: 20,
      priceAdult: 2299000,
      priceChild: 1724000,
      minParticipants: 18,
      bookingDeadline: toDateKey(addDays(enoughNearest, -10)),
      createdBy: 'Điều phối B',
      createdAt: toDateKey(addDays(now, -15)),
    },
    {
      id: 'TI-ENOUGH-EDIT',
      programId: 'TP-ENOUGH',
      programName: 'Tour đã đủ mở bán',
      departureDate: toDateKey(editRequestDate),
      status: 'yeu_cau_chinh_sua',
      departurePoint: 'Hồ Chí Minh',
      sightseeingSpots: ['Phú Yên'],
      transport: 'xe',
      expectedGuests: 19,
      priceAdult: 2299000,
      priceChild: 1724000,
      minParticipants: 18,
      bookingDeadline: toDateKey(addDays(editRequestDate, -10)),
      createdBy: 'Điều phối B',
      createdAt: toDateKey(addDays(now, -4)),
      cancelReason: 'Quản lý yêu cầu chỉnh lại danh sách tour trùng và kiểm tra giá bán.',
    },
    {
      id: 'TI-ENOUGH-2',
      programId: 'TP-ENOUGH',
      programName: 'Tour đã đủ mở bán',
      departureDate: toDateKey(enoughFarthest),
      status: 'dang_mo_ban',
      departurePoint: 'Hồ Chí Minh',
      sightseeingSpots: ['Phú Yên'],
      transport: 'xe',
      expectedGuests: 25,
      priceAdult: 2299000,
      priceChild: 1724000,
      minParticipants: 18,
      bookingDeadline: toDateKey(addDays(enoughFarthest, -10)),
      createdBy: 'Điều phối B',
      createdAt: toDateKey(addDays(now, -2)),
    },
    {
      id: 'TI-OVERLAP',
      programId: 'TP-ENOUGH',
      programName: 'Tour đã đủ mở bán',
      departureDate: toDateKey(warningNextAfterFarthest),
      status: 'dang_mo_ban',
      departurePoint: 'Hồ Chí Minh',
      sightseeingSpots: ['Phú Yên'],
      transport: 'xe',
      expectedGuests: 21,
      priceAdult: 2299000,
      priceChild: 1724000,
      minParticipants: 18,
      bookingDeadline: toDateKey(addDays(warningNextAfterFarthest, -10)),
      createdBy: 'Điều phối B',
      createdAt: toDateKey(addDays(now, -1)),
    },
    {
      id: 'TI-WARN-OLDER-1',
      programId: 'TP-WARN-OLDER',
      programName: 'Tour cảnh báo cũ hơn',
      departureDate: toDateKey(warningOlderNearest),
      status: 'dang_mo_ban',
      departurePoint: 'Hà Nội',
      sightseeingSpots: ['Quảng Ninh'],
      transport: 'xe',
      expectedGuests: 17,
      priceAdult: 1888000,
      priceChild: 1416000,
      minParticipants: 16,
      bookingDeadline: toDateKey(addDays(warningOlderNearest, -5)),
      createdBy: 'Điều phối C',
      createdAt: toDateKey(addDays(now, -18)),
      warningDate: toDateKey(addDays(now, -20)),
    },
    {
      id: 'TI-WARN-OLDER-2',
      programId: 'TP-WARN-OLDER',
      programName: 'Tour cảnh báo cũ hơn',
      departureDate: toDateKey(warningOlderFarthest),
      status: 'cho_duyet_ban',
      departurePoint: 'Hà Nội',
      sightseeingSpots: ['Quảng Ninh'],
      transport: 'xe',
      expectedGuests: 18,
      priceAdult: 1888000,
      priceChild: 1416000,
      minParticipants: 16,
      bookingDeadline: toDateKey(addDays(warningOlderFarthest, -5)),
      createdBy: 'Điều phối C',
      createdAt: toDateKey(addDays(now, -17)),
      warningDate: toDateKey(addDays(now, -19)),
    },
    {
      id: 'TI-ENOUGH-OLDER-1',
      programId: 'TP-ENOUGH-OLDER',
      programName: 'Tour đã đủ cũ hơn',
      departureDate: toDateKey(enoughOlderNearest),
      status: 'dang_mo_ban',
      departurePoint: 'Cần Thơ',
      sightseeingSpots: ['Khánh Hòa'],
      transport: 'xe',
      expectedGuests: 18,
      priceAdult: 2111000,
      priceChild: 1583000,
      minParticipants: 17,
      bookingDeadline: toDateKey(addDays(enoughOlderNearest, -8)),
      createdBy: 'Điều phối D',
      createdAt: toDateKey(addDays(now, -16)),
    },
    {
      id: 'TI-ENOUGH-OLDER-2',
      programId: 'TP-ENOUGH-OLDER',
      programName: 'Tour đã đủ cũ hơn',
      departureDate: toDateKey(enoughOlderFarthest),
      status: 'dang_mo_ban',
      departurePoint: 'Cần Thơ',
      sightseeingSpots: ['Khánh Hòa'],
      transport: 'xe',
      expectedGuests: 20,
      priceAdult: 2111000,
      priceChild: 1583000,
      minParticipants: 17,
      bookingDeadline: toDateKey(addDays(enoughOlderFarthest, -8)),
      createdBy: 'Điều phối D',
      createdAt: toDateKey(addDays(now, -14)),
    },
  ] as const;

  return {
    users: [coordinatorUser],
    tourPrograms: programs,
    tourInstances: instances,
    suppliers: [],
    services: [],
    guides: [],
    vouchers: [],
    blogs: [],
    tours: [],
    bookings: [],
  };
}

async function mockCoordinatorSession(page: Page, bootstrapPayload: ReturnType<typeof buildTourRulesBootstrap>) {
  const state = JSON.parse(JSON.stringify(bootstrapPayload)) as ReturnType<typeof buildTourRulesBootstrap>;
  let nextRequestSequence = 1;
  const getInstanceIdFromRoute = (routeUrl: string) => {
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

  await page.route('**/tour-instances/*', async route => {
    const method = route.request().method();
    const id = getInstanceIdFromRoute(route.request().url());
    if (method === 'PATCH') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      const index = state.tourInstances.findIndex(instance => instance.id === id);
      if (index < 0) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Not found' }) });
        return;
      }
      const updated = { ...state.tourInstances[index], ...payload, id };
      state.tourInstances[index] = updated;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourInstance: updated }) });
      return;
    }
    if (method === 'DELETE') {
      state.tourInstances = state.tourInstances.filter(instance => instance.id !== id);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return;
    }
    await route.fallback();
  });

  await page.route('**/tour-instances', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const id = typeof payload.id === 'string' && payload.id ? payload.id : `REQ-AUTO-${String(nextRequestSequence).padStart(3, '0')}`;
    nextRequestSequence += 1;
    const created = { ...payload, id };
    state.tourInstances.push(created as (typeof state.tourInstances)[number]);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourInstance: created }) });
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

async function openTourRules(page: Page) {
  const bootstrapPayload = buildTourRulesBootstrap();
  await mockCoordinatorSession(page, bootstrapPayload);
  await page.goto('/coordinator/tour-rules');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => null);
  return bootstrapPayload;
}

test.describe('Coordinator tour rules', () => {
  test('shows the renamed coverage fields, computes statuses, and sorts warning programs first', async ({ page }) => {
    await openTourRules(page);

    await expect(page.getByText('Thời gian mở bán đã tính')).toBeVisible();
    await expect(page.getByText('Thời gian mở bán khả dụng')).toBeVisible();
    await expect(page.getByText('Thời gian mở bán tối thiểu')).toBeVisible();

    const bodyRows = page.locator('tbody tr');
    await expect(bodyRows.nth(0)).toContainText('Tour cảnh báo cũ hơn');
    await expect(bodyRows.nth(1)).toContainText('Tour cảnh báo mở bán');
    await expect(bodyRows.nth(1)).toContainText('0.5 tháng');
    await expect(bodyRows.nth(0)).toContainText('Cảnh báo');
    await expect(bodyRows.nth(2)).toContainText('Tour đã đủ cũ hơn');
    await expect(bodyRows.nth(3)).toContainText('Tour đã đủ mở bán');
    await expect(bodyRows.nth(3)).toContainText('Đã đủ');
  });

  test('uses the create-tour popup rules for default dates, validation, preview refresh, and overlap details', async ({ page }) => {
    const bootstrap = await openTourRules(page);
    const warningRow = page.locator('tbody tr').filter({ hasText: 'Tour cảnh báo mở bán' }).first();
    await warningRow.getByRole('button', { name: 'Tạo tour' }).click();

    const dialog = page.getByRole('dialog');
    const startInput = dialog.locator('input[type="date"]').nth(0);
    const endInput = dialog.locator('input[type="date"]').nth(1);

    const farthestRequested = bootstrap.tourInstances
      .filter(instance => instance.programId === 'TP-WARN')
      .sort((left, right) => left.departureDate.localeCompare(right.departureDate))
      .at(-1)!;
    const minStart = toDateKey(addMonths(new Date(), 1));
    const expectedStart = toDateKey(addDays(new Date(`${farthestRequested.departureDate}T00:00:00`), 7));
    const expectedEnd = toDateKey(addMonths(new Date(`${expectedStart}T00:00:00`), 3));

    await expect(dialog.getByText(/Tóm tắt:/i)).toHaveCount(0);
    await expect(startInput).toHaveValue(expectedStart);
    await expect(startInput).toHaveAttribute('min', minStart);
    await expect(endInput).toHaveValue(expectedEnd);

    const overlapCell = dialog.getByText('1 chương trình trùng thời điểm').first();
    await expect(overlapCell).toBeVisible();
    await expect(overlapCell).toHaveAttribute('title', /Tour đã đủ mở bán/i);

    const tooEarly = toDateKey(addDays(new Date(`${minStart}T00:00:00`), -1));
    await startInput.fill(tooEarly);
    await expect(dialog.getByText('tour phải tạo ít nhất trước 1 tháng')).toBeVisible();

    const laterStart = toDateKey(addDays(new Date(`${expectedEnd}T00:00:00`), 3));
    await startInput.fill(laterStart);
    await expect(endInput).toHaveValue('');
    await expect(dialog.getByText(/Chọn khoảng thời gian hợp lệ để sinh preview tour dự kiến/i)).toBeVisible();

    const nextEnd = toDateKey(endOfMonth(addMonths(new Date(`${laterStart}T00:00:00`), 1)));
    await endInput.fill(nextEnd);
    const nextDeparture = nextWeekdayFrom(new Date(`${laterStart}T00:00:00`), 1);
    await expect(dialog.locator('tbody tr').first()).toContainText(nextDeparture.toLocaleDateString('vi-VN'));

    await startInput.fill('');
    await dialog.getByRole('button', { name: 'Gửi duyệt' }).click();
    await expect(dialog.getByText('Vui lòng chọn Sinh từ ngày')).toBeVisible();
  });

  test('shows manager edit notes in the edit popup and keeps the previously entered dates', async ({ page }) => {
    const bootstrap = await openTourRules(page);
    await page.getByRole('button', { name: /Chờ duyệt bán/i }).click();

    const editRow = page.locator('tbody tr').filter({ hasText: 'TI-ENOUGH-EDIT' }).first();
    await editRow.getByRole('button', { name: 'Sửa' }).click();

    const dialog = page.getByRole('dialog');
    const startInput = dialog.locator('input[type="date"]').nth(0);
    const endInput = dialog.locator('input[type="date"]').nth(1);
    const editInstance = bootstrap.tourInstances.find(instance => instance.id === 'TI-ENOUGH-EDIT')!;

    await expect(dialog.getByText('Yêu cầu chỉnh sửa từ quản lý')).toBeVisible();
    await expect(dialog.getByText(/Quản lý yêu cầu chỉnh lại danh sách tour trùng/i)).toBeVisible();
    await expect(startInput).toHaveValue(editInstance.departureDate);
    await expect(endInput).toHaveValue(toDateKey(addMonths(new Date(`${editInstance.departureDate}T00:00:00`), 1)));
  });

  test('uses end-of-month default for Đã đủ and moves newly generated requests into the pending tab', async ({ page }) => {
    await openTourRules(page);

    const enoughRow = page.locator('tbody tr').filter({ hasText: 'Tour đã đủ mở bán' }).first();
    await enoughRow.getByRole('button', { name: 'Tạo tour' }).click();

    const dialog = page.getByRole('dialog');
    const startInput = dialog.locator('input[type="date"]').nth(0);
    const endInput = dialog.locator('input[type="date"]').nth(1);
    const startValue = await startInput.inputValue();
    const expectedEnd = toDateKey(endOfMonth(addMonths(new Date(`${startValue}T00:00:00`), 1)));

    await expect(endInput).toHaveValue(expectedEnd);
    await dialog.getByRole('button', { name: 'Gửi duyệt' }).click();

    await page.getByRole('button', { name: /Chờ duyệt bán/i }).click();
    await expect(page.locator('tbody tr').filter({ hasText: 'YC-TP-ENOUGH' }).first()).toBeVisible();
  });

  test('creates unchecked preview rows as rejected-sale tours instead of blocking submit', async ({ page }) => {
    await openTourRules(page);
    const createPayloads: Array<{ status?: string; saleRequest?: { unselectedRows?: number } }> = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/tour-instances')) {
        createPayloads.push(request.postDataJSON() as { status?: string; saleRequest?: { unselectedRows?: number } });
      }
    });

    const warningRow = page.locator('tbody tr').filter({ hasText: 'Tour cảnh báo mở bán' }).first();
    await warningRow.getByRole('button', { name: 'Tạo tour' }).click();

    const dialog = page.getByRole('dialog');
    const checkboxes = dialog.locator('tbody input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let index = 0; index < count; index += 1) {
      await checkboxes.nth(index).uncheck();
    }

    await dialog.getByRole('button', { name: 'Gửi duyệt' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(createPayloads.filter(payload => payload.status === 'tu_choi_ban').length).toBe(count);
    expect(Math.max(...createPayloads.map(payload => payload.saleRequest?.unselectedRows ?? 0))).toBe(count);
  });

  test('does not show stop-business action in coordinator active program list', async ({ page }) => {
    const bootstrapPayload = buildTourRulesBootstrap();
    await mockCoordinatorSession(page, bootstrapPayload);
    await page.goto('/coordinator/tour-programs');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle').catch(() => null);

    await page.getByRole('button', { name: /Đang hoạt động/i }).click();
    await expect(page.getByRole('button', { name: /Ngừng kinh doanh/i })).toHaveCount(0);
  });
});
