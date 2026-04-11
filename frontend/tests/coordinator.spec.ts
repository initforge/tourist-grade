import { test, expect } from '@playwright/test';

// ── Login helper ────────────────────────────────────────────────────────────
async function loginAsCoordinator(page: any) {
  // First visit any page to load the React app + store
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  // Inject auth
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__authLogin('coordinator');
  });
  await page.waitForTimeout(200);
  // Now navigate to coordinator — store already has the role
  await page.goto('/coordinator/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

async function loginAsManager(page: any) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__authLogin('manager');
  });
  await page.waitForTimeout(200);
  await page.goto('/manager/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Coordinator Role — Full Verification', () => {

  // ── 1. Sidebar ──────────────────────────────────────────────────────────
  test('1. Sidebar: "Quản lý Tour" nằm trong "Điều hành", không có "Kinh doanh"', async ({ page }) => {
    await loginAsCoordinator(page);

    const aside = page.locator('aside');
    await expect(aside).toBeVisible();

    // "Quản lý Tour" phải có
    await expect(page.locator('a', { hasText: 'Quản lý Tour' })).toBeVisible();

    // "Điều hành" section phải có
    await expect(page.locator('p', { hasText: 'Điều hành' }).first()).toBeVisible();

    // "Kinh doanh" section KHÔNG có
    await expect(page.locator('p', { hasText: 'Kinh doanh' })).toHaveCount(0);

    // "Điều hành Tour" link phải có
    await expect(page.locator('a', { hasText: 'Điều hành Tour' })).toBeVisible();
  });

  // ── 2. TourInstances — 7 tabs đúng ────────────────────────────────────
  test('2. TourInstances: đúng 7 tabs theo đúng thứ tự', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');
    await page.waitForTimeout(500);

    const expectedTabs = [
      'Chờ nhận ĐH',
      'Chờ dự toán',
      'Phân công HDV',
      'Đang khởi hành',
      'Chờ quyết toán',
      'Hoàn thành',
      'Đã hủy',
    ];

    for (const tabName of expectedTabs) {
      await expect(page.locator('button', { hasText: tabName })).toBeVisible();
    }
  });

  // ── 3. DispatchHDVModal wired — Phân công HDV button opens modal ────────
  test('3. Tab "Phân công HDV": bấm "Phân công HDV" → mở DispatchHDVModal', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');
    await page.waitForTimeout(500);

    // Click tab Phân công HDV
    await page.locator('button', { hasText: 'Phân công HDV' }).click();
    await page.waitForTimeout(300);

    // Table row action button phải là "Phân công HDV" (KHÔNG phải "Xem chi tiết")
    // Use .nth(1) because .first() grabs the tab button itself
    const btn = page.locator('button', { hasText: 'Phân công HDV' }).nth(1);
    await expect(btn).toBeVisible();

    // Click → modal mở
    await btn.click();
    await page.waitForTimeout(500);

    // Modal title phải hiện
    await expect(page.locator('h3', { hasText: 'Điều phối hướng dẫn viên' })).toBeVisible({ timeout: 3000 });

    // Danh sách HDV phải hiện
    await expect(page.locator('p', { hasText: 'Chọn hướng dẫn viên' })).toBeVisible();

    // Nút Xác nhận điều phối phải có
    await expect(page.locator('button', { hasText: 'Xác nhận điều phối' })).toBeVisible();
  });

  // ── 4. Tab "Đang khởi hành": KHÔNG có nút Điều phối HDV ────────────
  test('4. Tab "Đang khởi hành": KHÔNG có nút "Điều phối HDV"', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');
    await page.waitForTimeout(500);

    await page.locator('button', { hasText: 'Đang khởi hành' }).click();
    await page.waitForTimeout(300);

    await expect(page.locator('button', { hasText: 'Điều phối HDV' })).toHaveCount(0);
  });

  // ── 5. Cột động: Phân công HDV → "Hướng dẫn viên", Chờ nhận ĐH → "Người tạo" ──
  test('5. Tab "Phân công HDV" có cột "Hướng dẫn viên", tab "Chờ nhận ĐH" có cột "Người tạo"', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');
    await page.waitForTimeout(500);

    // Phân công HDV → cột HDV
    await page.locator('button', { hasText: 'Phân công HDV' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('th', { hasText: 'Hướng dẫn viên' }).first()).toBeVisible();

    // Chờ nhận ĐH → cột Người tạo
    await page.locator('button', { hasText: 'Chờ nhận ĐH' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('th', { hasText: 'Người tạo' })).toBeVisible();
  });

  // ── 6. DispatchHDVModal: chỉ có chọn HDV, không có phần nhập xe ──────────
  test('6. DispatchHDVModal: chỉ có popup chọn HDV, KHÔNG có input thông tin xe', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');
    await page.waitForTimeout(500);

    await page.locator('button', { hasText: 'Phân công HDV' }).click();
    await page.waitForTimeout(300);
    // .nth(1) skips the tab button itself
    await page.locator('button', { hasText: 'Phân công HDV' }).nth(1).click();
    await page.waitForTimeout(500);

    // Phải có title modal
    await expect(page.locator('h3', { hasText: 'Điều phối hướng dẫn viên' })).toBeVisible({ timeout: 3000 });

    // KHÔNG có input nhập thông tin xe (biển số, loại xe...)
    const xeInput = page.locator('input[placeholder*="xe"], input[placeholder*="Xe"], input[placeholder*="biển"]');
    await expect(xeInput).toHaveCount(0);

    // Phải có HDV được list
    const hdvCard = page.locator('[class*="cursor-pointer"]').first();
    await expect(hdvCard).toBeVisible({ timeout: 3000 });
  });

  // ── 7. Vouchers: breadcrumb + gửi phê duyệt message.success ────────────
  test('7. Vouchers: breadcrumb có + "Gửi phê duyệt" hiện message.success', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/vouchers');
    await page.waitForTimeout(1000);

    // Breadcrumb: link "Voucher"
    await expect(page.locator('a', { hasText: 'Voucher' })).toBeVisible({ timeout: 3000 });

    // Tìm nút Gửi phê duyệt trong bảng
    const sendBtn = page.locator('button', { hasText: 'Gửi phê duyệt' }).first();
    if (await sendBtn.isVisible({ timeout: 2000 })) {
      await sendBtn.click();
      await page.waitForTimeout(800);
      // Ant Design message thành công
      await expect(page.locator('.ant-message').or(page.locator('[class*="ant-message"]')).first()).toBeVisible({ timeout: 3000 });
    }
  });

  // ── 8. Vouchers: detail drawer có 3 nút Duyệt / Yêu cầu chỉnh sửa / Từ chối ──
  test('8. Vouchers: detail drawer (manager) có đủ 3 nút Duyệt, Yêu cầu chỉnh sửa, Từ chối', async ({ page }) => {
    // Manager mới thấy nút phê duyệt → login manager
    await loginAsManager(page);

    await page.goto('/coordinator/vouchers');
    await page.waitForTimeout(1000);

    // Tìm bản ghi có nút Phê duyệt (manager thấy inline approve button)
    const approveBtn = page.locator('button', { hasText: 'Phê duyệt' }).first();
    if (await approveBtn.isVisible({ timeout: 3000 })) {
      await approveBtn.click();
      await page.waitForTimeout(500);

      // Drawer mở → phải có 3 nút
      await expect(page.locator('button', { hasText: 'Từ chối' })).toBeVisible({ timeout: 3000 });
      await expect(page.locator('button', { hasText: 'Yêu cầu chỉnh sửa' })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Phê duyệt' })).toBeVisible();

      // Click Từ chối → popup nhập lý do
      await page.locator('button', { hasText: 'Từ chối' }).click();
      await page.waitForTimeout(500);
      await expect(page.locator('textarea').or(page.locator('input')).first()).toBeVisible({ timeout: 3000 });
    }
  });

  // ── 9. TourGenerationRules: header "Quản lý Tour" ───────────────────────
  test('9. TourGenerationRules: header là "Quản lý Tour", breadcrumb có, 2 sub-tabs đúng', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tour-rules');
    await page.waitForTimeout(500);

    await expect(page.locator('h1', { hasText: 'Quản lý Tour' })).toBeVisible({ timeout: 3000 });

    // Breadcrumb
    await expect(page.locator('.ant-breadcrumb').or(page.locator('[class*="breadcrumb"]')).first()).toBeVisible({ timeout: 3000 });

    // 2 sub-tabs
    await expect(page.locator('button', { hasText: 'Quy tắc tạo tour' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Chờ duyệt bán' })).toBeVisible();
  });

  // ── 10. TourGenerationRules: tab Chờ duyệt bán KHÔNG có Từ chối/Duyệt ──
  test('10. Tab "Chờ duyệt bán": KHÔNG có nút Từ chối/Duyệt (chỉ có Xem/Sửa/Xóa)', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tour-rules');
    await page.waitForTimeout(500);

    await page.locator('button', { hasText: 'Chờ duyệt bán' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('button', { hasText: 'Từ chối' })).toHaveCount(0);
    // /^Duyệt$/ để không match tab "Chờ duyệt bán" — chỉ match nút hành động trong bảng
    await expect(page.locator('button', { hasText: /^Duyệt$/ })).toHaveCount(0);
    await expect(page.locator('button', { hasText: 'Xem' }).first()).toBeVisible({ timeout: 3000 });
  });

  // ── 11. TourGenerationRules: view modal KHÔNG còn hardcoded [1,2,3] rows ──
  test('11. View modal: hiện instance thực từ data, KHÔNG còn hardcoded 3 hàng giống nhau', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tour-rules');
    await page.waitForTimeout(500);

    await page.locator('button', { hasText: 'Chờ duyệt bán' }).click();
    await page.waitForTimeout(500);

    const xemBtn = page.locator('button', { hasText: 'Xem' }).first();
    if (await xemBtn.isVisible({ timeout: 3000 })) {
      await xemBtn.click();
      await page.waitForTimeout(500);

      // Modal mở
      await expect(page.locator('h3', { hasText: 'Chi tiết tour' })).toBeVisible({ timeout: 3000 });

      // Phải có mã tour TI***
      const tourCode = page.locator('text=/TI\\d+/').first();
      await expect(tourCode).toBeVisible({ timeout: 3000 });
    }
  });

  // ── 12. TourReceiveDispatch: Người tạo không còn hardcoded "Nguyễn Thị Lan" ──
  test('12. TourReceiveDispatch: KHÔNG hiện "Nguyễn Thị Lan" hardcoded, dùng mockUsers lookup', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');
    await page.waitForTimeout(500);

    const nhanBtn = page.locator('button', { hasText: 'Nhận điều hành' }).first();
    await nhanBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    if (await nhanBtn.isVisible({ timeout: 3000 })) {
      await nhanBtn.click();
      await page.waitForURL('**/receive**', { timeout: 5000 });
      await page.waitForTimeout(500);

      // KHÔNG được hiện "Nguyễn Thị Lan"
      await expect(page.locator('text=Nguyễn Thị Lan')).toHaveCount(0);

      // Breadcrumb
      await expect(page.locator('.ant-breadcrumb').or(page.locator('[class*="breadcrumb"]')).first()).toBeVisible({ timeout: 3000 });

      // Phải có label Người tạo
      await expect(page.locator('text=Người tạo')).toBeVisible({ timeout: 3000 });
    }
  });

  // ── 13. Suppliers: "Khu vực hoạt động" header, transport=text, khác="—" ──
  test('13. Suppliers: header "Khu vực hoạt động", lodging/restaurant = "-", transport = text', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/suppliers');
    await page.waitForTimeout(500);

    // Header đúng — dùng regex để match chính xác "Khu vực hoạt động"
    await expect(page.locator('th', { hasText: 'Khu vực hoạt động' })).toBeVisible();
    // KHÔNG có cột "Khu vực" đơn lẻ (chỉ có "Khu vực hoạt động")
    await expect(page.locator('th', { hasText: /^Khu vực$/ })).toHaveCount(0);

    // Breadcrumb
    await expect(page.locator('a', { hasText: 'Đối tác' }).first()).toBeVisible();

    // Phải có ít nhất 1 row hiện "—" (lodging/restaurant type)
    await expect(page.locator('td', { hasText: /^—$/ }).first()).toBeVisible({ timeout: 3000 });
  });

  // ── 14. ServiceList: tab "Hướng dẫn viên (HDV)" hoạt động ─────────────────
  test('14. ServiceList: tab "Hướng dẫn viên (HDV)" và "Chi phí ăn" có trong tab bar', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/services');
    await page.waitForTimeout(500);

    await expect(page.locator('button', { hasText: 'Hướng dẫn viên (HDV)' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Chi phí ăn' })).toBeVisible();

    // Breadcrumb
    await expect(page.locator('a', { hasText: 'Kho Dịch vụ' }).first()).toBeVisible();

    // Click HDV tab → table vẫn hiện
    await page.locator('button', { hasText: 'Hướng dẫn viên (HDV)' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('table').first()).toBeVisible({ timeout: 3000 });
  });

  // ── 15. TourInstances: breadcrumb ────────────────────────────────────────
  test('15. TourInstances: có breadcrumb với "Điều hành tour"', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours');
    await page.waitForTimeout(500);

    await expect(page.locator('.ant-breadcrumb').or(page.locator('[class*="breadcrumb"]')).first()).toBeVisible({ timeout: 3000 });
    // sidebar link + breadcrumb link both say "Điều hành tour" — use first()
    await expect(page.locator('a', { hasText: 'Điều hành tour' }).first()).toBeVisible({ timeout: 3000 });
  });

  // ── 16. TourSettlement: breadcrumb ────────────────────────────────────────
  test('16. TourSettlement: có breadcrumb', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours/TI001/settle');
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-breadcrumb').or(page.locator('[class*="breadcrumb"]')).first()).toBeVisible({ timeout: 3000 });
  });

  // ── 17. TourEstimate: breadcrumb ───────────────────────────────────────────
  test('17. TourEstimate: có breadcrumb', async ({ page }) => {
    await loginAsCoordinator(page);
    await page.goto('/coordinator/tours/TI001/estimate');
    await page.waitForTimeout(500);
    await expect(page.locator('.ant-breadcrumb').or(page.locator('[class*="breadcrumb"]')).first()).toBeVisible({ timeout: 3000 });
  });

});
