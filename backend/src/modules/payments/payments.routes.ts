import { Router } from 'express';
import { createPayment, getTripPayments } from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';
import { requireCompanyRole } from '../../middleware/roleGuard.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireCompanyScope);

router.post('/', requireCompanyRole(CompanyRole.COMPANY_ADMIN, CompanyRole.STAFF), createPayment);
router.get('/trip/:tripId', getTripPayments);

export default router;
