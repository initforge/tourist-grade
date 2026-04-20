import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { loginAs } from './support/app';

test.describe('Sales dashboard feedback', () => {
  test('sales dashboard separates urgent work from reports and shows top tour ranking', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/dashboard');

    const urgent = page.getByRole('region', { name: 'Công việc cần xử lý' });
    const report = page.getByRole('region', { name: 'Báo cáo kinh doanh' });

    await expect(urgent).toBeVisible();
    await expect(report).toBeVisible();

    await expect(urgent.locator('input[type="date"]')).toHaveCount(0);
    await expect(urgent.getByRole('button', { name: /Xuất/i })).toHaveCount(0);
    await expect(urgent.getByRole('heading', { name: 'Xác nhận đơn đặt' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Xác nhận đơn hủy' })).toBeVisible();
    await expect(urgent.getByRole('heading', { name: 'Hoàn tiền' })).toBeVisible();

    await expect(report.locator('input[type="date"]')).toHaveCount(2);
    await expect(report.getByRole('button', { name: /Xuất Báo Cáo/i })).toBeVisible();
    await expect(report.getByRole('heading', { name: /Top 5 chương trình tour có số lượt booking nhiều nhất/i })).toBeVisible();
    await expect(report.getByRole('heading', { name: /Báo cáo doanh thu theo ngày/i })).toBeVisible();
  });

  test('sales export flow uses the revised report types', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/dashboard');

    await page.getByRole('region', { name: 'Báo cáo kinh doanh' }).getByRole('button', { name: /Xuất Báo Cáo/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal.getByText('Xuất Báo Cáo Excel')).toBeVisible();
    await expect(modal.getByText('Báo cáo tổng hợp booking')).toBeVisible();
    await expect(modal.getByText('Báo cáo Top 5 chương trình tour')).toBeVisible();
    await expect(modal.getByText('Báo cáo theo dõi hoàn tiền')).toBeVisible();
    await expect(modal.getByRole('button', { name: /^Xuất$/ })).toBeDisabled();

    await modal.getByText('Báo cáo tổng hợp booking').click();
    await expect(modal.getByRole('button', { name: /Xuất 1 báo cáo/i })).toBeEnabled();

    await modal.getByText('Báo cáo Top 5 chương trình tour').click();
    await expect(modal.getByRole('button', { name: /Xuất 2 báo cáo/i })).toBeEnabled();
  });

  test('sales exports keep booking and refund columns aligned with the requested reports', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/dashboard');

    await page.getByRole('region', { name: 'Báo cáo kinh doanh' }).getByRole('button', { name: /Xuất Báo Cáo/i }).click();
    let modal = page.getByRole('dialog');
    await modal.getByText('Báo cáo tổng hợp booking').click();
    let downloadPromise = page.waitForEvent('download');
    await modal.getByRole('button', { name: /Xuất 1 báo cáo/i }).click();
    let download = await downloadPromise;
    let path = await download.path();
    expect(path).toBeTruthy();
    let content = await readFile(path!, 'utf8');
    expect(content).toContain('Số lượng khách');
    expect(content).toContain('Ghi chú');

    await page.getByRole('region', { name: 'Báo cáo kinh doanh' }).getByRole('button', { name: /Xuất Báo Cáo/i }).click();
    modal = page.getByRole('dialog');
    await modal.getByText('Báo cáo theo dõi hoàn tiền').click();
    downloadPromise = page.waitForEvent('download');
    await modal.getByRole('button', { name: /Xuất 1 báo cáo/i }).click();
    download = await downloadPromise;
    path = await download.path();
    expect(path).toBeTruthy();
    content = await readFile(path!, 'utf8');
    expect(content).toContain('Ngày khởi hành,Số lượng khách,Tổng tiền,Trạng thái đơn,Lý do hủy,Số tiền hoàn,TT hoàn tiền');
  });
});
