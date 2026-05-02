import type { EmailOutboxStatus, Prisma, PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { normalizePayload, normalizeText } from './text.js';

type EmailWriter = Pick<PrismaClient, 'emailOutbox'> | Prisma.TransactionClient;

export type QueueEmailInput = {
  template: string;
  recipient: string;
  subject: string;
  payload: Record<string, unknown>;
  bookingId?: string | null;
  voucherId?: string | null;
  createdById?: string | null;
  status?: EmailOutboxStatus;
};

const templateTitles: Record<string, string> = {
  booking_created: 'Đã ghi nhận đơn đặt tour',
  booking_payment_received: 'Đã nhận thanh toán',
  booking_confirmed: 'Đơn đặt tour đã được xác nhận',
  booking_cancel_requested: 'Đã ghi nhận yêu cầu hủy tour',
  booking_cancel_confirmed: 'Yêu cầu hủy tour đã được xác nhận',
  booking_refund_completed: 'Hoàn tiền thành công',
  booking_refund_bill_updated: 'Cập nhật bill hoàn tiền',
  booking_updated: 'Thông tin đặt tour đã được cập nhật',
  wishlist_tour_reminder: 'Nhắc nhở tour yêu thích',
  guide_assignment: 'Phân công hướng dẫn viên',
};

const maxInlineEmailValueLength = 40_000;
const nonDeliverableDevDomains = new Set([
  'test.vn',
  'test.com',
  'example.com',
  'example.net',
  'example.org',
  'localhost',
]);

function valueToText(value: unknown, fallback = '') {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text ? normalizeText(text) : fallback;
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `${Math.round(amount).toLocaleString('vi-VN')} VND` : '0 VND';
}

function formatTime(value: unknown) {
  if (!value) return '';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? valueToText(value)
    : parsed.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function getNestedValue(source: Record<string, unknown>, path: string) {
  return path.split('.').reduce<unknown>((current, key) => (
    current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
  ), source);
}

function getBookingCode(payload: Record<string, unknown>) {
  return valueToText(payload.bookingCode);
}

function getTourName(payload: Record<string, unknown>) {
  return valueToText(payload.tourName);
}

function getTourDate(payload: Record<string, unknown>) {
  return valueToText(payload.tourDate);
}

function hasValue(value: unknown) {
  return value != null && String(value).trim().length > 0;
}

function getSafeEmailUrl(value: unknown) {
  const url = valueToText(value);
  if (!url) return '';
  return url.length <= maxInlineEmailValueLength ? url : '';
}

function getRefundBillNote(payload: Record<string, unknown>) {
  if (!payload.refundBillUrl) return '';
  return getSafeEmailUrl(payload.refundBillUrl)
    ? 'Ảnh bill hoàn tiền được đính kèm trong nội dung email.'
    : 'Ảnh bill hoàn tiền đã được lưu trong hệ thống. Vui lòng xem chi tiết đơn đã hủy để đối chiếu bill.';
}

function isNonDeliverableDevRecipient(recipient: string) {
  const domain = recipient.toLowerCase().split('@').at(-1) ?? '';
  return env.NODE_ENV !== 'production'
    && (domain.endsWith('.test') || domain.endsWith('.local') || nonDeliverableDevDomains.has(domain));
}

function buildSubject(template: string, payload: Record<string, unknown>, fallback: string) {
  const bookingCode = getBookingCode(payload);
  const tourName = getTourName(payload);

  switch (template) {
    case 'booking_created':
      return bookingCode ? `Travela đã ghi nhận đơn đặt tour ${bookingCode}` : 'Travela đã ghi nhận đơn đặt tour';
    case 'booking_payment_received':
      return bookingCode ? `Travela đã nhận thanh toán cho đơn ${bookingCode}` : 'Travela đã nhận thanh toán';
    case 'booking_confirmed':
      return bookingCode ? `Travela xác nhận đơn đặt tour ${bookingCode}` : 'Travela xác nhận đơn đặt tour';
    case 'booking_cancel_requested':
      return bookingCode ? `Travela đã ghi nhận yêu cầu hủy đơn ${bookingCode}` : 'Travela đã ghi nhận yêu cầu hủy tour';
    case 'booking_cancel_confirmed':
      return bookingCode ? `Travela xác nhận hủy đơn ${bookingCode}` : 'Travela xác nhận hủy tour';
    case 'booking_refund_completed':
      return bookingCode ? `Travela đã hoàn tiền đơn ${bookingCode}` : 'Travela đã hoàn tiền';
    case 'booking_refund_bill_updated':
      return bookingCode ? `Travela cập nhật bill hoàn tiền đơn ${bookingCode}` : 'Travela cập nhật bill hoàn tiền';
    case 'booking_updated':
      return bookingCode ? `Travela cập nhật thông tin đơn ${bookingCode}` : 'Travela cập nhật thông tin đơn đặt tour';
    case 'wishlist_tour_reminder':
      return tourName ? `Travela nhắc tour yêu thích: ${tourName}` : 'Travela nhắc tour yêu thích';
    default:
      return normalizeText(fallback || 'Thông báo từ Travela');
  }
}

function buildPassengerSummary(payload: Record<string, unknown>) {
  const passengers = Array.isArray(payload.passengers) ? payload.passengers : [];
  if (passengers.length === 0) return [];

  const lines = ['Danh sách hành khách:'];
  passengers.forEach((rawPassenger, index) => {
    if (!rawPassenger || typeof rawPassenger !== 'object') {
      lines.push(`- Hành khách ${index + 1}`);
      return;
    }

    const passenger = rawPassenger as Record<string, unknown>;
    const type = valueToText(passenger.type, 'khách');
    const name = valueToText(passenger.name, `Hành khách ${index + 1}`);
    const dob = valueToText(passenger.dateOfBirth);
    const documentNumber = valueToText(passenger.documentNumber);
    const parts = [`- ${index + 1}. ${name}`, `loại: ${type}`];
    if (dob) parts.push(`ngày sinh: ${dob}`);
    if (documentNumber) parts.push(`giấy tờ: ${documentNumber}`);
    lines.push(parts.join(', '));
  });

  return lines;
}

function escapeHtml(value: unknown) {
  return valueToText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildRoomSummary(payload: Record<string, unknown>) {
  const rooms = payload.roomCounts;
  if (!rooms || typeof rooms !== 'object') return '';
  const roomCounts = rooms as Record<string, unknown>;
  return [
    `Phòng đơn: ${Number(roomCounts.single ?? 0)}`,
    `Phòng đôi: ${Number(roomCounts.double ?? 0)}`,
    `Phòng ba: ${Number(roomCounts.triple ?? 0)}`,
  ].join(' | ');
}

function buildPassengerTableHtml(payload: Record<string, unknown>) {
  const passengers = Array.isArray(payload.passengers) ? payload.passengers : [];
  if (passengers.length === 0) return '';

  const rows = passengers.map((rawPassenger, index) => {
    const passenger = rawPassenger && typeof rawPassenger === 'object' ? rawPassenger as Record<string, unknown> : {};
    return `<tr><td>${index + 1}</td><td>${escapeHtml(passenger.name ?? `Hành khách ${index + 1}`)}</td><td>${escapeHtml(passenger.type ?? 'khách')}</td><td>${escapeHtml(passenger.dateOfBirth)}</td><td>${escapeHtml(passenger.documentNumber)}</td></tr>`;
  });

  return `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:12px"><thead><tr><th>STT</th><th>Họ tên</th><th>Đối tượng</th><th>Ngày sinh</th><th>Giấy tờ</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function buildEmailMessage(template: string, payload: Record<string, unknown>) {
  const lines: string[] = [];
  const title = templateTitles[template] ?? 'Thông báo từ Travela';
  const bookingCode = getBookingCode(payload);
  const tourName = getTourName(payload);
  const tourDate = getTourDate(payload);

  lines.push(title);
  if (bookingCode) lines.push(`Mã đơn: ${bookingCode}`);
  if (tourName) lines.push(`Tour: ${tourName}`);
  if (tourDate) lines.push(`Ngày khởi hành: ${tourDate}`);

  if (template === 'booking_created') {
    lines.push('Hệ thống đã ghi nhận đơn đặt tour của quý khách.');
    lines.push(`Số tiền cần thanh toán: ${formatMoney(payload.amount ?? payload.totalAmount)}`);
    lines.push(`Hạn thanh toán giữ chỗ: ${formatTime(payload.paymentWindowExpiresAt)}`);
    lines.push('Vui lòng hoàn tất thanh toán trong thời gian giữ chỗ để đơn không bị tự động hủy.');
  } else if (template === 'booking_payment_received') {
    lines.push('Travela đã nhận thanh toán cho đơn đặt tour của quý khách.');
    lines.push(`Số tiền vừa thanh toán: ${formatMoney(payload.paidAmount)}`);
    lines.push(`Tổng đã thanh toán: ${formatMoney(payload.totalPaidAmount ?? payload.paidAmount)}`);
    lines.push(`Số tiền còn lại: ${formatMoney(payload.remainingAmount)}`);
  } else if (template === 'booking_confirmed') {
    lines.push('Đơn đặt tour của quý khách đã được xác nhận.');
    lines.push(`Người xác nhận: ${valueToText(payload.confirmedBy, 'Travela')}`);
    lines.push(`Thời điểm xác nhận: ${formatTime(payload.confirmedAt)}`);
    const roomSummary = buildRoomSummary(payload);
    if (roomSummary) lines.push(`Số phòng: ${roomSummary}`);
    lines.push(...buildPassengerSummary(payload));
  } else if (template === 'booking_cancel_requested') {
    lines.push('Travela đã ghi nhận yêu cầu hủy tour của quý khách.');
    lines.push(`Lý do hủy: ${valueToText(payload.cancellationReason, 'Khách hàng gửi yêu cầu hủy')}`);
    lines.push(`Số tiền dự kiến hoàn: ${formatMoney(payload.refundAmount)}`);
  } else if (template === 'booking_cancel_confirmed') {
    lines.push('Yêu cầu hủy tour của quý khách đã được xác nhận.');
    lines.push(`Lý do hủy: ${valueToText(payload.cancellationReason, 'Không có')}`);
    lines.push(`Số tiền hoàn: ${formatMoney(payload.refundAmount)}`);
    lines.push(`Thời điểm xác nhận hủy: ${formatTime(payload.cancelledConfirmedAt)}`);
  } else if (template === 'booking_refund_completed' || template === 'booking_refund_bill_updated') {
    const refundBillUrl = getSafeEmailUrl(payload.refundBillUrl);
    const refundBillNote = getRefundBillNote(payload);
    lines.push(template === 'booking_refund_bill_updated'
      ? 'Bill chuyển khoản hoàn tiền đã được cập nhật.'
      : 'Travela đã hoàn tiền thành công cho đơn hủy.');
    lines.push(`Số tiền hoàn: ${formatMoney(payload.refundAmount)}`);
    lines.push(`Người hoàn tiền: ${valueToText(payload.refundedBy, 'Travela')}`);
    lines.push(`Thời điểm hoàn tiền: ${formatTime(payload.refundedAt)}`);
    if (refundBillUrl) lines.push(`Ảnh bill hoàn tiền: ${refundBillUrl}`);
    if (refundBillNote) lines.push(refundBillNote);
  } else if (template === 'booking_updated') {
    lines.push('Thông tin đơn đặt tour của quý khách đã được cập nhật.');
    lines.push(`Số tiền cần thanh toán: ${formatMoney(payload.amount ?? payload.totalAmount)}`);
    lines.push('Vui lòng kiểm tra lại thông tin đơn trước khi tiếp tục thanh toán.');
  } else if (template === 'wishlist_tour_reminder') {
    const reasons = Array.isArray(payload.reasons) ? payload.reasons.map((reason) => valueToText(reason)).filter(Boolean) : [];
    lines.push('Tour quý khách đã lưu đang có cập nhật cần chú ý.');
    if (reasons.length > 0) lines.push(`Lý do nhắc: ${reasons.join(', ')}`);
    if (payload.availableSeats != null) lines.push(`Số chỗ còn lại thấp nhất: ${valueToText(payload.availableSeats)}`);
    if (payload.voucherCode) lines.push(`Mã ưu đãi: ${valueToText(payload.voucherCode)}`);
    if (payload.discountValue) lines.push(`Giá trị ưu đãi: ${valueToText(payload.discountValue)}`);
    if (payload.tourUrl) lines.push(`Xem tour: ${valueToText(payload.tourUrl)}`);
  } else if (template === 'guide_assignment') {
    lines.push(`Anh/chị được phân công phụ trách tour ${tourName || valueToText(payload.tourCode, 'mới')}.`);
    lines.push(`Hướng dẫn viên: ${valueToText(payload.guideName, 'HDV được phân công')}`);
    if (payload.commonFileName) lines.push(`File thông tin chung và lịch trình: ${valueToText(payload.commonFileName)}`);
    if (payload.passengerFileName) lines.push(`File danh sách khách hàng: ${valueToText(payload.passengerFileName)}`);
    lines.push('Noi dung file duoc xuat tu man hinh Phan cong HDV cua dieu phoi.');
  } else {
    lines.push('Travela gửi thông báo mới liên quan đến đơn đặt tour của quý khách.');
  }

  lines.push('');
  lines.push('Nếu cần hỗ trợ, quý khách vui lòng phản hồi email này hoặc liên hệ Travela.');
  return lines.filter((line) => line.trim().length > 0).join('\n');
}

function buildTemplateParams(input: QueueEmailInput, subject: string, message: string, payload: Record<string, unknown>) {
  const contactName = valueToText(getNestedValue(payload, 'contact.name'));
  const recipientName = contactName || input.recipient;
  const passengerTableHtml = input.template === 'booking_confirmed' ? buildPassengerTableHtml(payload) : '';
  const roomSummary = buildRoomSummary(payload);
  const htmlMessage = [
    message.split('\n').map((line) => line.trim()).join('<br>'),
    passengerTableHtml,
  ].filter(Boolean).join('<br>');
  const refundBillUrl = getSafeEmailUrl(payload.refundBillUrl);
  const amountSource = payload.amount ?? payload.totalAmount ?? payload.refundAmount ?? payload.paidAmount;

  return {
    to_email: input.recipient,
    to_name: recipientName,
    recipient: input.recipient,
    recipient_name: recipientName,
    subject,
    email_subject: subject,
    title: templateTitles[input.template] ?? subject,
    from_name: env.EMAILJS_FROM_NAME,
    reply_to: env.EMAILJS_REPLY_TO,
    email: env.EMAILJS_REPLY_TO,
    name: recipientName,
    time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    message,
    content: message,
    body: message,
    text: message,
    html_message: htmlMessage,
    passenger_table_html: passengerTableHtml,
    room_summary: roomSummary,
    has_passenger_table: Boolean(passengerTableHtml),
    has_room_summary: hasValue(roomSummary),
    has_booking_code: hasValue(payload.bookingCode),
    has_tour_name: hasValue(payload.tourName),
    has_tour_date: hasValue(payload.tourDate),
    has_amount: hasValue(amountSource),
    has_refund_amount: hasValue(payload.refundAmount),
    has_refund_bill_url: Boolean(refundBillUrl),
    has_refund_bill_note: hasValue(payload.refundBillUrl),
    has_common_file: hasValue(payload.commonFileName),
    has_passenger_file: hasValue(payload.passengerFileName),
    booking_code: getBookingCode(payload),
    tour_name: getTourName(payload),
    tour_date: getTourDate(payload),
    amount: formatMoney(amountSource),
    refund_amount: formatMoney(payload.refundAmount),
    paid_amount: formatMoney(payload.paidAmount),
    remaining_amount: formatMoney(payload.remainingAmount),
    payment_deadline: formatTime(payload.paymentWindowExpiresAt),
    refund_bill_url: refundBillUrl,
    refund_bill_note: getRefundBillNote(payload),
    common_file_name: valueToText(payload.commonFileName),
    common_file_content: '',
    passenger_file_name: valueToText(payload.passengerFileName),
    passenger_file_content: '',
    template: input.template,
  };
}

function prepareEmail(input: QueueEmailInput) {
  const payload = normalizePayload(input.payload) as Record<string, unknown>;
  const subject = buildSubject(input.template, payload, input.subject);
  const message = buildEmailMessage(input.template, payload);
  return {
    payload,
    subject,
    message,
    params: buildTemplateParams(input, subject, message, payload),
  };
}

async function sendEmailJs(input: QueueEmailInput, params: Record<string, unknown>) {
  if (process.env.VITEST === 'true' || !env.EMAILJS_ENABLED) {
    return { skipped: true };
  }

  if (isNonDeliverableDevRecipient(input.recipient)) {
    return { skipped: true, reason: `Skipped non-deliverable development recipient: ${input.recipient}` };
  }

  if (!env.EMAILJS_SERVICE_ID || !env.EMAILJS_TEMPLATE_ID || !env.EMAILJS_PUBLIC_KEY) {
    throw new Error('EmailJS is enabled but missing service/template/public key');
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: env.EMAILJS_SERVICE_ID,
      template_id: env.EMAILJS_TEMPLATE_ID,
      user_id: env.EMAILJS_PUBLIC_KEY,
      ...(env.EMAILJS_PRIVATE_KEY ? { accessToken: env.EMAILJS_PRIVATE_KEY } : {}),
      template_params: params,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`EmailJS send failed: ${response.status} ${details}`.trim());
  }

  return { skipped: false };
}

export async function queueEmail(
  writer: EmailWriter,
  input: QueueEmailInput,
) {
  const {
    template,
    recipient,
    bookingId,
    voucherId,
    createdById,
  } = input;
  const prepared = prepareEmail(input);
  let status = input.status ?? 'SENT';
  let sentAt: Date | null = status === 'SENT' ? new Date() : null;
  let payloadJson: Record<string, unknown> = {
    ...prepared.payload,
    emailSubject: prepared.subject,
    emailMessage: prepared.message,
  };

  try {
    const result = await sendEmailJs({ ...input, subject: prepared.subject, payload: prepared.payload }, prepared.params);
    if (result.skipped) {
      payloadJson = {
        ...payloadJson,
        emailSkipped: true,
        ...(result.reason ? { emailSkipReason: result.reason } : {}),
      };
    }
    status = input.status ?? 'SENT';
    sentAt = status === 'SENT' ? new Date() : null;
  } catch (error) {
    status = 'FAILED';
    sentAt = null;
    payloadJson = {
      ...payloadJson,
      emailError: error instanceof Error ? error.message : 'Unknown EmailJS error',
    };
  }

  return writer.emailOutbox.create({
    data: {
      template,
      recipient,
      subject: prepared.subject,
      payloadJson: payloadJson as Prisma.InputJsonValue,
      bookingId: bookingId ?? null,
      voucherId: voucherId ?? null,
      createdById: createdById ?? null,
      status,
      sentAt,
    },
  });
}
