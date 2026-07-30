import { Router } from 'express';
import * as companyController from './company.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createCompanySchema, updateCompanySchema } from './company.validation.js';
const router = Router();
router.use(authMiddleware);
// List all companies
router.get('/', companyController.getAllCompanies);
// Get a single company by UUID
router.get('/:uuid', companyController.getCompanyByUuid);
// Create a new company (validate body first)
router.post('/', validate(createCompanySchema), companyController.createCompany);
// Update an existing company by UUID (validate body first)
router.put('/:uuid', validate(updateCompanySchema), companyController.updateCompany);
// Soft delete a company by UUID
router.delete('/:uuid', companyController.deleteCompany);
export default router;
