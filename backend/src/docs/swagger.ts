export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'نظام المجد لإدارة التوصيل | Al Majd Delivery Management System API',
    version: '2.0.0',
    description: 'واجهات برمجة التطبيقات الرسمية (REST API) لإدارة الرحلات والموصلين والشركات والتقارير والذكاء الاصطناعي.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'خادم التطوير المحلي الإصدار 1',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      CompanyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Company-Id',
        description: 'معرف الشركة النشطة المطلوب استعلام بياناتها',
      },
    },
  },
  security: [
    { BearerAuth: [] },
    { CompanyHeader: [] },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['المصادقة (Auth)'],
        summary: 'تسجيل الدخول',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@almajd.sa' },
                  password: { type: 'string', example: 'Admin@123456' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'نجاح تسجيل الدخول' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['المصادقة (Auth)'],
        summary: 'معلومات المستخدم الحالي والشركات المصرح بها',
        responses: { 200: { description: 'نجاح جلب البيانات' } },
      },
    },
    '/companies': {
      get: {
        tags: ['الشركات (Companies)'],
        summary: 'قائمة الشركات المتاحة للمستخدم',
        responses: { 200: { description: 'قائمة الشركات' } },
      },
      post: {
        tags: ['الشركات (Companies)'],
        summary: 'تسجيل شركة جديدة',
        responses: { 201: { description: 'تم إنشاء الشركة بنجاح' } },
      },
    },
    '/drivers': {
      get: {
        tags: ['السائقون (Drivers)'],
        summary: 'قائمة السائقين التابعين للشركة النشطة مع إحصائياتهم',
        responses: { 200: { description: 'قائمة السائقين' } },
      },
      post: {
        tags: ['السائقون (Drivers)'],
        summary: 'إضافة سائق جديد للشركة النشطة',
        responses: { 201: { description: 'تمت إضافة السائق' } },
      },
    },
    '/trips': {
      get: {
        tags: ['الرحلات والمشاوير (Trips)'],
        summary: 'قائمة المشاوير مع التصفية والبحث والترقيم',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'driverId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'deliveryStatus', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'قائمة المشاوير' } },
      },
      post: {
        tags: ['الرحلات والمشاوير (Trips)'],
        summary: 'تسجيل مشوار جديد مع الاحتساب الآلي للتكلفة',
        responses: { 201: { description: 'تم تسجيل المشوار' } },
      },
    },
    '/deliveries/{tripId}/status': {
      patch: {
        tags: ['حالة التوصيل (Deliveries)'],
        summary: 'تحديث حالة استلام الطلب وتوثيق الوقت الفعلي واسم المستلم أو سبب التعذر',
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'تم تحديث حالة الاستلام' } },
      },
    },
    '/payments': {
      post: {
        tags: ['المدفوعات (Payments)'],
        summary: 'تسجيل دفعة مالية مع منع التكرار والتحقق من المتبقي',
        responses: { 201: { description: 'تم تسجيل الدفعة' } },
      },
    },
    '/pricing': {
      get: {
        tags: ['التسعير (Pricing)'],
        summary: 'عرض قواعد تسعير الشركة النشطة',
        responses: { 200: { description: 'قواعد التسعير' } },
      },
      put: {
        tags: ['التسعير (Pricing)'],
        summary: 'تعديل قواعد تسعير الشركة للمشاوير القادمة',
        responses: { 200: { description: 'تم تحديث قواعد التسعير' } },
      },
    },
    '/reports/dashboard': {
      get: {
        tags: ['التقارير (Reports)'],
        summary: 'مؤشرات لوحة التحكم الرئيسية والرسوم البيانية',
        responses: { 200: { description: 'بيانات لوحة التحكم' } },
      },
    },
    '/reports/data': {
      get: {
        tags: ['التقارير (Reports)'],
        summary: 'تقرير تفصيلي شامل يدعم الفلاتر الزمنية ومقارنة السائقين',
        responses: { 200: { description: 'بيانات التقرير' } },
      },
    },
    '/ai/chat': {
      post: {
        tags: ['المساعد الذكي (AI)'],
        summary: 'طرح استفسارات بالعربية باستخدام Function Calling وقاعدة البيانات',
        responses: { 200: { description: 'إجابة المساعد الذكي' } },
      },
    },
  },
};
