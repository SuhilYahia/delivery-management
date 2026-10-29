import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';

async function bootstrap() {
  try {
    // اختبار اتصال قاعدة البيانات
    await prisma.$connect();
    console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 خادم نظام المجد يعمل على المنفذ: http://localhost:${env.PORT}`);
      console.log(`📄 توثيق الـ API متاح على: http://localhost:${env.PORT}/api-docs`);
      console.log(`🩺 فحص الحالة: http://localhost:${env.PORT}/health`);
    });

    // إيقاف التشغيل بأمان عند إشارات النظام
    const shutdown = async () => {
      console.log('جارٍ إغلاق الخادم بأمان...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('تم قطع الاتصال بقاعدة البيانات وإغلاق الخادم.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ فشل بدء تشغيل الخادم:', err);
    process.exit(1);
  }
}

bootstrap();
