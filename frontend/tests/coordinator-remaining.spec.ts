import { expect, test } from '@playwright/test';
import { loginAs } from './support/app';

async function loginAsCoordinator(page: any) {
  await loginAs(page, 'coordinator', '/coordinator/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.localStorage?.removeItem('__travela_tour_programs');
  });
}

test.describe('Coordinator remaining feedback', () => {
  test('receive dispatch redirects to cho du toan after accepting operation', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tour-programs/TI008/receive');

    await page.getByRole('button', { name: /Nhận điều hành/i }).click();
    await expect(page).toHaveURL(/\/coordinator\/tours$/);
    await expect(page.getByRole('button', { name: /Chờ dự toán/i })).toHaveClass(/text-\[var\(--color-secondary\)\]|bg-\[var\(--color-secondary\)\]\/5/);
  });

  test('completed tours open settlement in read only mode', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');

    await page.getByRole('button', { name: /Hoàn thành/i }).click();
    await page.getByRole('button', { name: /^Chi tiết$/i }).first().click();

    await expect(page).toHaveURL(/\/coordinator\/tours\/.*\/settle$/);
    await expect(page.getByRole('button', { name: /Lưu Nháp/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Hoàn Tất Quyết Toán/i })).toHaveCount(0);
    await expect(page.locator('tbody input[type="number"]').first()).toBeDisabled();
  });

  test('tour rule edit popup shows program info and preview table', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tour-rules');

    await page.getByRole('button', { name: /Chờ duyệt bán/i }).click();
    await page.getByRole('button', { name: /^Sửa$/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Tên chương trình/i)).toBeVisible();
    await expect(dialog.getByText(/Loại tour/i)).toBeVisible();
    await expect(dialog.getByText(/Điểm khởi hành/i)).toBeVisible();
    await expect(dialog.getByText(/Thời lượng tour/i)).toBeVisible();
    await expect(dialog.getByLabel(/Sinh từ ngày/i)).toBeVisible();
    await expect(dialog.getByLabel(/Đến ngày/i)).toBeVisible();
    await expect(dialog.getByText(/Preview danh sách tour/i)).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Ngày kết thúc/i })).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Cùng thời điểm/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Lưu thay đổi/i })).toBeVisible();
  });

  test('services detail follows locked and editable category rules', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/services');

    await page.getByRole('row', { name: /Dịch vụ Hướng dẫn viên/i }).getByRole('button', { name: /Xem/i }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Phân loại/i)).toBeVisible();
    await expect(dialog.getByText(/Đơn vị/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Sửa$/i })).toHaveCount(0);
    await expect(dialog.getByText(/Bảng giá/i)).toHaveCount(0);
    await dialog.getByLabel(/Đóng/i).click();

    await page.getByRole('row', { name: /Vé tham quan Sun World/i }).getByRole('button', { name: /Xem/i }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /^Sửa$/i })).toBeVisible();
    await expect(dialog.getByText(/Trạng thái/i)).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Ngày hết hiệu lực/i })).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Người tạo/i })).toBeVisible();
    await dialog.getByRole('button', { name: /^Sửa$/i }).click();

    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /Thêm mới bảng giá/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Chuyển trạng thái dịch vụ/i })).toBeVisible();
  });

  test('supplier create and edit layouts follow new service table rules', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/suppliers');

    await page.getByRole('button', { name: /Thêm nhà cung cấp/i }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Phân loại/i).selectOption('Vận chuyển');
    await dialog.getByLabel(/Loại phương tiện/i).selectOption('Máy bay');
    await expect(dialog.getByText(/không có bảng dịch vụ riêng/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Thêm bảng giá/i })).toHaveCount(0);

    await dialog.getByLabel(/Phân loại/i).selectOption('Khách sạn');
    await expect(dialog.getByRole('button', { name: /Thêm dịch vụ/i }).first()).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i })).toBeVisible();
    await dialog.getByRole('checkbox').check();
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i }).nth(1)).toBeVisible();
    await dialog.getByLabel(/Phân loại/i).selectOption('Nhà hàng');
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i })).toBeVisible();
    await dialog.getByRole('button', { name: /Hủy bỏ/i }).click();

    await page.getByRole('row', { name: /Vận tải Xuyên Việt/i }).getByRole('button', { name: /Xem/i }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Sửa$/i }).click();

    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /Mở rộng bảng giá/i }).first()).toBeVisible();
    await dialog.getByRole('button', { name: /Mở rộng bảng giá/i }).first().click();
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Thêm bảng giá/i }).first()).toBeVisible();
  });
});
