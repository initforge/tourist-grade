import { expect, test } from '@playwright/test';
import { loginAs } from './support/app';

test.describe('Manager and coordinator dashboard feedback', () => {
  test('manager dashboard splits work and report areas with filterable exports', async ({ page }) => {
    await loginAs(page, 'manager', '/manager/dashboard');

    const urgent = page.getByRole('region', { name: 'Công việc cần làm' });
    const report = page.getByRole('region', { name: 'Báo cáo quản lý' });

    await expect(urgent).toBeVisible();
    await expect(report).toBeVisible();

    await expect(urgent.locator('input[type="date"]')).toHaveCount(0);
    await expect(report.locator('input[type="date"]')).toHaveCount(2);
    await expect(report.getByRole('button', { name: /Xuất Báo Cáo/i })).toBeVisible();

    await expect(urgent.getByRole('heading', { name: 'Phê duyệt voucher' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Phê duyệt chương trình tour' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Phê duyệt dự toán' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Phê duyệt yêu cầu bán' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Xử lý tour không đủ điều kiện khởi hành' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Xem quyết toán mới tạo' })).toBeVisible();
  });

  test('coordinator dashboard splits work and report areas with filterable exports', async ({ page }) => {
    await loginAs(page, 'coordinator', '/coordinator/dashboard');

    const urgent = page.getByRole('region', { name: 'Công việc cần làm' });
    const report = page.getByRole('region', { name: 'Báo cáo điều phối' });

    await expect(urgent).toBeVisible();
    await expect(report).toBeVisible();

    await expect(urgent.locator('input[type="date"]')).toHaveCount(0);
    await expect(report.locator('input[type="date"]')).toHaveCount(2);
    await expect(report.getByRole('button', { name: /Xuất Báo Cáo/i })).toBeVisible();

    await expect(urgent.getByRole('heading', { name: 'Nhận điều hành' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Tạo/chỉnh sửa dự toán' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Phân công HDV' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Quyết toán' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: /Cảnh báo cần tạo tour/i })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: /Hoàn thiện bản nháp chương trình tour/i })).toBeVisible();
  });
});
