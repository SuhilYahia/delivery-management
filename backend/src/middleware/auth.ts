import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { errorResponse } from '../utils/response.js';
import { SystemRole } from '@prisma/client';

interface JwtPayload {
  userId: string;
  email: string;
  systemRole: SystemRole;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // استخراج الرمز من ترويسة Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      errorResponse(res, 'يرجى تسجيل الدخول للوصول إلى هذا المورد', 401);
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        systemRole: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      errorResponse(res, 'حساب المستخدم غير موجود أو تم تعطيله', 401);
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      errorResponse(res, 'انتهت صلاحية جلسة الدخول، يرجى إعادة تسجيل الدخول', 401);
      return;
    }
    errorResponse(res, 'رمز المصادقة غير صالح', 401);
  }
}
