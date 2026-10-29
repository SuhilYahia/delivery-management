import { Router } from 'express';
import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} from './trips.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';
import { requireCompanyRole } from '../../middleware/roleGuard.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireCompanyScope);

router.get('/', getTrips);
router.post('/', requireCompanyRole(CompanyRole.COMPANY_ADMIN, CompanyRole.STAFF), createTrip);

router.get('/:tripId', getTripById);
router.put('/:tripId', requireCompanyRole(CompanyRole.COMPANY_ADMIN, CompanyRole.STAFF), updateTrip);
router.delete('/:tripId', requireCompanyRole(CompanyRole.COMPANY_ADMIN), deleteTrip);

export default router;
