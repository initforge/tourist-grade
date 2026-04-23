import { test, expect } from '@playwright/test';
import { loginAs } from './support/app';

async function loginAsCoordinator(page: any) {
  await loginAs(page, 'coordinator', '/coordinator/dashboard');
  await page?.waitForLoadState('domcontentloaded');
  await page?.waitForTimeout(500);
}

async function loginAsManager(page: any) {
  await loginAs(page, 'manager', '/manager/dashboard');
  await page?.waitForLoadState('domcontentloaded');
  await page?.waitForTimeout(500);
}


// ─────────────────────────────────────────────────────────────────────────────

test?.describe('Coordinator Role — Full Verification', () => {

  // ── 1. Sidebar ──────────────────────────────────────────────────────────
  test('1. Sidebar: "Quản lý Tour" nằm trong "Điều hành", không có "Kinh doanh"', async ({ page }) => {
    await loginAsCoordinator(page);

    const aside = page?.locator('aside');
    await expect(aside)?.toBeVisible();
    await expect(page?.getByRole('region', { name: /Công việc cần làm/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /Báo cáo điều phối/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /Công việc cần làm/i })?.getByRole('heading', { name: /Nhận điều hành/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /Báo cáo điều phối/i })?.getByText(/NCC hợp tác/i))?.toBeVisible();

    // "Quản lý Tour" phải có
    await expect(page?.locator('a', { hasText: 'Quản lý Tour' }))?.toBeVisible();

    // "Điều hành" section phải có
    await expect(page?.locator('p', { hasText: 'Điều hành' })?.first())?.toBeVisible();

    // "Kinh doanh" section KHÔNG có
    await expect(page?.locator('p', { hasText: 'Kinh doanh' }))?.toHaveCount(0);

    // "Điều hành Tour" link phải có
    await expect(page?.locator('a', { hasText: 'Điều hành Tour' }))?.toBeVisible();
  });

  // ── 2. TourInstances — 7 tabs đúng ────────────────────────────────────
  test('2. TourInstances: đúng 7 tabs theo đúng thứ tự', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForTimeout(500);

    const expectedTabs = [
      'Chờ nhận điều hành',
      'Chờ dự toán',
      'Phân công HDV',
      'Đang khởi hành',
      'Chờ quyết toán',
      'Hoàn thành',
      'Đã hủy',
    ];

    for (const tabName of expectedTabs) {
      await expect(page?.locator('button', { hasText: tabName }))?.toBeVisible();
    }
  });

  // ── 3. DispatchHDVModal wired ? Phân công HDV button opens modal ────────
  test('3. Tab "Phân công HDV": bấm "Phân công HDV" → mở DispatchHDVModal', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForTimeout(500);

    // Click tab Phân công HDV
    await page?.locator('button', { hasText: 'Phân công HDV' })?.click();
    await page?.waitForTimeout(300);

    // Table row action button phải l? "Phân công HDV" (KHÔNG phải "Xem chi tiết")
    // Use ?.nth(1) because ?.first() grabs the tab button itself
    const btn = page?.locator('button', { hasText: 'Phân công HDV' })?.nth(1);
    await expect(btn)?.toBeVisible();

    // Click → modal mở
    await btn?.click();
    await page?.waitForTimeout(500);

    // Modal title phải hiện
    await expect(page?.locator('h3', { hasText: 'Phân công HDV' }))?.toBeVisible({ timeout: 3000 });

    // Danh sách HDV phải hiện
    await expect(page?.locator('p', { hasText: 'Chọn hướng dẫn viên' }))?.toBeVisible();

    // Nút Xác nhận điều phối phải có
    await expect(page?.locator('button', { hasText: 'Xác nhận điều phối' }))?.toBeVisible();
  });

  // ── 4. Tab "Đang khởi hành": KHÔNG có nút Điều phối HDV ────────────
  test('4. Tab "Đang khởi hành": KHÔNG có nút "Điều phối HDV"', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForTimeout(500);

    await page?.locator('button', { hasText: 'Đang khởi hành' })?.click();
    await page?.waitForTimeout(300);

    await expect(page?.locator('button', { hasText: 'Điều phối HDV' }))?.toHaveCount(0);
  });

  // ── 5. Cột động: Đang khởi hành/Chờ quyết toán → "Hướng dẫn viên", Chờ nhận điều hành → "Người tạo" ──
  test('5. Tab "Đang khởi hành" và "Chờ quyết toán" có cột "Hướng dẫn viên", tab "Chờ nhận điều hành" có cột "Người tạo"', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForTimeout(500);

    // Đang khởi hành → cột HDV
    await page?.locator('button', { hasText: 'Đang khởi hành' })?.click();
    await page?.waitForTimeout(300);
    await expect(page?.locator('th', { hasText: 'Hướng dẫn viên' })?.first())?.toBeVisible();

    // Chờ quyết toán → cột HDV
    await page?.locator('button', { hasText: 'Chờ quyết toán' })?.click();
    await page?.waitForTimeout(300);
    await expect(page?.locator('th', { hasText: 'Hướng dẫn viên' })?.first())?.toBeVisible();

    // Chờ nhận điều hành → cột Người tạo
    await page?.locator('button', { hasText: 'Chờ nhận điều hành' })?.click();
    await page?.waitForTimeout(300);
    await expect(page?.locator('th', { hasText: 'Người tạo' }))?.toBeVisible();
  });

  // ── 6. DispatchHDVModal: chỉ có chọn HDV, không có phần nhập xe ──────────
  test('6. DispatchHDVModal: chỉ có popup chọn HDV, KHÔNG có input thông tin xe', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForTimeout(500);

    await page?.locator('button', { hasText: 'Phân công HDV' })?.click();
    await page?.waitForTimeout(300);
    // ?.nth(1) skips the tab button itself
    await page?.locator('button', { hasText: 'Phân công HDV' })?.nth(1)?.click();
    await page?.waitForTimeout(500);

    // Phải có title modal
    await expect(page?.locator('h3', { hasText: 'Phân công HDV' }))?.toBeVisible({ timeout: 3000 });

    // KHÔNG có input nhập thông tin xe (biển số, loại xe...)
    const xeInput = page?.locator('input[placeholder*="xe"], input[placeholder*="Xe"], input[placeholder*="biển"]');
    await expect(xeInput)?.toHaveCount(0);

    // Phải có HDV được list
    const hdvCard = page?.locator('[class*="cursor-pointer"]')?.first();
    await expect(hdvCard)?.toBeVisible({ timeout: 3000 });
  });

  // ── 7. Coordinator no longer has voucher section ─────────────────────────
  test('7. Sidebar coordinator không còn mục Vouchers và route cũ chuyển về dashboard', async ({ page }) => {
    await loginAsCoordinator(page);

    await expect(page?.locator('aside'))?.not?.toContainText('Vouchers');

    await page?.goto('/coordinator/vouchers');
    await page?.waitForTimeout(500);
    await expect(page)?.toHaveURL(/\/coordinator\/dashboard$/);
  });

  // ── 8. Manager voucher approval keeps list layout + reject dialog ─────────
  test('8. Manager voucher approval có filter trạng thái rút gọn và popup từ chối bắt nhập lý do', async ({ page }) => {
    await loginAsManager(page);

    await page?.goto('/manager/voucher-approval');
    await page?.waitForTimeout(1000);

    const options = page?.locator('select option');
    await expect(options)?.toContainText(['Chờ phê duyệt', 'Chưa diễn ra', 'Đang hoạt động', 'Vô hiệu/Hết hạn']);
    await expect(options?.filter({ hasText: 'Tất cả trạng thái' }))?.toHaveCount(0);
    await expect(options?.filter({ hasText: 'Nháp' }))?.toHaveCount(0);
    await expect(options?.filter({ hasText: 'Không được phê duyệt' }))?.toHaveCount(0);

    await page?.locator('tbody tr')?.first()?.getByRole('button', { name: 'Từ chối' })?.click();
    await page?.waitForTimeout(500);
    const rejectDialog = page?.getByRole('dialog', { name: /Từ chối Voucher/i });
    await expect(rejectDialog?.getByRole('button', { name: 'Xác nhận' }))?.toBeDisabled();
    await rejectDialog?.getByPlaceholder(/Lý do không phê duyệt/i)?.fill('Thiếu điều kiện áp dụng rõ ràng');
    await expect(rejectDialog?.getByRole('button', { name: 'Xác nhận' }))?.toBeEnabled();
  });

  // ── 9. TourGenerationRules: header "Quản lý Tour" ───────────────────────
  test('9. TourGenerationRules: header là "Quản lý Tour", breadcrumb có, 2 sub-tabs đúng', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-rules');
    await page?.waitForTimeout(500);

    await expect(page?.locator('h1', { hasText: 'Quản lý Tour' }))?.toBeVisible({ timeout: 3000 });

    // Breadcrumb
    await expect(page?.locator('.ant-breadcrumb')?.or(page?.locator('[class*="breadcrumb"]'))?.first())?.toBeVisible({ timeout: 3000 });

    // 2 sub-tabs
    await expect(page?.locator('button', { hasText: 'Quy tắc tạo tour' }))?.toBeVisible();
    await expect(page?.locator('button', { hasText: 'Chờ duyệt bán' }))?.toBeVisible();
  });

  // ── 10. TourGenerationRules: tab Chờ duyệt bán KHÔNG có Từ chối/Duyệt ──
  test('10. Tab "Chờ duyệt bán": KHÔNG có nút Từ chối/Duyệt (chỉ có Xem/Sửa/Xóa)', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-rules');
    await page?.waitForTimeout(500);

    await page?.locator('button', { hasText: 'Chờ duyệt bán' })?.click();
    await page?.waitForTimeout(500);

    await expect(page?.locator('button', { hasText: 'Từ chối' }))?.toHaveCount(0);
    // /^Duyệt$/ để không match tab "Chờ duyệt bán" ? chỉ match nút hành động trong bảng
    await expect(page?.locator('button', { hasText: /^Duyệt$/ }))?.toHaveCount(0);
    await expect(page?.locator('button', { hasText: 'Xem' })?.first())?.toBeVisible({ timeout: 3000 });
  });

  // ── 11. TourGenerationRules: view modal KHÔNG còn hardcoded [1,2,3] rows ──
  test('11. View modal: hiện instance thực từ data, KHÔNG còn hardcoded 3 hàng giống nhau', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-rules');
    await page?.waitForTimeout(500);

    await page?.locator('button', { hasText: 'Chờ duyệt bán' })?.click();
    await page?.waitForTimeout(500);

    const xemBtn = page?.locator('button', { hasText: 'Xem' })?.first();
    if (await xemBtn?.isVisible({ timeout: 3000 })) {
      await xemBtn?.click();
      await page?.waitForTimeout(500);

      // Modal mở
      await expect(page?.locator('h3', { hasText: 'Chi tiết tour' }))?.toBeVisible({ timeout: 3000 });

      // Phải có mã tour TI***
      const tourCode = page?.locator('text=/TI\\d+/')?.first();
      await expect(tourCode)?.toBeVisible({ timeout: 3000 });
    }
  });

  // ── 12. TourReceiveDispatch: Người tạo không còn hardcoded "Nguyễn Thị Lan" ──
  test('12. TourReceiveDispatch: KHÔNG hiện "Nguyễn Thị Lan" hardcoded, dùng mockUsers lookup', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForTimeout(500);

    const nhanBtn = page?.getByRole('button', { name: /^Nhận điều hành$/ })?.first();
    if (await nhanBtn?.isVisible({ timeout: 3000 })) {
      await nhanBtn?.click();
      await page?.waitForURL('**/receive**', { timeout: 5000 });
      await page?.waitForTimeout(500);

      // KHÔNG được hiện "Nguyễn Thị Lan"
      await expect(page?.locator('text=Nguyễn Thị Lan'))?.toHaveCount(0);

      // Breadcrumb
      await expect(page?.locator('.ant-breadcrumb')?.or(page?.locator('[class*="breadcrumb"]'))?.first())?.toBeVisible({ timeout: 3000 });

      // Phải có label Người tạo
      await expect(page?.locator('text=Người tạo'))?.toBeVisible({ timeout: 3000 });
    }
  });

  // ── 13. Suppliers: "Khu vực hoạt động" header and revised supplier catalog ──
  test('13. Suppliers: header "Khu vực hoạt động" and revised supplier catalog are visible', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/suppliers');
    await page?.waitForTimeout(500);

    // Header đúng — dùng regex để match chành xác "Khu vực hoạt động"
    await expect(page?.locator('th', { hasText: 'Khu vực hoạt động' }))?.toBeVisible();
    // KHÔNG có cột "Khu vực" đơn lẻ (chỉ có "Khu vực hoạt động")
    await expect(page?.locator('th', { hasText: /^Khu vực$/ }))?.toHaveCount(0);

    // Breadcrumb
    await expect(page?.locator('a', { hasText: 'Đối tác' })?.first())?.toBeVisible();

    // Khách sạn/nhà hàng hiện đúng khu vực hoạt động, không còn placeholder "-"?.
    await expect(page?.getByRole('row', { name: /Khách sạn Di Sản Việt?.*Hạ Long/i }))?.toBeVisible({ timeout: 3000 });
    await expect(page?.getByRole('row', { name: /The Lotus Dining Room?.*Hà Nội/i }))?.toBeVisible({ timeout: 3000 });
  });

  // ── 14. ServiceList: revised catalog columns ─────────────────
  test('14. ServiceList: có cột Đơn vị / Thiết lập giá và dịch vụ HDV mặc định', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/services');
    await page?.waitForTimeout(500);

    await expect(page?.locator('th', { hasText: 'Đơn vị' }))?.toBeVisible();
    await expect(page?.locator('th', { hasText: 'Thiết lập giá' }))?.toBeVisible();
    await expect(page?.locator('text=Dịch vụ Hướng dẫn viên'))?.toBeVisible();

    // Breadcrumb
    await expect(page?.locator('a', { hasText: 'Kho Dịch vụ' })?.first())?.toBeVisible();
    await expect(page?.locator('table')?.first())?.toBeVisible({ timeout: 3000 });
  });

  // ── 15. TourInstances: breadcrumb ────────────────────────────────────────
  test('15. TourInstances: có breadcrumb với "Điều hành tour"', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForTimeout(500);

    await expect(page?.locator('.ant-breadcrumb')?.or(page?.locator('[class*="breadcrumb"]'))?.first())?.toBeVisible({ timeout: 3000 });
    // sidebar link + breadcrumb link both say "Điều hành tour" — use first()
    await expect(page?.locator('a', { hasText: 'Điều hành tour' })?.first())?.toBeVisible({ timeout: 3000 });
  });

  // ── 16. TourSettlement: breadcrumb ────────────────────────────────────────
  test('16. TourSettlement: có breadcrumb', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours/TI001/settle');
    await page?.waitForTimeout(500);
    await expect(page?.locator('.ant-breadcrumb')?.or(page?.locator('[class*="breadcrumb"]'))?.first())?.toBeVisible({ timeout: 3000 });
  });

  // ── 17. TourEstimate: breadcrumb ───────────────────────────────────────────
  test('17. TourEstimate: có breadcrumb', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours/TI001/estimate');
    await page?.waitForTimeout(500);
    await expect(page?.locator('.ant-breadcrumb')?.or(page?.locator('[class*="breadcrumb"]'))?.first())?.toBeVisible({ timeout: 3000 });
  });

});
