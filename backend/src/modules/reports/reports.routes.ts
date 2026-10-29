import { Router } from 'express';
import { getDashboardOverview, getReportData } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';

const router = Router();

router.use(authenticate);
router.use(requireCompanyScope);

router.get('/dashboard', getDashboardOverview);
router.get('/data', getReportData);

export default router;
