import { expect, test } from '@playwright/test';

async function loginAsAdmin(page: any) {
  await page?.goto('/');
  await page?.waitForLoadState('domcontentloaded');
  await page?.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin('admin');
  });
  await page?.goto('/admin/users');
  await page?.waitForLoadState('domcontentloaded');
}

test?.describe('Admin Users Verification', () => {
  test('Row 26: admin users are split into staff and customer tabs with the correct actions', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page?.getByRole('heading', { name: /Quản trị Người dùng/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: 'Nhân viên', exact: true }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: 'Khách hàng', exact: true }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Thêm tài khoản/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Vai trò/i }))?.toBeVisible();
    await expect(page?.getByText('Quản Trị Viên (Admin)'))?.toBeVisible();
    await expect(page?.getByText('Khách Hàng VIP'))?.toHaveCount(0);

    await page?.getByRole('button', { name: /Thêm tài khoản/i })?.click();
    const drawer = page?.getByRole('dialog', { name: /Thêm Tài Khoản Mới/i });
    await expect(drawer)?.toBeVisible();
    await expect(drawer?.getByText('Khách hàng'))?.toHaveCount(0);
    await drawer?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    await page?.getByRole('button', { name: 'Khách hàng', exact: true })?.click();
    await expect(page?.getByRole('button', { name: /Thêm tài khoản/i }))?.toHaveCount(0);
    await expect(page?.getByRole('columnheader', { name: /Lịch sử đơn đặt/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Tổng số tiền đã chi/i }))?.toBeVisible();
    await expect(page?.getByText('Khách Hàng VIP'))?.toBeVisible();
    await expect(page?.getByText(/đơn thành công/i))?.toBeVisible();
    await expect(page?.getByLabel('Chỉnh sửa Khách Hàng VIP'))?.toHaveCount(0);

    const customerRow = page?.getByRole('row', { name: /Khách Hàng VIP/i });
    await customerRow?.getByLabel('Xem chi tiết Khách Hàng VIP')?.click();
    const historyDialog = page?.getByRole('dialog', { name: /Chi tiết khách hàng/i });
    await expect(historyDialog)?.toBeVisible();
    await expect(historyDialog?.getByText('Số đơn thành công'))?.toBeVisible();
    await expect(historyDialog?.getByText('Số đơn hủy'))?.toBeVisible();
    await expect(historyDialog?.getByText('Tổng số tiền đã chi'))?.toBeVisible();
    await expect(historyDialog?.getByText('BK-847291'))?.toBeVisible();
    await historyDialog?.getByRole('button')?.first()?.click();

    await customerRow?.getByLabel('Khóa tài khoản Khách Hàng VIP')?.click();
    const confirmDialog = page?.getByRole('dialog', { name: /Xác nhận khóa tài khoản/i });
    await expect(confirmDialog)?.toBeVisible();
    await confirmDialog?.getByRole('button', { name: /Khóa tài khoản/i })?.click();
    await expect(customerRow?.getByText('Đã khóa'))?.toBeVisible();
  });
});
