import { expect, test, type Page, type TestInfo } from '@playwright/test';

const BASE_URL = process.env.FEEDBACK_BASE_URL ?? '';
const HALONG_TOUR = '/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao';

function appUrl(path: string) {
  return BASE_URL ? new URL(path, BASE_URL).toString() : path;
}

async function loginAs(page: Page, role: 'customer' | 'sales' | 'coordinator' | 'manager') {
  await page.goto(appUrl('/'));
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((selectedRole) => {
    localStorage?.removeItem('__travela_bookings');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin(selectedRole);
  }, role);
}

async function lookupBooking(page: Page, code: string, contact: string) {
  await page.getByPlaceholder('VD: BK-582910').fill(code);
  await page.getByPlaceholder('0988 123 456').fill(contact);
  await page.getByRole('button', { name: /Tra Cuu Thong Tin|Tra Cứu Thông Tin/i }).click();
}

function installRuntimeAudit(page: Page) {
  const issues: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push(`console.error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText ?? '';
    const resourceType = request.resourceType();
    const isNavigationAbort = errorText === 'net::ERR_ABORTED' && ['image', 'font'].includes(resourceType);
    if (!url.startsWith('data:') && !url.startsWith('blob:') && !isNavigationAbort) {
      issues.push(`requestfailed: ${request.resourceType()} ${url} ${request.failure()?.errorText ?? ''}`);
    }
  });
  page.on('response', (response) => {
    const resourceType = response.request().resourceType();
    if (['document', 'script', 'stylesheet', 'fetch', 'xhr', 'image'].includes(resourceType) && response.status() >= 400) {
      issues.push(`http ${response.status()}: ${resourceType} ${response.url()}`);
    }
  });

  return issues;
}

async function expectCleanRuntime(issues: string[], testInfo: TestInfo) {
  await testInfo.attach('runtime-audit', {
    body: issues.length ? issues.join('\n') : 'clean',
    contentType: 'text/plain',
  });
  expect(issues).toEqual([]);
}

async function expectNoBodyHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

async function expectImagesLoaded(page: Page, selector = 'img') {
  await page.waitForFunction((targetSelector) => {
    const images = Array.from(document.querySelectorAll(targetSelector)) as HTMLImageElement[];
    return images.every((image) => !image.src || (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0));
  }, selector, { timeout: 15000 });
  const brokenImages = await page.locator(selector).evaluateAll((images) =>
    images
      .map((image) => {
        const img = image as HTMLImageElement;
        return { src: img.currentSrc || img.src, width: img.naturalWidth, height: img.naturalHeight };
      })
      .filter((image) => image.src && (image.width === 0 || image.height === 0)),
  );
  expect(brokenImages).toEqual([]);
}

test.describe('Feedback hardening audit', () => {
  test('public customer routes are visible, clickable, responsive, and runtime-clean', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl('/tours'));
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Tour Nội Địa|Hành Trình Tuyệt Tác/i })).toBeVisible();
    await expectNoBodyHorizontalOverflow(page);
    await expectImagesLoaded(page, 'img');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(appUrl(HALONG_TOUR));
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Khám Phá Vịnh Hạ Long/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Lịch khởi hành/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Đặt ngay/i })).toBeVisible();
    await page.getByRole('row', { name: /01\/05\/2026/ }).click();
    await page.getByRole('button', { name: /Giá tour bao gồm/i }).click();
    await expect(page.getByText(/Xe Limousine đưa đón khứ hồi/i)).toBeVisible();
    await expectImagesLoaded(page, 'img');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => null);

    await page.goto(appUrl(`${HALONG_TOUR}/book?scheduleId=DS001-4`));
    await page.waitForLoadState('domcontentloaded');
    await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn A');
    await page.getByPlaceholder('0901 234 567').fill('0901234567');
    await page.getByPlaceholder('email@example.com').fill('nguyenvana@example.com');
    await page.getByRole('radio', { name: /Nam/i }).first().check();
    await page.getByPlaceholder('Đúng theo CCCD/Passport').fill('Nguyễn Văn A');
    await page.locator('input[type="date"]').first().fill('1990-01-01');
    await page.locator('section').filter({ hasText: /Thông tin hành khách/i }).getByRole('checkbox', { name: /Phòng đơn/i }).check();
    await page.getByRole('button', { name: /Tiếp tục: Thanh toán/i }).first().click();
    await expect(page.getByRole('button', { name: /Thanh toán ?.*đ/i })).toBeVisible();

    await page.goto(appUrl('/booking/lookup'));
    await page.waitForLoadState('domcontentloaded');
    await lookupBooking(page, 'BK-394821', '0912345678');
    await page.getByRole('region', { name: /Kết quả tra cứu đơn đặt/i }).getByRole('button', { name: /Hủy/i }).click();
    const cancelDialog = page.getByRole('dialog', { name: /Gửi yêu cầu hủy/i });
    await expect(cancelDialog).toBeVisible();
    const dialogBox = await cancelDialog.boundingBox();
    const viewport = page.viewportSize();
    expect(dialogBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(dialogBox!.height).toBeLessThanOrEqual(viewport!.height * 0.92);

    await expectCleanRuntime(issues, testInfo);
  });

  test('sales routes allow the revised booking/voucher/report interactions without runtime errors', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await loginAs(page, 'sales');
    await page.goto(appUrl('/sales/bookings'));
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Quản lý Booking/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Tìm kiếm mã đơn/i)).toBeVisible();
    await page.getByPlaceholder(/Tìm kiếm mã đơn/i).fill('BK-');
    await expect(page.getByText(/Hiển thị/i)).toBeVisible();

    await page.goto(appUrl('/sales/bookings/B003?tab=pending_confirm'));
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /Đơn hàng #BK-394821/i })).toBeVisible();
    await page.getByLabel(/^Đơn$/i).fill('1');
    await page.getByLabel(/^Đôi$/i).fill('1');
    await page.getByLabel(/^Ba$/i).fill('0');
    await page.getByRole('button', { name: /Lưu/i }).first().click();
    await page.getByRole('button', { name: /Chỉnh sửa$/i }).first().click();
    const passengerDialog = page.getByRole('dialog');
    await passengerDialog.locator('input[placeholder="Số GKS"]').fill('GKS-2018-0001');
    await passengerDialog.getByRole('button', { name: /Lưu/i }).click();
    await expect(page.getByRole('button', { name: /Xác nhận đơn đặt/i })).toBeEnabled();

    await page.goto(appUrl('/sales/vouchers'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Tạo Voucher Mới/i }).click();
    await expect(page.getByRole('dialog').getByRole('button', { name: /Gửi phê duyệt/i })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Đóng|Hủy/i }).first().click();
    await page.goto(appUrl('/sales/vouchers/VOU-05'));
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /PROMO10PCT/i })).toBeVisible();
    await expect(page.getByText(/Thời gian áp dụng/i)).toBeVisible();

    await page.goto(appUrl('/sales/dashboard'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Xuất Báo Cáo/i }).click();
    await expect(page.getByRole('dialog').getByText(/Chọn loại báo cáo/i)).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Hủy/i }).click();

    await expectCleanRuntime(issues, testInfo);
  });

  test('coordinator routes support program, estimate, settlement, service, and supplier workflows cleanly', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await loginAs(page, 'coordinator');
    await page.goto(appUrl('/coordinator/tour-programs/create'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Mùa lễ/i).check();
    await page.getByLabel(/Dịp lễ/i).selectOption('Giỗ Tổ Hùng Vương');
    await page.getByRole('button', { name: /6\s*Giỗ Tổ Hùng Vương/i }).click();
    await expect(page.getByText(/1 ngày đã chọn/i)).toBeVisible();

    await page.goto(appUrl('/coordinator/tour-rules'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /^Tạo tour$/ }).first().click();
    await expect(page.getByRole('dialog').getByText(/Preview danh sách tour/i)).toBeVisible();
    await page.keyboard.press('Escape');

    await page.goto(appUrl('/coordinator/tours/TI009/estimate'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Danh sách khách hàng/i }).click();
    await page.locator('button', { hasText: /BK-/ }).first().click();
    await expect(page.getByRole('dialog').getByText(/Cơ cấu phòng/i)).toBeVisible();
    await page.getByRole('dialog').getByRole('button').first().click();
    await page.getByRole('button', { name: /Dự toán/i }).click();
    await page.getByRole('button', { name: /Chỉnh sửa giá/i }).first().click();
    await expect(page.getByRole('dialog').getByText(/Nhà cung cấp:/i)).toBeVisible();

    await page.goto(appUrl('/coordinator/tours/TI004/settle'));
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('spinbutton').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Thêm dịch vụ|Thêm mới/i })).toHaveCount(0);

    await page.goto(appUrl('/coordinator/services'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Thêm dịch vụ/i }).click();
    await expect(page.getByRole('dialog').getByLabel(/Phân loại/i)).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Hủy bỏ/i }).click();

    await page.goto(appUrl('/coordinator/suppliers'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Thêm nhà cung cấp/i }).click();
    await page.getByLabel(/Phân loại/i).selectOption('Vận chuyển');
    await page.getByRole('button', { name: /Thêm dịch vụ/i }).click();
    await page.getByLabel(/Tên nhà cung cấp/i).fill('NCC vận chuyển hardening');
    await page.getByLabel(/Khu vực hoạt động/i).fill('Hà Nội');
    await page.getByLabel(/Số điện thoại/i).fill('0909000000');
    await page.getByLabel(/Email/i).fill('qa-hardening@travela.vn');
    await page.getByLabel(/Năm thành lập/i).fill('2020');
    await page.getByLabel(/Địa chỉ/i).fill('12 phố Kiểm Thử');
    await page.getByLabel(/Mô tả/i).first().fill('Nhà cung cấp hardening hiển thị đủ trường.');
    await page.getByRole('button', { name: /Lưu nhà cung cấp/i }).click();
    await expect(page.getByRole('dialog').getByText(/NCC vận chuyển hardening/i)).toBeVisible();
    await page.getByRole('dialog').locator('button').first().click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('button', { name: /Hướng dẫn viên/i }).click();
    await expect(page.getByRole('button', { name: /Thêm HDV/i })).toBeVisible();
    await page.getByRole('button', { name: /Thêm HDV/i }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: /Thêm hướng dẫn viên/i })).toBeVisible();
    await expect(page.getByRole('dialog').getByText(/Ngoại ngữ/i)).toBeVisible();

    await expectCleanRuntime(issues, testInfo);
  });

  test('manager approval routes open the richer dialogs and stay runtime-clean', async ({ page }, testInfo) => {
    const issues = installRuntimeAudit(page);

    await loginAs(page, 'manager');
    await page.goto(appUrl('/manager/tours'));
    await page.waitForLoadState('domcontentloaded');
    await page.locator('tbody tr').first().getByRole('button').first().click();
    const approveDialog = page.getByRole('dialog');
    await expect(approveDialog).toBeVisible();
    await expect(approveDialog.getByRole('button', { name: /Y.*u c.*u s.*a/i })).toBeVisible();
    await approveDialog.getByRole('button', { name: /Y.*u c.*u s.*a/i }).click();
    const requestEditDialog = page.locator('[role="dialog"]').last();
    await expect(requestEditDialog.getByRole('heading', { name: /Y.*u c.*u s.*a/i })).toBeVisible();
    await requestEditDialog.getByRole('button', { name: /H.*y b.*/i }).click();

    await page.goto(appUrl('/manager/tours'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Kh.*ng .*K KH/i }).click();
    await expect(page.getByRole('button', { name: /Ti.*p t.*c tri.*n khai/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /L.*i nhu.*n d.* ki.*n/i })).toBeVisible();

    await page.goto(appUrl('/manager/tour-programs/TP003/approval'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Duyệt chương trình tour/i }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: /Duyệt chương trình tour/i })).toBeVisible();

    await page.goto(appUrl('/manager/tours/TI003/estimate-approval'));
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /Yêu cầu chỉnh sửa/i }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: /Yêu cầu chỉnh sửa/i })).toBeVisible();

    await page.goto(appUrl('/manager/dashboard'));
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('region', { name: /Công việc cần làm/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /Báo cáo quản lý/i })).toBeVisible();

    await expectCleanRuntime(issues, testInfo);
  });
});
