import { Router } from 'express';
import * as companyController from './company.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { createCompanySchema, updateCompanySchema } from './company.validation.js';
const router = Router();
router.use(authMiddleware);
// List all companies
router.get('/', companyController.getAllCompanies);
// Lightweight company options for dropdowns (must precede /:uuid)
router.get('/options', companyController.getCompanyOptions);
// Get a single company by UUID
router.get('/:uuid', companyController.getCompanyByUuid);
// Create a new company (validate body first)
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(createCompanySchema), companyController.createCompany);
// Update an existing company by UUID (validate body first)
router.put('/:uuid', requireRole('SUPER_ADMIN', 'ADMIN_MGR'), validate(updateCompanySchema), companyController.updateCompany);
// Soft delete a company by UUID
router.delete('/:uuid', requireRole('SUPER_ADMIN'), companyController.deleteCompany);
export default router;
