import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerDocument } from './docs/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';

// استيراد المسارات
import authRoutes from './modules/auth/auth.routes.js';
import companyRoutes from './modules/companies/companies.routes.js';
import driverRoutes from './modules/drivers/drivers.routes.js';
import tripRoutes from './modules/trips/trips.routes.js';
import deliveryRoutes from './modules/deliveries/deliveries.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import pricingRoutes from './modules/pricing/pricing.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import settlementRoutes from './modules/settlements/settlements.routes.js';
import aiRoutes from './ai/ai.routes.js';

export const app = express();

// 1. إجراءات الأمان والحماية
app.use(helmet({
  contentSecurityPolicy: false, // للسماح لـ Swagger UI بالعمل بسلاسة
}));

// إعداد CORS للواجهة الأمامية
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // للتطوير المحلي
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id'],
  })
);

// تحديد معدل الطلبات العام Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 2. معالجة الطلبات
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. فحص الجاهزية (Health Check)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Al Majd Delivery Management Backend',
    version: '2.0.0',
    environment: env.NODE_ENV,
  });
});

// 4. توثيق OpenAPI / Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 5. مسارات الـ API v1
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/companies', companyRoutes);
apiRouter.use('/drivers', driverRoutes);
apiRouter.use('/trips', tripRoutes);
apiRouter.use('/deliveries', deliveryRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/pricing', pricingRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/settlements', settlementRoutes);
apiRouter.use('/ai', aiRoutes);

app.use('/api/v1', apiRouter);

// المسارات غير المعرفة (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار المطلوب ${req.originalUrl} غير موجود`,
  });
});

// 6. المعالج المركزي للأخطاء
app.use(errorHandler);

export default app;
