import { expect, test, type Page } from '@playwright/test';
import { loginAs } from './support/app';

function uniqueSuffix() {
  return Date.now().toString().slice(-6);
}

async function addFirstPickerOption(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('checkbox').first().check();
  await dialog.getByRole('button', { name: /Thêm đã chọn/i }).click();
  await expect(dialog).toBeHidden();
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
    await route.locator('select').nth(1).selectOption({ label: 'Đà Nẵng' });
    await route.getByLabel('Tiêu chuẩn lưu trú').selectOption({ label: '4 sao' });
    await route.locator('textarea').fill('Live E2E create program through docker stack.');

    const startInput = page.getByLabel('Ngày bắt đầu');
    const endInput = page.getByLabel('Ngày kết thúc');
    const startDate = (await startInput.getAttribute('min')) ?? await startInput.inputValue();
    const endDate = new Date(`${startDate}T00:00:00`);
    endDate.setDate(endDate.getDate() + 7);
    await startInput.fill(startDate);
    await expect(endInput).toBeEnabled();
    await endInput.fill(endDate.toISOString().slice(0, 10));
    await page.getByRole('button', { name: /T2|T3|T4|T5|T6|T7|CN/ }).nth(0).click();

    await page.getByRole('button', { name: /Tiếp theo: Lịch trình/i }).click();
    await page.locator('fieldset input[placeholder^="VD:"]').first().fill('Ngày 1 live');
    await page.locator('fieldset textarea').first().fill('Mô tả live ngày 1');
    await page.getByRole('button', { name: /Bữa trưa/i }).first().click();

    await page.getByRole('button', { name: /Tiếp theo: Giá & Cấu hình/i }).click();
    await page.getByLabel(/Thêm nhà cung cấp xe tham quan/i).click();
    await addFirstPickerOption(page);
    await page.getByLabel(/Đơn giá xe tham quan/i).fill('8100000');

    await page.getByLabel(/Thêm dịch vụ ăn uống cho Ngày 1 - Bữa trưa/i).click();
    await addFirstPickerOption(page);

    await page.getByLabel(/Thêm vé tham quan cho Ngày 1/i).click();
    await addFirstPickerOption(page);

    await page.getByRole('button', { name: /Tiếp theo: Tour dự kiến/i }).click();
    await page.getByRole('button', { name: /^Gửi duyệt$/i }).click();

    await expect(page).toHaveURL(/\/coordinator\/tour-programs\/TP\d+$/);
    await expect(page.getByText(name)).toBeVisible();
  });

  test('creates a pending tour-rule request through the real backend', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/tour-rules', { clearBookings: true });

    await page.locator('tbody tr').first().getByRole('button', { name: /Tạo tour|Sửa tour/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const startInput = dialog.locator('input[type="date"]').nth(0);
    const endInput = dialog.locator('input[type="date"]').nth(1);
    await startInput.fill(await startInput.inputValue());
    await endInput.fill(await endInput.inputValue());
    await dialog.getByRole('button', { name: /^Gửi duyệt$/i }).click();

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

    const downloadPromise = page.waitForEvent('download');
    await modal.getByRole('button', { name: /Xác nhận điều phối/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.xls');
    await expect(page.getByRole('button', { name: 'Thay đổi HDV' }).first()).toBeVisible();

    await page.goto('/coordinator/tours/TI002/settle');
    const actualInput = page.locator('table').first().locator('input[type="number"]').first();
    await expect(actualInput).toBeVisible();
    await actualInput.fill('8200000');
    await page.getByRole('button', { name: 'Lưu Nháp' }).click();
    await expect(page.getByText('Đã lưu nháp quyết toán')).toBeVisible();

    await page.reload();
    await expect(page.locator('input[type="number"]').first()).toHaveValue('8200000');
  });

  test('creates a service and a supplier through the real backend', async ({ page }) => {
    const serviceName = `Live service ${uniqueSuffix()}`;
    const supplierName = `Live supplier ${uniqueSuffix()}`;

    await loginAs(page, 'coordinator', '/coordinator/services', { clearBookings: true });
    const accessToken = await page.evaluate(() => {
      const raw = localStorage.getItem('__travela_auth_tokens');
      return raw ? JSON.parse(raw).accessToken as string : '';
    });
    await page.getByRole('button', { name: 'Thêm dịch vụ' }).click();
    await page.getByLabel('Tên dịch vụ').fill(serviceName);
    await page.getByLabel('Đơn vị').fill('vé');
    await page.getByLabel('Mô tả').fill('Live service create');
    await page.getByLabel('Đơn giá người lớn').fill('250000');
    await page.getByLabel('Đơn giá trẻ em').fill('180000');
    await page.getByRole('button', { name: 'Lưu dịch vụ' }).click();
    await expect(page.getByText(serviceName)).toBeVisible();
    await expect.poll(async () => {
      const response = await page.request.get('http://localhost:4000/api/v1/bootstrap', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await response.json();
      return payload.data?.services?.some((service: { name: string }) => service.name === serviceName);
    }).toBe(true);

    await page.goto('/coordinator/suppliers');
    await page.getByRole('button', { name: 'Thêm nhà cung cấp' }).click();
    await page.getByLabel('Phân loại').selectOption('Vận chuyển');
    await page.getByLabel('Tên nhà cung cấp').fill(supplierName);
    await page.getByLabel('Khu vực hoạt động').fill('Hà Nội');
    await page.getByLabel('Số điện thoại').fill('0909000999');
    await page.getByLabel('Email').fill('live-supplier@test.vn');
    await page.getByLabel('Địa chỉ').fill('Hà Nội');
    await page.locator('input[type="number"]').nth(0).fill('16');
    await page.locator('input[type="number"]').nth(1).fill('8100000');
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
