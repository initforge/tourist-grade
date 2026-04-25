import { expect, test, type Page } from '@playwright/test';
import { loginAs, type TestRole } from './support/app';

const BAD_TEXT = /(?:Ãƒ|Ã‚|Ã„|Ã’|Â©|Â·|Ä|Äƒ|áº|á»|Æ°|Æ¡|ï¿½|\?\?|Kh\?|H\? N\?i|Tr\? em)/;
const SAFE_BUTTON = /^(Nhân viên|Khách hàng|Tất cả|Cần xác nhận|Đã xác nhận|Hoàn thành|Đã hủy|Chờ|Đang|Không|Hủy|Đóng|Xem|Chi tiết|Sửa|Lưu nháp|Tiếp theo|Quay lại|Dự toán|Tổng quan|Khách|Lịch trình|Giá|Mở rộng|Thu gọn|Ngày khác|Giá tour bao gồm|Chính sách hủy tour|Thông tin khác|Áp dụng|Tìm kiếm|search|clear|menu_open|menu)$/i;
const UNSAFE_BUTTON = /(Đăng Xuất|Xóa|Khóa|Mở khóa|Phê duyệt|Từ chối|Xác nhận|Thanh toán|Đặt ngay|Gửi|Hoàn tiền|Điều phối|Phân công|Tạo|Thêm|Cập Nhật Mật Khẩu)/i;

const ROUTES: Array<{ role?: TestRole; path: string; label: string }> = [
  { path: '/', label: 'public landing' },
  { path: '/tours', label: 'public tours' },
  { path: '/tours/kham-pha-vinh-ha-long-du-thuyen-5-sao', label: 'tour detail' },
  { path: '/booking/lookup', label: 'booking lookup' },
  { path: '/blog', label: 'blog list' },
  { path: '/about', label: 'about' },
  { role: 'customer', path: '/customer/bookings', label: 'customer bookings' },
  { role: 'customer', path: '/customer/bookings/B001', label: 'customer booking detail' },
  { role: 'customer', path: '/customer/wishlist', label: 'customer wishlist' },
  { role: 'customer', path: '/customer/profile', label: 'customer profile' },
  { role: 'admin', path: '/admin/users', label: 'admin users' },
  { role: 'sales', path: '/sales/dashboard', label: 'sales dashboard' },
  { role: 'sales', path: '/sales/bookings', label: 'sales bookings' },
  { role: 'sales', path: '/sales/bookings/B001', label: 'sales booking detail' },
  { role: 'sales', path: '/sales/vouchers', label: 'sales vouchers' },
  { role: 'sales', path: '/sales/vouchers/VOU-06', label: 'sales voucher detail' },
  { role: 'manager', path: '/manager/dashboard', label: 'manager dashboard' },
  { role: 'manager', path: '/manager/tour-programs', label: 'manager programs' },
  { role: 'manager', path: '/manager/tour-programs/TP001', label: 'manager program detail' },
  { role: 'manager', path: '/manager/tour-programs/TP003/approval', label: 'manager program approval' },
  { role: 'manager', path: '/manager/tours', label: 'manager active tours' },
  { role: 'manager', path: '/manager/tours/TI003/estimate-approval', label: 'manager estimate approval' },
  { role: 'manager', path: '/manager/voucher-approval', label: 'manager voucher approval' },
  { role: 'manager', path: '/manager/cancel-policies', label: 'manager cancel policies' },
  { role: 'manager', path: '/manager/special-days', label: 'manager special days' },
  { role: 'coordinator', path: '/coordinator/dashboard', label: 'coordinator dashboard' },
  { role: 'coordinator', path: '/coordinator/tour-programs', label: 'coordinator programs' },
  { role: 'coordinator', path: '/coordinator/tour-programs/TP001', label: 'coordinator program detail' },
  { role: 'coordinator', path: '/coordinator/tour-programs/TP003/receive', label: 'coordinator receive' },
  { role: 'coordinator', path: '/coordinator/tour-rules', label: 'coordinator rules' },
  { role: 'coordinator', path: '/coordinator/tours', label: 'coordinator tours' },
  { role: 'coordinator', path: '/coordinator/tours/TI009/estimate', label: 'coordinator estimate' },
  { role: 'coordinator', path: '/coordinator/tours/TI004/settle', label: 'coordinator settlement' },
  { role: 'coordinator', path: '/coordinator/services', label: 'coordinator services' },
  { role: 'coordinator', path: '/coordinator/suppliers', label: 'coordinator suppliers' },
];

function installConsoleAudit(page: Page) {
  const issues: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !text.includes('401') && !text.includes('favicon')) issues.push(text);
  });
  page.on('pageerror', (error) => issues.push(error.message));
  return issues;
}

async function expectCleanSurface(page: Page, label: string, issues: string[]) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => null);
  const text = await page.locator('body').innerText();
  expect.soft(text, `${label} visible text has mojibake`).not.toMatch(BAD_TEXT);
  expect.soft(issues, `${label} console/page errors`).toEqual([]);
}

async function exerciseInputs(page: Page) {
  const textboxes = page.locator('input:not([type="password"]):not([type="date"]):not([type="file"]):not([readonly]), textarea:not([readonly])');
  const count = Math.min(await textboxes.count(), 4);
  for (let index = 0; index < count; index += 1) {
    const input = textboxes.nth(index);
    if (!(await input.isVisible().catch(() => false)) || !(await input.isEnabled().catch(() => false))) continue;
    const placeholder = await input.getAttribute('placeholder').catch(() => '') ?? '';
    const value = await input.inputValue().catch(() => '');
    if (/email|mật khẩu|password|cccd|passport|phone|số điện thoại/i.test(placeholder)) continue;
    await input.fill('test', { timeout: 1000 }).catch(() => null);
    await page.waitForTimeout(100);
    await input.fill(value, { timeout: 1000 }).catch(() => null);
  }
}

async function exerciseSelects(page: Page) {
  const selects = page.locator('select:not([disabled])');
  const count = Math.min(await selects.count(), 3);
  for (let index = 0; index < count; index += 1) {
    const select = selects.nth(index);
    if (!(await select.isVisible().catch(() => false))) continue;
    const options = await select.locator('option').evaluateAll((items) => items.map((item) => (item as HTMLOptionElement).value).filter(Boolean));
    if (options.length > 1) {
      const current = await select.inputValue();
      await select.selectOption(options[1], { timeout: 1000 }).catch(() => null);
      await page.waitForTimeout(100);
      await select.selectOption(current, { timeout: 1000 }).catch(() => null);
    }
  }
}

async function exerciseSafeButtons(page: Page) {
  const buttons = page.getByRole('button');
  const count = Math.min(await buttons.count(), 8);
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    if (!(await button.isVisible().catch(() => false)) || !(await button.isEnabled().catch(() => false))) continue;
    const name = ((await button.innerText().catch(() => '')) || (await button.getAttribute('aria-label').catch(() => '')) || '').trim();
    if (!name || UNSAFE_BUTTON.test(name) || !SAFE_BUTTON.test(name)) continue;
    await button.click({ timeout: 1000 }).catch(() => null);
    await page.waitForTimeout(150);
    const dialog = page.getByRole('dialog');
    if (await dialog.first().isVisible().catch(() => false)) {
      await page.keyboard.press('Escape').catch(() => null);
      await page.getByRole('button', { name: /Hủy|Đóng|Không|Quay lại/i }).first().click().catch(() => null);
    }
  }
}

test.describe.serial('UI surface interaction audit', () => {
  test.setTimeout(180000);

  for (const route of ROUTES) {
    test(`${route.label}: visible controls are stable`, async ({ page }) => {
      const issues = installConsoleAudit(page);
      if (route.role) await loginAs(page, route.role, route.path);
      else await page.goto(route.path);
      await expectCleanSurface(page, route.label, issues);
      await exerciseInputs(page);
      await exerciseSelects(page);
      await exerciseSafeButtons(page);
      await expectCleanSurface(page, `${route.label} after interactions`, issues);
    });
  }
});
