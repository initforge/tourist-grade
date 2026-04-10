export interface DepartureScheduleEntry {
  id: string;
  date: string;
  availableSeats: number;
  status: 'open' | 'filling' | 'full' | 'closed';
  priceAdult?: number;
  priceChild?: number;
  priceInfant?: number;
  singleRoomSurcharge?: number;
}

export interface CancellationTier {
  daysBefore: number;
  refundPercent: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: ('breakfast' | 'lunch' | 'dinner')[];
}

export interface Tour {
  id: string;
  slug: string;
  title: string;
  description: string;
  highlights: string[];
  duration: { days: number; nights: number };
  price: { adult: number; child: number; infant?: number };
  originalPrice?: number;
  image: string;
  gallery: string[];
  startDate: string;
  availableSeats: number;
  minParticipants: number;
  status: 'published' | 'draft' | 'archived';
  category: 'domestic' | 'international';
  itinerary: ItineraryDay[];
  // Coach/Customer fields
  departurePoint: string;
  sightseeingSpots: string[];
  transport: 'xe' | 'maybay';
  arrivalPoint?: string;
  tourType: 'mua_le' | 'quanh_nam';
  holiday?: string;
  bookingDeadline: number;
  departureSchedule: DepartureScheduleEntry[];
  inclusions: string[];
  exclusions: string[];
  childPolicy: string;
  cancellationPolicy: CancellationTier[];
  rating?: number;
  reviewCount?: number;
}

export const mockTours: Tour[] = [
  {
    id: 'T001',
    slug: 'kham-pha-vinh-ha-long-du-thuyen-5-sao',
    title: 'Khám Phá Vịnh Hạ Long - Du Thuyền 5 Sao',
    description: 'Trải nghiệm hoàng hôn rực rỡ trên vịnh di sản cùng dịch vụ nhà hàng fine-dining trên du thuyền Ambassador. Một hành trình thức tỉnh mọi giác quan.',
    highlights: ['Nghỉ đêm trên du thuyền The Halong Catamaran', 'Tiệc trà chiều Sunset Party', 'Chèo Kayak hang Luồn'],
    duration: { days: 3, nights: 2 },
    price: { adult: 4500000, child: 2250000 },
    originalPrice: 5500000,
    image: 'https://picsum.photos/seed/halong/1200/800',
    gallery: [
      'https://picsum.photos/seed/halong1/800/600',
      'https://picsum.photos/seed/halong2/800/600',
    ],
    startDate: '2026-04-10',
    availableSeats: 12,
    minParticipants: 8,
    status: 'published',
    category: 'domestic',
    itinerary: [
      { day: 1, title: 'Hà Nội - Vịnh Hạ Long', description: 'Đón khách tại Hà Nội và di chuyển xuống cảng Tuần Châu. Check-in du thuyền và thưởng thức welcome drink.', activities: ['Nhận phòng du thuyền', 'Tiệc nướng BBQ'], meals: ['lunch', 'dinner'] },
      { day: 2, title: 'Khám Phá Hang Sửng Sốt', description: 'Thăm quan một trong những hang động lớn nhất Vịnh. Tắm biển tại bãi Ti Tốp và tham gia lớp nấu ăn truyền thống.', activities: ['Tắm biển Ti Tốp', 'Lớp học nấu ăn'], meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 3, title: 'Hạ Long - Hà Nội', description: 'Ngắm bình minh và tập Thái Cực Quyền trên boong tàu. Brunch và trở về Hà Nội.', activities: ['Brunch tự chọn', 'Trở về Hà Nội'], meals: ['breakfast', 'lunch'] }
    ],
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Quảng Ninh'],
    transport: 'xe',
    tourType: 'quanh_nam',
    bookingDeadline: 7,
    departureSchedule: [
      { id: 'DS001-1', date: '2026-04-10', availableSeats: 12, status: 'open', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
      { id: 'DS001-2', date: '2026-04-17', availableSeats: 5, status: 'filling', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
      { id: 'DS001-3', date: '2026-04-24', availableSeats: 12, status: 'open', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
      { id: 'DS001-4', date: '2026-05-01', availableSeats: 12, status: 'open', priceAdult: 4800000, priceChild: 2400000, priceInfant: 0, singleRoomSurcharge: 500000 },
      { id: 'DS001-5', date: '2026-05-08', availableSeats: 0, status: 'full', priceAdult: 4500000, priceChild: 2250000, priceInfant: 0 },
    ],
    inclusions: ['Xe Limousine đưa đón khứ hồi', '02 đêm nghỉ trên du thuyền', 'Bữa ăn theo chương trình (3 bữa/ngày)', 'Vé tham quan hang động', 'Chèo Kayak', 'Bảo hiểm du lịch'],
    exclusions: ['Chi phí cá nhân, đồ uống ngoài thực đơn', 'Tiền tip cho hướng dẫn viên và lái xe', 'VAT nếu yêu cầu xuất hóa đơn'],
    childPolicy: 'Trẻ em (dưới 12 tuổi): 50% giá người lớn. Trẻ sơ sinh (dưới 2 tuổi): miễn phí (không chiếm ghế).',
    cancellationPolicy: [
      { daysBefore: 30, refundPercent: 100 },
      { daysBefore: 15, refundPercent: 70 },
      { daysBefore: 7, refundPercent: 50 },
      { daysBefore: 3, refundPercent: 20 },
    ],
    rating: 4.9,
    reviewCount: 128,
  },
  {
    id: 'T002',
    slug: 'amanoi-ninh-thuan-resort-chi-mang-tinh-chat-nghi-duong',
    title: 'Amanoi Ninh Thuận - Trải Nghiệm Tĩnh Tại',
    description: 'Nép mình bên bờ vịnh Vĩnh Hy, Amanoi mang đến không gian thiền định và các liệu trình spa chăm sóc sức khỏe thượng lưu.',
    highlights: ['Biệt thự hồ bơi riêng biệt', 'Trị liệu Spa thủy liệu pháp', 'Ăn tối riêng tư trên bãi biển'],
    duration: { days: 4, nights: 3 },
    price: { adult: 28000000, child: 14000000, infant: 2800000 },
    image: 'https://picsum.photos/seed/amanoi/1200/800',
    gallery: [
      'https://picsum.photos/seed/amanoi1/800/600',
      'https://picsum.photos/seed/amanoi2/800/600',
    ],
    startDate: '2026-05-01',
    availableSeats: 4,
    minParticipants: 2,
    status: 'published',
    category: 'domestic',
    itinerary: [
      { day: 1, title: 'Sân bay Cam Ranh - Amanoi', description: 'Đón bằng xe sang và check-in biệt thự. Thư giãn với massage chào đón.', activities: ['Massage thư giãn'], meals: ['lunch', 'dinner'] },
      { day: 2, title: 'Hành trình nước', description: 'Khám phá Vịnh Vĩnh Hy trên du thuyền Aman. Snorkeling và picnic bãi biển riêng.', activities: ['Snorkeling', 'Picnic bãi biển'], meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 3, title: 'Thiền định và tĩnh tâm', description: 'Lớp Yoga riêng với thiền sư. Trekking đỉnh núi Vườn Quốc Gia Núi Chúa.', activities: ['Yoga thiền định', 'Trekking đỉnh núi'], meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 4, title: 'Tạm biệt Vĩnh Hy', description: 'Ăn sáng muộn và di chuyển ra sân bay Cam Ranh.', activities: ['Trả phòng'], meals: ['breakfast'] }
    ],
    departurePoint: 'Hồ Chí Minh',
    sightseeingSpots: ['Ninh Thuận'],
    transport: 'xe',
    tourType: 'quanh_nam',
    bookingDeadline: 14,
    departureSchedule: [
      { id: 'DS002-1', date: '2026-05-01', availableSeats: 4, status: 'open', priceAdult: 28000000, priceChild: 14000000, priceInfant: 2800000, singleRoomSurcharge: 8000000 },
      { id: 'DS002-2', date: '2026-05-15', availableSeats: 4, status: 'open', priceAdult: 28000000, priceChild: 14000000, priceInfant: 2800000, singleRoomSurcharge: 8000000 },
    ],
    inclusions: ['Xe đưa đón sân bay Cam Ranh', '03 đêm tại biệt thự Amanoi', 'Bữa ăn theo chương trình', 'Liệu trình Spa 60 phút/ngày', 'Du thuyền Vịnh Vĩnh Hy', 'Bảo hiểm du lịch'],
    exclusions: ['Vé máy bay đến Cam Ranh', 'Chi phí cá nhân, đồ uống ngoài thực đơn', 'VAT nếu yêu cầu'],
    childPolicy: 'Trẻ em (dưới 12 tuổi): 50% giá người lớn. Trẻ sơ sinh (dưới 2 tuổi): 10% giá người lớn.',
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
    description: 'Hành trình 6 ngày khám phá cố đô Kyoto trong sắc lá phong đỏ rực, thưởng thức Kaiseki chuẩn sao Michelin.',
    highlights: ['Trải nghiệm trà đạo tại đền', 'Chụp ảnh Kimono', 'Tắm Onsen truyền thống'],
    duration: { days: 6, nights: 5 },
    price: { adult: 32000000, child: 26000000, infant: 8000000 },
    originalPrice: 35000000,
    image: 'https://picsum.photos/seed/kyoto/1200/800',
    gallery: [
      'https://picsum.photos/seed/kyoto1/800/600',
      'https://picsum.photos/seed/kyoto2/800/600',
    ],
    startDate: '2026-10-15',
    availableSeats: 25,
    minParticipants: 10,
    status: 'published',
    category: 'international',
    itinerary: [
      { day: 1, title: 'Hà Nội - Osaka', description: 'Bay thẳng Vietnam Airlines đến Osaka Kansai. Đón và đưa về khách sạn trung tâm Namba.', activities: ['Nhận phòng khách sạn'], meals: ['lunch'] },
      { day: 2, title: 'Khám phá Osaka', description: 'Thăm Lâu đài Osaka và khu phố Dotonbori. Thưởng thức Takoyaki và Okonomiyaki đích thực.', activities: ['Lâu đài Osaka', 'Dotonbori'], meals: ['breakfast', 'dinner'] },
      { day: 3, title: 'Cố đô Kyoto', description: 'Thăm Chùa Vàng (Kinkakuji), chụp ảnh với Kimono truyền thống. Trải nghiệm trà đạo tại đền.', activities: ['Kinkakuji', 'Kimono', 'Trà đạo'], meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 4, title: 'Rừng trúc Arashiyama', description: 'Đi dạo trong rừng trúc huyền thoại. Thưởng thức bữa tối Kaiseki cao cấp.', activities: ['Arashiyama', 'Kaiseki'], meals: ['breakfast', 'lunch', 'dinner'] },
      { day: 5, title: 'Nara', description: 'Thăm công viên hươu Nara và chùa Todaiji. Tự do mua sắm tại Shinsaibashi.', activities: ['Nara Park', 'Todaiji'], meals: ['breakfast', 'lunch'] },
      { day: 6, title: 'Osaka - Hà Nội', description: 'Tắm Onsen buổi sáng. Di chuyển ra sân bay Kansai và kết thúc hành trình.', activities: ['Onsen', 'Trả phòng'], meals: ['breakfast'] }
    ],
    departurePoint: 'Hà Nội',
    sightseeingSpots: ['Osaka', 'Kyoto', 'Nara'],
    transport: 'maybay',
    arrivalPoint: 'Osaka',
    tourType: 'mua_le',
    holiday: 'Mùa thu Nhật Bản',
    bookingDeadline: 21,
    departureSchedule: [
      { id: 'DS003-1', date: '2026-03-10', availableSeats: 10, status: 'open', priceAdult: 11400000, priceChild: 10000000, priceInfant: 500000, singleRoomSurcharge: 1000000 },
      { id: 'DS003-2', date: '2026-03-11', availableSeats: 10, status: 'open', priceAdult: 11400000, priceChild: 10000000, priceInfant: 500000, singleRoomSurcharge: 1000000 },
      { id: 'DS003-3', date: '2026-04-11', availableSeats: 10, status: 'open', priceAdult: 11400000, priceChild: 10000000, priceInfant: 500000, singleRoomSurcharge: 1000000 },
      { id: 'DS003-4', date: '2026-04-12', availableSeats: 10, status: 'open', priceAdult: 11400000, priceChild: 10000000, priceInfant: 500000, singleRoomSurcharge: 2000000 },
      { id: 'DS003-5', date: '2026-05-12', availableSeats: 10, status: 'open', priceAdult: 11400000, priceChild: 10000000, priceInfant: 500000, singleRoomSurcharge: 1000000 },
      { id: 'DS003-6', date: '2026-10-15', availableSeats: 25, status: 'open', priceAdult: 32000000, priceChild: 26000000, priceInfant: 8000000, singleRoomSurcharge: 5000000 },
      { id: 'DS003-7', date: '2026-10-20', availableSeats: 18, status: 'open', priceAdult: 32000000, priceChild: 26000000, priceInfant: 8000000, singleRoomSurcharge: 5000000 },
    ],
    inclusions: ['Vé máy bay khứ hồi NRT/KIX', '05 đêm khách sạn 4* (phòng đôi)', 'Bữa ăn theo chương trình', 'Xe tham quan', 'Phí vào cửa các điểm tham quan', 'Hướng dẫn viên tiếng Việt', 'Bảo hiểm du lịch quốc tế'],
    exclusions: ['Chi phí cá nhân, đồ uống ngoài thực đơn', 'Tip cho HDV và lái xe (khoảng 50 USD)', 'Phí phòng đơn (nếu có)', 'VAT'],
    childPolicy: 'Trẻ em (2-11 tuổi): 81% giá người lớn. Trẻ sơ sinh (dưới 2 tuổi): 25% giá người lớn (không có ghế riêng).',
    cancellationPolicy: [
      { daysBefore: 30, refundPercent: 100 },
      { daysBefore: 21, refundPercent: 80 },
      { daysBefore: 14, refundPercent: 50 },
      { daysBefore: 7, refundPercent: 20 },
    ],
    rating: 4.7,
    reviewCount: 89,
  }
];
