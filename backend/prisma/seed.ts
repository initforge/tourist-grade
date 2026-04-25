import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.js';
import { resetBookingFixtures, resetTourWorkflowFixtures, resetVoucherFixtures } from '../src/lib/booking-fixtures.js';

const prisma = new PrismaClient();

const CUSTOMER_AVATAR =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2296%22 height=%2296%22 viewBox=%220 0 96 96%22%3E%3Crect width=%2296%22 height=%2296%22 rx=%2248%22 fill=%22%23f5efe6%22/%3E%3Ccircle cx=%2248%22 cy=%2236%22 r=%2217%22 fill=%22%232d5a45%22/%3E%3Cpath d=%22M18 88c5-19 17-29 30-29s25 10 30 29%22 fill=%22%232d5a45%22/%3E%3Ctext x=%2248%22 y=%2290%22 text-anchor=%22middle%22 font-size=%2211%22 font-family=%22Arial, sans-serif%22 font-weight=%22700%22 fill=%22%23c59d3f%22%3EKH%3C/text%3E%3C/svg%3E';

function toDate(value: string) {
  return new Date(value);
}

async function main() {
  await prisma.paymentTransaction.deleteMany();
  await prisma.bookingPassenger.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.tourInstance.deleteMany();
  await prisma.voucherTarget.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.tourProgram.deleteMany();
  await prisma.supplierServicePrice.deleteMany();
  await prisma.supplierServiceVariant.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.servicePrice.deleteMany();
  await prisma.service.deleteMany();
  await prisma.tourGuide.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await hashPassword('123456aA@');

  const [admin, manager, coordinator, sales, customer] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@travela.vn',
        fullName: 'Quản trị viên',
        phone: '0901234567',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@travela.vn',
        fullName: 'Quản lý kinh doanh',
        phone: '0901234568',
        role: 'MANAGER',
        status: 'ACTIVE',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'coordinator@travela.vn',
        fullName: 'Điều phối viên',
        phone: '0901234569',
        role: 'COORDINATOR',
        status: 'ACTIVE',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sales@travela.vn',
        fullName: 'Nhân viên kinh doanh',
        phone: '0901234570',
        role: 'SALES',
        status: 'ACTIVE',
        passwordHash: defaultPasswordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer@travela.vn',
        fullName: 'Khách hàng',
        phone: '0988888888',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        avatarUrl: CUSTOMER_AVATAR,
        passwordHash: defaultPasswordHash,
      },
    }),
  ]);

  const publicTours = [
    {
      id: 'T001',
      slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
      title: 'Kh?m Ph? V?nh H? Long - Du Thuy?n 5 Sao',
      description: 'Tr?i nghi?m ho?ng h?n r?c r? tr?n v?nh di s?n c?ng d?ch v? nh? h?ng fine-dining tr?n du thuy?n Ambassador.',
      highlights: ['Ngh? ??m tr?n du thuy?n', 'Sunset party', 'Ch?o kayak hang Lu?n'],
      duration: { days: 3, nights: 2 },
      price: { adult: 4500000, child: 2250000, infant: 0 },
      originalPrice: 5500000,
      image: '/login_hero.png',
      gallery: [
        '/login_hero.png',
        '/login_hero.png',
      ],
      startDate: '2026-04-10',
      availableSeats: 12,
      minParticipants: 8,
      status: 'published',
      category: 'domestic',
      itinerary: [
        { day: 1, title: 'H? N?i - V?nh H? Long', description: '??n kh?ch t?i H? N?i, check-in du thuy?n.', activities: ['Nh?n ph?ng', 'Ti?c t?i'], meals: ['lunch', 'dinner'] },
        { day: 2, title: 'Kh?m ph? v?nh', description: 'Th?m hang S?ng S?t v? b?i Ti T?p.', activities: ['Hang S?ng S?t', 'Ti T?p'], meals: ['breakfast', 'lunch', 'dinner'] },
        { day: 3, title: 'Tr? v? H? N?i', description: 'Ng?m b?nh minh v? brunch tr?n t?u.', activities: ['Th?i c?c quy?n', 'Brunch'], meals: ['breakfast', 'lunch'] },
      ],
      departurePoint: 'H? N?i',
      sightseeingSpots: ['Qu?ng Ninh'],
      transport: 'xe',
      tourType: 'quanh_nam',
      bookingDeadline: 7,
      weekdays: ['t4', 't6', 'cn'],
      yearRoundStartDate: '2026-04-01',
      yearRoundEndDate: '2026-09-30',
      coverageMonths: 3,
      departureSchedule: [
        { id: 'DS001-1', date: '2026-04-10', availableSeats: 12, status: 'open', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
        { id: 'DS001-2', date: '2026-04-17', availableSeats: 8, status: 'filling', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
        { id: 'DS001-3', date: '2026-04-24', availableSeats: 12, status: 'open', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
        { id: 'DS001-4', date: '2026-05-01', availableSeats: 12, status: 'open', priceAdult: 4800000, priceChild: 2400000, priceInfant: 0, singleRoomSurcharge: 500000 },
        { id: 'DS001-5', date: '2026-05-08', availableSeats: 0, status: 'full', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
      ],
      inclusions: ['Xe Limousine ??a ??n kh? h?i', '02 ??m ngh? tr?n du thuy?n', 'B?a ?n theo ch??ng tr?nh (3 b?a/ng?y)', 'V? tham quan hang ??ng', 'Ch?o Kayak', 'B?o hi?m du l?ch'],
      exclusions: ['Chi ph? c? nh?n, ?? u?ng ngo?i th?c ??n', 'Ti?n tip cho h??ng d?n vi?n v? l?i xe', 'VAT n?u y?u c?u xu?t h?a ??n'],
      childPolicy: 'Tr? em (d??i 12 tu?i): 50% gi? ng??i l?n. Tr? s? sinh (d??i 2 tu?i): mi?n ph? (kh?ng chi?m gh?).',
      cancellationPolicy: [
        { daysBefore: 30, refundPercent: 100 },
        { daysBefore: 15, refundPercent: 70 },
        { daysBefore: 7, refundPercent: 50 },
      ],
      rating: 4.9,
      reviewCount: 128,
    },
    {
      id: 'T002',
      slug: 'amanoi-ninh-thuan-resort-chi-mang-tinh-chat-nghi-duong',
      title: 'Amanoi Ninh Thu?n - Tr?i Nghi?m T?nh T?i',
      description: 'Ngh? d??ng cao c?p t?i Amanoi v?i kh?ng gian ri?ng t? v? d?ch v? ch?m s?c s?c kh?e.',
      highlights: ['Bi?t th? h? b?i', 'Spa', 'B?a t?i ri?ng t?'],
      duration: { days: 4, nights: 3 },
      price: { adult: 28000000, child: 14000000, infant: 2800000 },
      image: '/login_hero.png',
      gallery: [
        '/login_hero.png',
        '/login_hero.png',
      ],
      startDate: '2026-05-01',
      availableSeats: 4,
      minParticipants: 2,
      status: 'published',
      category: 'domestic',
      itinerary: [
        { day: 1, title: 'S?n bay Cam Ranh - Amanoi', description: 'Check-in bi?t th? ngh? d??ng.', activities: ['Check-in'], meals: ['lunch', 'dinner'] },
        { day: 2, title: 'H?nh tr?nh n??c', description: 'Du thuy?n ri?ng v? snorkeling.', activities: ['Du thuy?n', 'Snorkeling'], meals: ['breakfast', 'lunch', 'dinner'] },
        { day: 3, title: 'Tĩnh tại', description: 'Yoga và trekking nhẹ.', activities: ['Yoga', 'Trekking'], meals: ['breakfast', 'lunch', 'dinner'] },
        { day: 4, title: 'T?m bi?t', description: 'Tr? ph?ng v? ra s?n bay.', activities: ['Tr? ph?ng'], meals: ['breakfast'] },
      ],
      departurePoint: 'H? Ch? Minh',
      sightseeingSpots: ['Ninh Thu?n'],
      transport: 'xe',
      tourType: 'quanh_nam',
      bookingDeadline: 14,
      weekdays: ['t5', 'cn'],
      yearRoundStartDate: '2026-05-01',
      yearRoundEndDate: '2026-12-31',
      coverageMonths: 6,
      departureSchedule: [
        { id: 'DS002-1', date: '2026-05-01', availableSeats: 4, status: 'open', priceAdult: 28000000, priceChild: 14000000, priceInfant: 2800000 },
        { id: 'DS002-2', date: '2026-05-15', availableSeats: 4, status: 'open', priceAdult: 28000000, priceChild: 14000000, priceInfant: 2800000 },
      ],
      inclusions: ['Xe đưa đón', '03 đêm Amanoi', 'Spa 60 phút/ngày'],
      exclusions: ['Vé máy bay', 'Chi phí cá nhân'],
      childPolicy: 'Tr? em d??i 12 tu?i t?nh 50% gi? ng??i l?n.',
      cancellationPolicy: [
        { daysBefore: 14, refundPercent: 100 },
        { daysBefore: 7, refundPercent: 50 },
      ],
      rating: 4.8,
      reviewCount: 56,
    },
    {
      id: 'T003',
      slug: 'kham-pha-mua-thu-kyoto-chuyen-bay-thang',
      title: 'Mùa Thu Kyoto & Osaka - Vẻ Đẹp Vĩnh Cửu',
      description: 'Hành trình 6 ngày khám phá Kyoto và Osaka trong mùa lá đỏ.',
      highlights: ['Kimono', 'Kaiseki', 'Onsen'],
      duration: { days: 6, nights: 5 },
      price: { adult: 32000000, child: 26000000, infant: 8000000 },
      originalPrice: 35000000,
      image: '/login_hero.png',
      gallery: [
        '/login_hero.png',
        '/login_hero.png',
      ],
      startDate: '2026-10-15',
      availableSeats: 25,
      minParticipants: 10,
      status: 'published',
      category: 'international',
      itinerary: [
        { day: 1, title: 'H? N?i - Osaka', description: 'Bay th?ng ??n Osaka.', activities: ['Nh?n ph?ng'], meals: ['lunch'] },
        { day: 2, title: 'Khám phá Osaka', description: 'Tham quan lâu đài Osaka.', activities: ['Lâu đài Osaka', 'Dotonbori'], meals: ['breakfast', 'dinner'] },
        { day: 3, title: 'C? ?? Kyoto', description: 'Th?m Kinkakuji v? tr?i nghi?m tr? ??o.', activities: ['Kinkakuji', 'Tr? ??o'], meals: ['breakfast', 'lunch', 'dinner'] },
        { day: 4, title: 'Arashiyama', description: 'R?ng tr?c v? b?a t?i Kaiseki.', activities: ['R?ng tr?c', 'Kaiseki'], meals: ['breakfast', 'lunch', 'dinner'] },
        { day: 5, title: 'Nara', description: 'Công viên hươu và mua sắm.', activities: ['Nara', 'Mua sắm'], meals: ['breakfast', 'lunch'] },
        { day: 6, title: 'Osaka - H? N?i', description: 'Onsen s?ng v? k?t th?c h?nh tr?nh.', activities: ['Onsen'], meals: ['breakfast'] },
      ],
      departurePoint: 'H? N?i',
      sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
      transport: 'maybay',
      arrivalPoint: 'Osaka',
      tourType: 'mua_le',
      holiday: 'Mùa thu Nhật Bản',
      bookingDeadline: 21,
      selectedDates: ['2026-10-15', '2026-10-20'],
      departureSchedule: [
        { id: 'DS003-1', date: '2026-10-15', availableSeats: 25, status: 'open', priceAdult: 32000000, priceChild: 26000000, priceInfant: 8000000 },
        { id: 'DS003-2', date: '2026-10-20', availableSeats: 18, status: 'open', priceAdult: 32000000, priceChild: 26000000, priceInfant: 8000000 },
      ],
      inclusions: ['V? m?y bay', 'Kh?ch s?n 4 sao', '?n theo ch??ng tr?nh', 'B?o hi?m'],
      exclusions: ['Chi phí cá nhân', 'VAT'],
      childPolicy: 'Tr? em 2-11 tu?i t?nh 81% gi? ng??i l?n.',
      cancellationPolicy: [
        { daysBefore: 30, refundPercent: 100 },
        { daysBefore: 21, refundPercent: 80 },
        { daysBefore: 14, refundPercent: 50 },
      ],
      rating: 4.7,
      reviewCount: 89,
    },
  ];

  Object.assign(publicTours[0], {
    title: 'Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao',
    description: 'Trải nghiệm hoàng hôn rực rỡ trên vịnh di sản cùng dịch vụ nhà hàng fine-dining trên du thuyền Ambassador.',
    highlights: ['Nghỉ đêm trên du thuyền', 'Sunset party', 'Chèo kayak hang Luồn'],
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    inclusions: ['Xe Limousine đưa đón khứ hồi', '02 đêm nghỉ trên du thuyền', 'Bữa ăn theo chương trình', 'Vé tham quan hang động', 'Chèo Kayak', 'Bảo hiểm du lịch'],
    exclusions: ['Chi phí cá nhân, đồ uống ngoài thực đơn', 'Tiền tip cho hướng dẫn viên và lái xe', 'VAT nếu yêu cầu xuất hóa đơn'],
    childPolicy: 'Trẻ em dưới 12 tuổi tính 50% giá người lớn. Trẻ sơ sinh dưới 2 tuổi miễn phí.',
    itinerary: [
      { day: 1, title: 'Hà Nội - Vịnh Hạ Long', description: 'Đón khách tại Hà Nội, check-in du thuyền.', activities: ['Nhận phòng', 'Tiệc tối'], meals: ['lunch', 'dinner'] },
      { day: 2, title: 'Khám phá vịnh', description: 'Thăm hang Sửng Sốt và bãi Ti Tốp.', activities: ['Hang Sửng Sốt', 'Ti Tốp'], meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 3, title: 'Trở về Hà Nội', description: 'Ngắm bình minh và brunch trên tàu.', activities: ['Thái cực quyền', 'Brunch'], meals: ['breakfast', 'lunch'] },
    ],
  });

  Object.assign(publicTours[1], {
    title: 'Amanoi Ninh Thuận - Trải Nghiệm Tĩnh Tại',
    description: 'Nghỉ dưỡng cao cấp tại Amanoi với không gian riêng tư và dịch vụ chăm sóc sức khỏe.',
    highlights: ['Biệt thự hồ bơi', 'Spa', 'Bữa tối riêng tư'],
    departurePoint: 'Hồ Chí Minh',
    sightseeingSpots: ['Ninh Thuận'],
    childPolicy: 'Trẻ em dưới 12 tuổi tính 50% giá người lớn.',
  });

  Object.assign(publicTours[2], {
    title: 'Mùa Thu Kyoto & Osaka - Vẻ Đẹp Vĩnh Cửu',
    description: 'Hành trình 6 ngày khám phá Kyoto và Osaka trong mùa lá đỏ.',
    highlights: ['Kimono', 'Kaiseki', 'Onsen'],
    departurePoint: 'Hà Nội',
    holiday: 'Mùa thu Nhật Bản',
  });

  const [tp1, tp2, tp3, tp4] = await Promise.all([
    prisma.tourProgram.create({
      data: {
        code: 'TP001',
        name: publicTours[0].title,
        slug: publicTours[0].slug,
        description: publicTours[0].description,
        departurePoint: publicTours[0].departurePoint,
        arrivalPoint: null,
        sightseeingSpots: publicTours[0].sightseeingSpots,
        durationDays: publicTours[0].duration.days,
        durationNights: publicTours[0].duration.nights,
        transport: 'XE',
        tourType: 'QUANH_NAM',
        bookingDeadline: 7,
        status: 'ACTIVE',
        itineraryJson: publicTours[0].itinerary.map((day) => ({
          day: day.day,
          title: day.title,
          description: day.description,
          meals: day.meals,
        })),
        pricingConfigJson: {
          profitMargin: 20,
          taxRate: 10,
          otherCostFactor: 0.05,
          netPrice: 0,
          sellPriceAdult: 4500000,
          sellPriceChild: 2250000,
          sellPriceInfant: 0,
          minParticipants: 8,
        },
        publicContentJson: publicTours[0],
        createdById: coordinator.id,
        updatedById: coordinator.id,
      },
    }),
    prisma.tourProgram.create({
      data: {
        code: 'TP002',
        name: publicTours[1].title,
        slug: publicTours[1].slug,
        description: publicTours[1].description,
        departurePoint: publicTours[1].departurePoint,
        arrivalPoint: null,
        sightseeingSpots: publicTours[1].sightseeingSpots,
        durationDays: publicTours[1].duration.days,
        durationNights: publicTours[1].duration.nights,
        transport: 'XE',
        tourType: 'QUANH_NAM',
        bookingDeadline: 14,
        status: 'ACTIVE',
        itineraryJson: publicTours[1].itinerary.map((day) => ({
          day: day.day,
          title: day.title,
          description: day.description,
          meals: day.meals,
        })),
        pricingConfigJson: {
          profitMargin: 18,
          taxRate: 10,
          otherCostFactor: 0.08,
          netPrice: 0,
          sellPriceAdult: 28000000,
          sellPriceChild: 14000000,
          sellPriceInfant: 2800000,
          minParticipants: 2,
        },
        publicContentJson: publicTours[1],
        createdById: coordinator.id,
        updatedById: coordinator.id,
      },
    }),
    prisma.tourProgram.create({
      data: {
        code: 'TP003',
        name: publicTours[2].title,
        slug: publicTours[2].slug,
        description: publicTours[2].description,
        departurePoint: publicTours[2].departurePoint,
        arrivalPoint: 'Osaka',
        sightseeingSpots: publicTours[2].sightseeingSpots,
        durationDays: publicTours[2].duration.days,
        durationNights: publicTours[2].duration.nights,
        transport: 'MAYBAY',
        tourType: 'MUA_LE',
        holidayLabel: 'Mùa thu Nhật Bản',
        bookingDeadline: 21,
        status: 'DRAFT',
        itineraryJson: publicTours[2].itinerary.map((day) => ({
          day: day.day,
          title: day.title,
          description: day.description,
          meals: day.meals,
        })),
        pricingConfigJson: {
          profitMargin: 18,
          taxRate: 10,
          otherCostFactor: 0.08,
          netPrice: 0,
          sellPriceAdult: 32000000,
          sellPriceChild: 26000000,
          sellPriceInfant: 8000000,
          minParticipants: 10,
        },
        publicContentJson: publicTours[2],
        createdById: coordinator.id,
        updatedById: coordinator.id,
      },
    }),
    prisma.tourProgram.create({
      data: {
        code: 'TP004',
        name: 'Sapa - Ru�Tng Bậc Thang Mùa Hạ 2N1Đ',
        slug: 'sapa-ruong-bac-thang-mua-ha-2n1d',
        description: 'Chương trình Sapa đang ngừng hoạt đ�Tng đ�f rà soát lại đđi tác và chính sách giá.',
        departurePoint: 'Hà N�Ti',
        sightseeingSpots: ['Sapa', 'Bản Cát Cát', 'Núi Hàm R�"ng'],
        durationDays: 2,
        durationNights: 1,
        transport: 'XE',
        tourType: 'QUANH_NAM',
        bookingDeadline: 10,
        status: 'INACTIVE',
        itineraryJson: [
          { day: 1, title: 'Hà N�Ti - Sapa', description: 'Di chuy�fn lên Sapa.', meals: ['lunch', 'dinner'] },
          { day: 2, title: 'Sapa - Hà N�Ti', description: 'Tr�Y về Hà N�Ti.', meals: ['breakfast', 'lunch'] },
        ],
        pricingConfigJson: {
          profitMargin: 18,
          taxRate: 10,
          otherCostFactor: 0.05,
          netPrice: 0,
          sellPriceAdult: 2200000,
          sellPriceChild: 1600000,
          sellPriceInfant: 0,
          minParticipants: 10,
        },
        publicContentJson: {
          inactiveReason: 'Tạm dừng đ�f cập nhật lại giá phòng và đđi tác vận chuy�fn',
        },
        createdById: coordinator.id,
        updatedById: coordinator.id,
      },
    }),
  ]);

  const instances = await Promise.all([
    prisma.tourInstance.create({
      data: {
        code: 'TI001',
        programId: tp1.id,
        programNameSnapshot: tp1.name,
        departureDate: toDate('2026-04-10'),
        bookingDeadlineAt: toDate('2026-04-03'),
        status: 'DANG_TRIEN_KHAI',
        departurePoint: 'Hà N�Ti',
        sightseeingSpots: ['Quảng Ninh'],
        transport: 'XE',
        expectedGuests: 10,
        minParticipants: 8,
        priceAdult: 4500000,
        priceChild: 2250000,
        priceInfant: 0,
        assignedCoordinatorId: coordinator.id,
        createdById: coordinator.id,
        openedAt: toDate('2026-03-25T00:00:00Z'),
        startedAt: toDate('2026-04-10T00:00:00Z'),
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI002',
        programId: tp3.id,
        programNameSnapshot: tp3.name,
        departureDate: toDate('2026-10-15'),
        bookingDeadlineAt: toDate('2026-09-24'),
        status: 'SAN_SANG_TRIEN_KHAI',
        departurePoint: 'Hà N�Ti',
        arrivalPoint: 'Osaka',
        sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
        transport: 'MAYBAY',
        expectedGuests: 15,
        minParticipants: 10,
        priceAdult: 32000000,
        priceChild: 26000000,
        priceInfant: 8000000,
        createdById: coordinator.id,
        approvedById: manager.id,
        submittedAt: toDate('2026-03-16T10:00:00Z'),
        approvedAt: toDate('2026-03-17T10:00:00Z'),
        openedAt: toDate('2026-03-18T00:00:00Z'),
        warningDate: toDate('2026-10-10'),
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI003',
        programId: tp3.id,
        programNameSnapshot: tp3.name,
        departureDate: toDate('2026-10-20'),
        bookingDeadlineAt: toDate('2026-09-29'),
        status: 'DANG_MO_BAN',
        departurePoint: 'Hà N�Ti',
        arrivalPoint: 'Osaka',
        sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
        transport: 'MAYBAY',
        expectedGuests: 18,
        minParticipants: 10,
        priceAdult: 32000000,
        priceChild: 26000000,
        priceInfant: 8000000,
        createdById: coordinator.id,
        approvedById: manager.id,
        submittedAt: toDate('2026-03-26T10:00:00Z'),
        approvedAt: toDate('2026-03-27T10:00:00Z'),
        openedAt: toDate('2026-03-28T00:00:00Z'),
        warningDate: toDate('2026-10-15'),
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI004',
        programId: tp1.id,
        programNameSnapshot: tp1.name,
        departureDate: toDate('2026-04-17'),
        bookingDeadlineAt: toDate('2026-04-10'),
        status: 'CHO_QUYET_TOAN',
        departurePoint: 'Hà N�Ti',
        sightseeingSpots: ['Quảng Ninh'],
        transport: 'XE',
        expectedGuests: 8,
        minParticipants: 8,
        priceAdult: 4500000,
        priceChild: 2250000,
        priceInfant: 0,
        assignedCoordinatorId: coordinator.id,
        createdById: coordinator.id,
        openedAt: toDate('2026-03-12T00:00:00Z'),
        closedAt: toDate('2026-04-14T00:00:00Z'),
        receivedAt: toDate('2026-04-14T10:00:00Z'),
        readyAt: toDate('2026-04-15T10:00:00Z'),
        startedAt: toDate('2026-04-17T06:00:00Z'),
        endedAt: toDate('2026-04-19T18:00:00Z'),
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI005',
        programId: tp2.id,
        programNameSnapshot: tp2.name,
        departureDate: toDate('2026-05-01'),
        bookingDeadlineAt: toDate('2026-04-17'),
        status: 'DANG_MO_BAN',
        departurePoint: 'H�" Chí Minh',
        sightseeingSpots: ['Ninh Thuận'],
        transport: 'XE',
        expectedGuests: 4,
        minParticipants: 2,
        priceAdult: 28000000,
        priceChild: 14000000,
        priceInfant: 2800000,
        createdById: coordinator.id,
        openedAt: toDate('2026-03-25T00:00:00Z'),
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI006',
        programId: tp1.id,
        programNameSnapshot: tp1.name,
        departureDate: toDate('2026-03-20'),
        bookingDeadlineAt: toDate('2026-03-13'),
        status: 'DA_HUY',
        departurePoint: 'Hà N�Ti',
        sightseeingSpots: ['Quảng Ninh'],
        transport: 'XE',
        expectedGuests: 5,
        minParticipants: 8,
        priceAdult: 4500000,
        priceChild: 2250000,
        priceInfant: 0,
        createdById: coordinator.id,
        openedAt: toDate('2026-03-05T00:00:00Z'),
        closedAt: toDate('2026-03-17T00:00:00Z'),
        cancelledAt: toDate('2026-03-17T12:00:00Z'),
        cancelReason: 'Không đủ khách tđi thi�fu (ch�? có 5/8)',
        refundTotal: 11250000,
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI007',
        programId: tp3.id,
        programNameSnapshot: tp3.name,
        departureDate: toDate('2026-10-20'),
        bookingDeadlineAt: toDate('2026-09-29'),
        status: 'DANG_MO_BAN',
        departurePoint: 'Hà N�Ti',
        arrivalPoint: 'Osaka',
        sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
        transport: 'MAYBAY',
        expectedGuests: 18,
        minParticipants: 10,
        priceAdult: 32000000,
        priceChild: 26000000,
        priceInfant: 8000000,
        createdById: coordinator.id,
        approvedById: manager.id,
        submittedAt: toDate('2026-03-26T10:00:00Z'),
        approvedAt: toDate('2026-03-27T10:00:00Z'),
        openedAt: toDate('2026-03-28T00:00:00Z'),
        warningDate: toDate('2026-10-15'),
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI008',
        programId: tp1.id,
        programNameSnapshot: tp1.name,
        departureDate: toDate('2026-04-24'),
        bookingDeadlineAt: toDate('2026-04-17'),
        status: 'CHO_NHAN_DIEU_HANH',
        departurePoint: 'Hà N�Ti',
        sightseeingSpots: ['Quảng Ninh'],
        transport: 'XE',
        expectedGuests: 12,
        minParticipants: 8,
        priceAdult: 4500000,
        priceChild: 2250000,
        priceInfant: 0,
        assignedCoordinatorId: coordinator.id,
        createdById: coordinator.id,
        openedAt: toDate('2026-03-18T00:00:00Z'),
        closedAt: toDate('2026-04-21T00:00:00Z'),
      },
    }),
    prisma.tourInstance.create({
      data: {
        code: 'TI009',
        programId: tp1.id,
        programNameSnapshot: tp1.name,
        departureDate: toDate('2026-05-22'),
        bookingDeadlineAt: toDate('2026-05-15'),
        status: 'CHO_DU_TOAN',
        departurePoint: 'Hà N�Ti',
        sightseeingSpots: ['Quảng Ninh'],
        transport: 'XE',
        expectedGuests: 10,
        minParticipants: 8,
        priceAdult: 4700000,
        priceChild: 2350000,
        priceInfant: 0,
        assignedCoordinatorId: coordinator.id,
        createdById: coordinator.id,
        openedAt: toDate('2026-03-22T00:00:00Z'),
        closedAt: toDate('2026-05-18T00:00:00Z'),
        receivedAt: toDate('2026-05-18T10:00:00Z'),
      },
    }),
  ]);

  await prisma.supplier.createMany({
    data: [
      {
        id: 'SUP001',
        name: 'Khách sạn Di Sản Vi�?t',
        phone: '024 3939 8888',
        email: 'contact@heritage.vn',
        type: 'HOTEL',
        serviceSummary: 'Lưu trú',
        operatingArea: 'Hạ Long',
        address: '12 Bãi Cháy, Hạ Long',
        establishedYear: 2016,
        description: 'Khách sạn 4 sao phục vụ khách đoàn, có nhà hàng n�Ti khu.',
        isActive: true,
      },
      {
        id: 'SUP002',
        name: 'Vận tải Xuyên Vi�?t',
        phone: '0901 234 567',
        email: 'ops@vantaiviet.vn',
        type: 'TRANSPORT',
        serviceSummary: 'Xe tham quan',
        operatingArea: 'Hà N�Ti, Quảng Ninh, Ninh Bình',
        address: '31 Trần Quang Khải, Hà N�Ti',
        establishedYear: 2014,
        description: 'Nhà xe chuyên tour ghép và tour riêng.',
        isActive: true,
      },
      {
        id: 'SUP004',
        name: 'The Lotus Dining Room',
        phone: '024 3888 7777',
        email: 'reserve@lotus.vn',
        type: 'RESTAURANT',
        serviceSummary: 'Bữa �fn đoàn',
        operatingArea: 'Hà N�Ti',
        address: '88 Tràng Tiền, Hoàn Kiếm, Hà N�Ti',
        establishedYear: 2011,
        description: 'Nhà hàng chuyên set menu cho khách du l�<ch đoàn.',
        isActive: false,
      },
    ],
  });

  await prisma.supplierServiceVariant.createMany({
    data: [
      {
        id: 'SUP001-S1',
        supplierId: 'SUP001',
        name: 'Phòng đôi',
        description: 'Phòng tiêu chuẩn hư�>ng phđ',
        unit: 'Phòng',
        quantity: 1,
        basePrice: 1300000,
      },
      {
        id: 'SUP001-S2',
        supplierId: 'SUP001',
        name: 'Phòng đơn',
        description: 'Phòng tiêu chuẩn giường l�>n',
        unit: 'Phòng',
        quantity: 1,
        basePrice: 1200000,
      },
      {
        id: 'SUP001-M1',
        supplierId: 'SUP001',
        name: 'Buffet sáng',
        unit: 'Bữa',
        quantity: 1,
        basePrice: 180000,
        isMealService: true,
        menu: 'Buffet 20 món + nư�>c ép',
        note: 'Phục vụ từ 06:00-09:30',
      },
      {
        id: 'SUP002-S1',
        supplierId: 'SUP002',
        name: 'Xe 16 chá»—',
        description: 'Đ�"ng hành suđt hành trình',
        unit: 'Xe',
        quantity: 1,
        capacity: 16,
        basePrice: 8100000,
        transportType: 'XE',
        priceMode: 'QUOTED',
      },
      {
        id: 'SUP002-S2',
        supplierId: 'SUP002',
        name: 'Xe 25 chá»—',
        description: 'Phương án dự phòng',
        unit: 'Xe',
        quantity: 1,
        capacity: 25,
        basePrice: 9600000,
        transportType: 'XE',
        priceMode: 'QUOTED',
      },
      {
        id: 'SUP004-S1',
        supplierId: 'SUP004',
        name: 'Set menu đoàn',
        description: 'Phục vụ bàn tròn 10 người',
        unit: 'Bàn',
        quantity: 1,
        basePrice: 1800000,
        menu: '6 món + canh + tráng mi�?ng',
        note: 'Có menu chay theo yêu cầu',
      },
    ],
  });

  await prisma.supplierServicePrice.createMany({
    data: [
      { serviceVariantId: 'SUP001-S1', unitPrice: 1300000, fromDate: toDate('2026-01-01'), toDate: toDate('2026-12-31'), note: 'Giá chuẩn', createdByName: 'Điều phđi viên' },
      { serviceVariantId: 'SUP001-S2', unitPrice: 1200000, fromDate: toDate('2026-01-01'), toDate: toDate('2026-12-31'), note: 'Giá chuẩn', createdByName: 'Điều phđi viên' },
      { serviceVariantId: 'SUP001-M1', unitPrice: 180000, fromDate: toDate('2026-01-01'), toDate: toDate('2026-12-31'), note: 'Áp dụng n�Ti khu', createdByName: 'Điều phđi viên' },
      { serviceVariantId: 'SUP002-S1', unitPrice: 8100000, fromDate: toDate('2026-04-01'), toDate: toDate('2026-09-30'), note: 'Xe 16 ch�-', createdByName: 'Điều phđi viên' },
      { serviceVariantId: 'SUP002-S2', unitPrice: 9600000, fromDate: toDate('2026-04-01'), toDate: toDate('2026-09-30'), note: 'Xe 25 ch�-', createdByName: 'Điều phđi viên' },
      { serviceVariantId: 'SUP004-S1', unitPrice: 1800000, fromDate: toDate('2026-01-01'), toDate: toDate('2026-12-31'), note: 'Set menu cơ bản', createdByName: 'Điều phđi viên' },
    ],
  });

  await prisma.service.createMany({
    data: [
      {
        id: 'service-1',
        code: 'SV-TKT',
        name: 'Vé tham quan Sun World',
        category: 'ATTRACTION_TICKET',
        unit: 'vé',
        priceMode: 'LISTED',
        priceSetup: 'BY_AGE',
        status: 'ACTIVE',
        description: 'Áp dụng cho các chương trình tham quan tại Đà Nẵng.',
        supplierName: 'Sun World Hạ Long',
        contactInfo: '024 3936 6666',
        province: 'Đà Nẵng',
      },
      {
        id: 'service-2',
        code: 'SV-INS',
        name: 'Bảo hiểm du lịch',
        category: 'OTHER',
        unit: 'khách',
        priceMode: 'LISTED',
        priceSetup: 'COMMON',
        status: 'ACTIVE',
        description: 'Áp dụng trực tiếp vào chi phí khác.',
        supplierName: 'Bảo Việt Travel Care',
        contactInfo: 'hotro@baoviet.example',
        formulaCount: 'DEFAULT_VALUE',
        formulaCountDefault: '1',
        formulaQuantity: 'DEFAULT_VALUE',
        formulaQuantityDefault: 'Theo sđ người',
      },
    ],
  });

  await prisma.servicePrice.createMany({
    data: [
      { serviceId: 'service-1', unitPrice: 250000, effectiveDate: toDate('2026-01-01'), endDate: toDate('2026-06-30'), note: 'Người l�>n', createdByName: 'Trư�Yng phòng điều phđi' },
      { serviceId: 'service-1', unitPrice: 180000, effectiveDate: toDate('2026-01-01'), endDate: toDate('2026-06-30'), note: 'Trẻ em', createdByName: 'Trư�Yng phòng điều phđi' },
      { serviceId: 'service-2', unitPrice: 40000, effectiveDate: toDate('2026-01-01'), endDate: toDate('2026-12-31'), note: 'Bảo hi�fm n�Ti đ�<a', createdByName: 'Điều phđi viên' },
    ],
  });

  await prisma.tourGuide.createMany({
    data: [
      {
        code: 'HDV001',
        fullName: 'Trần Minh Hoàng',
        gender: 'MALE',
        dateOfBirth: toDate('1986-04-12'),
        phone: '0901 111 222',
        email: 'hoang.hdv@travela.vn',
        address: '25 Nguy�.n Chí Thanh, Hà N�Ti',
        operatingArea: 'Miền Bắc',
        guideCardNumber: 'HDV-001-2020',
        issueDate: toDate('2020-03-20'),
        expiryDate: toDate('2030-03-20'),
        issuePlace: 'Tổng cục Du lịch',
        note: 'Phụ trách tour n�Ti đ�<a miền Bắc',
        languagesJson: ['Tiếng Anh'],
      },
      {
        code: 'HDV002',
        fullName: 'Lê Thu Hà',
        gender: 'FEMALE',
        dateOfBirth: toDate('1992-08-21'),
        phone: '0902 333 444',
        email: 'ha.hdv@travela.vn',
        address: '15 Lý Thường Ki�?t, Hà N�Ti',
        operatingArea: 'Nhật Bản',
        guideCardNumber: 'HDV-002-2021',
        issueDate: toDate('2021-05-11'),
        expiryDate: toDate('2031-05-11'),
        issuePlace: 'S�Y Du l�<ch Hà N�Ti',
        note: 'Ưu tiên tour inbound Nhật Bản',
        languagesJson: ['Tiếng Nhật', 'Tiếng Anh'],
      },
    ],
  });

  await prisma.voucher.createMany({
    data: [
      {
        code: 'SUMMER2026',
        type: 'PERCENT',
        valueAmount: 20,
        startsAt: toDate('2026-06-01'),
        endsAt: toDate('2026-08-31'),
        usageLimit: 200,
        usedCount: 0,
        status: 'DRAFT',
        description: 'Khuyến mãi mùa hè 2026',
        createdById: sales.id,
      },
      {
        code: 'PROMO10PCT',
        type: 'PERCENT',
        valueAmount: 10,
        startsAt: toDate('2026-04-20'),
        endsAt: toDate('2026-12-31'),
        usageLimit: 100,
        usedCount: 15,
        status: 'PENDING_APPROVAL',
        description: 'Giảm 10% cho tour chọn lọc',
        createdById: sales.id,
      },
      {
        code: 'VIP50PCT',
        type: 'PERCENT',
        valueAmount: 50,
        startsAt: toDate('2026-04-01'),
        endsAt: toDate('2026-06-30'),
        usageLimit: 10,
        usedCount: 0,
        status: 'REJECTED',
        description: 'Voucher b�< từ chđi do giá tr�< quá cao',
        rejectionReason: 'Giá tr�< giảm quá cao, vui lòng giảm xuđng 30%',
        createdById: sales.id,
      },
      {
        code: 'LUXURY500K',
        type: 'FIXED',
        valueAmount: 500000,
        startsAt: toDate('2026-01-01'),
        endsAt: toDate('2026-12-31'),
        usageLimit: 50,
        usedCount: 12,
        status: 'ACTIVE',
        description: 'Giảm 500K cho đơn hàng cao cấp',
        createdById: sales.id,
        approvedById: manager.id,
      },
    ],
  });

  await prisma.blogPost.createMany({
    data: [
      {
        slug: 'cam-nang-du-thuyen-ha-long',
        title: 'Cẩm Nang Du Thuyền Hạ Long',
        category: 'Cẩm nang',
        excerpt: 'Những điều cần chuẩn bị trước khi lên du thuyền Hạ Long.',
        contentMarkdown: '# Cẩm nang\n\nChuẩn bị giấy tờ, trang phục và thuốc cá nhân.',
        coverImageUrl: '/login_hero.png',
        publishedAt: toDate('2026-03-10'),
      },
      {
        slug: 'kinh-nghiem-ngam-la-do-kyoto',
        title: 'Kinh Nghiệm Ngắm Lá Đỏ Kyoto',
        category: 'Kinh nghiệm',
        excerpt: 'Thời điểm đẹp nhất để ngắm lá đỏ tại Kyoto.',
        contentMarkdown: '# Kyoto mùa thu\n\nNên đặt sớm để giữ chỗ.',
        coverImageUrl: '/login_hero.png',
        publishedAt: toDate('2026-03-15'),
      },
    ],
  });

  await prisma.booking.create({
    data: {
      id: 'B001',
      bookingCode: 'BK-582910',
      tourInstanceId: instances[0].id,
      userId: customer.id,
      status: 'CONFIRMED',
      refundStatus: 'NONE',
      paymentMethod: 'PAYOS',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Nguy�.n V�fn A',
      contactEmail: 'nguyenvana@gmail.com',
      contactPhone: '0988 888 888',
      contactNote: 'Dị ứng hải sản nhẹ',
      roomCountsJson: { single: 1, double: 0, triple: 0 },
      totalAmount: 9000000,
      paidAmount: 9000000,
      remainingAmount: 0,
      confirmedById: sales.id,
      confirmedAt: toDate('2026-03-25T11:00:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Nguy�.n V�fn A', gender: 'MALE', dateOfBirth: toDate('1985-05-12'), cccd: '001085012345', nationality: 'Vi�?t Nam' },
          { type: 'ADULT', fullName: 'Trần Thị B', gender: 'FEMALE', dateOfBirth: toDate('1987-08-20'), cccd: '001087067890', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 9000000, method: 'PAYOS', status: 'PAID', paidAt: toDate('2026-03-25T10:45:00Z'), transactionRef: 'PAYOS-17000001', orderCode: '17000001' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B002',
      bookingCode: 'BK-102938',
      tourInstanceId: instances[1].id,
      userId: customer.id,
      status: 'PENDING_CANCEL',
      refundStatus: 'PENDING',
      paymentMethod: 'PAYOS',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Nguy�.n V�fn A',
      contactEmail: 'nguyenvana@gmail.com',
      contactPhone: '0988 888 888',
      bankInfoJson: { accountNumber: '1234567890', bankName: 'Vietcombank', accountHolder: 'NGUYEN VAN A' },
      totalAmount: 32000000,
      paidAmount: 32000000,
      remainingAmount: 0,
      cancellationReason: 'Thay đ�.i kế hoạch công tác',
      cancelledAt: toDate('2026-04-05T10:00:00Z'),
      refundAmount: 25600000,
      payloadJson: {
        cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
        cancelledConfirmedAt: '2026-04-05T10:30:00Z',
      },
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Nguy�.n V�fn A', gender: 'MALE', dateOfBirth: toDate('1985-05-12'), cccd: '001085012345', nationality: 'Vi�?t Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 32000000, method: 'PAYOS', status: 'PAID', paidAt: toDate('2026-03-26T08:20:00Z'), transactionRef: 'PAYOS-17000002', orderCode: '17000002' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B003',
      bookingCode: 'BK-394821',
      tourInstanceId: instances[4].id,
      userId: customer.id,
      status: 'PENDING',
      refundStatus: 'NONE',
      paymentMethod: 'PAYOS',
      paymentType: 'ONLINE',
      paymentStatus: 'PARTIAL',
      contactName: 'Lê V�fn C',
      contactEmail: 'levanc@gmail.com',
      contactPhone: '0912 345 678',
      roomCountsJson: { single: 1, double: 1, triple: 0 },
      totalAmount: 56000000,
      paidAmount: 28000000,
      remainingAmount: 28000000,
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Lê V�fn C', gender: 'MALE', dateOfBirth: toDate('1990-03-15'), cccd: '001090034567', nationality: 'Vi�?t Nam', singleRoomSupplement: 500000 },
          { type: 'ADULT', fullName: 'Phạm Thị D', gender: 'FEMALE', dateOfBirth: toDate('1992-07-22'), cccd: '001092078901', nationality: 'Việt Nam' },
          { type: 'CHILD', fullName: 'Lê Minh E', gender: 'MALE', dateOfBirth: toDate('2018-01-10') },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 28000000, method: 'PAYOS', status: 'PAID', paidAt: toDate('2026-03-24T14:10:00Z'), transactionRef: 'PAYOS-17000003', orderCode: '17000003' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B004',
      bookingCode: 'BK-847291',
      tourInstanceId: instances[3].id,
      userId: customer.id,
      status: 'COMPLETED',
      refundStatus: 'NONE',
      paymentMethod: 'PAYOS',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Hoang Van F',
      contactEmail: 'hoangvanf@gmail.com',
      contactPhone: '0977 654 321',
      totalAmount: 9000000,
      paidAmount: 9000000,
      remainingAmount: 0,
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Hoang Van F', gender: 'MALE', dateOfBirth: toDate('1988-11-05'), cccd: '001088056789', nationality: 'Viet Nam' },
          { type: 'ADULT', fullName: 'Vu Thi G', gender: 'FEMALE', dateOfBirth: toDate('1990-09-18'), cccd: '001090098765', nationality: 'Viet Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 4500000, method: 'PAYOS', status: 'PAID', paidAt: toDate('2026-03-20T09:50:00Z'), transactionRef: 'PAYOS-17000004', orderCode: '17000004' },
          { amount: 4500000, method: 'PAYOS', status: 'PAID', paidAt: toDate('2026-04-09T10:00:00Z'), transactionRef: 'PAYOS-17000005', orderCode: '17000005' },
        ],
      },
    },
  });

  await resetBookingFixtures(prisma);
  await resetTourWorkflowFixtures(prisma);
  await resetVoucherFixtures(prisma);

  console.log('Seed completed.');
  console.log('Accounts:');
  console.log('admin@travela.vn / 123456aA@');
  console.log('manager@travela.vn / 123456aA@');
  console.log('coordinator@travela.vn / 123456aA@');
  console.log('sales@travela.vn / 123456aA@');
  console.log('customer@travela.vn / 123456aA@');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
