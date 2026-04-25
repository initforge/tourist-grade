import { expect, test, type Page } from '@playwright/test';
import { loginAs } from './support/app';

async function loginAsAdmin(page: Page) {
  await loginAs(page, 'admin', '/admin/users');
}

test.describe('Admin Users Verification', () => {
  test('Row 26: admin users are split into staff and customer tabs with the correct actions', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole('heading', { name: /Qu.*n l.* Ng/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Nh.*n vi.*n$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Kh.*ch h.*ng$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Th.*m t.*i kho.*n/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Vai tr./i })).toBeVisible();

    const adminRow = page.getByRole('row', { name: /Qu.*n Tr.* Vi.*n/i });
    await expect(adminRow).toBeVisible();
    await expect(adminRow.getByText(/^Admin$/)).toBeVisible();
    await expect(page.getByText(/Kh.*ch H.*ng Demo/i)).toHaveCount(0);

    await page.getByRole('button', { name: /Th.*m t.*i kho.*n/i }).click();
    const drawer = page.getByRole('dialog', { name: /Th.*m T.*i Kho.*n M.*i/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/Kh.*ch h.*ng/i)).toHaveCount(0);
    await drawer.getByRole('button', { name: /H.y b./i }).click();

    await page.getByRole('button', { name: /^Kh.*ch h.*ng$/i }).click();
    await expect(page.getByRole('button', { name: /Th.*m t.*i kho.*n/i })).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: /L.ch s. .*n .*t/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /T.ng s. ti.n .* chi/i })).toBeVisible();
    await expect(page.getByText('customer@travela.vn')).toBeVisible();
    await expect(page.getByText(/.n th.nh c.ng/i)).toBeVisible();
    await expect(page.getByLabel(/Ch.nh s.a/i)).toHaveCount(0);

    const customerRow = page.getByRole('row', { name: /customer@travela.vn/i });
    await customerRow.getByLabel(/Xem chi ti.t/i).click();
    const historyDialog = page.getByRole('dialog', { name: /Chi ti.t kh.*ch h.*ng/i });
    await expect(historyDialog).toBeVisible();
    await expect(historyDialog.getByText(/S. .*n th.nh c.ng/i)).toBeVisible();
    await expect(historyDialog.getByText(/S. .*n h.y/i)).toBeVisible();
    await expect(historyDialog.getByText(/T.ng s. ti.n .* chi/i)).toBeVisible();
    await expect(historyDialog.getByText('BK-847291')).toBeVisible();
    await historyDialog.getByRole('button').first().click();

    const toggleButton = customerRow.getByRole('button').last();
    await toggleButton.click();
    let confirmDialog = page.locator('.ant-modal').last();
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /Kh.* t.*i kho.*n/i }).click();
    await expect(customerRow.getByText(/. kh.a/i)).toBeVisible();

    await customerRow.getByRole('button').last().click();
    confirmDialog = page.locator('.ant-modal').last();
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /M.* kh.* t.*i kho.*n/i }).click();
    await expect(customerRow.getByText(/Ho.t .*ng/i)).toBeVisible();
  });
});
