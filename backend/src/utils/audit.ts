import prisma from '../config/prisma.js';
import { Request } from 'express';

interface CreateAuditLogParams {
  req?: Request;
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any>;
}

export async function recordAuditLog({
  req,
  companyId,
  userId,
  action,
  entity,
  entityId,
  details,
}: CreateAuditLogParams): Promise<void> {
  try {
    // استخراج معلومات العميل والطلب بأمان
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || null
      : null;
    const userAgent = req ? req.headers['user-agent'] || null : null;

    // تنظيف التفاصيل لمنع حفظ أي كلمات مرور أو رموز سرية
    const safeDetails = details ? { ...details } : undefined;
    if (safeDetails) {
      delete safeDetails.password;
      delete safeDetails.passwordHash;
      delete safeDetails.token;
      delete safeDetails.secret;
    }

    await prisma.auditLog.create({
      data: {
        companyId: companyId || req?.currentCompanyId || null,
        userId: userId || req?.user?.id || null,
        action,
        entity,
        entityId: entityId || null,
        details: safeDetails || undefined,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.slice(0, 45) : null,
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : null,
      },
    });
  } catch (err) {
    console.error('فشل حفظ سجل التدقيق:', err);
  }
}
