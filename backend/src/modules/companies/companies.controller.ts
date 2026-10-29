import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { createCompanySchema, updateCompanySchema, addMemberSchema } from './companies.validator.js';
import { CompanyRole, SystemRole } from '@prisma/client';

export async function getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      errorResponse(res, 'غير مصرح', 401);
      return;
    }

    let companies;

    if (req.user.systemRole === SystemRole.SYSTEM_ADMIN) {
      companies = await prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          pricingRules: { where: { isActive: true }, take: 1 },
          _count: { select: { drivers: true, trips: true } },
        },
      });
    } else {
      const memberships = await prisma.companyMembership.findMany({
        where: { userId: req.user.id, isActive: true },
        include: {
          company: {
            include: {
              pricingRules: { where: { isActive: true }, take: 1 },
              _count: { select: { drivers: true, trips: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      companies = memberships.map(m => ({
        ...m.company,
        role: m.role,
      }));
    }

    const formatted = companies.map((c: any) => ({
      id: c.id,
      name: c.name,
      managerName: c.managerName,
      phone: c.phone,
      email: c.email,
      crNumber: c.crNumber,
      taxNumber: c.taxNumber,
      city: c.city,
      address: c.address,
      logo: c.logo,
      defaultCurrency: c.defaultCurrency,
      isActive: c.isActive,
      createdAt: c.createdAt,
      role: c.role || 'COMPANY_ADMIN',
      pricingConfig: c.pricingRules?.[0] || null,
      stats: {
        driversCount: c._count?.drivers || 0,
        tripsCount: c._count?.trips || 0,
      },
    }));

    successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        pricingRules: { where: { isActive: true }, take: 1 },
        _count: { select: { drivers: true, trips: true } },
      },
    });

    if (!company) {
      errorResponse(res, 'الشركة غير موجودة', 404);
      return;
    }

    successResponse(res, {
      ...company,
      pricingConfig: company.pricingRules?.[0] || null,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      errorResponse(res, 'غير مصرح', 401);
      return;
    }

    const data = createCompanySchema.parse(req.body);

    const newCompany = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          ...data,
          email: data.email || null,
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
        include: {
          pricingRules: true,
        },
      });

      // ربط المستخدم المنشئ كمدير للشركة
      await tx.companyMembership.create({
        data: {
          userId: req.user!.id,
          companyId: company.id,
          role: CompanyRole.COMPANY_ADMIN,
        },
      });

      return company;
    });

    await recordAuditLog({
      req,
      companyId: newCompany.id,
      action: 'CREATE_COMPANY',
      entity: 'Company',
      entityId: newCompany.id,
      details: { name: newCompany.name },
    });

    successResponse(
      res,
      {
        ...newCompany,
        pricingConfig: newCompany.pricingRules?.[0] || null,
      },
      'تم إنشاء الشركة بنجاح',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params;
    const data = updateCompanySchema.parse(req.body);

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...data,
        email: data.email || null,
      },
      include: {
        pricingRules: { where: { isActive: true }, take: 1 },
      },
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'UPDATE_COMPANY',
      entity: 'Company',
      entityId: companyId,
      details: data,
    });

    successResponse(
      res,
      {
        ...updated,
        pricingConfig: updated.pricingRules?.[0] || null,
      },
      'تم تحديث بيانات الشركة بنجاح'
    );
  } catch (err) {
    next(err);
  }
}

export async function toggleCompanyStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params;

    const current = await prisma.company.findUnique({
      where: { id: companyId },
      select: { isActive: true },
    });

    if (!current) {
      errorResponse(res, 'الشركة غير موجودة', 404);
      return;
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { isActive: !current.isActive },
    });

    await recordAuditLog({
      req,
      companyId,
      action: updated.isActive ? 'ACTIVATE_COMPANY' : 'DEACTIVATE_COMPANY',
      entity: 'Company',
      entityId: companyId,
    });

    successResponse(res, updated, updated.isActive ? 'تم تفعيل الشركة' : 'تم تعطيل الشركة');
  } catch (err) {
    next(err);
  }
}

export async function deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.params;

    await prisma.company.delete({
      where: { id: companyId },
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'DELETE_COMPANY',
      entity: 'Company',
      entityId: companyId,
    });

    successResponse(res, null, 'تم حذف الشركة وجميع بياناتها بنجاح');
  } catch (err) {
    next(err);
  }
}
