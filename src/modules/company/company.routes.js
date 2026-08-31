import { Router } from 'express';
import * as companyController from './company.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createCompanySchema, updateCompanySchema } from './company.validation.js';
const router = Router();
router.use(authMiddleware);
// List all companies
router.get('/', requirePermission('companies:read_all'), companyController.getAllCompanies);
// Lightweight company options for dropdowns (must precede /:uuid)
router.get('/options', requirePermission('companies:read'), companyController.getCompanyOptions);
// Get a single company by UUID
router.get('/:uuid', requirePermission('companies:read'), companyController.getCompanyByUuid);
// Create a new company (validate body first)
router.post('/', requirePermission('companies:create'), validate(createCompanySchema), companyController.createCompany);
// Update an existing company by UUID (validate body first)
router.put('/:uuid', requirePermission('companies:update'), validate(updateCompanySchema), companyController.updateCompany);
// Soft delete a company by UUID
router.delete('/:uuid', requirePermission('companies:delete'), companyController.deleteCompany);
export default router;
