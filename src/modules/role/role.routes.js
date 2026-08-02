import { Router } from 'express';
import * as roleController from './role.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { createRoleSchema, updateRoleSchema } from './role.validation.js';
const router = Router();
router.use(authMiddleware);
router.use(requireRole('SUPER_ADMIN'));
// List all roles
router.get('/', roleController.getAllRoles);
// Lightweight role options for dropdowns (must precede /:uuid)
router.get('/options', roleController.getRoleOptions);
// Get a single role by UUID
router.get('/:uuid', roleController.getRoleByUuid);
// Create a new role (validate body first)
router.post('/', validate(createRoleSchema), roleController.createRole);
// Update an existing role by UUID (validate body first)
router.put('/:uuid', validate(updateRoleSchema), roleController.updateRole);
// Soft delete a role by UUID
router.delete('/:uuid', roleController.deleteRole);
export default router;
