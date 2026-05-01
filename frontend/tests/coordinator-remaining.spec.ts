import { expect, test, type Page } from '@playwright/test';
import { loginAs } from './support/app';

async function loginAsCoordinator(page: Page) {
  await loginAs(page, 'coordinator', '/coordinator/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.localStorage?.removeItem('__travela_tour_programs');
  });
}

async function searchCurrentList(page: Page, query: string) {
  await page.getByRole('textbox', { name: /Tìm/i }).fill(query);
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
    await expect(page.locator('tbody input[type="number"]:enabled')).toHaveCount(0);
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

    await searchCurrentList(page, 'Bảo hiểm du lịch');
    await page.getByRole('row', { name: /Bảo hiểm du lịch/i }).getByRole('button', { name: /Xem/i }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Phân loại/i)).toBeVisible();
    await expect(dialog.getByText(/Đơn vị/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Sửa$/i })).toBeVisible();
    await expect(dialog.getByText('Bảng giá', { exact: true })).toBeVisible();
    await dialog.getByLabel(/Đóng/i).click();

    await searchCurrentList(page, 'Vé tham quan Sun World');
    await page.getByRole('row', { name: /Vé tham quan Sun World/i }).getByRole('button', { name: /Xem/i }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /^Sửa$/i })).toBeVisible();
    await expect(dialog.getByText(/Trạng thái/i)).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Ngày hết hiệu lực/i })).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Người tạo/i })).toBeVisible();
    await dialog.getByRole('button', { name: /^Sửa$/i }).click();

    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /Thêm mới bảng giá/i })).toBeVisible();
    await expect(dialog.getByLabel(/Trạng thái/i)).toBeVisible();
  });

  test('service create flow captures supplier, contact, unit price, and dropdown formulas', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/services');

    await page.getByRole('button', { name: /Thêm dịch vụ/i }).click();
    const dialog = page.getByRole('dialog');
    const serviceName = `Phí nước uống đoàn ${Date.now()}`;

    await dialog.getByLabel(/Phân loại/i).selectOption('Các dịch vụ khác');
    await expect(dialog.getByText(/Tên nhà cung cấp/i)).toBeVisible();
    await expect(dialog.getByText(/Thông tin liên hệ/i)).toBeVisible();
    await expect(dialog.getByText(/^Đơn giá$/i)).toBeVisible();

    await dialog.getByLabel(/Tên dịch vụ/i).fill(serviceName);
    await dialog.getByLabel(/Đơn vị/i).fill('khách');
    await dialog.getByLabel(/Tên nhà cung cấp/i).fill('Công ty Nước Suối');
    await dialog.getByLabel(/Thông tin liên hệ/i).fill('0909 000 111');
    await dialog.getByLabel(/Mô tả/i).fill('Nước uống đóng chai cho đoàn');
    await dialog.getByLabel(/^Đơn giá$/i).fill('25000');
    await dialog.getByLabel(/Công thức tính số lần/i).selectOption('Giá trị mặc định');
    await dialog.getByLabel(/Công thức tính số lượng/i).selectOption('Giá trị mặc định');
    await dialog.getByLabel(/Số lần mặc định/i).fill('2');
    await dialog.getByLabel(/Số lượng mặc định/i).fill('10');
    await dialog.getByRole('button', { name: /Lưu dịch vụ/i }).click();

    await searchCurrentList(page, serviceName);
    await page.getByRole('row', { name: new RegExp(serviceName, 'i') }).getByRole('button', { name: /Xem/i }).click();
    const detail = page.getByRole('dialog');
    await expect(detail.getByText('Công ty Nước Suối', { exact: true })).toBeVisible();
    await expect(detail.getByText(/0909 000 111/i)).toBeVisible();
    await expect(detail.getByText(/Giá trị mặc định: 2/i)).toBeVisible();
    await expect(detail.getByText(/Giá trị mặc định: 10/i)).toBeVisible();
    await expect(detail.getByText(/25.000 đ/i)).toBeVisible();
  });

  test('supplier create and edit layouts follow new service table rules', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/suppliers');

    await page.getByRole('button', { name: /Thêm nhà cung cấp/i }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Phân loại/i).selectOption('Vận chuyển');
    await dialog.getByLabel(/Loại phương tiện/i).selectOption('Máy bay');
    await expect(dialog.getByText(/Dịch vụ vận chuyển/i)).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Tên dịch vụ/i })).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: /Thêm dòng/i })).toHaveCount(0);

    await dialog.getByLabel(/Phân loại/i).selectOption('Khách sạn');
    await expect(dialog.getByText(/Dịch vụ lưu trú cố định/i)).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i }).first()).toBeVisible();
    await dialog.getByRole('checkbox', { name: /Có dịch vụ ăn kèm/i }).check();
    await expect(dialog.getByText('Dịch vụ ăn kèm', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Thêm dòng/i })).toBeVisible();
    await dialog.getByLabel(/Phân loại/i).selectOption('Nhà hàng');
    await expect(dialog.getByText(/Dịch vụ ăn uống/i)).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i }).first()).toBeVisible();
    await dialog.getByRole('button', { name: /^Hủy$/i }).click();

    await page.getByRole('row', { name: /Khách sạn Di Sản Việt/i }).getByRole('button', { name: /Xem/i }).click();
    dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Sửa$/i }).click();

    dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/Dịch vụ lưu trú cố định/i)).toBeVisible();
    await expect(dialog.getByRole('columnheader', { name: /Đơn giá/i }).first()).toBeVisible();
    await expect(dialog.locator('input[type="number"]').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Lưu$/i })).toBeVisible();
  });
});
