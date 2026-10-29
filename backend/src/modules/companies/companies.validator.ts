import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'اسم الشركة مطلوب ويجب أن يتكون من حرفين على الأقل'),
  managerName: z.string().min(2, 'اسم المسؤول مطلوب'),
  phone: z.string().optional().nullable(),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  taxNumber: z.string().optional().nullable(),
  crNumber: z.string().optional().nullable(),
  city: z.string().optional().nullable().default('الرياض'),
  address: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  defaultCurrency: z.string().optional().default('SAR'),
});

export const updateCompanySchema = createCompanySchema.partial();

export const addMemberSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  role: z.enum(['COMPANY_ADMIN', 'STAFF', 'VIEWER']).default('STAFF'),
});
