import { Router } from 'express';
import * as permissionController from './permission.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createPermissionSchema, updatePermissionSchema } from './permission.validation.js';
const router = Router();
router.use(authMiddleware);
// List all permissions
router.get('/', requirePermission('permissions:read_all'), permissionController.getAllPermissions);
// Get a single permission by UUID
router.get('/:uuid', requirePermission('permissions:read'), permissionController.getPermissionByUuid);
// Create a new permission (validate body first)
router.post('/', requirePermission('permissions:create'), validate(createPermissionSchema), permissionController.createPermission);
// Update an existing permission by UUID (validate body first)
router.put('/:uuid', requirePermission('permissions:update'), validate(updatePermissionSchema), permissionController.updatePermission);
// Soft delete a permission by UUID
router.delete('/:uuid', requirePermission('permissions:delete'), permissionController.deletePermission);
export default router;
