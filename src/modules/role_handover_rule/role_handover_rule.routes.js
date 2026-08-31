import { Router } from 'express';
import * as roleHandoverRuleController from './role_handover_rule.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requirePermission } from '../../middleware/auth.js';
import { createRuleSchema, updateRuleSchema, syncRulesSchema } from './role_handover_rule.validation.js';

const router = Router();
router.use(authMiddleware);
// List all rules (optional ?module= filter)
router.get('/', requirePermission('role_handover_rules:read_all'), roleHandoverRuleController.getAllRules);
// Sync a from-role's rules (must precede /:uuid)
router.put('/sync', requirePermission('role_handover_rules:create'), validate(syncRulesSchema), roleHandoverRuleController.syncRules);
// Get a single rule by UUID
router.get('/:uuid', requirePermission('role_handover_rules:read'), roleHandoverRuleController.getRuleByUuid);
// Create a new rule (validate body first)
router.post('/', requirePermission('role_handover_rules:create'), validate(createRuleSchema), roleHandoverRuleController.createRule);
// Update an existing rule by UUID (validate body first)
router.put('/:uuid', requirePermission('role_handover_rules:update'), validate(updateRuleSchema), roleHandoverRuleController.updateRule);
// Soft delete a rule by UUID
router.delete('/:uuid', requirePermission('role_handover_rules:delete'), roleHandoverRuleController.deleteRule);

export default router;
