import { z } from 'zod';

export const createPaymentSchema = z.object({
  tripId: z.string().uuid('معرف المشوار غير صالح'),
  amount: z.number().positive('مبلغ الدفعة يجب أن يكون أكبر من صفر'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'CREDIT', 'OTHER']).default('CASH'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});
