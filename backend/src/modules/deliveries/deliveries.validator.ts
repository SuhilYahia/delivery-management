import { z } from 'zod';

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['PENDING', 'DELIVERED', 'FAILED', 'RETURNED']),
  actualDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  actualDeliveryTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  recipientName: z.string().optional().nullable(),
  pendingReason: z.string().optional().nullable(),
  nextDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  failureReason: z.string().optional().nullable(),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  returnReason: z.string().optional().nullable(),
  deliveryNotes: z.string().optional().nullable(),
});
