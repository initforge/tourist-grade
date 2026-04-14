import { expect, test } from '@playwright/test';

async function loginAsManager(page: any) {
  await page?.goto('/');
  await page?.waitForLoadState('domcontentloaded');
  await page?.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin('manager');
  });
}

test.describe('Manager remaining feedback', () => {
  test('tour management follows the revised tabs and insufficient-tour action flows', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tours');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('heading', { name: 'Quản lý Tour' }))?.toBeVisible();
    await expect(page?.locator('body'))?.not?.toContainText(/Quáº|KhÃ|Chá»|Duyá»|Ä/);
    await expect(page?.getByRole('button', { name: 'Không đủ ĐK KH' }))?.toBeVisible();

    for (const tab of [
      /Ch.* duy.*t b.*n/i,
      /Kh.*ng .*K KH/i,
      /Ch.* duy.*t d.* to.*n/i,
      /Ho.*n th.*nh/i,
      /.* h.*y/i,
    ]) {
      await expect(page?.getByRole('button', { name: tab }))?.toBeVisible();
    }
    await expect(page?.getByRole('button', { name: /.*ang tri.*n khai/i }))?.toHaveCount(0);

    await page?.locator('tbody tr')?.first()?.getByRole('button')?.first()?.click();
    const approveDialog = page?.getByRole('dialog');
    await expect(approveDialog)?.toBeVisible();
    await expect(approveDialog)?.not?.toContainText(/Quáº|KhÃ|Chá»|Duyá»|Ä/);
    await expect(approveDialog?.getByRole('button', { name: 'Duyệt' }))?.toBeVisible();
    await expect(approveDialog?.getByText(/.* ch.*n: \d+ tour/i).first())?.toBeVisible();
    await expect(approveDialog?.getByRole('button', { name: /Y.*u c.*u s.*a/i }))?.toBeVisible();
    await expect(approveDialog?.getByRole('button', { name: /T.* ch.*i/i }))?.toBeVisible();
    await approveDialog?.getByRole('button', { name: /Y.*u c.*u s.*a/i })?.click();
    const requestEditDialog = page?.locator('[role="dialog"]')?.last();
    await expect(requestEditDialog?.getByText(/Y.*u c.*u s.*a/i))?.toBeVisible();
    await requestEditDialog?.getByRole('button', { name: /H.*y b.*/i })?.click();

    await page?.goto('/manager/tours');
    await page?.waitForLoadState('domcontentloaded');

    await page?.getByRole('button', { name: /Kh.*ng .*K KH/i })?.click();
    await expect(page?.getByRole('button', { name: /Ti.*p t.*c tri.*n khai/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /L.*i nhu.*n d.* ki.*n/i }))?.toBeVisible();

    await page?.locator('tbody input[type="checkbox"]')?.first()?.check();
    await page?.getByRole('button', { name: /Ti.*p t.*c tri.*n khai/i })?.click();
    const continueDialog = page?.getByRole('dialog');
    await expect(continueDialog?.getByRole('heading', { name: /Ti.*p t.*c tri.*n khai tour/i }))?.toBeVisible();
    await expect(continueDialog?.getByRole('columnheader', { name: /Doanh thu hi.*n t.*i/i }))?.toBeVisible();
    await expect(continueDialog?.getByRole('button', { name: /B.* TI007/i }))?.toBeVisible();
    await continueDialog?.getByRole('button', { name: /B.* TI007/i })?.click();
    await expect(continueDialog)?.toHaveCount(0);

    await page?.locator('tbody input[type="checkbox"]')?.first()?.check();
    await page?.getByRole('button', { name: /H.*y tour/i })?.click();
    const cancelDialog = page?.getByRole('dialog');
    await expect(cancelDialog?.getByRole('heading', { name: /H.*y tour kh.*ng .*i.*u ki.*n/i }))?.toBeVisible();
    await cancelDialog?.getByRole('button', { name: /H.*y b.*/i })?.click();

    await page?.locator('tbody input[type="checkbox"]')?.first()?.check();
    await page?.getByRole('button', { name: /Gia h.*n/i })?.click();
    const extendDialog = page?.getByRole('dialog');
    await expect(extendDialog?.getByRole('heading', { name: /Gia h.*n b.*n/i }))?.toBeVisible();
    await expect(extendDialog?.getByRole('columnheader', { name: /Gia h.*n .*n ng.*y/i }))?.toBeVisible();
    await expect(extendDialog?.locator('input[type="date"]'))?.toBeVisible();
  });

  test('tour program approval is read-only and requires reject and approve dialogs', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tour-programs/TP003/approval');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByText(/Th.*ng tin chung/i))?.toBeVisible();
    await expect(page?.getByText(/L.*ch tr.*nh/i))?.toBeVisible();
    await expect(page?.getByText(/Gi.* & C.*u h.*nh/i))?.toBeVisible();
    await expect(page?.getByText('Người tạo', { exact: true }))?.toBeVisible();
    await expect(page?.getByText('Ngày tạo', { exact: true }))?.toBeVisible();
    await expect(page?.getByRole('textbox'))?.toHaveCount(0);
    await expect(page?.getByRole('spinbutton'))?.toHaveCount(0);
    await expect(page?.getByRole('button', { name: /L.*u nh.*p|Ti.*p theo|G.*i ph.* duy.*t/i }))?.toHaveCount(0);

    await page?.getByRole('button', { name: /T.* ch.*i/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /T.* ch.*i ch.*ng tr.*nh tour/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /H.*y b.*/i })?.click();

    await page?.getByRole('button', { name: /Duy.*t ch.*ng tr.*nh tour/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Duy.*t ch.*ng tr.*nh tour/i }))?.toBeVisible();
    await expect(page?.getByText(/.*ang ho.*t .*ng/i))?.toBeVisible();
  });

  test('tour estimate approval exposes request-edit, reject, and approve confirmation flows', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tours/TI003/estimate-approval');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('button', { name: /Y.*u c.*u ch.*nh s.*a/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /T.* ch.*i/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Duy.*t$/i }))?.toBeVisible();
    await expect(page?.getByText(/B.*ng d.* to.*n chi ph.*/i))?.toBeVisible();

    await page?.getByRole('button', { name: /Y.*u c.*u ch.*nh s.*a/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Y.*u c.*u ch.*nh s.*a/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /H.*y b.*/i })?.click();

    await page?.getByRole('button', { name: /Duy.*t$/i })?.click();
    await expect(page?.getByRole('dialog')?.getByRole('heading', { name: /Duy.*t d.* to.*n/i }))?.toBeVisible();
  });

  test('manager tour programs and catalog match the revised scope', async ({ page }) => {
    await loginAsManager(page);
    await page?.goto('/manager/tour-programs');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('button', { name: /Ch.* duy.*t/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /.*ang ho.*t .*ng/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Ng.*ng ho.*t .*ng/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /.*i.*m TQ/i }))?.toBeVisible();

    await page?.getByRole('button', { name: /Ng.*ng ho.*t .*ng/i })?.click();
    await expect(page?.getByRole('columnheader', { name: /Lo.*i tour/i }))?.toBeVisible();

    await page?.goto('/manager/dashboard');
    await expect(page?.getByRole('link', { name: /Ch.*nh s.*ch H.*y/i }))?.toHaveCount(0);
    await expect(page?.getByRole('region', { name: /C.*ng vi.*c c.*n l.*m/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /B.*o c.*o qu.*n l.*/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /C.*ng vi.*c c.*n l.*m/i })?.getByRole('heading', { name: /Ph.* duy.*t voucher/i }))?.toBeVisible();
    await expect(page?.getByRole('region', { name: /B.*o c.*o qu.*n l.*/i })?.getByText('Doanh số', { exact: true }))?.toBeVisible();

    await page?.goto('/manager/cancel-policies');
    await expect(page?.getByText('Chính sách cố định', { exact: true }))?.toBeVisible();
    await expect(page?.getByText(/kh.*ng c.*n danh s.*ch, th.*m m.*i ho.*c s.*a rule h.*y/i))?.toBeVisible();

    await page?.goto('/manager/special-days');
    await expect(page?.getByRole('heading', { name: /Ng.*y .*c bi.*t/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /D.*p .*c bi.*t/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ng.*y b.*t .*u/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ng.*y k.*t th.*c/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ghi ch.*/i }))?.toBeVisible();
  });
});
