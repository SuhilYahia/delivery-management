import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { createDriverSchema, updateDriverSchema } from './drivers.validator.js';
import { SystemRole } from '@prisma/client';

export async function getDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;

    const drivers = await prisma.driver.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      include: {
        trips: {
          select: {
            id: true,
            status: true,
            cost: true,
            delivery: {
              select: {
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = drivers.map(d => {
      const eligibleTrips = d.trips.filter(t => t.status !== 'CANCELLED');
      const deliveredCount = eligibleTrips.filter(t => t.delivery?.status === 'DELIVERED').length;
      const pendingCount = eligibleTrips.filter(t => t.delivery?.status === 'PENDING').length;
      const failedCount = eligibleTrips.filter(t => t.delivery?.status === 'FAILED').length;
      const returnedCount = eligibleTrips.filter(t => t.delivery?.status === 'RETURNED').length;
      const totalCost = eligibleTrips.reduce((sum, t) => sum + Number(t.cost), 0);
      const successRate = eligibleTrips.length > 0 ? (deliveredCount / eligibleTrips.length) * 100 : null;

      return {
        id: d.id,
        companyId: d.companyId,
        name: d.name,
        phone: d.phone,
        vehicleType: d.vehicleType,
        licenseNumber: d.licenseNumber,
        isActive: d.isActive,
        createdAt: d.createdAt,
        stats: {
          totalTrips: d.trips.length,
          deliveredCount,
          pendingCount,
          failedCount,
          returnedCount,
          totalCost,
          successRate,
        },
      };
    });

    successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
}

export async function getDriverById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { driverId } = req.params;

    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        companyId,
        isDeleted: false,
      },
      include: {
        trips: {
          include: {
            delivery: true,
            payments: true,
          },
          orderBy: { tripDate: 'desc' },
        },
      },
    });

    if (!driver) {
      errorResponse(res, 'السائق غير موجود في هذه الشركة', 404);
      return;
    }

    successResponse(res, driver);
  } catch (err) {
    next(err);
  }
}

export async function createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const data = createDriverSchema.parse(req.body);

    const driver = await prisma.driver.create({
      data: {
        ...data,
        companyId,
      },
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'CREATE_DRIVER',
      entity: 'Driver',
      entityId: driver.id,
      details: { name: driver.name, phone: driver.phone },
    });

    successResponse(res, driver, 'تمت إضافة السائق بنجاح', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driverId } = req.params;
    const data = updateDriverSchema.parse(req.body);

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.isDeleted) {
      errorResponse(res, 'الموصل غير موجود أو تم حذفه مسبقاً', 404);
      return;
    }

    // التحقق من الصلاحية على شركة السائق
    if (req.user?.systemRole !== SystemRole.SYSTEM_ADMIN) {
      const membership = await prisma.companyMembership.findUnique({
        where: {
          userId_companyId: {
            userId: req.user!.id,
            companyId: driver.companyId,
          },
        },
      });

      if (!membership || !membership.isActive) {
        errorResponse(res, 'ليس لديك صلاحية لتعديل موصل في هذه الشركة', 403);
        return;
      }
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data,
    });

    await recordAuditLog({
      req,
      companyId: driver.companyId,
      action: 'UPDATE_DRIVER',
      entity: 'Driver',
      entityId: driverId,
      details: data,
    });

    successResponse(res, updated, 'تم تحديث بيانات السائق بنجاح');
  } catch (err) {
    next(err);
  }
}

export async function toggleDriverStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.isDeleted) {
      errorResponse(res, 'الموصل غير موجود أو تم حذفه مسبقاً', 404);
      return;
    }

    // التحقق من الصلاحية على شركة السائق
    if (req.user?.systemRole !== SystemRole.SYSTEM_ADMIN) {
      const membership = await prisma.companyMembership.findUnique({
        where: {
          userId_companyId: {
            userId: req.user!.id,
            companyId: driver.companyId,
          },
        },
      });

      if (!membership || !membership.isActive) {
        errorResponse(res, 'ليس لديك صلاحية لتعديل حالة موصل في هذه الشركة', 403);
        return;
      }
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: { isActive: !driver.isActive },
    });

    await recordAuditLog({
      req,
      companyId: driver.companyId,
      action: updated.isActive ? 'ACTIVATE_DRIVER' : 'DEACTIVATE_DRIVER',
      entity: 'Driver',
      entityId: driverId,
    });

    successResponse(res, updated, updated.isActive ? 'تم تفعيل حساب السائق' : 'تم تعطيل حساب السائق');
  } catch (err) {
    next(err);
  }
}

export async function deleteDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        _count: { select: { trips: true } },
      },
    });

    if (!driver || driver.isDeleted) {
      errorResponse(res, 'الموصل غير موجود أو تم حذفه مسبقاً', 404);
      return;
    }

    // التحقق من الصلاحية على شركة السائق
    if (req.user?.systemRole !== SystemRole.SYSTEM_ADMIN) {
      const membership = await prisma.companyMembership.findUnique({
        where: {
          userId_companyId: {
            userId: req.user!.id,
            companyId: driver.companyId,
          },
        },
      });

      if (!membership || !membership.isActive) {
        errorResponse(res, 'ليس لديك صلاحية لحذف موصل في هذه الشركة', 403);
        return;
      }
    }

    // إذا كان للسائق رحلات تاريخية سابقة، نمنع الحذف الصلب ونستخدم الحذف المنطقي حفاظاً على السجلات المحاسبية والتقارير
    if (driver._count.trips > 0) {
      await prisma.driver.update({
        where: { id: driverId },
        data: {
          isActive: false,
          isDeleted: true,
        },
      });

      await recordAuditLog({
        req,
        companyId: driver.companyId,
        action: 'SOFT_DELETE_DRIVER',
        entity: 'Driver',
        entityId: driverId,
        details: { reason: 'Has historical trips, soft deleted' },
      });

      successResponse(res, null, 'تم تعطيل وأرشفة السائق بنجاح حفاظاً على دقة السجلات المحاسبية التاريخية');
      return;
    }

    // إذا لم تكن هناك رحلات، يمكن الحذف النهائي
    await prisma.driver.delete({
      where: { id: driverId },
    });

    await recordAuditLog({
      req,
      companyId: driver.companyId,
      action: 'HARD_DELETE_DRIVER',
      entity: 'Driver',
      entityId: driverId,
    });

    successResponse(res, null, 'تم حذف السائق بنجاح');
  } catch (err) {
    next(err);
  }
}
