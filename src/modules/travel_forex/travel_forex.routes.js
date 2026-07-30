import { Router } from 'express';
import * as travelForexController from './travel_forex.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createForexSchema, updateForexSchema } from './travel_forex.validation.js';

const router = Router();
router.use(authMiddleware);

const router = Router();

// List all forex entries
router.get('/', travelForexController.getAll);

// Get a single forex entry by UUID
router.get('/:uuid', travelForexController.getByUuid);

// Create a new forex entry (validate body first)
router.post('/', validate(createForexSchema), travelForexController.create);

// Update an existing forex entry by UUID (validate body first)
router.put('/:uuid', validate(updateForexSchema), travelForexController.update);

// Soft delete a forex entry by UUID
router.delete('/:uuid', travelForexController.deleteRecord);

export default router;
