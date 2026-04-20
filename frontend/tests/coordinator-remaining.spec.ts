import { expect, test } from '@playwright/test';

async function loginAsCoordinator(page: any) {
  await page?.goto('/');
  await page?.waitForLoadState('domcontentloaded');
  await page?.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.__authLogin('coordinator');
  });
}

test?.describe('Coordinator remaining feedback', () => {
  test('program management is separate from tour operations and has the required three tabs', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-programs');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('heading', { name: /Quản lý Chương trình tour/i }))?.toBeVisible();
    await expect(page?.getByPlaceholder(/Tìm theo mã chương trình/i))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Nháp/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Đang hoạt động/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Ngừng hoạt động/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Tạo mới/i }))?.toBeVisible();

    await page?.getByRole('button', { name: /Đang hoạt động/i })?.click();
    await expect(page?.getByRole('columnheader', { name: /Loại tour/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Đơn giá/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Người tạo chương trình tour/i }))?.toBeVisible();

    await page?.goto('/coordinator/tours');
    await expect(page?.getByPlaceholder(/Tìm theo mã tour/i))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Chờ nhận điều hành/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Phân công HDV/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Đang khởi hành/i }))?.toBeVisible();
  });

  test('tour program wizard keeps save/send approval on top and only next at the bottom', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-programs/create');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('button', { name: /Lưu nháp/i })?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Gửi phê duyệt/i })?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Tiếp theo/i }))?.toBeVisible();
  });

  test('tour program wizard next buttons stay enabled so users can inspect itinerary and pricing steps', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-programs/create');
    await page?.waitForLoadState('domcontentloaded');

    const nextToItinerary = page?.getByRole('button', { name: /Tiếp theo: Lịch trình/i });
    await expect(nextToItinerary)?.toBeEnabled();
    await nextToItinerary?.click();

    await expect(page?.getByRole('heading', { name: /Ngày 1/i }))?.toBeVisible();
    const nextToPricing = page?.getByRole('button', { name: /Tiếp theo: Giá & Cấu hình/i });
    await expect(nextToPricing)?.toBeEnabled();
    await nextToPricing?.click();

    await expect(page?.getByRole('heading', { name: /Thông tin cấu hình giá tour/i }))?.toBeVisible();
  });

  test('tour program wizard supports holiday departures with a real calendar and route description', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-programs/create');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByLabel(/Mô tả/i))?.toBeVisible();
    await page?.getByLabel(/Mùa lễ/i)?.check();
    await expect(page?.getByLabel(/Dịp lễ/i))?.toBeVisible();
    await page?.getByLabel(/Dịp lễ/i)?.selectOption('Giỗ Tổ Hùng Vương');

    await expect(page?.getByText(/Lịch khởi hành/i))?.toBeVisible();
    await expect(page?.getByText(/Danh sách ngày khởi hành dự kiến/i))?.toBeVisible();
    await expect(page?.getByText(/Chưa chọn ngày khởi hành nào/i))?.toBeVisible();
    for (const weekday of ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']) {
      await expect(page?.getByText(weekday, { exact: true }))?.toBeVisible();
    }

    await page?.getByRole('button', { name: /6\s*Giỗ Tổ Hùng Vương/i })?.click();
    await expect(page?.getByText(/1 ngày đã chọn/i))?.toBeVisible();
    await expect(page?.getByText(/6\/4\/2026|06\/04\/2026/i)?.last())?.toBeVisible();
  });

  test('tour program wizard year-round type generates expected dates and create-only tour preview tab', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-programs/create');
    await page?.waitForLoadState('domcontentloaded');

    await page?.getByLabel(/Quanh năm/i)?.check();
    await page?.getByLabel(/Ngày bắt đầu/i)?.fill('2026-04-20');
    await page?.getByLabel(/Ngày kết thúc/i)?.fill('2026-04-22');

    await expect(page?.getByText(/Danh sách ngày khởi hành dự kiến/i)?.last())?.toBeVisible();
    await expect(page?.getByText(/3 ngày dự kiến/i))?.toBeVisible();
    await expect(page?.getByText(/20\/4\/2026|20\/04\/2026/i))?.toBeVisible();

    await page?.getByRole('button', { name: /Tiếp theo: Lịch trình/i })?.click();
    await page?.getByRole('button', { name: /Tiếp theo: Giá & Cấu hình/i })?.click();
    await expect(page?.getByText(/V\. Hướng dẫn viên/i))?.toBeVisible();
    const guideBlock = page?.locator('h4', { hasText: /V\. Hướng dẫn viên/i })?.locator('..');
    await expect(guideBlock?.getByText(/^Đơn giá$/i))?.toBeVisible();
    await expect(guideBlock?.getByText(/^Số lần$/i))?.toHaveCount(0);
    await expect(guideBlock?.getByText(/^Thành tiền$/i))?.toHaveCount(0);

    await page?.getByRole('button', { name: /Tiếp theo: Tour dự kiến/i })?.click();
    await expect(page?.getByRole('heading', { name: /Tour dự kiến/i }))?.toBeVisible();
    await expect(page?.getByText('Preview danh sách tour', { exact: true }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ngày kết thúc/i }))?.toBeVisible();
    await expect(page?.getByText(/Đã chọn: 3 tour/i))?.toBeVisible();
    await expect(page?.locator('tbody tr')?.first()?.locator('input[type="date"]'))?.toHaveCount(3);
  });

  test('tour program wizard pricing tables keep mock interactions alive for suppliers and services', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-programs/create');
    await page?.waitForLoadState('domcontentloaded');

    await page?.locator('select')?.nth(0)?.selectOption({ index: 1 });
    await page?.locator('select')?.nth(1)?.selectOption({ index: 1 });
    await page?.getByLabel(/Quanh năm/i)?.check();
    await page?.getByLabel(/Ngày bắt đầu/i)?.fill('2026-04-20');
    await page?.getByLabel(/Ngày kết thúc/i)?.fill('2026-04-22');
    await page?.getByRole('button', { name: /Tiếp theo: Lịch trình/i })?.click();

    await page?.locator('select')?.nth(0)?.selectOption({ index: 1 });
    await page?.locator('select')?.nth(1)?.selectOption({ index: 1 });
    const day1Block = page?.getByRole('heading', { name: /Ngày 1/i })?.locator('xpath=../../..');
    const day2Block = page?.getByRole('heading', { name: /Ngày 2/i })?.locator('xpath=../../..');
    await day1Block?.getByRole('button', { name: /Bữa trưa/i })?.click();
    await day2Block?.getByRole('button', { name: /Bữa tối/i })?.click();
    await page?.getByRole('button', { name: /Tiếp theo: Giá & Cấu hình/i })?.click();

    const tables = page?.locator('table');
    const transportTable = tables?.nth(0);
    const hotelTable = tables?.nth(1);
    const mealTable = tables?.nth(2);
    const attractionTable = tables?.nth(3);
    const otherCostTable = tables?.nth(4);

    const transportRowCount = await transportTable?.locator('tbody tr')?.count();
    await page?.getByRole('button', { name: /Thêm mới NCC xe tham quan/i })?.click();
    await expect(transportTable?.locator('tbody tr'))?.toHaveCount((transportRowCount ?? 0) + 1);

    const hotelRowCount = await hotelTable?.locator('tbody tr')?.count();
    await page?.getByRole('button', { name: /Thêm mới NCC Lưu trú/i })?.first()?.click();
    await expect(hotelTable?.locator('tbody tr'))?.toHaveCount((hotelRowCount ?? 0) + 3);

    const mealRowCount = await mealTable?.locator('tbody tr')?.count();
    await page?.getByRole('button', { name: /Thêm mới dịch vụ Ngày 1 - Bữa trưa/i })?.click();
    await expect(mealTable?.locator('tbody tr'))?.toHaveCount((mealRowCount ?? 0) + 1);

    const attractionRowCount = await attractionTable?.locator('tbody tr')?.count();
    await page?.getByRole('button', { name: /^Thêm mới dịch vụ Ngày 1$/i })?.click();
    await expect(attractionTable?.locator('tbody tr'))?.toHaveCount((attractionRowCount ?? 0) + 1);

    const otherCostRowCount = await otherCostTable?.locator('tbody tr')?.count();
    await page?.getByRole('button', { name: /Thêm mới dịch vụ chi phí khác/i })?.click();
    await expect(otherCostTable?.locator('tbody tr'))?.toHaveCount((otherCostRowCount ?? 0) + 1);
  });

  test('tour generation rules matches wireframe columns and generation preview table', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-rules');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByPlaceholder(/Tìm theo chương trình tour|Tìm theo mã yêu cầu/i))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Ngày khởi hành xa nhất/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Độ bao phủ đã tính/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Độ phủ khả dụng/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Độ bao phủ tối thiểu/i }))?.toBeVisible();

    await page?.getByRole('button', { name: /Chờ duyệt bán/i })?.click();
    await expect(page?.getByRole('button', { name: /^Duyệt$/ }))?.toHaveCount(0);
    await expect(page?.getByRole('button', { name: /Từ chối/i }))?.toHaveCount(0);
    await expect(page?.getByRole('button', { name: /Xem/i })?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Sửa/i })?.first())?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Xóa/i })?.first())?.toBeVisible();

    await page?.getByRole('button', { name: /Sửa/i })?.first()?.click();
    const editDialog = page?.getByRole('dialog');
    await expect(editDialog?.getByRole('heading', { name: /S.*a y.*u c.*u ch.* duy.*t b.*n/i }))?.toBeVisible();
    await editDialog?.getByRole('spinbutton')?.fill('33');
    await editDialog?.getByRole('button', { name: /L.*u thay .*i/i })?.click();
    await expect(editDialog)?.toHaveCount(0);

    await page?.getByRole('button', { name: /Xóa/i })?.first()?.click();
    const deleteDialog = page?.getByRole('dialog');
    await expect(deleteDialog?.getByRole('heading', { name: /X.*a y.*u c.*u ch.* duy.*t b.*n/i }))?.toBeVisible();
    await deleteDialog?.getByRole('button', { name: /^X.*a$/i })?.click();
    await expect(deleteDialog)?.toHaveCount(0);

    await page?.getByRole('button', { name: /Quy tắc tạo tour/i })?.click();
    await page?.getByRole('button', { name: /^Tạo tour$/ })?.first()?.click();
    const dialog = page?.getByRole('dialog');
    await expect(dialog?.getByRole('heading', { name: /Sinh tour/i }))?.toBeVisible();
    await expect(dialog?.getByText(/Preview danh sách tour/i))?.toBeVisible();
    await expect(dialog?.getByRole('columnheader', { name: /Ngày kết thúc/i }))?.toBeVisible();
    await expect(dialog?.getByRole('columnheader', { name: /Cùng thời điểm/i }))?.toBeVisible();
    await expect(dialog?.getByText(/Đã chọn:/i))?.toBeVisible();
    await expect(dialog?.getByText(/Chưa chọn:/i))?.toBeVisible();
    await expect(dialog?.getByText(/Tóm tắt:/i))?.toBeVisible();
    await expect(dialog?.locator('tbody tr')?.first()?.locator('input[type="date"]'))?.toHaveCount(1);
  });

  test('tour estimate removes redundant pricing panels and follows the revised guest and estimate layouts', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours/TI009/estimate');
    await page?.waitForLoadState('domcontentloaded');

    for (const tab of ['Tổng quan', 'Danh sách khách hàng', 'Lịch trình', 'Dự toán']) {
      await expect(page?.getByRole('button', { name: new RegExp(tab, 'i') }))?.toBeVisible();
    }

    await page?.getByRole('button', { name: /Tổng quan/i })?.click();
    await expect(page?.getByText(/Thông tin Giá/i))?.toHaveCount(0);
    await expect(page?.getByText(/Nhà cung cấp chành/i))?.toHaveCount(0);

    await page?.getByRole('button', { name: /Danh sách khách hàng/i })?.click();
    await expect(page?.getByText(/Nhóm khách \[/i)?.first())?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /CCCD \/ GKS/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Phụ thu phòng đơn/i }))?.toHaveCount(0);
    const bookingButton = page?.locator('button', { hasText: /BK-/ })?.first();
    await bookingButton?.click();
    const guestDialog = page?.getByRole('dialog');
    await expect(guestDialog?.getByRole('heading', { name: /Thông tin khách hàng đặt tour/i }))?.toBeVisible();
    await expect(guestDialog?.getByText(/Ghi chú booking/i))?.toBeVisible();
    await expect(guestDialog?.getByText(/Cơ cấu phòng/i))?.toBeVisible();
    await expect(guestDialog?.locator('table'))?.toHaveCount(0);
    await guestDialog?.getByRole('button')?.first()?.click();

    await page?.getByRole('button', { name: /Lịch trình/i })?.click();
    await expect(page?.getByText(/Sáng|Trưa|Tối/i)?.first())?.toBeVisible();

    await page?.getByRole('button', { name: /Dự toán/i })?.click();
    await expect(page?.getByText(/Vận chuyển/i)?.first())?.toBeVisible();
    await expect(page?.getByText(/Hướng dẫn viên/i)?.first())?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Đêm\/Lượt\/Bữa/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /^Dịch vụ$/i }))?.toHaveCount(0);
    await expect(page?.getByRole('columnheader', { name: /^Nhà cung cấp$/i }))?.toHaveCount(0);
    await expect(page?.getByText(/Mở rộng/i))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Chỉnh sửa giá/i })?.first())?.toBeVisible();
    await page?.getByRole('button', { name: /Chỉnh sửa giá/i })?.first()?.click();
    const priceDialog = page?.getByRole('dialog');
    await expect(priceDialog?.getByRole('heading', { name: /Chỉnh sửa giá/i }))?.toBeVisible();
    await expect(priceDialog?.getByText(/Thông tin giá đang áp dụng/i))?.toBeVisible();
    await expect(priceDialog?.getByText(/Nhà cung cấp:/i))?.toBeVisible();
    await expect(priceDialog?.getByLabel(/Cập nhật vào bảng giá hệ thống/i))?.toBeVisible();
    await expect(priceDialog?.getByText(/Lý do/i))?.toBeVisible();
    await priceDialog?.getByLabel(/Cập nhật vào bảng giá hệ thống/i)?.check();
    await expect(priceDialog?.getByLabel(/Ngày hiệu lực/i))?.toBeVisible();
    await expect(priceDialog?.getByLabel(/Ngày hết hiệu lực/i))?.toBeVisible();
  });

  test('settlement inherits grouped rows, allows actual-cost editing, and does not allow adding items', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours/TI004/settle');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('button', { name: /Bảng Quyết Toán/i }))?.toBeVisible();
    await expect(page?.getByText(/Tăng 500.000/i))?.toBeVisible();
    await expect(page?.getByText(/Kế thừa từ dự toán tour/i)?.first())?.toBeVisible();
    await expect(page?.locator('button:has-text("Thêm hạng mục")'))?.toHaveCount(0);
    await expect(page?.getByRole('columnheader', { name: /^Nhà cung cấp$/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /^Dịch vụ$/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /^Thực chi$/i }))?.toBeVisible();
    const firstActualInput = page?.locator('tbody input[type="number"]')?.first();
    await expect(firstActualInput)?.toBeVisible();
    await firstActualInput?.fill('8300000');
    await expect(firstActualInput)?.toHaveValue('8300000');
    await expect(page?.getByRole('button', { name: /Chỉnh sửa giá/i }))?.toHaveCount(0);
  });

  test('receive dispatch screen is read-only, has booking tab, and inherits estimate preview', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tour-programs/TI008/receive');
    await page?.waitForLoadState('domcontentloaded');

    await expect(page?.getByRole('button', { name: /Nhận điều hành/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Danh sách booking/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /Danh sách booking/i })?.click();
    await expect(page?.getByRole('heading', { name: /Danh sách booking/i }))?.toBeVisible();

    await page?.getByRole('button', { name: /^Dự toán$/i })?.click();
    await expect(page?.getByRole('columnheader', { name: /Đơn giá áp dụng/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Mở rộng/i })?.first())?.toBeVisible();
    await page?.getByRole('button', { name: /Mở rộng/i })?.first()?.click();
    await expect(page?.getByText(/Bảng giá đang áp dụng/i))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Chỉnh sửa giá/i }))?.toHaveCount(0);
  });

  test('guide dispatch modal only selects guide and hides vehicle and experience fields', async ({ page }) => {
    await loginAsCoordinator(page);
    await page?.goto('/coordinator/tours');
    await page?.waitForLoadState('domcontentloaded');

    await page?.getByRole('button', { name: /Phân công HDV/i })?.click();
    await page?.getByRole('button', { name: /^Phân công HDV$/i })?.first()?.click();
    const dialog = page?.getByRole('dialog');
    await expect(dialog?.getByRole('heading', { name: /Phân công HDV/i }))?.toBeVisible();
    await expect(dialog?.getByText(/SĐT:/i)?.first())?.toBeVisible();
    await expect(dialog?.getByText(/Số lần đã dẫn tour này/i)?.first())?.toBeVisible();
    await expect(dialog?.getByText(/năm KN|kinh nghiệm|thông tin xe|biển số|loại xe/i))?.toHaveCount(0);
  });

  test('service and supplier modules follow the revised catalog structure and supplier detail wireframes', async ({ page }) => {
    await loginAsCoordinator(page);

    await page?.goto('/coordinator/services');
    await expect(page?.getByRole('columnheader', { name: /Đơn vị/i }))?.toBeVisible();
    await expect(page?.getByRole('columnheader', { name: /Thiết lập giá/i }))?.toBeVisible();
    await expect(page?.getByText(/Dịch vụ Hướng dẫn viên/i))?.toBeVisible();
    await expect(page?.getByText(/Phòng đơn/i))?.toBeVisible();
    await page?.getByRole('button', { name: /Thêm dịch vụ/i })?.click();
    const serviceDialog = page?.getByRole('dialog');
    await expect(serviceDialog?.getByLabel(/Phân loại/i))?.toBeVisible();
    await serviceDialog?.getByRole('button', { name: /Hủy bỏ/i })?.click();
    await expect(page?.getByRole('dialog'))?.toHaveCount(0);

    await page?.locator('table').first()?.getByRole('button', { name: /Xem/i })?.nth(4)?.click();
    const serviceDetailDialog = page?.getByRole('dialog');
    await expect(serviceDetailDialog?.getByRole('button', { name: /^Sửa$/i }))?.toBeVisible();
    await expect(serviceDetailDialog?.getByRole('button', { name: /^Xóa$/i }))?.toBeVisible();
    await expect(serviceDetailDialog?.getByRole('button', { name: /Thêm bảng giá/i }))?.toHaveCount(0);
    await serviceDetailDialog?.getByRole('button', { name: /^Sửa$/i })?.click();
    const serviceEditDialog = page?.getByRole('dialog');
    await expect(serviceEditDialog?.getByRole('button', { name: /Thêm bảng giá/i }))?.toBeVisible();
    await expect(serviceEditDialog?.getByRole('button', { name: /Chỉnh sửa/i })?.first())?.toBeVisible();
    await serviceEditDialog?.getByRole('button', { name: /Thêm bảng giá/i })?.click();
    const servicePriceDialog = page?.getByRole('dialog');
    await expect(servicePriceDialog?.getByRole('heading', { name: /Thêm bảng giá/i }))?.toBeVisible();
    await servicePriceDialog?.getByRole('button', { name: /Hủy bỏ/i })?.last()?.click();
    await serviceEditDialog?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    await page?.goto('/coordinator/suppliers');
    await expect(page?.getByRole('button', { name: /Nhà cung cấp dịch vụ/i }))?.toBeVisible();
    await expect(page?.getByRole('button', { name: /Hướng dẫn viên/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /Hướng dẫn viên/i })?.click();
    await expect(page?.getByRole('button', { name: /Thêm HDV/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /Thêm HDV/i })?.click();
    const guideCreateDialog = page?.getByRole('dialog');
    await expect(guideCreateDialog?.getByRole('heading', { name: /Thêm hướng dẫn viên/i }))?.toBeVisible();
    await expect(guideCreateDialog?.getByPlaceholder(/Số thẻ hướng dẫn viên/i))?.toBeVisible();
    await expect(guideCreateDialog?.getByText(/Ngoại ngữ/i))?.toBeVisible();
    await expect(guideCreateDialog?.getByLabel(/Tiếng Anh/i))?.toBeVisible();
    await guideCreateDialog?.getByRole('button', { name: /Hủy/i })?.click();
    await expect(page?.getByRole('row', { name: /Trần Minh Hoàng/i }))?.toBeVisible();
    await page?.getByRole('button', { name: /Nhà cung cấp dịch vụ/i })?.click();
    await expect(page?.getByRole('columnheader', { name: /Khu vực hoạt động/i }))?.toBeVisible();
    await expect(page?.getByText(/Dừng hoạt động/i))?.toBeVisible();

    const hotelRow = page?.getByRole('row', { name: /Khách sạn Di Sản Việt/i });
    await hotelRow?.getByRole('button', { name: /Xem/i })?.click();
    const hotelDialog = page?.getByRole('dialog');
    await expect(hotelDialog?.getByText(/Địa chỉ/i))?.toBeVisible();
    await expect(hotelDialog?.getByText(/Năm thành lập/i))?.toBeVisible();
    await expect(hotelDialog?.getByRole('button', { name: /^Sửa$/i }))?.toBeVisible();
    await expect(hotelDialog?.getByRole('button', { name: /^Xóa$/i }))?.toBeVisible();
    await expect(hotelDialog?.getByRole('button', { name: /Thêm bảng giá/i }))?.toHaveCount(0);
    await hotelDialog?.getByRole('button', { name: /^Sửa$/i })?.click();
    const hotelEditDialog = page?.getByRole('dialog');
    await expect(hotelEditDialog?.getByRole('button', { name: /Thêm dịch vụ/i }))?.toBeVisible();
    await expect(hotelEditDialog?.getByRole('button', { name: /Thêm bảng giá/i }))?.toBeVisible();
    await hotelEditDialog?.getByRole('button', { name: /Thêm bảng giá/i })?.click();
    const hotelQuoteDialog = page?.getByRole('dialog');
    await expect(hotelQuoteDialog?.getByRole('columnheader', { name: /Nhóm dịch vụ/i }))?.toBeVisible();
    await expect(hotelQuoteDialog?.getByRole('columnheader', { name: /Đơn giá hiện tại/i }))?.toBeVisible();
    await expect(hotelQuoteDialog?.getByRole('columnheader', { name: /Đơn giá mới/i }))?.toBeVisible();
    await hotelQuoteDialog?.getByRole('button', { name: /Hủy bỏ/i })?.last()?.click();
    await hotelEditDialog?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    const restaurantRow = page?.getByRole('row', { name: /The Lotus Dining Room/i });
    await restaurantRow?.getByRole('button', { name: /Xem/i })?.click();
    const restaurantDialog = page?.getByRole('dialog');
    await restaurantDialog?.getByRole('button', { name: /^Sửa$/i })?.click();
    const restaurantEditDialog = page?.getByRole('dialog');
    await restaurantEditDialog?.getByRole('button', { name: /Thêm bảng giá/i })?.click();
    const restaurantQuoteDialog = page?.getByRole('dialog');
    await expect(restaurantQuoteDialog?.getByRole('columnheader', { name: /Đơn giá hiện tại/i }))?.toBeVisible();
    await expect(restaurantQuoteDialog?.getByRole('columnheader', { name: /Đơn giá mới/i }))?.toBeVisible();
    await restaurantQuoteDialog?.getByRole('button', { name: /Hủy bỏ/i })?.last()?.click();
    await restaurantEditDialog?.getByRole('button', { name: /Hủy bỏ/i })?.click();

    await page?.getByRole('button', { name: /Thêm nhà cung cấp/i })?.click();
    await page?.getByLabel(/Phân loại/i)?.selectOption('Vận chuyển');
    await expect(page?.getByLabel(/Loại phương tiện/i)?.first())?.toBeVisible();
    await page?.getByRole('button', { name: /Thêm dịch vụ/i })?.click();
    await expect(page?.getByText(/Tên dịch vụ 2/i))?.toBeVisible();
    await page?.getByLabel(/Tên nhà cung cấp/i)?.fill('NCC vận chuyển kiểm thử');
    await page?.getByLabel(/Khu vực hoạt động/i)?.fill('Hà Nội');
    await page?.getByLabel(/Số điện thoại/i)?.fill('0909000000');
    await page?.getByLabel(/Email/i)?.fill('qa-supplier@travela.vn');
    await page?.getByLabel(/Năm thành lập/i)?.fill('2020');
    await page?.getByLabel(/Địa chỉ/i)?.fill('12 phố Kiểm Thử');
    await page?.getByLabel(/Mô tả/i)?.first()?.fill('Nhà cung cấp kiểm thử hiển thị đủ trường?.');
    await page?.getByRole('button', { name: /Lưu nhà cung cấp/i })?.click();
    const createdDialog = page?.getByRole('dialog');
    await expect(createdDialog?.getByText(/NCC vận chuyển kiểm thử/i))?.toBeVisible();
    await expect(createdDialog?.getByText(/12 phố Kiểm Thử/i))?.toBeVisible();
    await expect(createdDialog?.getByText(/2020/i))?.toBeVisible();
    await expect(createdDialog?.getByRole('columnheader', { name: /Loại phương tiện/i }))?.toBeVisible();
    await createdDialog?.getByRole('button', { name: /^Sửa$/i })?.click();
    const transportEditDialog = page?.getByRole('dialog');
    await transportEditDialog?.getByRole('button', { name: /Thêm bảng giá/i })?.click();
    const transportQuoteDialog = page?.getByRole('dialog');
    await expect(transportQuoteDialog?.getByRole('columnheader', { name: /Đơn giá hiện tại/i }))?.toBeVisible();
    await expect(transportQuoteDialog?.getByRole('columnheader', { name: /Đơn giá mới/i }))?.toBeVisible();
  });
});
