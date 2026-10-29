import { PrismaClient, SystemRole, CompanyRole, TripStatus, DeliveryStatus, PaymentMethod, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getRelativeDate(daysAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d;
}

function getRelativeDateStr(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log('🌱 بدء إدخال البيانات التجريبية الأولية...');

  // تنظيف الجداول القديمة بترتيب العلاقات
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.companyMembership.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // 1. إنشاء المستخدمين
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const staffPasswordHash = await bcrypt.hash('Staff@123456', salt);

  const adminUser = await prisma.user.create({
    data: {
      name: 'عبدالرحمن الماجد (مدير عام)',
      email: 'admin@almajd.sa',
      passwordHash: adminPasswordHash,
      systemRole: SystemRole.SYSTEM_ADMIN,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: 'عبدالله السبيعي (موظف تشغيل)',
      email: 'staff@almajd.sa',
      passwordHash: staffPasswordHash,
      systemRole: SystemRole.USER,
    },
  });

  const ofokAdmin = await prisma.user.create({
    data: {
      name: 'خالد السعيد (مدير أفق الأثاث)',
      email: 'ofok.admin@decor.sa',
      passwordHash: adminPasswordHash,
      systemRole: SystemRole.USER,
    },
  });

  // 2. إنشاء الشركات
  const company1 = await prisma.company.create({
    data: {
      name: 'المجد هوم للمفروشات',
      managerName: 'عبدالرحمن الماجد',
      phone: '0501234567',
      email: 'info@almajdhome.com',
      crNumber: '1010789456',
      taxNumber: '310123456700003',
      city: 'الرياض',
      address: 'شارع الملك فهد - حي العليا',
      defaultCurrency: 'SAR',
      isActive: true,
      pricingRules: {
        create: {
          tier1MaxMinutes: 19,
          tier1Price: new Prisma.Decimal(20.00),
          tier2MaxMinutes: 29,
          tier2Price: new Prisma.Decimal(30.00),
          tier3MaxMinutes: 60,
          tier3Price: new Prisma.Decimal(50.00),
          extraHourRate: new Prisma.Decimal(50.00),
          isActive: true,
        },
      },
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'أفق الأثاث والديكور العصري',
      managerName: 'خالد السعيد',
      phone: '0559876543',
      email: 'contact@ofokdecor.sa',
      crNumber: '1010321654',
      taxNumber: '310987654300003',
      city: 'جدة',
      address: 'طريق الكورنيش - حي الشاطئ',
      defaultCurrency: 'SAR',
      isActive: true,
      pricingRules: {
        create: {
          tier1MaxMinutes: 19,
          tier1Price: new Prisma.Decimal(25.00),
          tier2MaxMinutes: 29,
          tier2Price: new Prisma.Decimal(35.00),
          tier3MaxMinutes: 60,
          tier3Price: new Prisma.Decimal(60.00),
          extraHourRate: new Prisma.Decimal(60.00),
          isActive: true,
        },
      },
    },
  });

  // 3. ربط العضويات
  await prisma.companyMembership.createMany({
    data: [
      { userId: adminUser.id, companyId: company1.id, role: CompanyRole.COMPANY_ADMIN },
      { userId: adminUser.id, companyId: company2.id, role: CompanyRole.COMPANY_ADMIN },
      { userId: staffUser.id, companyId: company1.id, role: CompanyRole.STAFF },
      { userId: ofokAdmin.id, companyId: company2.id, role: CompanyRole.COMPANY_ADMIN },
    ],
  });

  // 4. إنشاء سائقي شركة المجد هوم
  const driver1 = await prisma.driver.create({
    data: {
      companyId: company1.id,
      name: 'سالم الدوسري',
      phone: '0503344551',
      vehicleType: 'دينا نقل مفروشات مغلقة',
      isActive: true,
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      companyId: company1.id,
      name: 'فهد العتيبي',
      phone: '0547788992',
      vehicleType: 'فان نقل بضائع سريع',
      isActive: true,
    },
  });

  const driver3 = await prisma.driver.create({
    data: {
      companyId: company1.id,
      name: 'أحمد الغامدي',
      phone: '0561122334',
      vehicleType: 'شاحنة دينا شاسيه طويل',
      isActive: true,
    },
  });

  const driver4 = await prisma.driver.create({
    data: {
      companyId: company1.id,
      name: 'طارق الشمري',
      phone: '0538899001',
      vehicleType: 'وانيت غمارتين',
      isActive: false, // سائق معطل للاختبار
    },
  });

  // سائقو شركة أفق الأثاث
  const driverOfok1 = await prisma.driver.create({
    data: {
      companyId: company2.id,
      name: 'عمر القحطاني',
      phone: '0551122445',
      vehicleType: 'شاحنة مرسيدس مقفلة',
      isActive: true,
    },
  });

  const driverOfok2 = await prisma.driver.create({
    data: {
      companyId: company2.id,
      name: 'ياسر الحربي',
      phone: '0594455667',
      vehicleType: 'هايلوكس نقل ديكورات',
      isActive: true,
    },
  });

  const pricingSnapshotC1 = {
    tier1MaxMinutes: 19,
    tier1Price: 20,
    tier2MaxMinutes: 29,
    tier2Price: 30,
    tier3MaxMinutes: 60,
    tier3Price: 50,
    extraHourRate: 50,
  };

  // 5. إنشاء رحلات شركة المجد هوم للمفروشات
  // رحلة 1: اليوم - تم التسليم (45 دقيقة -> 50 ر.س)
  const trip1 = await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1001',
      companyId: company1.id,
      driverId: driver1.id,
      orderNumber: 'ORD-9841',
      customerName: 'سليمان بن ناصر المعجل',
      customerPhone: '0505123456',
      deliveryAddress: 'الرياض - حي النرجس، شارع أنس بن مالك',
      tripDate: getRelativeDate(0),
      tripTime: '10:30',
      durationMinutes: 45,
      cost: new Prisma.Decimal(50.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.DELIVERED,
          actualDeliveryDate: getRelativeDate(0),
          actualDeliveryTime: '11:15',
          recipientName: 'سليمان المعجل (شخصياً)',
          deliveryNotes: 'تم تسليم طقم كنب مجلس مع فحص سلامة القماش',
        },
      },
      payments: {
        create: {
          companyId: company1.id,
          amount: new Prisma.Decimal(50.00),
          paymentMethod: PaymentMethod.CASH,
          recordedById: adminUser.id,
          notes: 'مدفوع نقداً عند الاستلام',
        },
      },
    },
  });

  // رحلة 2: اليوم - قيد التنفيذ (75 دقيقة -> 100 ر.س)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1002',
      companyId: company1.id,
      driverId: driver2.id,
      orderNumber: 'ORD-9842',
      customerName: 'د. خالد الزهراني',
      customerPhone: '0544332211',
      deliveryAddress: 'الرياض - حي حطين، مجمع الفلل السكنية',
      tripDate: getRelativeDate(0),
      tripTime: '14:00',
      durationMinutes: 75,
      cost: new Prisma.Decimal(100.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.IN_PROGRESS,
      delivery: {
        create: {
          status: DeliveryStatus.PENDING,
          pendingReason: 'الطلب في الطريق إلى العميل حالياً',
        },
      },
      payments: {
        create: {
          companyId: company1.id,
          amount: new Prisma.Decimal(100.00),
          paymentMethod: PaymentMethod.CARD,
          recordedById: staffUser.id,
          notes: 'مدفوع مقدماً عبر البطاقة',
        },
      },
    },
  });

  // رحلة 3: أمس - تم التسليم (15 دقيقة -> 20 ر.س)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1003',
      companyId: company1.id,
      driverId: driver3.id,
      orderNumber: 'ORD-9830',
      customerName: 'م. عبدالله الشهري',
      customerPhone: '0567788990',
      deliveryAddress: 'الرياض - حي الياسمين، فيلا 14',
      tripDate: getRelativeDate(1),
      tripTime: '16:15',
      durationMinutes: 15,
      cost: new Prisma.Decimal(20.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.DELIVERED,
          actualDeliveryDate: getRelativeDate(1),
          actualDeliveryTime: '16:30',
          recipientName: 'الحارس أحمد',
          deliveryNotes: 'استلم المشتريات وأكد توقيع الإشعار',
        },
      },
      payments: {
        create: {
          companyId: company1.id,
          amount: new Prisma.Decimal(20.00),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          recordedById: staffUser.id,
        },
      },
    },
  });

  // رحلة 4: أمس - لم يتم التسليم (25 دقيقة -> 30 ر.س، غير مدفوع)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1004',
      companyId: company1.id,
      driverId: driver1.id,
      orderNumber: 'ORD-9831',
      customerName: 'نورة بنت سعود',
      customerPhone: '0551239874',
      deliveryAddress: 'الرياض - حي الملقا',
      tripDate: getRelativeDate(1),
      tripTime: '18:00',
      durationMinutes: 25,
      cost: new Prisma.Decimal(30.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.IN_PROGRESS,
      delivery: {
        create: {
          status: DeliveryStatus.PENDING,
          pendingReason: 'العميل لم يرد',
          nextDeliveryDate: getRelativeDate(-1),
          deliveryNotes: 'تم التواصل واتساب وتم الاتفاق على موعد غداً',
        },
      },
    },
  });

  // رحلة 5: قبل 3 أيام - تعذر التسليم (40 دقيقة -> 50 ر.س)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1005',
      companyId: company1.id,
      driverId: driver2.id,
      orderNumber: 'ORD-9820',
      customerName: 'تركي العثمان',
      customerPhone: '0533322110',
      deliveryAddress: 'الرياض - حي الرمال',
      tripDate: getRelativeDate(3),
      tripTime: '12:00',
      durationMinutes: 40,
      cost: new Prisma.Decimal(50.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.FAILED,
          failureReason: 'العنوان غير صحيح والعميل مغلق هاتفه',
          deliveryNotes: 'وصل السائق للموقع ولم يجد المبنى المذكور',
        },
      },
    },
  });

  // رحلة 6: قبل 4 أيام - تم إرجاع الطلب (125 دقيقة -> 150 ر.س)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1006',
      companyId: company1.id,
      driverId: driver3.id,
      orderNumber: 'ORD-9815',
      customerName: 'سارة التميمي',
      customerPhone: '0509988776',
      deliveryAddress: 'الخرج - حي الخالدية',
      tripDate: getRelativeDate(4),
      tripTime: '09:00',
      durationMinutes: 125,
      cost: new Prisma.Decimal(150.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.RETURNED,
          returnDate: getRelativeDate(4),
          returnReason: 'العميل رفض الاستلام بسبب المقاس غير مناسب للغرفة',
          deliveryNotes: 'تمت إعادة البضاعة لمستودع المجد المركزي بحالة سليمة',
        },
      },
      payments: {
        create: {
          companyId: company1.id,
          amount: new Prisma.Decimal(150.00),
          paymentMethod: PaymentMethod.CASH,
          recordedById: staffUser.id,
        },
      },
    },
  });

  // رحلة 7: قبل 5 أيام - مشوار ملغي (20 دقيقة -> 30 ر.س)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1007',
      companyId: company1.id,
      driverId: driver1.id,
      orderNumber: 'ORD-9808',
      customerName: 'بندر الشمري',
      customerPhone: '0541122335',
      deliveryAddress: 'الرياض - حي الصحافة',
      tripDate: getRelativeDate(5),
      tripTime: '15:30',
      durationMinutes: 20,
      cost: new Prisma.Decimal(30.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.CANCELLED,
      cancelReason: 'العميل قام بالإلغاء قبل خروج السائق من المعرض',
      delivery: {
        create: {
          status: DeliveryStatus.PENDING,
          pendingReason: 'المشوار ملغي',
        },
      },
    },
  });

  // رحلة 8: قبل 10 أيام - تم التسليم (185 دقيقة -> 200 ر.س)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1008',
      companyId: company1.id,
      driverId: driver2.id,
      orderNumber: 'ORD-9770',
      customerName: 'فهد بن منصور آل سعود',
      customerPhone: '0500112233',
      deliveryAddress: 'الدرعية - مزرعة خاصة',
      tripDate: getRelativeDate(10),
      tripTime: '11:00',
      durationMinutes: 185,
      cost: new Prisma.Decimal(200.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.DELIVERED,
          actualDeliveryDate: getRelativeDate(10),
          actualDeliveryTime: '14:15',
          recipientName: 'مدير الصيانة أبو راشد',
          deliveryNotes: 'تركيب طقم أثاث حدائق كامل مع تسليم إشعار التركيب',
        },
      },
      payments: {
        create: {
          companyId: company1.id,
          amount: new Prisma.Decimal(200.00),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          recordedById: adminUser.id,
        },
      },
    },
  });

  // رحلة 9: قبل 18 يوماً - تم التسليم مدفوع جزئياً (60 دقيقة -> 50 ر.س، مدفوع 30 ومتبقي 20)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRP-1009',
      companyId: company1.id,
      driverId: driver1.id,
      orderNumber: 'ORD-9720',
      customerName: 'منى القاسم',
      customerPhone: '0533344112',
      deliveryAddress: 'الرياض - حي الغدير',
      tripDate: getRelativeDate(18),
      tripTime: '17:00',
      durationMinutes: 60,
      cost: new Prisma.Decimal(50.00),
      appliedPricingSnapshot: pricingSnapshotC1,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.DELIVERED,
          actualDeliveryDate: getRelativeDate(18),
          actualDeliveryTime: '18:00',
          recipientName: 'منى القاسم',
          deliveryNotes: 'دفعت 30 ريال نقداً ومتبقي 20 ريال',
        },
      },
      payments: {
        create: {
          companyId: company1.id,
          amount: new Prisma.Decimal(30.00),
          paymentMethod: PaymentMethod.CASH,
          recordedById: staffUser.id,
          notes: 'دفعة أولى 30 ر.س نقداً ومتبقي 20 ر.س',
        },
      },
    },
  });

  // 6. إنشاء مشاوير شركة أفق الأثاث والديكور العصري
  const pricingSnapshotC2 = {
    tier1MaxMinutes: 19,
    tier1Price: 25,
    tier2MaxMinutes: 29,
    tier2Price: 35,
    tier3MaxMinutes: 60,
    tier3Price: 60,
    extraHourRate: 60,
  };

  await prisma.trip.create({
    data: {
      tripNumber: 'OFK-2001',
      companyId: company2.id,
      driverId: driverOfok1.id,
      orderNumber: 'OFK-ORD-101',
      customerName: 'ماجد الغامدي',
      customerPhone: '0555667788',
      deliveryAddress: 'جدة - حي الشاطئ، برج اللؤلؤة',
      tripDate: getRelativeDate(0),
      tripTime: '13:00',
      durationMinutes: 40,
      cost: new Prisma.Decimal(60.00),
      appliedPricingSnapshot: pricingSnapshotC2,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.DELIVERED,
          actualDeliveryDate: getRelativeDate(0),
          actualDeliveryTime: '13:45',
          recipientName: 'ماجد الغامدي',
        },
      },
      payments: {
        create: {
          companyId: company2.id,
          amount: new Prisma.Decimal(60.00),
          paymentMethod: PaymentMethod.CARD,
          recordedById: ofokAdmin.id,
        },
      },
    },
  });

  await prisma.trip.create({
    data: {
      tripNumber: 'OFK-2002',
      companyId: company2.id,
      driverId: driverOfok2.id,
      orderNumber: 'OFK-ORD-102',
      customerName: 'فاطمة الصالح',
      customerPhone: '0599881122',
      deliveryAddress: 'جدة - حي الروضة',
      tripDate: getRelativeDate(2),
      tripTime: '15:00',
      durationMinutes: 25,
      cost: new Prisma.Decimal(35.00),
      appliedPricingSnapshot: pricingSnapshotC2,
      status: TripStatus.COMPLETED,
      delivery: {
        create: {
          status: DeliveryStatus.DELIVERED,
          actualDeliveryDate: getRelativeDate(2),
          actualDeliveryTime: '15:28',
          recipientName: 'فاطمة الصالح',
        },
      },
      payments: {
        create: {
          companyId: company2.id,
          amount: new Prisma.Decimal(35.00),
          paymentMethod: PaymentMethod.CASH,
          recordedById: ofokAdmin.id,
        },
      },
    },
  });

  console.log('✅ تم إدخال البيانات التجريبية الأولية بنجاح:');
  console.log('   - 3 مستخدمين (مدير عام، مدير شركة، موظف)');
  console.log('   - شركتان مستقلتان (المجد هوم للمفروشات، أفق الأثاث والديكور)');
  console.log('   - 6 سائقين مع حالات مختلفة');
  console.log('   - 11 رحلة بتكاليف ومدد وتواريخ وحالات تسليم ودفعات متعددة');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إدخال البيانات التجريبية:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
