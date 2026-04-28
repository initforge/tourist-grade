import { Router } from 'express';
import { expireOverdueDepositBookings, expireUnpaidBookings } from '../lib/booking-lifecycle.js';
import { applySuccessfulPayOSTransaction, isPayOSCancelledStatus, isPayOSPaidStatus } from '../lib/payos-bookings.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, badRequest, notFound } from '../lib/http.js';
import { authenticate } from '../middleware/auth.js';
import { getPayOSClient } from '../lib/payos.js';
import { env } from '../config/env.js';

function buildPayOSDescription(bookingCode: string) {
  return `Thanh toan ${bookingCode.replaceAll('-', '')}`.slice(0, 25);
}

function getPayOSWebhookStatus(paymentData: unknown) {
  return (paymentData as { status?: unknown; code?: unknown } | null)?.status;
}

function getPayOSWebhookCode(paymentData: unknown) {
  return (paymentData as { status?: unknown; code?: unknown } | null)?.code;
}

export function createPaymentsRouter() {
  const router = Router();

  router.post('/bookings/:id/payos-link', asyncHandler(async (req, res) => {
    await expireUnpaidBookings(prisma);
    await expireOverdueDepositBookings(prisma);

    const bookingId = String(req.params.id);
    const client = getPayOSClient();
    if (!client) {
      throw badRequest('PayOS has not been configured');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tourInstance: {
          include: {
            program: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw notFound('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw badRequest('Booking can no longer be paid');
    }

    const payload = (booking.payloadJson as { paymentRatio?: 'deposit' | 'full'; publicScheduleId?: string } | null) ?? {};
    const checkoutBaseUrl = `http://localhost:8080/tours/${booking.tourInstance.program.slug}/book?scheduleId=${encodeURIComponent(payload.publicScheduleId ?? booking.tourInstance.code)}&bookingId=${booking.id}`;
    const remainingAmount = Number(booking.remainingAmount);
    const paidAmount = Number(booking.paidAmount);
    const payableAmount = payload.paymentRatio === 'deposit' && paidAmount === 0
      ? Math.min(Math.ceil(Number(booking.totalAmount) * 0.5), remainingAmount)
      : remainingAmount;

    if (payableAmount <= 0) {
      throw badRequest('Booking has no remaining balance');
    }

    const existingUnpaidTransactions = await prisma.paymentTransaction.findMany({
      where: {
        bookingId: booking.id,
        method: 'PAYOS',
        status: 'UNPAID',
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const transaction of existingUnpaidTransactions) {
      if (transaction.orderCode) {
        try {
          await client.cancelPaymentLink(transaction.orderCode, 'A new payment request was created for this booking');
        } catch {
          // Keep local state consistent even if the PayOS link was already closed remotely.
        }
      }

      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CANCELLED',
          payloadJson: {
            ...((transaction.payloadJson as Record<string, unknown> | null) ?? {}),
            cancelledAt: new Date().toISOString(),
            cancellationReason: 'Superseded by a newer PayOS payment request',
          },
        },
      });
    }

    const orderCode = Number(`${Date.now()}`.slice(-9));
    const paymentLink = await client.createPaymentLink({
      orderCode,
      amount: payableAmount,
      description: buildPayOSDescription(booking.bookingCode),
      cancelUrl: `${checkoutBaseUrl}&payos=cancel`,
      returnUrl: `${checkoutBaseUrl}&payos=return`,
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

  router.get('/payos/webhook', asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      message: 'PayOS webhook endpoint is reachable',
    });
  }));

  router.post('/payos/webhook', asyncHandler(async (req, res) => {
    await expireOverdueDepositBookings(prisma);
    const client = getPayOSClient();
    if (!client) {
      throw badRequest('PayOS has not been configured');
    }

    const paymentData = client.verifyPaymentWebhookData(req.body);
    const orderCode = String(paymentData.orderCode);
    const webhookStatus = getPayOSWebhookStatus(paymentData);
    const webhookCode = getPayOSWebhookCode(paymentData);

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { orderCode },
      include: {
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!transaction) {
      res.json({
        error: 0,
        message: 'Webhook acknowledged',
        data: null,
      });
      return;
    }

    if (isPayOSCancelledStatus(webhookStatus) || isPayOSCancelledStatus(webhookCode)) {
      if (transaction.status === 'UNPAID') {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'CANCELLED',
            payloadJson: req.body,
          },
        });
      }
    } else if (transaction.status === 'CANCELLED') {
      // Ignore stale webhooks from superseded PayOS links so old payment requests cannot change the booking.
    } else if (transaction.status !== 'PAID' && (isPayOSPaidStatus(webhookStatus) || isPayOSPaidStatus(webhookCode))) {
      await prisma.$transaction((tx) => applySuccessfulPayOSTransaction(
        tx,
        transaction,
        {
          amount: Number(paymentData.amount),
          reference: paymentData.reference,
          transactionDateTime: paymentData.transactionDateTime,
          paymentLinkId: paymentData.paymentLinkId,
          status: webhookStatus ?? webhookCode,
        },
        req.body,
        'webhook',
      ));
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

    let result: unknown;
    try {
      result = await client.confirmWebhook(env.PAYOS_WEBHOOK_URL);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PayOS webhook confirmation failed';
      if (/webhook url invalid/i.test(message)) {
        throw badRequest('Webhook URL invalid. Endpoint is reachable, but PayOS rejected this public URL. Quick trycloudflare tunnels are often refused; use a stable named tunnel or domain and retry.');
      }
      throw error;
    }

    res.json({
      success: true,
      result,
      webhookUrl: env.PAYOS_WEBHOOK_URL,
    });
  }));

  return router;
}
