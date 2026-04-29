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

const bootstrapPayload = {
  users: [coordinatorUser],
  tourPrograms: [],
  tourInstances: [],
  suppliers: [],
  services: [],
  guides: [],
  vouchers: [],
  blogs: [],
  tours: [],
  bookings: [],
} as const;

async function mockCoordinatorSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('__travela_auth_tokens', JSON.stringify({
      accessToken: 'playwright-access-token',
      refreshToken: 'playwright-refresh-token',
    }));
  });

  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, user: coordinatorUser }),
    });
  });

  await page.route('**/bootstrap', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: bootstrapPayload }),
    });
  });

  await page.route('**/public/tours', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, tours: [] }),
    });
  });

  await page.route('**/public/blogs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, blogs: [] }),
    });
  });
}

async function openCreateWizard(page: Page) {
  await mockCoordinatorSession(page);
  await page.goto('/coordinator/tour-programs/create');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => null);
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

function transportSection(page: Page) {
  return page.locator('section').filter({ hasText: /^Phương tiện/i }).first();
}

async function addSightseeingSpot(section: Locator, label: string) {
  await section.locator('select').nth(1).selectOption({ label });
}

async function fillRequiredBaseInfo(page: Page) {
  const duration = durationSection(page);
  await duration.locator('input[type="number"]').nth(0).fill('3');
  await duration.locator('input[type="number"]').nth(1).fill('2');

  const route = routeSection(page);
  await route.locator('input').first().fill('Tour kiểm thử điều phối');
  await route.locator('select').nth(0).selectOption({ label: 'Hà Nội' });
  await addSightseeingSpot(route, 'Đà Nẵng');
  await route.getByLabel('Tiêu chuẩn lưu trú').selectOption({ label: '4 sao' });
  await route.locator('textarea').fill('Mô tả kiểm thử cho chương trình tour điều phối.');
}

async function fillBaseInfo(page: Page, { days, nights }: { days: number; nights: number }) {
  const duration = durationSection(page);
  await duration.locator('input[type="number"]').nth(0).fill(String(days));
  await duration.locator('input[type="number"]').nth(1).fill(String(nights));

  const route = routeSection(page);
  await route.locator('input').first().fill('Tour test dieu phoi');
  await route.locator('select').nth(0).selectOption({ index: 1 });
  await addSightseeingSpot(route, 'Đà Nẵng');
  await route.locator('select').nth(2).selectOption({ label: '4 sao' });
  await route.locator('textarea').fill('Mo ta test dieu phoi.');
}

async function goToStep3(page: Page, config: { days: number; nights: number; withMeals?: boolean; withAccommodation?: boolean }) {
  await fillBaseInfo(page, { days: config.days, nights: config.nights });
  const rules = await getDateRules(page);
  const tourType = tourTypeSection(page);
  await tourType.locator('input[type="date"]').nth(0).fill(rules.minimumStart);
  await tourType.locator('input[type="date"]').nth(1).fill(rules.validEnd);
  await page.getByRole('button', { name: 'T2' }).click();
  await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();

  const titleInputs = page.locator('fieldset input[placeholder^="VD:"]');
  const descriptions = page.locator('fieldset textarea');
  const accommodationSelects = page.locator('fieldset select');

  const titleCount = await titleInputs.count();
  for (let index = 0; index < titleCount; index += 1) {
    await titleInputs.nth(index).fill(`Ngay ${index + 1} - Dieu phoi`);
    await descriptions.nth(index).fill(`Mo ta ngay ${index + 1}`);
  }

  if (config.withMeals) {
    await page.getByRole('button', { name: /Bữa trưa/i }).nth(0).click();
  }

  if (config.withAccommodation) {
    const accommodationCount = await accommodationSelects.count();
    for (let index = 0; index < accommodationCount; index += 1) {
      await accommodationSelects.nth(index).selectOption({ label: 'Đà Nẵng' });
    }
  }

  await page.getByRole('button', { name: /Tiếp theo: Giá & Cấu hình/i }).click();
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
    const tooEarlyStart = addDays(minimumStart, -1);
    const validEnd = addDays(minimumStart, 5);
    const laterStart = addDays(validEnd, 2);
    const holidayThreshold = addDays(now, 15);

    return {
      minimumStart: toKey(minimumStart),
      tooEarlyStart: toKey(tooEarlyStart),
      validEnd: toKey(validEnd),
      laterStart: toKey(laterStart),
      holidayThreshold: toKey(holidayThreshold),
    };
  });
}

test.describe('Coordinator create tour program wizard', () => {
  test('starts with only the allowed defaults and validates before leaving the first tab', async ({ page }) => {
    await openCreateWizard(page);

    const duration = durationSection(page);
    await expect(duration.locator('input[type="number"]').nth(0)).toHaveValue('');
    await expect(duration.locator('input[type="number"]').nth(1)).toHaveValue('');

    const route = routeSection(page);
    await expect(route.locator('input').first()).toHaveValue('');
    await expect(route.getByLabel('Tiêu chuẩn lưu trú')).toHaveValue('');
    await expect(route.locator('input[type="number"]')).toHaveValue('7');
    await expect(page.getByLabel(/Máy bay/i)).toHaveCount(0);

    const tourType = tourTypeSection(page);
    await expect(tourType.locator('input[type="number"]')).toHaveValue('3');
    await expect(tourType.getByText(/Danh sách ngày khởi hành dự kiến/i)).toHaveCount(0);

    await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();

    await expect(page.getByText(/Cần bổ sung thông tin trước khi chuyển bước/i)).toBeVisible();
    await expect(page.getByText(/Vui lòng nhập số ngày/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng nhập số đêm/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng nhập tên chương trình tour/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng chọn điểm khởi hành/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng chọn ít nhất một điểm tham quan/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng chọn tiêu chuẩn lưu trú/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng nhập mô tả chương trình tour/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng chọn ngày bắt đầu/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng chọn ngày kết thúc/i).first()).toBeVisible();
    await expect(page.getByText(/Vui lòng chọn ít nhất một ngày khởi hành trong tuần/i).first()).toBeVisible();
    await expect(page.getByText(/Bước 1 \/ 4/i)).toBeVisible();
  });

  test('shows transport only for airport-compatible routes and locks single-airport arrival', async ({ page }) => {
    await openCreateWizard(page);

    const duration = durationSection(page);
    await duration.locator('input[type="number"]').nth(0).fill('3');
    await duration.locator('input[type="number"]').nth(1).fill('2');

    const route = routeSection(page);
    await route.locator('select').nth(0).selectOption({ label: 'Quảng Trị' });
    await addSightseeingSpot(route, 'Đà Nẵng');
    await expect(page.getByLabel(/Máy bay/i)).toHaveCount(0);

    await route.locator('select').nth(0).selectOption({ label: 'Hà Nội' });
    await expect(page.getByLabel(/Máy bay/i)).toBeVisible();

    await page.getByLabel(/Máy bay/i).check();
    const arrivalSelect = page.locator('select').last();
    await expect(arrivalSelect).toHaveValue('Đà Nẵng');
    await expect(arrivalSelect).toBeDisabled();

    await addSightseeingSpot(route, 'Hồ Chí Minh');
    await expect(arrivalSelect).toBeEnabled();

    const arrivalOptions = await arrivalSelect.locator('option').allTextContents();
    expect(arrivalOptions.join(' | ')).toContain('Đà Nẵng');
    expect(arrivalOptions.join(' | ')).toContain('Hồ Chí Minh');
    expect(arrivalOptions.join(' | ')).not.toContain('Quảng Trị');
  });

  test('hides lodging standard for zero-night tours and prevents departure-sightseeing duplication in both selectors', async ({ page }) => {
    await openCreateWizard(page);

    const duration = durationSection(page);
    await duration.locator('input[type="number"]').nth(0).fill('1');
    await duration.locator('input[type="number"]').nth(1).fill('0');

    const route = routeSection(page);
    await expect(route.getByLabel('Tiêu chuẩn lưu trú')).toHaveCount(0);

    await route.locator('input').first().fill('Tour không lưu trú');
    await route.locator('select').nth(0).selectOption({ label: 'Hà Nội' });

    const sightseeingOptions = await route.locator('select').nth(1).locator('option').allTextContents();
    expect(sightseeingOptions.join(' | ')).not.toContain('Hà Nội');

    await addSightseeingSpot(route, 'Đà Nẵng');
    const departureOptions = await route.locator('select').nth(0).locator('option').allTextContents();
    expect(departureOptions.join(' | ')).not.toContain('Đà Nẵng');
  });

  test('enforces year-round date rules, disables end date until start is valid, and hides the preview list until enough data exists', async ({ page }) => {
    await openCreateWizard(page);
    await fillRequiredBaseInfo(page);

    const rules = await getDateRules(page);
    const tourType = tourTypeSection(page);
    const startInput = tourType.locator('input[type="date"]').nth(0);
    const endInput = tourType.locator('input[type="date"]').nth(1);

    await expect(startInput).toHaveValue('');
    await expect(startInput).toHaveAttribute('min', rules.minimumStart);
    await expect(endInput).toBeDisabled();
    await expect(tourType.getByText(/Danh sách ngày khởi hành dự kiến/i)).toHaveCount(0);

    await startInput.fill(rules.tooEarlyStart);
    await expect(tourType.getByText('chương trình tour phải tạo ít nhất trước 1 tháng')).toBeVisible();
    await expect(endInput).toBeDisabled();

    await startInput.fill(rules.minimumStart);
    await expect(endInput).toBeEnabled();
    await expect(endInput).toHaveAttribute('min', rules.minimumStart);

    await endInput.fill(rules.tooEarlyStart);
    await expect(tourType.getByText('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu')).toBeVisible();

    await endInput.fill(rules.validEnd);
    await expect(tourType.getByText(/Danh sách ngày khởi hành dự kiến/i)).toHaveCount(0);

    await page.getByRole('button', { name: 'T2' }).click();
    await expect(tourType.getByText(/Danh sách ngày khởi hành dự kiến/i)).toBeVisible();

    await startInput.fill(rules.laterStart);
    await expect(endInput).toHaveValue('');
  });

  test('shows a sticky month header for year-round preview dates and lets coordinators delete individual projected dates', async ({ page }) => {
    await openCreateWizard(page);
    await fillRequiredBaseInfo(page);

    const rules = await getDateRules(page);
    const tourType = tourTypeSection(page);
    const startInput = tourType.locator('input[type="date"]').nth(0);
    const endInput = tourType.locator('input[type="date"]').nth(1);

    await startInput.fill(rules.minimumStart);
    await endInput.fill(rules.validEnd);
    await page.getByRole('button', { name: 'T2' }).click();

    const removeButtons = page.getByRole('button', { name: /Xóa ngày/i });
    const countBefore = await removeButtons.count();
    expect(countBefore).toBeGreaterThan(0);

    const stickyHeader = tourType.locator('.sticky').first();
    await expect(stickyHeader).toBeVisible();
    const stickyPosition = await stickyHeader.evaluate((node) => getComputedStyle(node).position);
    expect(stickyPosition).toBe('sticky');

    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(countBefore - 1);
  });

  test('limits holiday choices to dates at least half a month ahead', async ({ page }) => {
    await openCreateWizard(page);

    await page.getByLabel(/Mùa lễ/i).check();
    const holidaySelect = page.getByLabel(/Dịp lễ/i);
    const options = await holidaySelect.locator('option').allTextContents();
    const optionText = options.join(' | ');

    expect(optionText).toContain('Giá Sinh');
    expect(optionText).not.toContain('Giải phóng Miền Nam');
    expect(optionText).not.toContain('Quốc tế Lao động');
  });
  test('starts pricing with only insurance and blocks moving on until providers are selected explicitly', async ({ page }) => {
    await openCreateWizard(page);
    await goToStep3(page, { days: 1, nights: 0, withMeals: true, withAccommodation: false });

    await expect(page.getByText(/Bảo hiểm du lịch/i)).toBeVisible();
    await page.getByRole('button', { name: /Tiếp theo: Tour dự kiến/i }).click();

    await expect(page.getByText(/Giá và cấu hình chưa đủ thông tin/i)).toBeVisible();
    await expect(page.getByText(/Xe tham quan chưa có nhà cung cấp/i)).toBeVisible();
    await expect(page.getByText(/Ngày 1 - Bữa trưa chưa có dịch vụ ăn uống/i)).toBeVisible();
    await expect(page.getByText(/Ngày 1 chưa có vé tham quan/i)).toBeVisible();
  });

  test('uses popup selectors for pricing rows and shows readonly projected-tour dates', async ({ page }) => {
    await openCreateWizard(page);
    await goToStep3(page, { days: 1, nights: 0, withMeals: true, withAccommodation: false });

    await page.getByLabel(/Thêm nhà cung cấp xe tham quan/i).click();
    await page.getByLabel(/Chọn Vận tải Việt Tourist/i).check();
    await page.getByLabel(/Chọn Hoàng Gia Travel Bus/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();
    await expect(page.getByText(/Vận tải Việt Tourist/i)).toBeVisible();
    await expect(page.getByText(/Hoàng Gia Travel Bus/i)).toBeVisible();
    await page.getByLabel(/Đơn giá xe tham quan Vận tải Việt Tourist/i).fill('8100000');

    await page.getByLabel(/Thêm dịch vụ ăn uống cho Ngày 1 - Bữa trưa/i).click();
    await page.getByLabel(/Chọn Set menu miền Trung/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();

    await page.getByLabel(/Thêm vé tham quan cho Ngày 1/i).click();
    await page.getByLabel(/Chọn Vé tham quan Bà Nà Hills/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();

    await page.getByRole('button', { name: /Tiếp theo: Tour dự kiến/i }).click();

    await expect(page.getByRole('heading', { name: /Tour dự kiến/i })).toBeVisible();
    await expect(page.locator('table input[type="date"]')).toHaveCount(0);
    await expect(page.getByText(/Tóm tắt:/i)).toHaveCount(0);
  });

  test('filters hotel popup by lodging standard and itinerary accommodation point', async ({ page }) => {
    await openCreateWizard(page);
    await goToStep3(page, { days: 3, nights: 2, withMeals: true, withAccommodation: true });

    await page.getByLabel(/Thêm khách sạn cho Lưu trú - Đêm 1, 2/i).click();
    await expect(page.getByText(/Pearl Beach Hotel/i)).toBeVisible();
    await expect(page.getByText(/Riviera Đà Nẵng/i)).toBeVisible();
    await expect(page.getByText(/Old Quarter Central/i)).toHaveCount(0);
  });

  test('applies the updated projected-pricing formulas for net price, sell price, infant default, minimum guests, and single-room supplement', async ({ page }) => {
    await openCreateWizard(page);
    await goToStep3(page, { days: 3, nights: 2, withMeals: true, withAccommodation: true });

    await page.getByLabel(/Thêm nhà cung cấp xe tham quan/i).click();
    await page.getByLabel(/Chọn Vận tải Việt Tourist/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();
    await page.getByLabel(/Đơn giá xe tham quan Vận tải Việt Tourist/i).fill('8100000');

    await page.getByLabel(/Thêm khách sạn cho Lưu trú - Đêm 1, 2/i).click();
    await page.getByLabel(/Chọn Pearl Beach Hotel/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();

    await page.getByLabel(/Thêm dịch vụ ăn uống cho Ngày 1 - Bữa trưa/i).click();
    await page.getByLabel(/Chọn Set menu miền Trung/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();

    await page.getByLabel(/Thêm vé tham quan cho Ngày 1/i).click();
    await page.getByLabel(/Chọn Vé tham quan Bà Nà Hills/i).check();
    await page.getByRole('button', { name: /Thêm đã chọn/i }).click();

    const pricingSummary = page.locator('section').filter({ hasText: /Tính toán dự kiến/i }).first();
    const infantPriceBox = pricingSummary.locator('div.space-y-2').filter({ hasText: /Giá trẻ sơ sinh/i }).locator('div').last();
    const minimumGuestsBox = pricingSummary.locator('div.space-y-2').filter({ hasText: /Số khách tối thiểu để triển khai/i }).locator('div').last();
    await expect(pricingSummary).toContainText('3.128.000');
    await expect(pricingSummary).toContainText('2.346.000');
    await expect(infantPriceBox).toHaveText('0');
    await expect(pricingSummary).toContainText('1.025.000');
    await expect(pricingSummary).toContainText('2.719.750');
    await expect(pricingSummary).toContainText('15.0%');
    await expect(minimumGuestsBox).toHaveText('7');
  });
});


