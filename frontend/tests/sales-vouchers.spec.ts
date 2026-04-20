import { expect, test } from '@playwright/test';
import { loginAs } from './support/app';

test.describe('Sales voucher feedback', () => {
  test('voucher list shows time range, applied tour names, and detail is a full page', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers');

    await expect(page.getByRole('heading', { name: /Quản lý Voucher/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Thời gian áp dụng' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tour áp dụng' })).toBeVisible();
    await expect(page.getByRole('table').getByText('Chưa diễn ra')).toBeVisible();

    const autumnRow = page.locator('tbody tr').filter({ hasText: 'AUTUMN20' });
    await expect(autumnRow.getByText('Mùa Thu Kyoto & Osaka')).toBeVisible();
    await autumnRow.click();

    await expect(page).toHaveURL(/\/sales\/vouchers\/VOU-07$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'AUTUMN20' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voucher', exact: true })).toBeVisible();
    await expect(page.getByText('Thời gian áp dụng')).toBeVisible();
    await expect(page.getByText('Mùa Thu Kyoto & Osaka')).toBeVisible();
  });

  test('draft and rejected vouchers expose the revised actions', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers');

    const draftRow = page.locator('tbody tr').filter({ hasText: 'SUMMER2026' });
    await expect(draftRow.getByRole('button', { name: 'Chỉnh sửa' })).toBeVisible();
    await expect(draftRow.getByRole('button', { name: 'Gửi phê duyệt' })).toBeVisible();
    await expect(draftRow.locator('[title="Xóa"]')).toBeVisible();

    const rejectedRow = page.locator('tbody tr').filter({ hasText: 'VIP50PCT' });
    await expect(rejectedRow.getByRole('button', { name: 'Chỉnh sửa' })).toBeVisible();
    await expect(rejectedRow.getByRole('button', { name: 'Gửi phê duyệt' })).toHaveCount(0);
    await expect(rejectedRow.locator('[title="Xóa"]')).toBeVisible();

    const inactiveRow = page.locator('tbody tr').filter({ hasText: 'FLASHWINTER' });
    await expect(inactiveRow.locator('[title="Xóa"]')).toBeVisible();
  });

  test('creating a voucher still allows save and send approval from the form', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers');

    await page.getByRole('button', { name: /Tạo Voucher Mới/i }).click();
    const form = page.getByRole('dialog');
    await expect(form.getByRole('heading', { name: /Tạo Voucher Mới/i })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Gửi Phê Duyệt' })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Lưu' })).toBeVisible();
  });

  test('send approval uses the 7-day rule while save keeps the 10-day rule', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers');

    await page.getByRole('button', { name: /Tạo Voucher Mới/i }).click();
    const form = page.getByRole('dialog');

    await form.locator('input').nth(0).fill('WEEK7');
    await form.locator('input').nth(1).fill('10');
    await form.locator('input').nth(2).fill('20');
    await form.locator('input[type="date"]').nth(0).fill('2026-04-27');
    await form.locator('input[type="date"]').nth(1).fill('2026-05-10');

    await expect(form.getByText('Nhập cách ít nhất 10 ngày để lưu, nhập cách ít nhất 7 ngày để gửi phê duyệt.')).toBeVisible();
    await expect(form.getByRole('button', { name: 'Lưu' })).toBeDisabled();
    await expect(form.getByRole('button', { name: 'Gửi Phê Duyệt' })).toBeEnabled();

    await form.getByRole('button', { name: 'Gửi Phê Duyệt' }).click();
    await expect(page.locator('.ant-modal-confirm-title').filter({ hasText: 'Gửi phê duyệt voucher' })).toBeVisible();
  });

  test('rejected voucher detail only exposes edit/delete, then edit form allows send approval', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers/VOU-06');

    await expect(page.getByText(/Lý do:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chỉnh sửa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xóa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gửi phê duyệt' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Chỉnh sửa' }).click();
    const form = page.getByRole('dialog');
    await expect(form.getByRole('heading', { name: 'Chỉnh sửa Voucher' })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Hủy' })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Lưu' })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Gửi Phê Duyệt' })).toBeVisible();
  });

  test('active, pending approval, and upcoming voucher details are read-only', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers/VOU-07');
    await expect(page.getByRole('heading', { name: 'AUTUMN20' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chỉnh sửa' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Gửi phê duyệt' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Xóa' })).toHaveCount(0);

    await page.goto('/sales/vouchers/VOU-09');
    await expect(page.getByRole('heading', { name: 'NATIONALDAY2026' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chỉnh sửa' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Gửi phê duyệt' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Xóa' })).toHaveCount(0);
  });
});
