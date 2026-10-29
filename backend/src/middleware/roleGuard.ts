import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { CompanyRole, SystemRole } from '@prisma/client';

export function requireCompanyRole(...allowedRoles: CompanyRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'يجب تسجيل الدخول أولاً', 401);
      return;
    }

    if (req.user.systemRole === SystemRole.SYSTEM_ADMIN) {
      next();
      return;
    }

    if (!req.currentMembership) {
      errorResponse(res, 'لم يتم التحقق من عضوية الشركة بعد', 403);
      return;
    }

    if (!allowedRoles.includes(req.currentMembership.role)) {
      errorResponse(res, 'لا تملك الصلاحية الكافية لتنفيذ هذا الإجراء', 403);
      return;
    }

    next();
  };
}

export function requireSystemAdmin() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.systemRole !== SystemRole.SYSTEM_ADMIN) {
      errorResponse(res, 'هذا الإجراء متاح لمدير النظام العام فقط', 403);
      return;
    }
    next();
  };
}
