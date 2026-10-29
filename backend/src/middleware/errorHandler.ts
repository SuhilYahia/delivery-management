import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // أخطاء التحقق من المدخلات Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    errorResponse(res, 'خطأ في التحقق من البيانات المدخلة', 422, formattedErrors);
    return;
  }

  // أخطاء قاعدة البيانات Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      errorResponse(
        res,
        `قيمة فريدة مسجلة مسبقاً (${target.join(', ')})، يرجى استخدام قيمة أخرى`,
        409
      );
      return;
    }
    if (err.code === 'P2025') {
      errorResponse(res, 'السجل المطلوب غير موجود أو تم حذفه', 404);
      return;
    }
    if (err.code === 'P2003') {
      errorResponse(res, 'تعذر تنفيذ العملية لوجود سجلات مرتبطة بهذا العنصر', 400);
      return;
    }
  }

  // أخطاء تحليل JSON
  if (err instanceof SyntaxError && 'body' in err) {
    errorResponse(res, 'صيغة بيانات JSON غير صحيحة', 400);
    return;
  }

  // طباعة الخطأ في وضع التطوير فقط
  if (env.NODE_ENV === 'development') {
    console.error('Unhandled Server Error:', err);
  }

  const message = err.message || 'حدث خطأ داخلي في الخادم';
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;

  errorResponse(res, message, statusCode);
}
