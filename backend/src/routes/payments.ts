import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { authenticate } from '../middleware/auth.js';
import { getPayOSClient } from '../lib/payos.js';
import { env } from '../config/env.js';

function buildPayOSDescription(bookingCode: string) {
  return `Thanh toan ${bookingCode.replaceAll('-', '')}`.slice(0, 25);
}

export function createPaymentsRouter() {
  const router = Router();

  router.post('/bookings/:id/payos-link', asyncHandler(async (req, res) => {
    const bookingId = String(req.params.id);
    const client = getPayOSClient();
    if (!client) {
      throw badRequest('PayOS has not been configured');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tourInstance: true,
      },
    });

    if (!booking) {
      throw notFound('Booking not found');
    }

    const payload = (booking.payloadJson as { paymentRatio?: 'deposit' | 'full' } | null) ?? {};
    const remainingAmount = Number(booking.remainingAmount);
    const paidAmount = Number(booking.paidAmount);
    const payableAmount = payload.paymentRatio === 'deposit' && paidAmount === 0
      ? Math.min(Math.ceil(Number(booking.totalAmount) * 0.5), remainingAmount)
      : remainingAmount;

    if (payableAmount <= 0) {
      throw badRequest('Booking has no remaining balance');
    }

    const existingUnpaidTransaction = await prisma.paymentTransaction.findFirst({
      where: {
        bookingId: booking.id,
        method: 'PAYOS',
        status: 'UNPAID',
      },
      orderBy: { createdAt: 'desc' },
    });

    const existingPaymentLink = existingUnpaidTransaction?.payloadJson as {
      checkoutUrl?: string;
      qrCode?: string;
      paymentLinkId?: string;
    } | null | undefined;

    if (existingUnpaidTransaction && existingPaymentLink?.checkoutUrl) {
      res.json({
        success: true,
        reused: true,
        paymentLink: existingPaymentLink,
      });
      return;
    }

    const orderCode = Number(`${Date.now()}`.slice(-9));
    const paymentLink = await client.createPaymentLink({
      orderCode,
      amount: payableAmount,
      description: buildPayOSDescription(booking.bookingCode),
      cancelUrl: env.PAYOS_CANCEL_URL,
      returnUrl: env.PAYOS_RETURN_URL,
      buyerName: booking.contactName,
      buyerEmail: booking.contactEmail,
      buyerPhone: booking.contactPhone,
      items: [
        {
          name: booking.bookingCode,
          quantity: 1,
          price: payableAmount,
        },
      ],
    });

    await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        amount: payableAmount,
        method: 'PAYOS',
        status: 'UNPAID',
        orderCode: String(orderCode),
        transactionRef: paymentLink.paymentLinkId,
        payloadJson: paymentLink,
      },
    });

    res.json({
      success: true,
      paymentLink,
    });
  }));

  router.post('/payos/webhook', asyncHandler(async (req, res) => {
    const client = getPayOSClient();
    if (!client) {
      throw badRequest('PayOS has not been configured');
    }

    const paymentData = client.verifyPaymentWebhookData(req.body);
    const orderCode = String(paymentData.orderCode);

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { orderCode },
      include: {
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!transaction) {
      throw notFound('Payment transaction not found');
    }

    const alreadyPaid = transaction.status === 'PAID';
    if (!alreadyPaid) {
      const nextPaidAmount = Number(transaction.booking.paidAmount) + Number(paymentData.amount);
      const totalAmount = Number(transaction.booking.totalAmount);

      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'PAID',
          paidAt: new Date(paymentData.transactionDateTime),
          transactionRef: paymentData.reference,
          payloadJson: req.body,
        },
      });

      await prisma.booking.update({
        where: { id: transaction.bookingId },
        data: {
          paidAmount: nextPaidAmount,
          remainingAmount: Math.max(totalAmount - nextPaidAmount, 0),
          paymentStatus: nextPaidAmount >= totalAmount ? 'PAID' : 'PARTIAL',
        },
      });
    }

    res.json({
      error: 0,
      message: 'Webhook processed',
      data: null,
    });
  }));

  router.post('/payos/confirm-webhook', authenticate, asyncHandler(async (_req, res) => {
    const client = getPayOSClient();
    if (!client) {
      throw badRequest('PayOS has not been configured');
    }

    if (!env.PAYOS_WEBHOOK_URL) {
      throw badRequest('PAYOS_WEBHOOK_URL is missing');
    }

    const result = await client.confirmWebhook(env.PAYOS_WEBHOOK_URL);

    res.json({
      success: true,
      result,
      webhookUrl: env.PAYOS_WEBHOOK_URL,
    });
  }));

  return router;
}
