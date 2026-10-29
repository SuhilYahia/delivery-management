import { z } from 'zod';

export const createTripSchema = z.object({
  driverId: z.string().uuid('معرف السائق غير صالح'),
  orderNumber: z.string().optional().nullable(),
  customerName: z.string().min(2, 'اسم العميل مطلوب'),
  customerPhone: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ يجب أن تكون YYYY-MM-DD'),
  tripTime: z.string().regex(/^\d{2}:\d{2}$/, 'صيغة الوقت يجب أن تكون HH:mm'),
  durationMinutes: z.number().int().positive('مدة المشوار يجب أن تكون رقماً صحيحاً موجباً أكبر من صفر'),
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().default('NEW'),
  deliveryStatus: z.enum(['PENDING', 'DELIVERED', 'FAILED', 'RETURNED']).optional().default('PENDING'),
  driverSettlementStatus: z.enum(['UNSETTLED', 'SETTLED']).optional().default('UNSETTLED'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'CREDIT', 'OTHER']).optional().default('CASH'),
  paidAmount: z.number().min(0, 'المبلغ المدفوع لا يمكن أن يكون سالباً').optional().default(0),
  notes: z.string().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
});

export const updateTripSchema = z.object({
  driverId: z.string().uuid().optional(),
  orderNumber: z.string().optional().nullable(),
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tripTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  driverSettlementStatus: z.enum(['UNSETTLED', 'SETTLED']).optional(),
  cancelReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
});

export const queryTripsSchema = z.object({
  page: z.string().optional().transform(v => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform(v => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 10)),
  search: z.string().optional(),
  driverId: z.string().optional(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  deliveryStatus: z.enum(['PENDING', 'DELIVERED', 'FAILED', 'RETURNED']).optional(),
  driverSettlementStatus: z.enum(['UNSETTLED', 'SETTLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortField: z.enum(['tripDate', 'cost', 'durationMinutes', 'createdAt', 'tripNumber']).optional().default('tripDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
