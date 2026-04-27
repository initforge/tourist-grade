import type { EmailOutboxStatus, Prisma, PrismaClient } from '@prisma/client';

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

export async function queueEmail(
  writer: EmailWriter,
  {
    template,
    recipient,
    subject,
    payload,
    bookingId,
    voucherId,
    createdById,
    status = 'SENT',
  }: QueueEmailInput,
) {
  return writer.emailOutbox.create({
    data: {
      template,
      recipient,
      subject,
      payloadJson: payload as Prisma.InputJsonValue,
      bookingId: bookingId ?? null,
      voucherId: voucherId ?? null,
      createdById: createdById ?? null,
      status,
      sentAt: status === 'SENT' ? new Date() : null,
    },
  });
}

