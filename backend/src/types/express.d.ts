import { User, CompanyMembership, CompanyRole, SystemRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        systemRole: SystemRole;
      };
      currentCompanyId?: string;
      currentMembership?: {
        id: string;
        companyId: string;
        role: CompanyRole;
      };
    }
  }
}

export {};
