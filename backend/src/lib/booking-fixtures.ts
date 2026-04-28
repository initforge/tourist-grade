import type { PrismaClient } from '@prisma/client';

function toDate(value: string) {
  return new Date(value);
}

function isoOffset(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const refundBillSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='180' viewBox='0 0 400 180'%3E%3Crect width='400' height='180' fill='%23f8fafc'/%3E%3Crect x='20' y='20' width='360' height='140' fill='%23ffffff' stroke='%23166534'/%3E%3Ctext x='40' y='84' font-size='24' font-family='Arial' fill='%23166534'%3EBill hoan tien%3C/text%3E%3Ctext x='40' y='118' font-size='16' font-family='Arial' fill='%23334155'%3EBK-564738%3C/text%3E%3C/svg%3E";

export async function resetBookingFixtures(prisma: PrismaClient) {
  await prisma.emailOutbox.deleteMany();
  await prisma.tourReview.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.bookingPassenger.deleteMany();
  await prisma.booking.deleteMany();

  const [customer, sales, instances] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'customer@travela.vn' } }),
    prisma.user.findUnique({ where: { email: 'sales@travela.vn' } }),
    prisma.tourInstance.findMany({
      where: { code: { in: ['TI001', 'TI002', 'TI004', 'TI005', 'TI009', 'TI010'] } },
      select: { id: true, code: true },
    }),
  ]);

  if (!customer || !sales) {
    throw new Error('Booking fixture users are missing. Run the full seed first.');
  }

  const instanceByCode = new Map(instances.map((instance) => [instance.code, instance.id]));
  const instanceId = (code: string) => {
    const id = instanceByCode.get(code);
    if (!id) {
      throw new Error(`Booking fixture tour instance ${code} is missing. Run the full seed first.`);
    }
    return id;
  };

  await prisma.booking.create({
    data: {
      id: 'B001',
      bookingCode: 'BK-582910',
      tourInstanceId: instanceId('TI001'),
      userId: customer.id,
      status: 'CONFIRMED',
      refundStatus: 'NONE',
      paymentMethod: 'PAYOS',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Nguyễn Văn A',
      contactEmail: 'nguyenvana@gmail.com',
      contactPhone: '0988 888 888',
      contactNote: 'Dị ứng hải sản nhẹ',
      roomCountsJson: { single: 1, double: 0, triple: 0 },
      totalAmount: 9000000,
      paidAmount: 9000000,
      remainingAmount: 0,
      confirmedById: sales.id,
      confirmedAt: toDate('2026-03-25T11:00:00Z'),
      payloadJson: {
        confirmedBy: 'Nhân Viên Kinh Doanh',
      },
      createdAt: toDate('2026-03-25T10:30:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Nguyễn Văn A', gender: 'MALE', dateOfBirth: toDate('1985-05-12'), cccd: '001085012345', nationality: 'Việt Nam' },
          { type: 'ADULT', fullName: 'Trần Thị B', gender: 'FEMALE', dateOfBirth: toDate('1987-08-20'), cccd: '001087067890', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 9000000, method: 'PAYOS', status: 'PAID', paidAt: toDate('2026-03-25T10:45:00Z'), transactionRef: 'PAYOS17000001' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B002',
      bookingCode: 'BK-102938',
      tourInstanceId: instanceId('TI009'),
      userId: customer.id,
      status: 'PENDING_CANCEL',
      refundStatus: 'PENDING',
      paymentMethod: 'STRIPE',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Nguyễn Văn A',
      contactEmail: 'nguyenvana@gmail.com',
      contactPhone: '0988 888 888',
      bankInfoJson: { accountNumber: '1234567890', bankName: 'Vietcombank', accountHolder: 'NGUYỄN VĂN A' },
      totalAmount: 32000000,
      paidAmount: 32000000,
      remainingAmount: 0,
      cancellationReason: 'Thay đổi kế hoạch công tác',
      cancelledAt: toDate('2026-04-05T10:00:00Z'),
      refundAmount: 25600000,
      payloadJson: {
        cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
        cancelledConfirmedAt: '2026-04-05T10:30:00Z',
      },
      createdAt: toDate('2026-03-26T08:15:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Nguyễn Văn A', gender: 'MALE', dateOfBirth: toDate('1985-05-12'), cccd: '001085012345', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 32000000, method: 'STRIPE', status: 'PAID', paidAt: toDate('2026-03-26T08:20:00Z'), transactionRef: 'STR17000001' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B003',
      bookingCode: 'BK-394821',
      tourInstanceId: instanceId('TI009'),
      userId: customer.id,
      status: 'PENDING',
      refundStatus: 'NONE',
      paymentMethod: 'VNPAY',
      paymentType: 'ONLINE',
      paymentStatus: 'PARTIAL',
      contactName: 'Lê Văn C',
      contactEmail: 'levanc@gmail.com',
      contactPhone: '0912 345 678',
      roomCountsJson: { single: 1, double: 1, triple: 0 },
      totalAmount: 56000000,
      paidAmount: 28000000,
      remainingAmount: 28000000,
      createdAt: toDate('2026-03-24T14:20:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Lê Văn C', gender: 'MALE', dateOfBirth: toDate('1990-03-15'), cccd: '001090034567', nationality: 'Việt Nam', singleRoomSupplement: 500000 },
          { type: 'ADULT', fullName: 'Phạm Thị D', gender: 'FEMALE', dateOfBirth: toDate('1992-07-22'), cccd: '001092078901', nationality: 'Việt Nam' },
          { type: 'CHILD', fullName: 'Lê Minh E', gender: 'MALE', dateOfBirth: toDate('2018-01-10') },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 28000000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-03-24T14:10:00Z'), transactionRef: 'VNP17000007' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B004',
      bookingCode: 'BK-847291',
      tourInstanceId: instanceId('TI004'),
      userId: customer.id,
      status: 'COMPLETED',
      refundStatus: 'NONE',
      paymentMethod: 'VNPAY',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Hoang Van F',
      contactEmail: 'hoangvanf@gmail.com',
      contactPhone: '0977 654 321',
      totalAmount: 9000000,
      paidAmount: 9000000,
      remainingAmount: 0,
      createdAt: toDate('2026-03-15T07:00:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Hoang Van F', gender: 'MALE', dateOfBirth: toDate('1988-11-05'), cccd: '001088056789', nationality: 'Viet Nam' },
          { type: 'ADULT', fullName: 'Vu Thi G', gender: 'FEMALE', dateOfBirth: toDate('1990-09-18'), cccd: '001090098765', nationality: 'Viet Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 4500000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-03-20T09:50:00Z'), transactionRef: 'VNP17000004' },
          { amount: 4500000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-04-09T10:00:00Z'), transactionRef: 'VNP17000005' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B008',
      bookingCode: 'BK-291045',
      tourInstanceId: instanceId('TI005'),
      userId: customer.id,
      status: 'COMPLETED',
      refundStatus: 'NONE',
      paymentMethod: 'VNPAY',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Phan Văn M',
      contactEmail: 'phanvanm@gmail.com',
      contactPhone: '0901 234 567',
      contactNote: 'Yêu cầu phòng view biển',
      totalAmount: 56400000,
      paidAmount: 56400000,
      remainingAmount: 0,
      createdAt: toDate('2026-03-15T07:00:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Phan Văn M', gender: 'MALE', dateOfBirth: toDate('1982-09-03'), cccd: '001082090123', nationality: 'Việt Nam' },
          { type: 'ADULT', fullName: 'Ngô Thị N', gender: 'FEMALE', dateOfBirth: toDate('1984-11-17'), cccd: '001084011234', nationality: 'Việt Nam' },
          { type: 'CHILD', fullName: 'Phan Minh O', gender: 'MALE', dateOfBirth: toDate('2016-05-25') },
          { type: 'INFANT', fullName: 'Phan Bảo P', gender: 'FEMALE', dateOfBirth: toDate('2024-08-12') },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 56400000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-03-15T07:10:00Z'), transactionRef: 'VNP17000005' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B013',
      bookingCode: 'BK-130013',
      tourInstanceId: instanceId('TI004'),
      userId: customer.id,
      status: 'COMPLETED',
      refundStatus: 'NONE',
      paymentMethod: 'VNPAY',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Đặng Gia T',
      contactEmail: 'danggia.t@gmail.com',
      contactPhone: '0966 222 555',
      totalAmount: 9400000,
      paidAmount: 9400000,
      remainingAmount: 0,
      createdAt: toDate('2026-03-16T08:30:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Đặng Gia T', gender: 'MALE', dateOfBirth: toDate('1991-04-14'), cccd: '001091041234', nationality: 'Việt Nam' },
          { type: 'ADULT', fullName: 'Lưu Mai U', gender: 'FEMALE', dateOfBirth: toDate('1993-09-19'), cccd: '001093091234', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 9400000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-03-16T08:45:00Z'), transactionRef: 'VNP17000011' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B009',
      bookingCode: 'BK-401928',
      tourInstanceId: instanceId('TI009'),
      userId: customer.id,
      status: 'CONFIRMED',
      refundStatus: 'NONE',
      paymentMethod: 'VNPAY',
      paymentType: 'ONLINE',
      paymentStatus: 'PARTIAL',
      contactName: 'Vương Minh Q',
      contactEmail: 'vuongminhq@gmail.com',
      contactPhone: '0922 111 333',
      totalAmount: 64000000,
      paidAmount: 32000000,
      remainingAmount: 32000000,
      discountAmount: 0,
      payloadJson: {
        promoCode: 'TRAVELA50',
      },
      createdAt: toDate('2026-03-26T18:00:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Vương Minh Q', gender: 'MALE', dateOfBirth: toDate('1991-03-18'), cccd: '001091034567', nationality: 'Việt Nam', singleRoomSupplement: 600000 },
          { type: 'ADULT', fullName: 'Lê Thị R', gender: 'FEMALE', dateOfBirth: toDate('1993-07-25'), cccd: '001093078901', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 32000000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-03-26T18:10:00Z'), transactionRef: 'VNP17000006' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B010',
      bookingCode: 'BK-509182',
      tourInstanceId: instanceId('TI009'),
      userId: customer.id,
      status: 'PENDING',
      refundStatus: 'NONE',
      paymentMethod: 'STRIPE',
      paymentType: 'ONLINE',
      paymentStatus: 'PARTIAL',
      contactName: 'Cao Đức S',
      contactEmail: 'caoducs@gmail.com',
      contactPhone: '0955 222 444',
      roomCountsJson: { single: 1, double: 0, triple: 0 },
      totalAmount: 32000000,
      paidAmount: 16000000,
      remainingAmount: 16000000,
      createdAt: toDate('2026-03-26T20:30:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Cao Đức S', gender: 'MALE', dateOfBirth: toDate('1989-11-02'), cccd: 'P1234567', nationality: 'Nhật Bản', singleRoomSupplement: 800000 },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 16000000, method: 'STRIPE', status: 'PAID', paidAt: toDate('2026-03-26T20:40:00Z'), transactionRef: 'STR17000002' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B014',
      bookingCode: 'BK-140014',
      tourInstanceId: instanceId('TI010'),
      userId: customer.id,
      status: 'CONFIRMED',
      refundStatus: 'NONE',
      paymentMethod: 'PAYOS',
      paymentType: 'ONLINE',
      paymentStatus: 'PARTIAL',
      contactName: 'Ngô Thanh V',
      contactEmail: 'ngothanhv@gmail.com',
      contactPhone: '0908 111 444',
      roomCountsJson: { single: 1, double: 0, triple: 0 },
      totalAmount: 9600000,
      paidAmount: 4800000,
      remainingAmount: 4800000,
      payloadJson: {
        paymentRatio: 'deposit',
      },
      confirmedById: sales.id,
      confirmedAt: toDate('2026-04-10T10:30:00Z'),
      createdAt: toDate('2026-04-10T09:45:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Ngô Thanh V', gender: 'MALE', dateOfBirth: toDate('1989-02-17'), cccd: '001089021234', nationality: 'Việt Nam', singleRoomSupplement: 500000 },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 4800000, method: 'PAYOS', status: 'PAID', paidAt: toDate('2026-04-10T10:00:00Z'), transactionRef: 'PAYOS17000014', orderCode: '17000014' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B011',
      bookingCode: 'BK-773420',
      tourInstanceId: instanceId('TI001'),
      userId: customer.id,
      status: 'BOOKED',
      refundStatus: 'NONE',
      paymentMethod: 'VNPAY',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Võ Thanh P',
      contactEmail: 'vothanhp@gmail.com',
      contactPhone: '0933 111 222',
      roomCountsJson: { single: 1, double: 0, triple: 0 },
      totalAmount: 9000000,
      paidAmount: 9000000,
      remainingAmount: 0,
      confirmedById: sales.id,
      confirmedAt: toDate('2026-04-08T09:15:00Z'),
      payloadJson: {
        confirmedBy: 'Nhân Viên Kinh Doanh',
      },
      createdAt: toDate('2026-04-08T08:50:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Võ Thanh P', gender: 'MALE', dateOfBirth: toDate('1986-04-20'), cccd: '001086045678', nationality: 'Việt Nam', singleRoomSupplement: 500000 },
          { type: 'ADULT', fullName: 'Trần Mai Q', gender: 'FEMALE', dateOfBirth: toDate('1988-10-05'), cccd: '001088078901', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 9000000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-04-08T09:00:00Z'), transactionRef: 'VNP17000010' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B005',
      bookingCode: 'BK-192837',
      tourInstanceId: instanceId('TI001'),
      userId: customer.id,
      status: 'CANCELLED',
      refundStatus: 'PENDING',
      paymentMethod: 'VNPAY',
      paymentType: 'ONLINE',
      paymentStatus: 'PAID',
      contactName: 'Đỗ Thị H',
      contactEmail: 'dothih@gmail.com',
      contactPhone: '0933 456 789',
      bankInfoJson: { accountNumber: '1234567890', bankName: 'Vietcombank', accountHolder: 'ĐỖ THỊ H' },
      totalAmount: 9000000,
      paidAmount: 9000000,
      remainingAmount: 0,
      cancellationReason: 'Danh sách hành khách không đủ điều kiện',
      cancelledAt: toDate('2026-03-28T10:00:00Z'),
      refundAmount: 6300000,
      payloadJson: {
        cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
        cancelledConfirmedAt: '2026-03-28T11:00:00Z',
      },
      createdAt: toDate('2026-03-22T16:30:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Đỗ Thị H', gender: 'FEMALE', dateOfBirth: toDate('1995-04-30'), cccd: '001095045678', nationality: 'Việt Nam' },
          { type: 'ADULT', fullName: 'Bùi Văn I', gender: 'MALE', dateOfBirth: toDate('1993-12-08'), cccd: '001093012890', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 9000000, method: 'VNPAY', status: 'PAID', paidAt: toDate('2026-03-22T16:40:00Z'), transactionRef: 'VNP17000004' },
        ],
      },
    },
  });

  await prisma.booking.create({
    data: {
      id: 'B006',
      bookingCode: 'BK-564738',
      tourInstanceId: instanceId('TI002'),
      userId: customer.id,
      status: 'CANCELLED',
      refundStatus: 'REFUNDED',
      refundBillUrl: refundBillSvg,
      paymentMethod: 'STRIPE',
      paymentType: 'ONLINE',
      paymentStatus: 'REFUNDED',
      contactName: 'Trịnh Văn K',
      contactEmail: 'trinhvank@gmail.com',
      contactPhone: '0945 678 901',
      bankInfoJson: { accountNumber: '9876543210', bankName: 'Techcombank', accountHolder: 'TRỊNH VĂN K' },
      totalAmount: 32000000,
      paidAmount: 32000000,
      remainingAmount: 0,
      cancellationReason: 'Sức khỏe không cho phép',
      cancelledAt: toDate('2026-03-25T14:00:00Z'),
      refundedById: sales.id,
      refundedAt: toDate('2026-03-26T09:00:00Z'),
      refundAmount: 25600000,
      payloadJson: {
        cancelledConfirmedBy: 'Nhân Viên Kinh Doanh',
        cancelledConfirmedAt: '2026-03-25T14:15:00Z',
        refundedBy: 'Nhân Viên Kinh Doanh',
        refundBillEditedBy: 'Nhân Viên Kinh Doanh',
        refundBillEditedAt: '2026-03-26T10:30:00Z',
      },
      createdAt: toDate('2026-03-18T11:00:00Z'),
      passengers: {
        create: [
          { type: 'ADULT', fullName: 'Trịnh Văn K', gender: 'MALE', dateOfBirth: toDate('1985-06-14'), cccd: '001085067890', nationality: 'Việt Nam' },
        ],
      },
      paymentTransactions: {
        create: [
          { amount: 32000000, method: 'STRIPE', status: 'PAID', paidAt: toDate('2026-03-18T11:10:00Z'), transactionRef: 'STR17000003' },
        ],
      },
    },
  });
}

export async function resetCustomerPublicFixtures(prisma: PrismaClient) {
  await prisma.tourReview.deleteMany();
  await prisma.wishlistItem.deleteMany();

  const [customer, programs, bookings] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'customer@travela.vn' } }),
    prisma.tourProgram.findMany({
      where: { code: { in: ['TP001', 'TP002', 'TP003'] } },
      select: { id: true, code: true },
    }),
    prisma.booking.findMany({
      where: { id: { in: ['B004', 'B008'] } },
      include: {
        tourInstance: true,
      },
    }),
  ]);

  if (!customer) {
    throw new Error('Customer fixture user is missing. Run the full seed first.');
  }

  const programIdByCode = new Map(programs.map((program) => [program.code, program.id]));

  await prisma.wishlistItem.createMany({
    data: [
      {
        userId: customer.id,
        tourProgramId: programIdByCode.get('TP001') ?? '',
      },
      {
        userId: customer.id,
        tourProgramId: programIdByCode.get('TP003') ?? '',
      },
    ].filter((item) => item.tourProgramId),
  });

  const reviewPayloads = [
    {
      bookingId: 'B004',
      rating: 5,
      title: 'Du thuyen sach, lich trinh gon',
      comment: 'Lich trinh ro rang, du thuyen sach va doi ngu cham soc doan rat ky.',
    },
  ];

  for (const reviewPayload of reviewPayloads) {
    const booking = bookings.find((item) => item.id === reviewPayload.bookingId);
    if (!booking) {
      continue;
    }

    await prisma.tourReview.create({
      data: {
        bookingId: booking.id,
        userId: customer.id,
        tourProgramId: booking.tourInstance.programId,
        tourInstanceId: booking.tourInstanceId,
        rating: reviewPayload.rating,
        title: reviewPayload.title,
        comment: reviewPayload.comment,
      },
    });
  }
}

export async function resetTourWorkflowFixtures(prisma: PrismaClient) {
  await Promise.all([
    prisma.tourInstance.updateMany({
      where: { code: 'TI001' },
      data: {
        status: 'DANG_TRIEN_KHAI',
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI002' },
      data: {
        status: 'SAN_SANG_TRIEN_KHAI',
        bookingDeadlineAt: toDate('2026-09-24'),
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI003' },
      data: {
        status: 'CHO_DUYET_DU_TOAN',
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI004' },
      data: {
        status: 'CHO_QUYET_TOAN',
        settledAt: null,
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI005' },
      data: {
        status: 'CHO_DUYET_BAN',
        departurePoint: 'Hồ Chí Minh',
        sightseeingSpots: ['Ninh Thuận'],
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI006' },
      data: {
        status: 'DA_HUY',
        cancelledAt: toDate('2026-03-17T12:00:00Z'),
        cancelReason: 'Khong du khach toi thieu (chi co 5/8)',
        refundTotal: 11250000,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI007' },
      data: {
        status: 'CHUA_DU_KIEN',
        bookingDeadlineAt: toDate('2026-09-29'),
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI008' },
      data: {
        status: 'CHO_NHAN_DIEU_HANH',
        receivedAt: null,
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI009' },
      data: {
        status: 'CHO_DU_TOAN',
        receivedAt: toDate('2026-05-18T10:00:00Z'),
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
    prisma.tourInstance.updateMany({
      where: { code: 'TI010' },
      data: {
        status: 'DANG_MO_BAN',
        cancelledAt: null,
        cancelReason: null,
        refundTotal: null,
      },
    }),
  ]);
}

export async function resetTourProgramFixtures(prisma: PrismaClient) {
  const tp1 = await prisma.tourProgram.findUnique({ where: { code: 'TP001' } });
  const tp2 = await prisma.tourProgram.findUnique({ where: { code: 'TP002' } });
  const tp3 = await prisma.tourProgram.findUnique({ where: { code: 'TP003' } });
  const tp4 = await prisma.tourProgram.findUnique({ where: { code: 'TP004' } });

  if (tp1) {
    const publicContent = ((tp1.publicContentJson as Record<string, unknown> | null) ?? {});
    await prisma.tourProgram.update({
      where: { id: tp1.id },
      data: {
        status: 'ACTIVE',
        publicContentJson: {
          ...publicContent,
          inactiveReason: null,
          rejectionReason: null,
          approvalStatus: 'approved',
        },
      },
    });
  }

  if (tp2) {
    const publicContent = ((tp2.publicContentJson as Record<string, unknown> | null) ?? {});
    await prisma.tourProgram.update({
      where: { id: tp2.id },
      data: {
        status: 'ACTIVE',
        publicContentJson: {
          ...publicContent,
          inactiveReason: null,
          rejectionReason: null,
          approvalStatus: 'approved',
        },
      },
    });
  }

  if (tp3) {
    const publicContent = ((tp3.publicContentJson as Record<string, unknown> | null) ?? {});
    await prisma.tourProgram.update({
      where: { id: tp3.id },
      data: {
        status: 'DRAFT',
        publicContentJson: {
          ...publicContent,
          inactiveReason: null,
          rejectionReason: 'Thiếu dữ liệu đối tác khách sạn và cần cập nhật lại cấu hình giá.',
          approvalStatus: 'rejected',
        },
      },
    });
  }

  if (tp4) {
    const publicContent = ((tp4.publicContentJson as Record<string, unknown> | null) ?? {});
    await prisma.tourProgram.update({
      where: { id: tp4.id },
      data: {
        status: 'INACTIVE',
        publicContentJson: {
          ...publicContent,
          inactiveReason: 'Tạm dừng để cập nhật lại giá phòng và đối tác vận chuyển',
          rejectionReason: null,
          approvalStatus: 'approved',
        },
      },
    });
  }
}

export async function resetSpecialDayFixtures(prisma: PrismaClient) {
  await prisma.specialDay.deleteMany();
  await prisma.specialDay.createMany({
    data: [
      { code: 'SD001', name: 'Tết Nguyên Đán 2026', occasion: 'Lễ Tết', startDate: toDate('2026-02-17'), endDate: toDate('2026-02-23'), note: 'Kỳ nghỉ Tết âm lịch' },
      { code: 'SD002', name: 'Giỗ Tổ Hùng Vương', occasion: 'Lễ quốc gia', startDate: toDate('2026-04-06'), endDate: toDate('2026-04-06'), note: 'Giỗ Tổ Hùng Vương' },
      { code: 'SD003', name: 'Giải phóng Miền Nam', occasion: 'Lễ quốc gia', startDate: toDate('2026-04-30'), endDate: toDate('2026-04-30'), note: '30/4' },
      { code: 'SD004', name: 'Quốc tế Lao động', occasion: 'Lễ quốc gia', startDate: toDate('2026-05-01'), endDate: toDate('2026-05-01'), note: '1/5' },
      { code: 'SD005', name: 'Quốc khánh', occasion: 'Lễ quốc gia', startDate: toDate('2026-09-02'), endDate: toDate('2026-09-02'), note: '2/9' },
      { code: 'SD006', name: 'Mùa thu Nhật Bản', occasion: 'Mùa lễ quốc tế', startDate: toDate('2026-10-15'), endDate: toDate('2026-10-28'), note: 'Mùa lá đỏ' },
      { code: 'SD007', name: 'Giáng Sinh', occasion: 'Lễ quốc tế', startDate: toDate('2026-12-25'), endDate: toDate('2026-12-25'), note: 'Noel' },
    ],
  });
}

export async function resetVoucherFixtures(prisma: PrismaClient) {
  await prisma.voucherTarget.deleteMany();
  await prisma.voucher.deleteMany();

  const [sales, manager, programs] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'sales@travela.vn' } }),
    prisma.user.findUnique({ where: { email: 'manager@travela.vn' } }),
    prisma.tourProgram.findMany({
      where: { code: { in: ['TP001', 'TP002', 'TP003'] } },
      select: { id: true, code: true },
    }),
  ]);

  if (!sales || !manager) {
    throw new Error('Voucher fixture users are missing. Run the full seed first.');
  }

  const programIdByCode = new Map(programs.map((program) => [program.code, program.id]));
  const targetProgram = (code: string) => {
    const id = programIdByCode.get(code);
    if (!id) {
      throw new Error(`Voucher fixture tour program ${code} is missing. Run the full seed first.`);
    }
    return id;
  };

  const createVoucher = async (data: {
    id: string;
    code: string;
    type: 'PERCENT' | 'FIXED';
    valueAmount: number;
    startsAt: string;
    endsAt: string;
    usageLimit: number;
    usedCount: number;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'ACTIVE' | 'INACTIVE';
    description: string;
    rejectionReason?: string;
    approvedById?: string;
    targetCodes?: string[];
  }) => prisma.voucher.create({
    data: {
      id: data.id,
      code: data.code,
      type: data.type,
      valueAmount: data.valueAmount,
      startsAt: toDate(data.startsAt),
      endsAt: toDate(data.endsAt),
      usageLimit: data.usageLimit,
      usedCount: data.usedCount,
      status: data.status,
      description: data.description,
      rejectionReason: data.rejectionReason,
      createdById: sales.id,
      approvedById: data.approvedById,
      targets: data.targetCodes?.length
        ? {
            create: data.targetCodes.map((code) => ({
              tourProgramId: targetProgram(code),
            })),
          }
        : undefined,
    },
  });

  await createVoucher({
    id: 'VOU-01',
    code: 'SUMMER2024',
    type: 'PERCENT',
    valueAmount: 15,
    startsAt: '2024-06-01',
    endsAt: '2026-08-31',
    usageLimit: 100,
    usedCount: 45,
    status: 'ACTIVE',
    description: 'Khuyến mãi mùa hè 2024',
    approvedById: manager.id,
  });

  await createVoucher({
    id: 'VOU-02',
    code: 'LUXURY500K',
    type: 'FIXED',
    valueAmount: 500000,
    startsAt: '2026-01-01',
    endsAt: '2026-12-31',
    usageLimit: 50,
    usedCount: 12,
    status: 'ACTIVE',
    description: 'Giảm 500K cho đơn hàng cao cấp',
    approvedById: manager.id,
  });

  await createVoucher({
    id: 'VOU-13',
    code: 'TRAVELA10',
    type: 'PERCENT',
    valueAmount: 10,
    startsAt: '2026-01-01',
    endsAt: '2026-12-31',
    usageLimit: 500,
    usedCount: 12,
    status: 'ACTIVE',
    description: 'Giam 10% cho tour Ha Long dang mo ban',
    approvedById: manager.id,
    targetCodes: ['TP001'],
  });

  await createVoucher({
    id: 'VOU-03',
    code: 'FLASHWINTER',
    type: 'PERCENT',
    valueAmount: 20,
    startsAt: '2024-01-01',
    endsAt: '2024-02-28',
    usageLimit: 100,
    usedCount: 100,
    status: 'INACTIVE',
    description: 'Flash sale mùa đông',
  });

  await createVoucher({
    id: 'VOU-04',
    code: 'SUMMER2026',
    type: 'PERCENT',
    valueAmount: 20,
    startsAt: '2026-06-01',
    endsAt: '2026-08-31',
    usageLimit: 200,
    usedCount: 0,
    status: 'DRAFT',
    description: 'Khuyến mãi mùa hè 2026',
  });

  await createVoucher({
    id: 'VOU-10',
    code: 'APPROVENOW',
    type: 'PERCENT',
    valueAmount: 12,
    startsAt: isoOffset(1),
    endsAt: isoOffset(40),
    usageLimit: 80,
    usedCount: 0,
    status: 'PENDING_APPROVAL',
    description: 'Dữ liệu mẫu kiểm tra cảnh báo phê duyệt còn 1-2 ngày',
  });

  await createVoucher({
    id: 'VOU-11',
    code: 'DRAFTWARN',
    type: 'FIXED',
    valueAmount: 200000,
    startsAt: isoOffset(7),
    endsAt: isoOffset(25),
    usageLimit: 60,
    usedCount: 0,
    status: 'DRAFT',
    description: 'Dữ liệu mẫu kiểm tra cảnh báo nháp sắp hết hạn gửi duyệt',
  });

  await createVoucher({
    id: 'VOU-12',
    code: 'SENDSOON8',
    type: 'PERCENT',
    valueAmount: 8,
    startsAt: isoOffset(8),
    endsAt: isoOffset(28),
    usageLimit: 40,
    usedCount: 0,
    status: 'DRAFT',
    description: 'Bản ghi mẫu để NV kinh doanh test icon cảnh báo 7-8 ngày trước ngày bắt đầu',
    targetCodes: ['TP001'],
  });

  await createVoucher({
    id: 'VOU-09',
    code: 'NATIONALDAY2026',
    type: 'FIXED',
    valueAmount: 250000,
    startsAt: '2026-09-01',
    endsAt: '2026-09-05',
    usageLimit: 120,
    usedCount: 0,
    status: 'ACTIVE',
    description: 'Ưu đãi Quốc khánh chưa đến thời gian áp dụng',
  });

  await createVoucher({
    id: 'VOU-05',
    code: 'PROMO10PCT',
    type: 'PERCENT',
    valueAmount: 10,
    startsAt: '2026-04-20',
    endsAt: '2026-12-31',
    usageLimit: 100,
    usedCount: 15,
    status: 'PENDING_APPROVAL',
    description: 'Giảm 10% cho tất cả tour',
    targetCodes: ['TP001'],
  });

  await createVoucher({
    id: 'VOU-06',
    code: 'VIP50PCT',
    type: 'PERCENT',
    valueAmount: 50,
    startsAt: '2026-04-01',
    endsAt: '2026-06-30',
    usageLimit: 10,
    usedCount: 0,
    status: 'REJECTED',
    rejectionReason: 'Giá trị giảm quá cao, vui lòng giảm xuống 30%.',
    description: 'VIP khách hàng thân thiết',
  });

  await createVoucher({
    id: 'VOU-07',
    code: 'AUTUMN20',
    type: 'PERCENT',
    valueAmount: 20,
    startsAt: '2026-09-01',
    endsAt: '2026-10-31',
    usageLimit: 150,
    usedCount: 0,
    status: 'PENDING_APPROVAL',
    description: 'Giảm 20% mùa thu',
    targetCodes: ['TP003'],
  });

  await createVoucher({
    id: 'VOU-08',
    code: 'VIPONLY30',
    type: 'FIXED',
    valueAmount: 300000,
    startsAt: '2026-05-01',
    endsAt: '2026-09-30',
    usageLimit: 50,
    usedCount: 2,
    status: 'PENDING_APPROVAL',
    description: 'Giảm 300K cho tour VIP',
  });
}
