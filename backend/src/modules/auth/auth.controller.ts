import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { loginSchema, registerSchema, changePasswordSchema } from './auth.validator.js';
import { CompanyRole, SystemRole } from '@prisma/client';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                city: true,
                isActive: true,
                logo: true,
                defaultCurrency: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      errorResponse(res, 'بيانات تسجيل الدخول غير صحيحة أو الحساب معطل', 401);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      errorResponse(res, 'بيانات تسجيل الدخول غير صحيحة', 401);
      return;
    }

    // إنشاء رمز الوصول JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        systemRole: user.systemRole,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    // تعيين الكوكي الآمن
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await recordAuditLog({
      req,
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email },
    });

    const activeCompanies = user.memberships
      .filter(m => m.company.isActive)
      .map(m => ({
        id: m.company.id,
        name: m.company.name,
        city: m.company.city,
        role: m.role,
        defaultCurrency: m.company.defaultCurrency,
      }));

    successResponse(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          systemRole: user.systemRole,
        },
        companies: activeCompanies,
      },
      'تم تسجيل الدخول بنجاح'
    );
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, companyName } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      errorResponse(res, 'البريد الإلكتروني مسجل مسبقاً', 409);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // إذا كان أول مستخدم في النظام، نجعله مدير نظام عام SYSTEM_ADMIN
    const userCount = await prisma.user.count();
    const systemRole = userCount === 0 ? SystemRole.SYSTEM_ADMIN : SystemRole.USER;

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          systemRole,
        },
      });

      // إذا تم تمرير اسم شركة أو كان أول مستخدم
      let company = null;
      if (companyName || userCount === 0) {
        const cName = companyName || 'المجد هوم للمفروشات';
        company = await tx.company.create({
          data: {
            name: cName,
            managerName: name,
            city: 'الرياض',
            defaultCurrency: 'SAR',
            pricingRules: {
              create: {
                tier1MaxMinutes: 19,
                tier1Price: 20,
                tier2MaxMinutes: 29,
                tier2Price: 30,
                tier3MaxMinutes: 60,
                tier3Price: 50,
                extraHourRate: 50,
              },
            },
          },
        });

        await tx.companyMembership.create({
          data: {
            userId: newUser.id,
            companyId: company.id,
            role: CompanyRole.COMPANY_ADMIN,
          },
        });
      }

      return { user: newUser, company };
    });

    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        systemRole: result.user.systemRole,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    successResponse(
      res,
      {
        token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          systemRole: result.user.systemRole,
        },
        company: result.company,
      },
      'تم إنشاء الحساب بنجاح',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      errorResponse(res, 'غير مصرح', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                city: true,
                phone: true,
                email: true,
                crNumber: true,
                taxNumber: true,
                logo: true,
                defaultCurrency: true,
                isActive: true,
                pricingRules: {
                  where: { isActive: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      errorResponse(res, 'المستخدم غير موجود', 404);
      return;
    }

    const companies = user.memberships.map(m => ({
      id: m.company.id,
      name: m.company.name,
      city: m.company.city,
      phone: m.company.phone,
      email: m.company.email,
      crNumber: m.company.crNumber,
      taxNumber: m.company.taxNumber,
      role: m.role,
      defaultCurrency: m.company.defaultCurrency,
      pricingConfig: m.company.pricingRules[0] || null,
    }));

    successResponse(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
      },
      companies,
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      errorResponse(res, 'غير مصرح', 401);
      return;
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      errorResponse(res, 'المستخدم غير موجود', 404);
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      errorResponse(res, 'كلمة المرور الحالية غير صحيحة', 400);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await recordAuditLog({
      req,
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: user.id,
    });

    successResponse(res, null, 'تم تغيير كلمة المرور بنجاح');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('access_token');
  successResponse(res, null, 'تم تسجيل الخروج بنجاح');
}
