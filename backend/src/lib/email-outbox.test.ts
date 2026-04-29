import { describe, expect, it, vi } from 'vitest';
import { queueEmail, type QueueEmailInput } from './email-outbox.js';

const mojibakePattern = /Ã|Ä|á»|Â|Æ|�/;

function createWriter() {
  return {
    emailOutbox: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

async function queue(input: QueueEmailInput) {
  const writer = createWriter();
  await queueEmail(writer as never, input);
  const call = writer.emailOutbox.create.mock.calls[0]?.[0] as {
    data: {
      subject: string;
      payloadJson: Record<string, unknown>;
    };
  };
  return call.data;
}

describe('queueEmail', () => {
  it('creates Vietnamese booking confirmation content with passenger details', async () => {
    const data = await queue({
      template: 'booking_confirmed',
      recipient: 'customer@test.vn',
      subject: 'Xac nhan booking BK-001',
      payload: {
        bookingCode: 'BK-001',
        tourName: 'Khám phá Vịnh Hạ Long',
        tourDate: '2026-05-05',
        confirmedBy: 'Nhân Viên Kinh Doanh',
        confirmedAt: '2026-04-29T09:00:00.000Z',
        passengers: [
          {
            type: 'adult',
            name: 'Nguyễn Văn A',
            dateOfBirth: '1990-01-01',
            documentNumber: '001090123456',
          },
        ],
      },
    });

    expect(data.subject).toBe('Travela xác nhận đơn đặt tour BK-001');
    expect(data.payloadJson.emailMessage).toContain('Đơn đặt tour của quý khách đã được xác nhận.');
    expect(data.payloadJson.emailMessage).toContain('Danh sách hành khách:');
    expect(data.payloadJson.emailMessage).toContain('Nguyễn Văn A');
    expect(String(data.payloadJson.emailMessage)).not.toMatch(mojibakePattern);
  });

  it.each<QueueEmailInput>([
    {
      template: 'booking_created',
      recipient: 'customer@test.vn',
      subject: 'Booking BK-002 da duoc tao',
      payload: {
        bookingCode: 'BK-002',
        amount: 4800000,
        paymentWindowExpiresAt: '2026-04-29T10:00:00.000Z',
      },
    },
    {
      template: 'booking_payment_received',
      recipient: 'customer@test.vn',
      subject: 'Da nhan thanh toan BK-003',
      payload: {
        bookingCode: 'BK-003',
        paidAmount: 4800000,
        totalPaidAmount: 4800000,
        remainingAmount: 0,
      },
    },
    {
      template: 'booking_cancel_requested',
      recipient: 'customer@test.vn',
      subject: 'Yeu cau huy BK-004',
      payload: {
        bookingCode: 'BK-004',
        cancellationReason: 'Khách hàng gửi yêu cầu hủy',
        refundAmount: 2400000,
      },
    },
    {
      template: 'booking_cancel_confirmed',
      recipient: 'customer@test.vn',
      subject: 'Xac nhan huy BK-005',
      payload: {
        bookingCode: 'BK-005',
        cancellationReason: 'Bất khả kháng',
        refundAmount: 4800000,
        cancelledConfirmedAt: '2026-04-29T10:00:00.000Z',
      },
    },
    {
      template: 'booking_refund_completed',
      recipient: 'customer@test.vn',
      subject: 'Hoan tien BK-006',
      payload: {
        bookingCode: 'BK-006',
        refundAmount: 4800000,
        refundedBy: 'Nhân Viên Kinh Doanh',
        refundedAt: '2026-04-29T10:00:00.000Z',
        refundBillUrl: 'data:image/png;base64,AAAA',
      },
    },
    {
      template: 'booking_refund_bill_updated',
      recipient: 'customer@test.vn',
      subject: 'Cap nhat bill BK-007',
      payload: {
        bookingCode: 'BK-007',
        refundAmount: 4800000,
        refundedBy: 'Nhân Viên Kinh Doanh',
        refundedAt: '2026-04-29T10:00:00.000Z',
        refundBillUrl: 'data:image/png;base64,AAAA',
      },
    },
    {
      template: 'wishlist_tour_reminder',
      recipient: 'customer@test.vn',
      subject: 'Travela nhac tour yeu thich',
      payload: {
        tourName: 'Khám phá Vịnh Hạ Long',
        reasons: ['Sắp hết chỗ', 'Có mã ưu đãi'],
        availableSeats: 3,
        voucherCode: 'SUMMER2024',
      },
    },
  ])('creates non-empty Vietnamese content for $template', async (input) => {
    const data = await queue(input);

    expect(data.subject).toBeTruthy();
    expect(data.payloadJson.emailMessage).toBeTruthy();
    expect(String(data.payloadJson.emailMessage).length).toBeGreaterThan(80);
    expect(String(data.subject)).not.toMatch(mojibakePattern);
    expect(String(data.payloadJson.emailMessage)).not.toMatch(mojibakePattern);
  });

  it('does not put oversized refund bill data URLs into EmailJS message variables', async () => {
    const largeBill = `data:image/png;base64,${'A'.repeat(45_000)}`;
    const data = await queue({
      template: 'booking_refund_completed',
      recipient: 'customer@test.vn',
      subject: 'Hoan tien BK-008',
      payload: {
        bookingCode: 'BK-008',
        refundAmount: 4800000,
        refundedBy: 'Nhân Viên Kinh Doanh',
        refundedAt: '2026-04-29T10:00:00.000Z',
        refundBillUrl: largeBill,
      },
    });

    expect(data.payloadJson.emailMessage).not.toContain(largeBill);
    expect(data.payloadJson.emailMessage).toContain('Ảnh bill hoàn tiền đã được lưu trong hệ thống.');
    expect(String(data.payloadJson.emailMessage)).not.toMatch(mojibakePattern);
  });
});
