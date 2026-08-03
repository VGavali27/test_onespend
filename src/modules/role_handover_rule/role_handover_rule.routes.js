import { Router } from 'express';
import * as roleHandoverRuleController from './role_handover_rule.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware, requireRole } from '../../middleware/auth.js';
import { createRuleSchema, updateRuleSchema, syncRulesSchema } from './role_handover_rule.validation.js';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('SUPER_ADMIN'));
// List all rules (optional ?module= filter)
router.get('/', roleHandoverRuleController.getAllRules);
// Sync a from-role's rules (must precede /:uuid)
router.put('/sync', validate(syncRulesSchema), roleHandoverRuleController.syncRules);
// Get a single rule by UUID
router.get('/:uuid', roleHandoverRuleController.getRuleByUuid);
// Create a new rule (validate body first)
router.post('/', validate(createRuleSchema), roleHandoverRuleController.createRule);
// Update an existing rule by UUID (validate body first)
router.put('/:uuid', validate(updateRuleSchema), roleHandoverRuleController.updateRule);
// Soft delete a rule by UUID
router.delete('/:uuid', roleHandoverRuleController.deleteRule);

export default router;
