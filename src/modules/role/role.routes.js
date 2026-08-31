import { Router } from 'express';
import * as roleController from './role.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createRoleSchema, updateRoleSchema } from './role.validation.js';
const router = Router();
router.use(authMiddleware);
// List all roles
router.get('/', requirePermission('roles:read_all'), roleController.getAllRoles);
// Lightweight role options for dropdowns (must precede /:uuid)
router.get('/options', requirePermission('roles:read'), roleController.getRoleOptions);
// Get a single role by UUID
router.get('/:uuid', requirePermission('roles:read'), roleController.getRoleByUuid);
// Create a new role (validate body first)
router.post('/', requirePermission('roles:create'), validate(createRoleSchema), roleController.createRole);
// Update an existing role by UUID (validate body first)
router.put('/:uuid', requirePermission('roles:update'), validate(updateRoleSchema), roleController.updateRole);
// Soft delete a role by UUID
router.delete('/:uuid', requirePermission('roles:delete'), roleController.deleteRole);
export default router;
