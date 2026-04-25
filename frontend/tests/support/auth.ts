import type { Page } from '@playwright/test';

export type TestRole = 'admin' | 'customer' | 'sales' | 'coordinator' | 'manager';

const CREDENTIALS: Record<TestRole, { email: string; password: string; defaultPath: string }> = {
  admin: {
    email: 'admin@travela.vn',
    password: '123456',
    defaultPath: '/admin/users',
  },
  manager: {
    email: 'manager@travela.vn',
    password: '123456',
    defaultPath: '/manager/dashboard',
  },
  coordinator: {
    email: 'coordinator@travela.vn',
    password: '123456',
    defaultPath: '/coordinator/dashboard',
  },
  sales: {
    email: 'sales@travela.vn',
    password: '123456',
    defaultPath: '/sales/dashboard',
  },
  customer: {
    email: 'customer@travela.vn',
    password: '123456',
    defaultPath: '/',
  },
};

async function clearClientState(page: Page) {
  await page.evaluate(() => {
    localStorage?.removeItem('__travela_auth_tokens');
    localStorage?.removeItem('__travela_bookings');
    localStorage?.removeItem('__travela_sales_vouchers');
    localStorage?.removeItem('__travela_sales_vouchers_seed_version');
    localStorage?.removeItem('__travela_tour_programs');
  });
}

export async function loginAsRole(page: Page, role: TestRole, destination?: string) {
  const credentials = CREDENTIALS[role];

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await clearClientState(page);
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[type="email"]').fill(credentials.email);
  await page.locator('input[type="password"]').fill(credentials.password);

  await page.getByRole('button', { name: /Đăng Nhập|Đăng nhập|Dang Nhap|Dang nhap/i }).click();
  await page.waitForFunction(() => {
    const hasTokens = Boolean(localStorage?.getItem('__travela_auth_tokens'));
    return hasTokens || !window.location.pathname.endsWith('/login');
  }, undefined, { timeout: 15000 });
  await page.waitForFunction(() => !window.location.pathname.endsWith('/login'), undefined, { timeout: 15000 }).catch(() => null);
  await page.waitForResponse((response) => response.url().includes('/api/v1/bootstrap') && response.ok(), { timeout: 15000 }).catch(() => null);
  await page.waitForLoadState('networkidle').catch(() => null);

  if (destination) {
    await page.goto(destination);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle').catch(() => null);
    return;
  }

  if (credentials.defaultPath !== '/') {
    await page.waitForURL((url) => url.pathname.startsWith(credentials.defaultPath));
  }
}
