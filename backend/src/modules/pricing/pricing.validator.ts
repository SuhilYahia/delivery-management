import { z } from 'zod';

export const updatePricingRuleSchema = z.object({
  tier1MaxMinutes: z.number().int().min(1, 'الحد الأقصى للشريحة الأولى يجب أن يكون دقيقة على الأقل'),
  tier1Price: z.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  tier2MaxMinutes: z.number().int().min(2, 'الحد الأقصى للشريحة الثانية يجب أن يكون أكبر من الشريحة الأولى'),
  tier2Price: z.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  tier3MaxMinutes: z.number().int().min(3, 'الحد الأقصى للشريحة الثالثة يجب أن يكون أكبر من الشريحة الثانية'),
  tier3Price: z.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  extraHourRate: z.number().min(0, 'سعر الساعة الإضافية لا يمكن أن يكون سالباً'),
}).refine(data => data.tier1MaxMinutes < data.tier2MaxMinutes, {
  message: 'حد الشريحة الأولى يجب أن يكون أصغر من حد الشريحة الثانية',
  path: ['tier2MaxMinutes'],
}).refine(data => data.tier2MaxMinutes < data.tier3MaxMinutes, {
  message: 'حد الشريحة الثانية يجب أن يكون أصغر من حد الشريحة الثالثة',
  path: ['tier3MaxMinutes'],
});
