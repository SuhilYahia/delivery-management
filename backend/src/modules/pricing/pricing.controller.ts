import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { updatePricingRuleSchema } from './pricing.validator.js';
import { DEFAULT_PRICING_CONFIG } from '../../utils/pricingCalculator.js';
import { Prisma } from '@prisma/client';

export async function getCompanyPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;

    let rule = await prisma.pricingRule.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!rule) {
      // إذا لم تكن هناك قاعدة مسجلة، ننشئ قاعدة افتراضية
      rule = await prisma.pricingRule.create({
        data: {
          companyId,
          tier1MaxMinutes: DEFAULT_PRICING_CONFIG.tier1MaxMinutes,
          tier1Price: new Prisma.Decimal(DEFAULT_PRICING_CONFIG.tier1Price),
          tier2MaxMinutes: DEFAULT_PRICING_CONFIG.tier2MaxMinutes,
          tier2Price: new Prisma.Decimal(DEFAULT_PRICING_CONFIG.tier2Price),
          tier3MaxMinutes: DEFAULT_PRICING_CONFIG.tier3MaxMinutes,
          tier3Price: new Prisma.Decimal(DEFAULT_PRICING_CONFIG.tier3Price),
          extraHourRate: new Prisma.Decimal(DEFAULT_PRICING_CONFIG.extraHourRate),
        },
      });
    }

    successResponse(res, rule);
  } catch (err) {
    next(err);
  }
}

export async function updateCompanyPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const data = updatePricingRuleSchema.parse(req.body);

    // إنشاء قاعدة جديدة مع تعطيل القديمة لحفظ الأثر التاريخي
    const updatedRule = await prisma.$transaction(async (tx) => {
      await tx.pricingRule.updateMany({
        where: { companyId, isActive: true },
        data: { isActive: false },
      });

      return tx.pricingRule.create({
        data: {
          companyId,
          tier1MaxMinutes: data.tier1MaxMinutes,
          tier1Price: new Prisma.Decimal(data.tier1Price),
          tier2MaxMinutes: data.tier2MaxMinutes,
          tier2Price: new Prisma.Decimal(data.tier2Price),
          tier3MaxMinutes: data.tier3MaxMinutes,
          tier3Price: new Prisma.Decimal(data.tier3Price),
          extraHourRate: new Prisma.Decimal(data.extraHourRate),
          isActive: true,
        },
      });
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'UPDATE_PRICING_RULES',
      entity: 'PricingRule',
      entityId: updatedRule.id,
      details: data,
    });

    successResponse(res, updatedRule, 'تم تحديث قواعد التسعير بنجاح، وستطبق على المشاوير القادمة');
  } catch (err) {
    next(err);
  }
}
