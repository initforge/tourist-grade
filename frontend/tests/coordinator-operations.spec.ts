import { expect, test, type Page } from '@playwright/test';

const coordinatorUser = {
  id: 'U-COORDINATOR',
  name: 'Điều phối kiểm thử',
  email: 'coordinator@travela.vn',
  phone: '0900000000',
  role: 'coordinator',
  avatar: '',
  active: true,
} as const;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildBootstrapPayload() {
  const now = new Date();
  const departure = toDateKey(addDays(now, 45));

  return {
    users: [coordinatorUser],
    tourPrograms: [
      {
        id: 'TP100',
        name: 'Tour Đà Nẵng kiểm thử',
        departurePoint: 'Hà Nội',
        sightseeingSpots: ['Đà Nẵng'],
        duration: { days: 3, nights: 2 },
        lodgingStandard: '4 sao',
        transport: 'xe',
        arrivalPoint: '',
        tourType: 'quanh_nam',
        routeDescription: 'Tour kiểm thử nghiệp vụ điều phối.',
        weekdays: ['t2'],
        yearRoundStartDate: departure,
        yearRoundEndDate: toDateKey(addDays(now, 120)),
        coverageMonths: 3,
        bookingDeadline: 7,
        status: 'draft',
        approvalStatus: 'approved',
        itinerary: [
          { day: 1, title: 'Ngày 1', description: 'Khởi hành Hà Nội - Đà Nẵng', meals: ['lunch'], accommodationPoint: 'Đà Nẵng' },
          { day: 2, title: 'Ngày 2', description: 'Tham quan Bà Nà', meals: ['dinner'], accommodationPoint: 'Đà Nẵng' },
          { day: 3, title: 'Ngày 3', description: 'Kết thúc', meals: [], accommodationPoint: '' },
        ],
        pricingConfig: {
          profitMargin: 15,
          taxRate: 10,
          otherCostFactor: 0.15,
          netPrice: 2500000,
          sellPriceAdult: 3100000,
          sellPriceChild: 2300000,
          sellPriceInfant: 0,
          minParticipants: 6,
        },
        draftPricingTables: {
          transport: [{ optionId: 'transport-van-tai-viet-29', isDefault: true }],
          flight: [],
          hotels: { 'stay-1': [{ optionId: 'hotel-da-nang-4-pearl', isDefault: true }] },
          meals: {
            'meal-1-lunch': [{ optionId: 'meal-da-nang-ocean', isDefault: true }],
            'meal-2-dinner': [{ optionId: 'meal-da-nang-ocean', isDefault: true }],
          },
          attractions: {
            'attraction-1': [{ optionId: 'ticket-ba-na', isDefault: true }],
          },
          otherCosts: [
            { optionId: 'other-insurance' },
            { optionId: 'other-team-building', occurrences: 2, note: '2' },
          ],
        },
        createdBy: 'Điều phối A',
        createdAt: departure,
        updatedAt: departure,
      },
    ],
    tourInstances: [
      {
        id: 'TI008',
        programId: 'TP100',
        programName: 'Tour Đà Nẵng kiểm thử',
        departureDate: departure,
        status: 'yeu_cau_chinh_sua',
        departurePoint: 'Hà Nội',
        sightseeingSpots: ['Đà Nẵng'],
        transport: 'xe',
        expectedGuests: 6,
        priceAdult: 3100000,
        priceChild: 2300000,
        priceInfant: 0,
        minParticipants: 6,
        bookingDeadline: toDateKey(addDays(now, 38)),
        createdBy: 'Điều phối A',
        createdAt: departure,
      },
      {
        id: 'TI004',
        programId: 'TP100',
        programName: 'Tour Đà Nẵng kiểm thử',
        departureDate: departure,
        status: 'cho_quyet_toan',
        departurePoint: 'Hà Nội',
        sightseeingSpots: ['Đà Nẵng'],
        transport: 'xe',
        expectedGuests: 6,
        priceAdult: 3100000,
        priceChild: 2300000,
        minParticipants: 6,
        bookingDeadline: toDateKey(addDays(now, 38)),
        createdBy: 'Điều phối A',
        createdAt: departure,
        costEstimate: {
          categories: [
            {
              id: 'A',
              name: 'Vận chuyển',
              subtotal: 8100000,
              isFixed: true,
              items: [
                {
                  id: 1,
                  name: 'Xe vận chuyển',
                  unit: 'chuyến',
                  target: 'all',
                  quantity: 1,
                  nightsOrRuns: 1,
                  unitPrice: 8100000,
                  total: 8100000,
                  suppliers: [{ supplierId: 'SUP001', supplierName: 'Vận tải Việt Tourist', serviceVariant: 'Xe 29 chỗ', quotedPrice: 8100000, isPrimary: true }],
                  primarySupplierId: 'SUP001',
                },
              ],
            },
          ],
          totalFixedCost: 8100000,
          totalVariableCost: 0,
          totalCost: 8100000,
          pricingConfig: {
            profitMargin: 15,
            taxRate: 10,
            otherCostFactor: 0.15,
            netPrice: 2500000,
            sellPriceAdult: 3100000,
            sellPriceChild: 2300000,
            sellPriceInfant: 0,
            minParticipants: 6,
          },
          estimatedGuests: 6,
        },
      },
      {
        id: 'TI010',
        programId: 'TP100',
        programName: 'Tour Đà Nẵng kiểm thử',
        departureDate: departure,
        status: 'san_sang_trien_khai',
        departurePoint: 'Hà Nội',
        sightseeingSpots: ['Đà Nẵng'],
        transport: 'xe',
        expectedGuests: 4,
        priceAdult: 3100000,
        priceChild: 2300000,
        minParticipants: 4,
        bookingDeadline: toDateKey(addDays(now, 38)),
        createdBy: 'Điều phối A',
        createdAt: departure,
      },
    ],
    suppliers: [
      {
        id: 'SUP100',
        name: 'Vận tải Việt Tourist',
        phone: '0901000001',
        email: 'ops@vantai.test',
        category: 'Vận chuyển',
        service: 'Xe tham quan',
        operatingArea: 'Đà Nẵng',
        status: 'Hoạt động',
        address: '1 Đà Nẵng',
        establishedYear: '2020',
        description: 'Nhà xe test',
        services: [
          {
            id: 'transport-29',
            name: 'Xe 29 chỗ',
            description: '',
            unit: 'xe',
            quantity: 1,
            capacity: 29,
            transportType: 'Xe',
            priceMode: 'Báo giá',
            prices: [{ id: 'SUP100-P1', fromDate: '2026-01-01', toDate: '', unitPrice: 8100000, note: 'Khởi tạo', createdBy: 'Seed' }],
          },
        ],
        mealServices: [],
      },
      {
        id: 'SUP101',
        name: 'Hoàng Gia Travel Bus',
        phone: '0901000002',
        email: 'ops@hoanggia.test',
        category: 'Vận chuyển',
        service: 'Xe tham quan',
        operatingArea: 'Đà Nẵng',
        status: 'Hoạt động',
        address: '2 Đà Nẵng',
        establishedYear: '2019',
        description: 'Nhà xe test 2',
        services: [
          {
            id: 'transport-29-hg',
            name: 'Xe 29 chỗ',
            description: '',
            unit: 'xe',
            quantity: 1,
            capacity: 29,
            transportType: 'Xe',
            priceMode: 'Báo giá',
            prices: [{ id: 'SUP101-P1', fromDate: '2026-01-01', toDate: '', unitPrice: 9600000, note: 'Khởi tạo', createdBy: 'Seed' }],
          },
        ],
        mealServices: [],
      },
    ],
    services: [
      {
        id: 'SV001',
        name: 'Đạo cụ team building',
        category: 'Các dịch vụ khác',
        unit: 'lần',
        priceMode: 'Báo giá',
        setup: 'Giá chung',
        status: 'Hoạt động',
        description: 'Đạo cụ sự kiện',
        supplierName: 'Event Lab',
        contactInfo: '0909',
        formulaCount: 'Nhập tay',
        formulaQuantity: 'Giá trị mặc định',
        formulaQuantityDefault: '1',
        prices: [{ id: 'SV001-P1', unitPrice: 500000, note: 'Bảng giá khởi tạo', effectiveDate: '2026-01-01', endDate: '', createdBy: 'Seed' }],
      },
      {
        id: 'SV002',
        name: 'Bảo hiểm du lịch',
        category: 'Các dịch vụ khác',
        unit: 'người',
        priceMode: 'Giá niêm yết',
        setup: 'Giá chung',
        status: 'Hoạt động',
        description: 'Bảo hiểm tour',
        supplierName: 'Bảo Việt Travel Care',
        contactInfo: '0908',
        formulaCount: 'Giá trị mặc định',
        formulaCountDefault: '1',
        formulaQuantity: 'Theo số người',
        prices: [{ id: 'SV002-P1', unitPrice: 40000, note: 'Bảng giá khởi tạo', effectiveDate: '2026-01-01', endDate: '', createdBy: 'Seed' }],
      },
    ],
    guides: [
      {
        id: 'HDV001',
        name: 'HDV tiếng Anh',
        phone: '0901111222',
        experienceYears: 3,
        tourGuidedCount: 5,
        languages: ['Tiếng Anh'],
      },
      {
        id: 'HDV002',
        name: 'HDV tiếng Nhật',
        phone: '0903333444',
        experienceYears: 6,
        tourGuidedCount: 12,
        languages: ['Tiếng Nhật', 'Tiếng Anh'],
      },
    ],
    vouchers: [],
    blogs: [],
    tours: [],
    bookings: [
      {
        id: 'B001',
        bookingCode: 'BK001',
        tourId: 'TI008',
        tourName: 'Tour Đà Nẵng kiểm thử',
        tourDate: departure,
        tourDuration: '3N2Đ',
        status: 'confirmed',
        refundStatus: 'none',
        passengers: [
          { type: 'adult', name: 'Khách A', dob: '1990-01-01', gender: 'male', nationality: 'Việt Nam' },
          { type: 'adult', name: 'Khách B', dob: '1992-01-01', gender: 'female', nationality: 'Nhật Bản' },
          { type: 'child', name: 'Khách C', dob: '2015-01-01', gender: 'female', nationality: 'Việt Nam' },
        ],
        contactInfo: { name: 'Người đặt 1', email: 'a@test.vn', phone: '0901' },
        totalAmount: 10000000,
        paidAmount: 10000000,
        remainingAmount: 0,
        paymentMethod: 'payos',
        paymentType: 'online',
        paymentStatus: 'paid',
        paymentTransactions: [],
        createdAt: departure,
        roomCounts: { single: 0, double: 1, triple: 0 },
      },
      {
        id: 'B002',
        bookingCode: 'BK002',
        tourId: 'TI008',
        tourName: 'Tour Đà Nẵng kiểm thử',
        tourDate: departure,
        tourDuration: '3N2Đ',
        status: 'cancelled',
        refundStatus: 'refunded',
        refundAmount: 2000000,
        passengers: [
          { type: 'adult', name: 'Khách D', dob: '1988-01-01', gender: 'male', nationality: 'Việt Nam' },
        ],
        contactInfo: { name: 'Người đặt 2', email: 'b@test.vn', phone: '0902' },
        totalAmount: 5000000,
        paidAmount: 5000000,
        remainingAmount: 0,
        paymentMethod: 'payos',
        paymentType: 'online',
        paymentStatus: 'refunded',
        paymentTransactions: [],
        createdAt: departure,
        roomCounts: { single: 0, double: 0, triple: 0 },
      },
      {
        id: 'B003',
        bookingCode: 'BK003',
        tourId: 'TI010',
        tourName: 'Tour Đà Nẵng kiểm thử',
        tourDate: departure,
        tourDuration: '3N2Đ',
        status: 'confirmed',
        refundStatus: 'none',
        passengers: [
          { type: 'adult', name: 'Khách E', dob: '1990-01-01', gender: 'male', nationality: 'Nhật Bản' },
        ],
        contactInfo: { name: 'Người đặt 3', email: 'c@test.vn', phone: '0903' },
        totalAmount: 4000000,
        paidAmount: 4000000,
        remainingAmount: 0,
        paymentMethod: 'payos',
        paymentType: 'online',
        paymentStatus: 'paid',
        paymentTransactions: [],
        createdAt: departure,
        roomCounts: { single: 0, double: 1, triple: 0 },
      },
    ],
  };
}

async function mockCoordinatorSession(page: Page, bootstrapPayload = buildBootstrapPayload()) {
  const state = JSON.parse(JSON.stringify(bootstrapPayload)) as ReturnType<typeof buildBootstrapPayload>;
  const getRouteSegments = (routeUrl: string) => new URL(routeUrl).pathname.split('/').filter(Boolean);
  const mapServiceCategory = (category: string) => category === 'ATTRACTION_TICKET' ? 'Vé tham quan' : 'Các dịch vụ khác';
  const mapPriceMode = (priceMode: string) => priceMode === 'LISTED' ? 'Giá niêm yết' : 'Báo giá';
  const mapPriceSetup = (priceSetup: string) => {
    if (priceSetup === 'BY_AGE') return 'Theo độ tuổi';
    if (priceSetup === 'NONE') return 'Không áp dụng';
    return 'Giá chung';
  };
  const mapStatus = (status: string) => status === 'INACTIVE' ? 'Ngưng hoạt động' : 'Hoạt động';

  await page.addInitScript(() => {
    localStorage.setItem('__travela_auth_tokens', JSON.stringify({
      accessToken: 'playwright-access-token',
      refreshToken: 'playwright-refresh-token',
    }));
  });

  await page.route('**/auth/me', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, user: coordinatorUser }) });
  });
  await page.route('**/bootstrap', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: state }) });
  });
  await page.route('**/public/tours', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tours: [] }) });
  });
  await page.route('**/public/blogs', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, blogs: [] }) });
  });

  await page.route('**/tour-instances/*/assign-guide', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const segments = getRouteSegments(route.request().url());
    const id = segments[segments.length - 2];
    const payload = route.request().postDataJSON() as { assignedGuide: { id: string; name: string } };
    const index = state.tourInstances.findIndex(instance => instance.id === id);
    const updated = {
      ...state.tourInstances[index],
      assignedGuide: payload.assignedGuide,
    };
    state.tourInstances[index] = updated;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourInstance: updated }) });
  });

  await page.route('**/tour-instances/*/estimate', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const segments = getRouteSegments(route.request().url());
    const id = segments[segments.length - 2];
    const payload = route.request().postDataJSON() as { costEstimate: unknown; submit?: boolean };
    const index = state.tourInstances.findIndex(instance => instance.id === id);
    const updated = {
      ...state.tourInstances[index],
      costEstimate: payload.costEstimate,
      status: payload.submit ? 'cho_duyet_du_toan' : state.tourInstances[index].status,
    };
    state.tourInstances[index] = updated;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourInstance: updated }) });
  });

  await page.route('**/tour-instances/*/settlement', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const segments = getRouteSegments(route.request().url());
    const id = segments[segments.length - 2];
    const payload = route.request().postDataJSON() as { settlement: unknown; complete?: boolean };
    const index = state.tourInstances.findIndex(instance => instance.id === id);
    const updated = {
      ...state.tourInstances[index],
      settlement: payload.settlement,
      status: payload.complete ? 'hoan_thanh' : state.tourInstances[index].status,
    };
    state.tourInstances[index] = updated;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, tourInstance: updated }) });
  });

  await page.route('**/services/*/prices', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const segments = getRouteSegments(route.request().url());
    const id = segments[segments.length - 2];
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const index = state.services.findIndex(service => service.id === id);
    if (index >= 0) {
      state.services[index] = {
        ...state.services[index],
        prices: [...state.services[index].prices, payload],
      };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, price: payload }) });
  });

  await page.route('**/services/*', async route => {
    const method = route.request().method();
    const id = getRouteSegments(route.request().url()).at(-1)!;
    if (method === 'PATCH') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      const index = state.services.findIndex(service => service.id === id);
      const updated = {
        ...state.services[index],
        ...payload,
      };
      state.services[index] = updated;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, service: updated }) });
      return;
    }
    if (method === 'DELETE') {
      state.services = state.services.filter(service => service.id !== id);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      return;
    }
    await route.fallback();
  });

  await page.route('**/services', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const created = {
      id: `SV${String(state.services.length + 100).padStart(3, '0')}`,
      name: String(payload.name ?? ''),
      category: mapServiceCategory(String(payload.category ?? 'OTHER')),
      unit: String(payload.unit ?? ''),
      priceMode: mapPriceMode(String(payload.priceMode ?? 'QUOTED')),
      setup: mapPriceSetup(String(payload.priceSetup ?? 'COMMON')),
      status: mapStatus(String(payload.status ?? 'ACTIVE')),
      description: String(payload.description ?? ''),
      supplierName: String(payload.supplierName ?? ''),
      contactInfo: String(payload.contactInfo ?? ''),
      province: String(payload.province ?? ''),
      formulaCount: payload.formulaCount ? String(payload.formulaCount) : '',
      formulaCountDefault: String(payload.formulaCountDefault ?? ''),
      formulaQuantity: payload.formulaQuantity ? String(payload.formulaQuantity) : '',
      formulaQuantityDefault: String(payload.formulaQuantityDefault ?? ''),
      prices: Array.isArray(payload.prices) ? payload.prices : [],
    };
    state.services.unshift(created as (typeof state.services)[number]);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, service: created }) });
  });

  await page.route('**/suppliers/*/service-variants/*/prices', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const segments = getRouteSegments(route.request().url());
    const supplierId = segments[segments.length - 4];
    const serviceId = segments[segments.length - 2];
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    const index = state.suppliers.findIndex(supplier => supplier.id === supplierId);
    const price = {
      id: String(payload.id || `${serviceId}-${Date.now()}`),
      fromDate: String(payload.fromDate ?? payload.effectiveDate ?? ''),
      toDate: String(payload.toDate ?? payload.endDate ?? ''),
      unitPrice: Number(payload.unitPrice ?? 0),
      note: String(payload.note ?? ''),
      createdBy: String(payload.createdBy ?? ''),
    };
    if (index >= 0) {
      const patchLine = (line: { id: string; prices: Array<Record<string, unknown>> }) => (
        line.id === serviceId ? { ...line, prices: [...line.prices, price] } : line
      );
      state.suppliers[index] = {
        ...state.suppliers[index],
        services: state.suppliers[index].services.map(patchLine),
        mealServices: state.suppliers[index].mealServices.map(patchLine),
      };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, price }) });
  });

  await page.route('**/suppliers/*/prices', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    const segments = getRouteSegments(route.request().url());
    const supplierId = segments[segments.length - 2];
    const payload = route.request().postDataJSON() as { priceMap: Record<string, number>; fromDate: string; toDate?: string; note: string; createdBy: string };
    const index = state.suppliers.findIndex(supplier => supplier.id === supplierId);
    if (index >= 0) {
      const patchLine = (line: { id: string; prices: Array<Record<string, unknown>> }) => {
        const unitPrice = payload.priceMap[line.id];
        if (typeof unitPrice !== 'number') return line;
        return {
          ...line,
          prices: [...line.prices.filter(price => price.toDate), {
            id: `${line.id}-${Date.now()}`,
            fromDate: payload.fromDate,
            toDate: payload.toDate ?? '',
            unitPrice,
            note: payload.note,
            createdBy: payload.createdBy,
          }],
        };
      };
      state.suppliers[index] = {
        ...state.suppliers[index],
        services: state.suppliers[index].services.map(patchLine),
        mealServices: state.suppliers[index].mealServices.map(patchLine),
      };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, supplier: state.suppliers[index] }) });
  });
}

test('estimate inherits data from tour config and recalculates totals', async ({ page }) => {
  await mockCoordinatorSession(page);
  await page.goto('/coordinator/tours/TI008/estimate');

  await expect(page.getByText('Dự toán này đang ở trạng thái yêu cầu chỉnh sửa')).toBeVisible();
  await page.getByRole('button', { name: 'Dự toán' }).click();
  await expect(page.getByText('13.000.000 đ')).toBeVisible();

  const hotelRow = page.locator('tr').filter({ hasText: 'Lưu trú - Đêm 1, 2 - Phòng đôi' }).first();
  await expect(hotelRow.locator('input').nth(0)).toHaveValue('1');
  await expect(hotelRow.locator('input').nth(1)).toHaveValue('2');

  const transportRow = page.locator('tr').filter({ hasText: 'Xe vận chuyển' }).first();
  await expect(transportRow.getByText('Vận tải Việt Tourist')).toBeVisible();
  await expect(transportRow.getByText('8.100.000 đ')).toBeVisible();
  await expect(transportRow.locator('select')).toHaveCount(0);
  await expect(transportRow.getByRole('button', { name: /Cập nhật bảng giá/i })).toHaveCount(0);
  await transportRow.locator('input').nth(2).fill('9000000');
  await expect(transportRow.getByText('9.000.000 đ')).toBeVisible();

  const insuranceRow = page.locator('tr').filter({ hasText: 'Bảo hiểm du lịch' }).first();
  await expect(insuranceRow).toBeVisible();
  await expect(page.locator('tfoot').getByText('15.540.000 đ')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Cập nhật giá lên hệ thống' })).toHaveCount(0);
  await expect(insuranceRow.getByRole('button', { name: /Cập nhật bảng giá/i })).toBeVisible();
  await hotelRow.getByRole('button', { name: /Cập nhật bảng giá/i }).click();
  await expect(page.getByText(/Giá hiện tại trong khoảng đã chọn/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lưu bảng giá' })).toBeVisible();
});

test('tour assignment filters guides by required language and supports replacement flow', async ({ page }) => {
  await mockCoordinatorSession(page);
  await page.goto('/coordinator/tours');

  await page.getByRole('button', { name: /Phân công HDV/ }).first().click();
  await page.locator('tr').filter({ hasText: 'TI010' }).getByRole('button', { name: 'Phân công HDV' }).click();
  await expect(page.getByText('HDV tiếng Nhật')).toBeVisible();
  await expect(page.getByText('HDV tiếng Anh')).toBeHidden();

  await page.getByRole('button', { name: 'HDV tiếng Nhật' }).click();
  await page.getByRole('button', { name: 'Xác nhận điều phối' }).click();
  await expect(page.locator('tr').filter({ hasText: 'TI010' })).toContainText('Đã phân công');

  await expect(page.getByRole('button', { name: 'Thay đổi HDV' })).toBeVisible();

  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Thay đổi HDV' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Thay đổi HDV' }).click();
  await expect(page.getByText('HDV tiếng Nhật')).toBeHidden();
  await expect(page.getByText('Không có hướng dẫn viên phù hợp với bộ lọc hiện tại.')).toBeVisible();
});

test('settlement starts with actual costs equal to estimated costs', async ({ page }) => {
  await mockCoordinatorSession(page);
  await page.goto('/coordinator/tours/TI004/settle');

  const actualInput = page.locator('input[type="number"]').first();
  await expect(actualInput).toHaveValue('8100000');
  await actualInput.fill('8200000');
  await expect(page.getByText('8.200.000 đ')).toBeVisible();
});

test('service screen validates new records and supports age pricing fields', async ({ page }) => {
  await mockCoordinatorSession(page);
  await page.goto('/coordinator/services');

  await page.getByRole('button', { name: 'Thêm dịch vụ' }).click();
  await page.getByRole('button', { name: 'Lưu dịch vụ' }).click();
  await expect(page.getByText('Cần nhập tên dịch vụ')).toBeVisible();

  await page.getByLabel('Tên dịch vụ').fill('Vé test độ tuổi');
  await expect(page.getByLabel('Đơn vị')).toHaveCount(0);
  await expect(page.getByLabel('Hình thức giá')).toHaveCount(0);
  await page.getByLabel('Mô tả').fill('Mô tả test');
  await page.getByLabel('Đơn giá người lớn').fill('250000');
  await page.getByLabel('Đơn giá trẻ em').fill('180000');
  await page.getByRole('button', { name: 'Lưu dịch vụ' }).click();
  await expect(page.getByText('Vé test độ tuổi')).toBeVisible();

  await page.getByRole('button', { name: 'Thêm dịch vụ' }).click();
  await page.getByRole('combobox').first().selectOption('Các dịch vụ khác');
  await expect(page.getByLabel('Đơn vị')).toHaveValue('');
  await page.getByRole('button', { name: 'Lưu dịch vụ' }).click();
  await expect(page.getByText('Cần nhập đơn vị')).toBeVisible();
});

test('supplier screen blocks duplicate transport capacities and restaurant rows start blank', async ({ page }) => {
  await mockCoordinatorSession(page);
  await page.goto('/coordinator/suppliers');

  await page.getByRole('button', { name: 'Thêm nhà cung cấp' }).click();
  await page.getByLabel('Phân loại').selectOption('Vận chuyển');
  await page.getByLabel('Tên nhà cung cấp').fill('NCC xe test');
  await page.getByLabel('Khu vực hoạt động').fill('Hà Nội');
  await page.getByLabel('Số điện thoại').fill('0909000999');
  await page.getByLabel('Email').fill('xe@test.vn');
  await page.getByLabel('Địa chỉ').fill('Hà Nội');
  await expect(page.getByRole('columnheader', { name: 'Đơn giá' })).toHaveCount(0);
  await page.getByText('Thêm dòng').click();
  await page.locator('input[type="number"]').nth(0).fill('16');
  await page.locator('input[type="number"]').nth(1).fill('16');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Không được trùng số chỗ giữa các dịch vụ xe')).toBeVisible();

  await page.getByRole('button', { name: 'Hủy' }).click();
  await page.getByRole('button', { name: 'Thêm nhà cung cấp' }).click();
  await page.getByLabel('Phân loại').selectOption('Nhà hàng');
  await expect(page.locator('table input').first()).toHaveValue('');
});

test('guide editor validates required coordinator fields before save', async ({ page }) => {
  await mockCoordinatorSession(page);
  await page.goto('/coordinator/suppliers');

  await page.getByRole('button', { name: 'Hướng dẫn viên' }).click();
  await page.getByRole('button', { name: 'Thêm HDV' }).click();
  await page.getByRole('button', { name: 'Lưu' }).click();

  await expect(page.getByText('Cần nhập email')).toBeVisible();
  await expect(page.getByText('Cần nhập địa chỉ')).toBeVisible();
  await expect(page.getByText('Cần nhập số thẻ hướng dẫn viên')).toBeVisible();
  await expect(page.getByText('Cần nhập nơi cấp')).toBeVisible();
});
