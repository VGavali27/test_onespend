import { Router } from 'express';
import * as rolePermissionController from './role_permission.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { syncPermissionSchema } from './role_permission.validation.js';
const router = Router();
router.use(authMiddleware);
// Get all permissions assigned to a role (by role UUID)
router.get('/by-role/:roleUuid', requirePermission('role_permissions:read'), rolePermissionController.getPermissionsByRole);
// Sync permissions — replaces all existing with the given set (empty array = remove all)
router.put('/:roleUuid/sync', requirePermission('role_permissions:create'), validate(syncPermissionSchema), rolePermissionController.syncPermissions);
export default router;
