import { expect, test } from '@playwright/test';

async function loginAsManager(page: any) {
  await page?.goto('/');
  await page?.waitForLoadState('domcontentloaded');
  await page?.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin('manager');
  });
}

test?.describe('Manager remaining feedback', () => {
  test('tour management has the requested tabs, no deployed tab, and the richer approval popup', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tours');
    await page?.waitForLoadState('domcontentloaded');

    for (const tab of ['Chờ duyệt bán', 'Không đủ ĐK KH', 'Chờ duyệt dự toán', 'Hoàn thành', 'Đã hủy']) {
      await expect(page?.getByRole('button', { name: new RegExp(tab, 'i') }))?.toBeVisible();
    }
    await expect(page?.getByRole('button', { name: /Đang triển khai/i }))?.toHaveCount(0);

    await page?.getByRole('button', { name: /^Duyệt$/ })?.first()?.click();
    const approveDialog = page?.getByRole('dialog');
    await expect(approveDialog?.getByRole('heading', { name: /Duyệt tour chờ bán/i }))?.toBeVisible();
    await expect(approveDialog?.getByRole('columnheader', { name: /Giá vốn\/người lớn/i }))?.toBeVisible();
    await expect(approveDialog?.getByText(/Đã chọn:/i))?.toBeVisible();
    await expect(approveDialog?.getByRole('button', { name: /Yêu cầu sửa/i }))?.toBeVisible();
    await expect(approveDialog?.getByRole('button', { name: /Từ chối/i }))?.toBeVisible();
    await approveDialog?.getByRole('button', { name: /Yêu cầu sửa/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Yêu cầu sửa/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    await page?.getByRole('button', { name: /Không đủ ĐK KH/i })?.click();
    await page?.locator('tbody input[type="checkbox"]')?.first()?.check();
    await page?.getByRole('button', { name: /Gia hạn/i })?.click();
    const extendDialog = page?.getByRole('dialog');
    await expect(extendDialog?.getByRole('heading', { name: /Gia hạn bán/i }))?.toBeVisible();
    await expect(extendDialog?.locator('input[type="date"]'))?.toBeVisible();
  });

  test('tour program approval is read-only and requires reject/approve dialogs', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tour-programs/TP003/approval');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByText(/Thông tin chung/i))?.toBeVisible();
    await expect(page?.getByText(/Lịch trình/i))?.toBeVisible();
    await expect(page?.getByText(/Giá & Cấu hình/i))?.toBeVisible();
    await expect(page?.getByText(/Người tạo/i))?.toBeVisible();
    await expect(page?.getByText(/Ngày tạo/i))?.toBeVisible();

    await page?.getByRole('button', { name: /Từ chối/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Từ chối chương trình tour/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    await page?.getByRole('button', { name: /Duyệt chương trình tour/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Duyệt chương trình tour/i }))?.toBeVisible();
    await expect(page?.getByText(/Đang hoạt động/i))?.toBeVisible();
  });

  test('tour estimate approval exposes request-edit, reject and approve confirmation flows', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tours/TI003/estimate-approval');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('button', { name: /Yêu cầu chỉnh sửa/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Từ chối/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Duyệt$/ }))?.toBeVisible();
    await expect(page?.getByText(/Bảng dự toán chi phí/i))?.toBeVisible();

    await page?.getByRole('button', { name: /Yêu cầu chỉnh sửa/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Yêu cầu chỉnh sửa/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    await page?.getByRole('button', { name: /Duyệt$/ })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Duyệt dự toán/i }))?.toBeVisible();
  });

  test('manager tour programs and catalog match the revised scope', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tour-programs');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('button', { name: /Chờ duyệt/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Đang hoạt động/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Ngừng hoạt động/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Điểm TQ/i }))?.toBeVisible();

    await page?.getByRole('button', { name: /Ngừng hoạt động/i })?.click();
    await expect(page?.getByRole('columnheader', { name: /Loại tour/i }))?.toBeVisible();

    await page?.goto('/manager/dashboard');
    await expect(page?.getByRole('link', { name: /Chành sách Hủy/i }))?.toHaveCount(0);
    await expect(page?.getByRole('region', { name: /Công việc cần làm/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /Báo cáo quản lý/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /Công việc cần làm/i })?.getByRole('heading', { name: /Phê duyệt voucher/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /Báo cáo quản lý/i })?.getByText('Doanh số', { exact: true }))?.toBeVisible();

    await page?.goto('/manager/cancel-policies');
    await expect(page?.getByText('Chính sách cố định', { exact: true }))?.toBeVisible();
    await expect(page?.getByText(/không còn danh sách, thêm mới hoặc sửa rule hủy/i))?.toBeVisible();

    await page?.goto('/manager/special-days');
    await expect(page?.getByRole('heading', { name: /Ngày đặc biệt/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Dịp đặc biệt/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ngày bắt đầu/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ngày kết thúc/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ghi chú/i }))?.toBeVisible();
  });
});
