import { Router } from 'express';
import * as departmentController from './department.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createDepartmentSchema, updateDepartmentSchema } from './department.validation.js';
const router = Router();
router.use(authMiddleware);
// List all departments
router.get('/', requirePermission('departments:read_all'), departmentController.getAllDepartments);
// Lightweight department options for dropdowns (must precede /:uuid)
router.get('/options', requirePermission('departments:read'), departmentController.getDepartmentOptions);
// Get a single department by UUID
router.get('/:uuid', requirePermission('departments:read'), departmentController.getDepartmentByUuid);
// Create a new department (validate body first)
router.post('/', requirePermission('departments:create'), validate(createDepartmentSchema), departmentController.createDepartment);
// Update an existing department by UUID (validate body first)
router.put('/:uuid', requirePermission('departments:update'), validate(updateDepartmentSchema), departmentController.updateDepartment);
// Soft delete a department by UUID
router.delete('/:uuid', requirePermission('departments:delete'), departmentController.deleteDepartment);
export default router;
