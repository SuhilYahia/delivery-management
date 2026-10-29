import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  toggleCompanyStatus,
  deleteCompany,
} from './companies.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireCompanyScope } from '../../middleware/companyScope.js';
import { requireCompanyRole, requireSystemAdmin } from '../../middleware/roleGuard.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getCompanies);
router.post('/', createCompany);

router.get('/:companyId', requireCompanyScope, getCompanyById);
router.put('/:companyId', requireCompanyScope, requireCompanyRole(CompanyRole.COMPANY_ADMIN), updateCompany);
router.patch('/:companyId/status', requireCompanyScope, requireCompanyRole(CompanyRole.COMPANY_ADMIN), toggleCompanyStatus);
router.delete('/:companyId', requireCompanyScope, requireCompanyRole(CompanyRole.COMPANY_ADMIN), deleteCompany);

export default router;
