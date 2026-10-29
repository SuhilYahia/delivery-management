import { Router } from 'express';
import { updateDeliveryStatus } from './deliveries.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';
import { requireCompanyRole } from '../../middleware/roleGuard.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireCompanyScope);

router.patch(
  '/:tripId/status',
  requireCompanyRole(CompanyRole.COMPANY_ADMIN, CompanyRole.STAFF),
  updateDeliveryStatus
);

export default router;
