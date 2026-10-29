import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { createPaymentSchema } from './payments.validator.js';
import { Prisma } from '@prisma/client';

export async function createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const data = createPaymentSchema.parse(req.body);

    // التحقق من مفتاح منع التكرار Idempotency Key
    if (data.idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existingPayment) {
        successResponse(res, existingPayment, 'تم تسجيل الدفعة مسبقاً (Idempotent replay)');
        return;
      }
    }

    // التحقق من أن المشوار يتبع نفس الشركة
    const trip = await prisma.trip.findFirst({
      where: { id: data.tripId, companyId },
      include: { payments: true },
    });

    if (!trip) {
      errorResponse(res, 'المشوار غير موجود في هذه الشركة', 404);
      return;
    }

    const cost = Number(trip.cost);
    const existingPaid = trip.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Math.max(0, cost - existingPaid);

    // التحقق من أن المبلغ لا يتجاوز المتبقي
    if (data.amount > remaining) {
      errorResponse(
        res,
        `مبلغ الدفعة (${data.amount} ر.س) يتجاوز المبلغ المتبقي المستحق على المشوار (${remaining} ر.س)`,
        400
      );
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        companyId,
        tripId: data.tripId,
        amount: new Prisma.Decimal(data.amount),
        paymentMethod: data.paymentMethod,
        reference: data.reference || null,
        notes: data.notes || null,
        idempotencyKey: data.idempotencyKey || null,
        recordedById: req.user?.id || null,
      },
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      details: {
        tripNumber: trip.tripNumber,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
      },
    });

    successResponse(res, payment, 'تم تسجيل الدفعة بنجاح', 201);
  } catch (err) {
    next(err);
  }
}

export async function getTripPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { tripId } = req.params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      select: {
        id: true,
        tripNumber: true,
        cost: true,
      },
    });

    if (!trip) {
      errorResponse(res, 'المشوار غير موجود في هذه الشركة', 404);
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { tripId, companyId },
      include: {
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const cost = Number(trip.cost);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingAmount = Math.max(0, cost - totalPaid);

    let paymentStatus = 'UNPAID';
    if (totalPaid >= cost && cost > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    successResponse(res, {
      tripNumber: trip.tripNumber,
      cost,
      totalPaid,
      remainingAmount,
      paymentStatus,
      payments,
    });
  } catch (err) {
    next(err);
  }
}
