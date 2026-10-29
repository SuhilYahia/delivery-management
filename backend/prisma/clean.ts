import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 بدء تنظيف قاعدة البيانات وتفريغ البيانات التجريبية...');

  // حذف العمليات والمشاوير والمدفوعات
  const deletedLogs = await prisma.auditLog.deleteMany();
  const deletedPayments = await prisma.payment.deleteMany();
  const deletedDeliveries = await prisma.delivery.deleteMany();
  const deletedTrips = await prisma.trip.deleteMany();
  const deletedDrivers = await prisma.driver.deleteMany();

  console.log(`✅ تم تنظيف السجلات بنجاح:`);
  console.log(`   - تم حذف المشاوير: ${deletedTrips.count}`);
  console.log(`   - تم حذف التوصيلات: ${deletedDeliveries.count}`);
  console.log(`   - تم حذف المدفوعات: ${deletedPayments.count}`);
  console.log(`   - تم حذف الموصلين: ${deletedDrivers.count}`);
  console.log(`   - تم حذف سجلات التدقيق: ${deletedLogs.count}`);
  console.log('🎉 قاعدة البيانات الآن نظيفة وجاهزة تماماً لاستقبال بياناتك الحقيقية!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ أثناء تنظيف البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
