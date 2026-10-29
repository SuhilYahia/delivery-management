import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { updateDeliveryStatusSchema } from './deliveries.validator.js';

export async function updateDeliveryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { tripId } = req.params;
    const data = updateDeliveryStatusSchema.parse(req.body);

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      include: { delivery: true },
    });

    if (!trip) {
      errorResponse(res, 'المشوار غير موجود في هذه الشركة', 404);
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // إعداد بيانات التحديث مع الحفاظ على البيانات السابقة إذا لم تقدم
    const deliveryPayload: any = {
      status: data.status,
      deliveryNotes: data.deliveryNotes !== undefined ? data.deliveryNotes : trip.delivery?.deliveryNotes,
    };

    if (data.status === 'DELIVERED') {
      deliveryPayload.actualDeliveryDate = data.actualDeliveryDate
        ? new Date(data.actualDeliveryDate)
        : trip.delivery?.actualDeliveryDate || new Date(todayStr);
      deliveryPayload.actualDeliveryTime = data.actualDeliveryTime || trip.delivery?.actualDeliveryTime || timeStr;
      deliveryPayload.recipientName = data.recipientName ?? trip.delivery?.recipientName;
    } else if (data.status === 'PENDING') {
      deliveryPayload.pendingReason = data.pendingReason ?? trip.delivery?.pendingReason;
      deliveryPayload.nextDeliveryDate = data.nextDeliveryDate ? new Date(data.nextDeliveryDate) : trip.delivery?.nextDeliveryDate;
    } else if (data.status === 'FAILED') {
      deliveryPayload.failureReason = data.failureReason ?? trip.delivery?.failureReason;
    } else if (data.status === 'RETURNED') {
      deliveryPayload.returnDate = data.returnDate ? new Date(data.returnDate) : trip.delivery?.returnDate || new Date(todayStr);
      deliveryPayload.returnReason = data.returnReason ?? trip.delivery?.returnReason;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. تحديث أو إنشاء سجل التوصيل
      const delivery = await tx.delivery.upsert({
        where: { tripId },
        create: {
          tripId,
          ...deliveryPayload,
        },
        update: deliveryPayload,
      });

      // 2. تحديث حالة المشوار تلقائياً إذا تم التسليم وكان المشوار جديداً
      if (data.status === 'DELIVERED' && trip.status === 'NEW') {
        await tx.trip.update({
          where: { id: tripId },
          data: { status: 'COMPLETED' },
        });
      }

      return delivery;
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'UPDATE_DELIVERY_STATUS',
      entity: 'Delivery',
      entityId: updated.id,
      details: {
        tripNumber: trip.tripNumber,
        newStatus: data.status,
        recipientName: data.recipientName,
      },
    });

    successResponse(res, updated, 'تم تحديث حالة استلام الطلب بنجاح');
  } catch (err) {
    next(err);
  }
}
