import { expect, test, type Page } from '@playwright/test';
import { loginAs } from './support/app';

function uniqueSuffix() {
  return Date.now().toString().slice(-6);
}

async function addFirstPickerOption(page: Page, expectedText?: RegExp) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  if (expectedText) {
    await expect(dialog.getByText(expectedText).first()).toBeVisible();
  }
  const firstCheckbox = dialog.getByRole('checkbox').first();
  await expect(firstCheckbox).toBeVisible();
  await firstCheckbox.check();
  await dialog.getByRole('button', { name: /Thêm đã chọn/i }).click();
  await expect(dialog).toBeHidden();
}

async function selectAllWeekdays(page: Page) {
  await page.locator('button').filter({ hasText: /Ch.n t.t c./i }).click();
  await expect(page.getByRole('button', { name: 'T2' })).toHaveClass(/bg-\[var\(--color-secondary\)\]/);
  await expect(page.getByText(/[1-9]\d* ng.y d./i).first()).toBeVisible();
}

test.describe('Coordinator live E2E against docker stack', () => {
  test('creates and submits a tour program through the real backend', async ({ page }) => {
    const name = `Live coordinator program ${uniqueSuffix()}`;
    await loginAs(page, 'coordinator', '/coordinator/tour-programs/create', { clearBookings: true });

    const duration = page.locator('section').filter({ hasText: /Thời lượng tour/i }).first();
    await duration.locator('input[type="number"]').nth(0).fill('1');
    await duration.locator('input[type="number"]').nth(1).fill('0');

    const route = page.locator('section').filter({ hasText: /Tên chương trình tour/i }).first();
    await route.locator('input').first().fill(name);
    await route.locator('select').nth(0).selectOption({ label: 'Hà Nội' });
    await route.locator('select').nth(1).selectOption({ label: 'Quảng Ninh' });
    await route.getByLabel(/Mô tả/i).fill('Live E2E create program through docker stack.');

    const startInput = page.getByLabel(/Ngày bắt đầu/i);
    const endInput = page.getByLabel(/Ngày kết thúc/i);
    const startDate = (await startInput.getAttribute('min')) ?? await startInput.inputValue();
    const endDate = new Date(`${startDate}T00:00:00`);
    endDate.setDate(endDate.getDate() + 7);
    await startInput.fill(startDate);
    await expect(endInput).toBeEnabled();
    await endInput.fill(endDate.toISOString().slice(0, 10));
    await selectAllWeekdays(page);

    await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();
    await expect(page.getByLabel(/Địa điểm lưu trú/i)).toHaveCount(0);
    await page.locator('fieldset input[placeholder^="VD:"]').nth(0).fill('Ngày 1 live');
    await page.locator('fieldset textarea').nth(0).fill('Mô tả live ngày 1');
    await page.getByRole('button', { name: /Bữa trưa/i }).nth(0).click();

    await page.getByRole('button', { name: /Tiếp theo: Giá & Cấu hình/i }).click();

    await page.getByRole('button', { name: /Thêm nhà cung cấp xe tham quan/i }).click();
    await addFirstPickerOption(page, /Xuyên Việt|hardening/i);
    const transportEditableRow = page.locator('tr')
      .filter({ hasText: /Xuy|hardening|Xe 45/i })
      .filter({ has: page.locator('input[type="number"]') })
      .first();
    await expect(transportEditableRow).toBeVisible();
    await transportEditableRow.getByRole('spinbutton').fill('8100000');
    await page.getByLabel(/Đơn giá hướng dẫn viên/i).fill('1200000');

    await page.getByRole('button', { name: /Thêm dịch vụ ăn uống cho Ngày 1 - Bữa trưa/i }).click();
    await addFirstPickerOption(page);

    await page.getByRole('button', { name: /Thêm vé tham quan cho Ngày 1/i }).click();
    await addFirstPickerOption(page);

    await page.getByRole('button', { name: /Tiếp theo: Tour dự kiến/i }).click();
    await page.getByRole('button', { name: /^Gửi duyệt$/i }).click();

    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP\d+$/);
    await expect(page.getByText(name)).toBeVisible();
  });

  test('keeps zero-night create flow free of lodging fields, blocks duplicate departure spots, and shows a validation toast', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tour-programs/create', { clearBookings: true });

    const duration = page.locator('section').filter({ hasText: /Thời lượng tour/i }).first();
    await duration.locator('input[type="number"]').nth(0).fill('1');
    await duration.locator('input[type="number"]').nth(1).fill('0');

    const route = page.locator('section').filter({ hasText: /Tên chương trình tour/i }).first();
    await route.locator('input').first().fill(`Zero-night validation ${uniqueSuffix()}`);
    await route.locator('select').nth(0).selectOption({ label: 'Hà Nội' });
    await expect(route.getByLabel(/Tiêu chuẩn lưu trú/i)).toHaveCount(0);

    const sightseeingOptions = await route.locator('select').nth(1).locator('option').allTextContents();
    expect(sightseeingOptions.join(' | ')).not.toContain('Hà Nội');

    await route.locator('select').nth(1).selectOption({ label: 'Đà Nẵng' });
    const departureOptions = await route.locator('select').nth(0).locator('option').allTextContents();
    expect(departureOptions.join(' | ')).not.toContain('Đà Nẵng');

    await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();
    await expect(page.getByText(/Cần bổ sung thông tin trước khi chuyển bước/i)).toBeVisible();

    await route.getByLabel(/Mô tả/i).fill('Kiểm tra toast validation và loại bỏ lưu trú cho tour 0 đêm.');
    const startInput = page.getByLabel(/Ngày bắt đầu/i);
    const endInput = page.getByLabel(/Ngày kết thúc/i);
    const startDate = (await startInput.getAttribute('min')) ?? await startInput.inputValue();
    const endDate = new Date(`${startDate}T00:00:00`);
    endDate.setDate(endDate.getDate() + 7);
    await startInput.fill(startDate);
    await endInput.fill(endDate.toISOString().slice(0, 10));
    await selectAllWeekdays(page);

    await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();
    await expect(page.getByLabel(/Địa điểm lưu trú/i)).toHaveCount(0);
  });

  test('shows sticky month headers for year-round departures and lets coordinators remove projected dates', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tour-programs/create', { clearBookings: true });

    const duration = page.locator('section').filter({ hasText: /Thời lượng tour/i }).first();
    await duration.locator('input[type="number"]').nth(0).fill('3');
    await duration.locator('input[type="number"]').nth(1).fill('2');

    const route = page.locator('section').filter({ hasText: /Tên chương trình tour/i }).first();
    await route.locator('input').first().fill(`Sticky month ${uniqueSuffix()}`);
    await route.locator('select').nth(0).selectOption({ label: 'Hà Nội' });
    await route.locator('select').nth(1).selectOption({ label: 'Đà Nẵng' });
    await route.getByLabel(/Tiêu chuẩn lưu trú/i).selectOption({ label: '4 sao' });
    await route.getByLabel(/Mô tả/i).fill('Kiểm tra sticky month header và xóa ngày dự kiến.');

    const startInput = page.getByLabel(/Ngày bắt đầu/i);
    const endInput = page.getByLabel(/Ngày kết thúc/i);
    const startDate = (await startInput.getAttribute('min')) ?? await startInput.inputValue();
    const endDate = new Date(`${startDate}T00:00:00`);
    endDate.setDate(endDate.getDate() + 20);
    await startInput.fill(startDate);
    await endInput.fill(endDate.toISOString().slice(0, 10));
    await selectAllWeekdays(page);

    const removeButtons = page.locator('button[aria-label^="Xóa ngày"]');
    await expect.poll(async () => removeButtons.count()).toBeGreaterThan(0);
    const countBefore = await removeButtons.count();

    const stickyHeader = page.locator('.sticky').filter({ hasText: /Tháng \d+\/\d+/i }).first();
    await expect(stickyHeader).toBeVisible();
    const stickyPosition = await stickyHeader.evaluate((node) => getComputedStyle(node).position);
    expect(stickyPosition).toBe('sticky');

    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(countBefore - 1);
  });

  test('creates a pending tour-rule request through the real backend', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tour-rules', { clearBookings: true });

    await page.locator('tbody tr').first().getByRole('button', { name: /Tạo tour|Sửa tour/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const startInput = dialog.locator('input[type="date"]').nth(0);
    const endInput = dialog.locator('input[type="date"]').nth(1);
    const startValue = await startInput.inputValue();
    const shortEnd = new Date(`${startValue}T00:00:00`);
    shortEnd.setDate(shortEnd.getDate() + 7);
    await startInput.fill(startValue);
    await endInput.fill(shortEnd.toISOString().slice(0, 10));
    await expect(dialog.locator('tbody tr').first()).toBeVisible();
    await dialog.getByRole('button', { name: /^Gửi duyệt$/i }).click();
    await expect(dialog).toHaveCount(0);

    await page.getByRole('button', { name: /Chờ duyệt bán/i }).click();
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
  });

  test('persists estimate changes through the real backend', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tours/TI008/estimate', { clearBookings: true });

    await page.getByRole('button').filter({ hasText: /Dự toán|Du toan/i }).first().click();
    const unitPriceInput = page.locator('table').first().locator('input[type="number"]:not([disabled])').last();
    await expect(unitPriceInput).toBeVisible();
    await unitPriceInput.fill('900000');

    await page.getByRole('button', { name: 'Lưu Nháp' }).click();
    await expect(page.getByText('Đã lưu nháp dự toán')).toBeVisible();

    const accessToken = await page.evaluate(() => {
      const raw = localStorage.getItem('__travela_auth_tokens');
      return raw ? JSON.parse(raw).accessToken as string : '';
    });
    await expect.poll(async () => {
      const response = await page.request.get('http://localhost:4000/api/v1/tour-instances/TI008', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await response.json();
      return payload.tourInstance?.costEstimate?.categories?.find((category: { id: string }) => category.id === 'E')
        ?.items?.[0]?.unitPrice;
    }).toBe(900000);

    await page.reload();
    await page.getByRole('button').filter({ hasText: /Dự toán|Du toan/i }).first().click();
    await expect.poll(async () => {
      const values = await page.locator('table').first().locator('input[type="number"]').evaluateAll((nodes) => (
        nodes.map((node) => (node as HTMLInputElement).value)
      ));
      return values.includes('900000');
    }).toBe(true);
  });

  test('assigns a guide and persists settlement draft through the real backend', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tours', { clearBookings: true });

    await page.getByRole('button', { name: /Phân công HDV/i }).click();
    await expect(page.getByText(/Tour sẵn sàng phân công hướng dẫn viên/i)).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('tbody tr').first().getByRole('button', { name: /Phân công HDV|Thay đổi HDV/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await modal.locator('button').filter({ hasText: /SĐT:/i }).first().click();

    await modal.getByRole('button', { name: /Xác nhận điều phối/i }).click();
    await expect(page.getByText(/gửi email cho|chưa có email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Thay đổi HDV/i }).first()).toBeVisible();

    const accessToken = await page.evaluate(() => {
      const raw = localStorage.getItem('__travela_auth_tokens');
      return raw ? JSON.parse(raw).accessToken as string : '';
    });
    const sourceEstimateResponse = await page.request.get('http://localhost:4000/api/v1/tour-instances/TI008', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const sourceEstimatePayload = await sourceEstimateResponse.json();
    await page.request.post('http://localhost:4000/api/v1/tour-instances/TI002/estimate', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        costEstimate: sourceEstimatePayload.tourInstance.costEstimate,
        submit: false,
      },
    });

    await page.goto('/coordinator/tours/TI002/settle');
    const actualInput = page.getByRole('spinbutton').first();
    await expect(actualInput).toBeVisible();
    await actualInput.fill('8600000');
    const settlementResponsePromise = page.waitForResponse((response) => (
      response.url() === 'http://localhost:4000/api/v1/tour-instances/TI002/settlement'
      && response.request().method() === 'POST'
    ));
    await page.getByRole('button', { name: /Lưu Nháp/i }).click();
    expect((await settlementResponsePromise).ok()).toBeTruthy();
    await expect(page.getByText(/Đã lưu nháp quyết toán/i)).toBeVisible();

    const settlementToken = await page.evaluate(() => {
      const raw = localStorage.getItem('__travela_auth_tokens');
      return raw ? JSON.parse(raw).accessToken as string : '';
    });
    await expect.poll(async () => {
      const response = await page.request.get('http://localhost:4000/api/v1/tour-instances/TI002', {
        headers: { Authorization: `Bearer ${settlementToken}` },
      });
      const payload = await response.json();
      return payload.tourInstance?.settlement?.actualCosts?.[0]?.items?.[0]?.unitPrice;
    }).toBe(8600000);

    await page.reload();
    await expect(page.getByRole('spinbutton').first()).toHaveValue('8600000');
  });

  test('creates a service and a supplier through the real backend', async ({ page }) => {
    const serviceName = `Live service ${uniqueSuffix()}`;
    const supplierName = `Live supplier ${uniqueSuffix()}`;

    await loginAs(page, 'coordinator', '/coordinator/services', { clearBookings: true });
    const accessToken = await page.evaluate(() => {
      const raw = localStorage.getItem('__travela_auth_tokens');
      return raw ? JSON.parse(raw).accessToken as string : '';
    });
    await page.getByRole('button', { name: /Thêm dịch vụ/i }).click();
    await page.getByLabel(/Tên dịch vụ/i).fill(serviceName);
    await expect(page.getByLabel(/Đơn vị/i)).toHaveCount(0);
    await expect(page.getByLabel(/Hình thức giá/i)).toHaveCount(0);
    await page.getByLabel(/Mô tả/i).fill('Live service create');
    await page.getByLabel(/Đơn giá người lớn/i).fill('250000');
    await page.getByLabel(/Đơn giá trẻ em/i).fill('180000');
    await page.getByRole('button', { name: /Lưu dịch vụ/i }).click();
    await expect(page.getByText(serviceName)).toBeVisible();
    await expect.poll(async () => {
      const response = await page.request.get('http://localhost:4000/api/v1/bootstrap', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await response.json();
      return payload.data?.services?.some((service: { name: string; unit?: string; priceMode?: string }) => (
        service.name === serviceName && service.unit === 'Vé' && service.priceMode === 'Giá niêm yết'
      ));
    }).toBe(true);

    await page.goto('/coordinator/suppliers');
    await page.getByRole('button', { name: /Thêm nhà cung cấp/i }).click();
    await page.getByLabel(/Phân loại/i).selectOption('Khách sạn');
    await page.getByLabel(/Tên nhà cung cấp/i).fill(supplierName);
    await page.getByLabel(/Khu vực hoạt động/i).selectOption({ label: 'Hà Nội' });
    await page.getByLabel(/Số điện thoại/i).fill('0909000999');
    await page.getByLabel(/Email/i).fill('live-supplier@test.vn');
    await page.getByLabel(/Địa chỉ/i).fill('Hà Nội');
    await expect(page.getByLabel(/4 sao/i)).toBeChecked();
    const hotelNumbers = page.getByRole('dialog').locator('input[type="number"]');
    await hotelNumbers.nth(1).fill('900000');
    await hotelNumbers.nth(3).fill('1200000');
    await hotelNumbers.nth(5).fill('1500000');
    const supplierResponsePromise = page.waitForResponse((response) => (
      response.url() === 'http://localhost:4000/api/v1/suppliers'
      && response.request().method() === 'POST'
    ));
    await page.getByRole('button', { name: /^Lưu$/i }).click();
    const supplierResponse = await supplierResponsePromise;
    expect(supplierResponse.status()).toBe(201);
    await expect.poll(async () => {
      const response = await page.request.get('http://localhost:4000/api/v1/bootstrap', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await response.json();
      return payload.data?.suppliers?.some((supplier: { name: string }) => supplier.name === supplierName);
    }).toBe(true);
  });
});
