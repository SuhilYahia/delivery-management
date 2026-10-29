import { Router } from 'express';
import { getCompanyPricing, updateCompanyPricing } from './pricing.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';
import { requireCompanyRole } from '../../middleware/roleGuard.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireCompanyScope);

router.get('/', getCompanyPricing);
router.put('/', requireCompanyRole(CompanyRole.COMPANY_ADMIN), updateCompanyPricing);

export default router;
