import { z } from 'zod';

export const createDriverSchema = z.object({
  name: z.string().min(2, 'اسم السائق مطلوب ويجب أن لا يقل عن حرفين'),
  phone: z.string().min(8, 'رقم هاتف السائق غير صالح'),
  vehicleType: z.string().optional().nullable().default('سيارة نقل'),
  licenseNumber: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateDriverSchema = createDriverSchema.partial();
