import { Prisma } from '@prisma/client';

export interface PricingConfig {
  tier1MaxMinutes: number;
  tier1Price: number | Prisma.Decimal;
  tier2MaxMinutes: number;
  tier2Price: number | Prisma.Decimal;
  tier3MaxMinutes: number;
  tier3Price: number | Prisma.Decimal;
  extraHourRate: number | Prisma.Decimal;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  tier1MaxMinutes: 19,
  tier1Price: 20,
  tier2MaxMinutes: 29,
  tier2Price: 30,
  tier3MaxMinutes: 60,
  tier3Price: 50,
  extraHourRate: 50,
};

/**
 * احتساب تكلفة المشوار على الخادم بدقة مالية متناهية
 * @param durationMinutes مدة المشوار بالدقائق (عدد صحيح موجب أكبر من صفر)
 * @param customConfig إعدادات تسعير الشركة الاختيارية
 * @returns التكلفة بالريال السعودي
 */
export function calculateTripCost(
  durationMinutes: number,
  customConfig?: Partial<PricingConfig>
): number {
  const minutes = Math.floor(durationMinutes);

  if (isNaN(minutes) || minutes <= 0) {
    throw new Error('مدة المشوار يجب أن تكون رقماً صحيحاً موجباً أكبر من صفر');
  }

  const config: PricingConfig = {
    tier1MaxMinutes: customConfig?.tier1MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier1MaxMinutes,
    tier1Price: Number(customConfig?.tier1Price ?? DEFAULT_PRICING_CONFIG.tier1Price),
    tier2MaxMinutes: customConfig?.tier2MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier2MaxMinutes,
    tier2Price: Number(customConfig?.tier2Price ?? DEFAULT_PRICING_CONFIG.tier2Price),
    tier3MaxMinutes: customConfig?.tier3MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier3MaxMinutes,
    tier3Price: Number(customConfig?.tier3Price ?? DEFAULT_PRICING_CONFIG.tier3Price),
    extraHourRate: Number(customConfig?.extraHourRate ?? DEFAULT_PRICING_CONFIG.extraHourRate),
  };

  // الشريحة الأولى: 1 إلى 19 دقيقة
  if (minutes <= config.tier1MaxMinutes) {
    return Number(config.tier1Price);
  }

  // الشريحة الثانية: 20 إلى 29 دقيقة
  if (minutes <= config.tier2MaxMinutes) {
    return Number(config.tier2Price);
  }

  // الشريحة الثالثة: 30 إلى 60 دقيقة
  if (minutes <= config.tier3MaxMinutes) {
    return Number(config.tier3Price);
  }

  // ما بعد 60 دقيقة: سعر الشريحة الثالثة + كل ساعة إضافية أو جزء منها
  const extraMinutes = minutes - config.tier3MaxMinutes;
  const extraHours = Math.ceil(extraMinutes / 60);

  return Number(config.tier3Price) + (extraHours * Number(config.extraHourRate));
}
