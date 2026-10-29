import { Router } from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  toggleDriverStatus,
  deleteDriver,
} from './drivers.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';
import { requireCompanyRole } from '../../middleware/roleGuard.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireCompanyScope);

router.get('/', getDrivers);
router.post('/', requireCompanyRole(CompanyRole.COMPANY_ADMIN, CompanyRole.STAFF), createDriver);

router.get('/:driverId', getDriverById);
router.put('/:driverId', requireCompanyRole(CompanyRole.COMPANY_ADMIN, CompanyRole.STAFF), updateDriver);
router.patch('/:driverId/status', requireCompanyRole(CompanyRole.COMPANY_ADMIN, CompanyRole.STAFF), toggleDriverStatus);
router.delete('/:driverId', requireCompanyRole(CompanyRole.COMPANY_ADMIN), deleteDriver);

export default router;
