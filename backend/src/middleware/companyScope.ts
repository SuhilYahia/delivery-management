import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma.js';
import { errorResponse } from '../utils/response.js';
import { CompanyRole, SystemRole } from '@prisma/client';

export async function requireCompanyScope(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      errorResponse(res, 'يجب تسجيل الدخول أولاً', 401);
      return;
    }

    // استخراج معرف الشركة من الترويسة أو المعاملات
    let targetCompanyId =
      (req.headers['x-company-id'] as string) ||
      (req.params.companyId as string) ||
      (req.query.companyId as string) ||
      (req.body && req.body.companyId as string);

    // إذا لم يحدد العميل معرف شركة، نبحث عن أول شركة نشطة ينتمي إليها المستخدم
    if (!targetCompanyId) {
      const defaultMembership = await prisma.companyMembership.findFirst({
        where: {
          userId: req.user.id,
          isActive: true,
          company: { isActive: true },
        },
        include: { company: true },
      });

      if (!defaultMembership) {
        errorResponse(res, 'لم يتم العثور على أي شركة نشطة ترتبط بحسابك', 403);
        return;
      }

      targetCompanyId = defaultMembership.companyId;
    }

    // التحقق من الصلاحيات والعضوية
    if (req.user.systemRole === SystemRole.SYSTEM_ADMIN) {
      // مدير النظام يملك صلاحية الوصول إلى أي شركة مسجلة
      const company = await prisma.company.findUnique({
        where: { id: targetCompanyId },
      });

      if (!company) {
        errorResponse(res, 'الشركة المطلوبة غير موجودة', 404);
        return;
      }

      req.currentCompanyId = targetCompanyId;
      req.currentMembership = {
        id: 'system-admin-bypass',
        companyId: targetCompanyId,
        role: CompanyRole.COMPANY_ADMIN,
      };
      next();
      return;
    }

    // للمستخدمين العاديين: التحقق الصارم من جدول العضويات
    const membership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: req.user.id,
          companyId: targetCompanyId,
        },
      },
      include: {
        company: true,
      },
    });

    if (!membership || !membership.isActive || !membership.company.isActive) {
      errorResponse(res, 'ليس لديك صلاحية للوصول إلى بيانات هذه الشركة', 403);
      return;
    }

    req.currentCompanyId = targetCompanyId;
    req.currentMembership = {
      id: membership.id,
      companyId: membership.companyId,
      role: membership.role,
    };

    next();
  } catch (err) {
    console.error('خطأ في التحقق من نطاق الشركة:', err);
    errorResponse(res, 'حدث خطأ أثناء التحقق من صلاحية الشركة', 500);
  }
}
