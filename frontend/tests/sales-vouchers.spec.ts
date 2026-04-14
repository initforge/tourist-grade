import { expect, test } from '@playwright/test';
import { loginAs } from './support/app';

test.describe('Sales voucher feedback', () => {
  test('voucher list shows time range, applied tour names, and detail is a full page', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers');

    await expect(page.getByRole('heading', { name: /Quản lý Voucher/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Thời gian áp dụng' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tour áp dụng' })).toBeVisible();
    await expect(page.getByRole('table').getByText('Chưa diễn ra')).toBeVisible();

    const promoRow = page.locator('tbody tr').filter({ hasText: 'PROMO10PCT' });
    await expect(promoRow.getByText('Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao')).toBeVisible();
    await promoRow.click();

    await expect(page).toHaveURL(/\/sales\/vouchers\/VOU-05$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'PROMO10PCT' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Voucher', exact: true })).toBeVisible();
    await expect(page.getByText('Thời gian áp dụng')).toBeVisible();
    await expect(page.getByText('Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao')).toBeVisible();
  });

  test('draft and rejected vouchers expose the revised actions', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers');

    const draftRow = page.locator('tbody tr').filter({ hasText: 'SUMMER2026' });
    await expect(draftRow.getByRole('button', { name: 'Sửa' })).toBeVisible();
    await expect(draftRow.getByRole('button', { name: 'Gửi phê duyệt' })).toBeVisible();
    await expect(draftRow.locator('[title="Xóa"]')).toBeVisible();

    const rejectedRow = page.locator('tbody tr').filter({ hasText: 'VIP50PCT' });
    await expect(rejectedRow.getByRole('button', { name: 'Sửa' })).toBeVisible();
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

  test('rejected voucher detail only exposes edit/delete, then edit form allows send approval', async ({ page }) => {
    await loginAs(page, 'sales', '/sales/vouchers/VOU-06');

    await expect(page.getByText(/Lý do:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chỉnh sửa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xóa' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gửi phê duyệt' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Chỉnh sửa' }).click();
    const form = page.getByRole('dialog');
    await expect(form.getByRole('heading', { name: 'Chỉnh sửa Voucher' })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Đóng' })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Lưu' })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Gửi Phê Duyệt' })).toBeVisible();
  });
});
