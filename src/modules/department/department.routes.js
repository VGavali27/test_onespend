import { Router } from 'express';
import * as departmentController from './department.controller.js';
import validate from '../../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from './department.validation.js';
const router = Router();
// List all departments
router.get('/', departmentController.getAllDepartments);
// Get a single department by UUID
router.get('/:uuid', departmentController.getDepartmentByUuid);
// Create a new department (validate body first)
router.post('/', validate(createDepartmentSchema), departmentController.createDepartment);
// Update an existing department by UUID (validate body first)
router.put('/:uuid', validate(updateDepartmentSchema), departmentController.updateDepartment);
// Soft delete a department by UUID
router.delete('/:uuid', departmentController.deleteDepartment);
export default router;
