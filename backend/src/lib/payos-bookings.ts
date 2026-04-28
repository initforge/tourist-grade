import type { Booking, PaymentTransaction, Prisma, PrismaClient } from '@prisma/client';
import { queueEmail } from './email-outbox.js';
import { getPayOSClient } from './payos.js';

type Writer = Pick<PrismaClient, 'booking' | 'paymentTransaction' | 'emailOutbox' | '$transaction'> | Prisma.TransactionClient;

type PayOSTransactionWithBooking = PaymentTransaction & {
  booking: Booking;
};

type PayOSSyncPayload = {
  amount?: number | null;
  amountPaid?: number | null;
  reference?: string | null;
  transactionDateTime?: string | null;
  paymentLinkId?: string | null;
  status?: unknown;
};

export function isPayOSPaidStatus(status: unknown) {
  const normalized = String(status ?? '').toUpperCase();
  return normalized === 'PAID' || normalized === '00';
}

export function isPayOSCancelledStatus(status: unknown) {
  return ['CANCELLED', 'CANCELED'].includes(String(status ?? '').toUpperCase());
}

function toJsonValue(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function resolvePaidAt(value?: string | null) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function applySuccessfulPayOSTransaction(
  writer: Pick<Prisma.TransactionClient, 'booking' | 'paymentTransaction' | 'emailOutbox'> | Prisma.TransactionClient,
  transaction: PayOSTransactionWithBooking,
  paymentData: PayOSSyncPayload,
  rawPayload: unknown,
  source: 'webhook' | 'lookup',
) {
  if (transaction.status === 'PAID') {
    return transaction.booking;
  }

  const paymentAmount = Math.max(
    0,
    Number(paymentData.amount ?? paymentData.amountPaid ?? transaction.amount ?? 0),
  );
  const currentPaidAmount = Number(transaction.booking.paidAmount);
  const totalAmount = Number(transaction.booking.totalAmount);
  const nextPaidAmount = Math.min(totalAmount, currentPaidAmount + paymentAmount);
  const nextBookingStatus =
    transaction.booking.status === 'PENDING'
      ? 'PENDING'
      : transaction.booking.status;

  await writer.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'PAID',
      paidAt: resolvePaidAt(paymentData.transactionDateTime),
      transactionRef: paymentData.reference ?? transaction.transactionRef ?? paymentData.paymentLinkId ?? null,
      payloadJson: toJsonValue(rawPayload),
    },
  });

  const booking = await writer.booking.update({
    where: { id: transaction.bookingId },
    data: {
      status: nextBookingStatus,
      paidAmount: nextPaidAmount,
      remainingAmount: Math.max(totalAmount - nextPaidAmount, 0),
      paymentStatus: nextPaidAmount >= totalAmount ? 'PAID' : 'PARTIAL',
    },
  });

  await queueEmail(writer, {
    template: 'booking_payment_received',
    recipient: booking.contactEmail,
    subject: `Da nhan thanh toan ${booking.bookingCode}`,
    bookingId: booking.id,
    payload: {
      bookingCode: booking.bookingCode,
      paidAmount: paymentAmount,
      totalPaidAmount: nextPaidAmount,
      remainingAmount: Math.max(totalAmount - nextPaidAmount, 0),
      paymentStatus: nextPaidAmount >= totalAmount ? 'PAID' : 'PARTIAL',
      source,
    },
  });

  return booking;
}

export async function syncBookingPaymentWithPayOS(prisma: PrismaClient, bookingId: string) {
  const client = getPayOSClient();
  if (!client) {
    return null;
  }

  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      bookingId,
      method: 'PAYOS',
      status: 'UNPAID',
    },
    include: {
      booking: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!transaction?.orderCode) {
    return null;
  }

  const paymentLinkInfo = await client.getPaymentLinkInformation(transaction.orderCode);
  if (isPayOSCancelledStatus(paymentLinkInfo.status)) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'CANCELLED',
        payloadJson: toJsonValue(paymentLinkInfo),
      },
    });
    return null;
  }

  if (!isPayOSPaidStatus(paymentLinkInfo.status)) {
    return null;
  }

  const latestTransaction = paymentLinkInfo.transactions.at(-1);

  return prisma.$transaction((tx) => applySuccessfulPayOSTransaction(
    tx,
    transaction,
    {
      amount: paymentLinkInfo.amountPaid,
      amountPaid: paymentLinkInfo.amountPaid,
      reference: latestTransaction?.reference ?? transaction.transactionRef,
      transactionDateTime: latestTransaction?.transactionDateTime ?? null,
      paymentLinkId: paymentLinkInfo.id,
      status: paymentLinkInfo.status,
    },
    paymentLinkInfo,
    'lookup',
  ));
}
