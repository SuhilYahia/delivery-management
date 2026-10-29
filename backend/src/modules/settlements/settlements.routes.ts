import { Router } from 'express';
import {
  settleDriverTrips,
  getDriverStatement,
  getSettlementHistory,
  getDriverDuesReport,
} from './settlements.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';

const router = Router();

router.use(authenticate);
router.use(requireCompanyScope);

// تسجيل تسوية مشاوير لموصل
router.post('/', settleDriverTrips);

// كشف حساب الموصل المالي
router.get('/driver/:driverId/statement', getDriverStatement);

// سجل التسويات السابقة
router.get('/history', getSettlementHistory);

// تقرير مستحقات الموصلين
router.get('/dues-report', getDriverDuesReport);

export default router;
