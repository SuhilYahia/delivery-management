/**
 * خوارزمية تسعير المشاوير لنظام المجد لإدارة التوصيل
 * 
 * القواعد الافتراضية:
 * - من 1 إلى 19 دقيقة: 20 ريال
 * - من 20 إلى 29 دقيقة (أقل من 30): 30 ريال
 * - من 30 إلى 60 دقيقة: 50 ريال
 * - بعد 60 دقيقة: 50 ريال لكل ساعة إضافية أو جزء منها
 */

export const DEFAULT_PRICING_CONFIG = {
  tier1MaxMinutes: 19,
  tier1Price: 20,
  tier2MaxMinutes: 29,
  tier2Price: 30,
  tier3MaxMinutes: 60,
  tier3Price: 50,
  extraHourRate: 50,
};

/**
 * احتساب تكلفة المشوار بناءً على المدة وإعدادات التسعير المحددة للشركة
 * @param {number|string} durationMinutes - مدة المشوار بالدقائق (عدد صحيح موجب)
 * @param {object} [customConfig] - إعدادات تسعير مخصصة للشركة
 * @returns {number} تكلفة المشوار بالريال السعودي
 */
export function calculateTripCost(durationMinutes, customConfig = {}) {
  const minutes = parseInt(durationMinutes, 10);

  if (isNaN(minutes) || minutes <= 0) {
    return 0;
  }

  // دمج الإعدادات الافتراضية مع أي إعدادات مخصصة للشركة
  const config = {
    tier1MaxMinutes: customConfig.tier1MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier1MaxMinutes,
    tier1Price: customConfig.tier1Price ?? DEFAULT_PRICING_CONFIG.tier1Price,
    tier2MaxMinutes: customConfig.tier2MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier2MaxMinutes,
    tier2Price: customConfig.tier2Price ?? DEFAULT_PRICING_CONFIG.tier2Price,
    tier3MaxMinutes: customConfig.tier3MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier3MaxMinutes,
    tier3Price: customConfig.tier3Price ?? DEFAULT_PRICING_CONFIG.tier3Price,
    extraHourRate: customConfig.extraHourRate ?? DEFAULT_PRICING_CONFIG.extraHourRate,
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
