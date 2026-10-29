import { z } from 'zod';

export const createSettlementSchema = z.object({
  driverId: z.string().uuid('معرف الموصل غير صالح'),
  tripIds: z.array(z.string().uuid('معرف المشوار غير صالح')).min(1, 'يجب اختيار مشوار واحد على الأقل للمحاسبة'),
  settledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة تاريخ التسوية يجب أن تكون YYYY-MM-DD').optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER']).optional().default('CASH'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const statementQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['ALL', 'UNSETTLED', 'SETTLED']).optional().default('ALL'),
});

export const duesReportQuerySchema = z.object({
  driverId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
