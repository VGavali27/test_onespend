import { Router } from 'express';

import * as travelLocalTransportController from './travel_local_transport.controller.js';

import validate from '../../middleware/validate.js';

import { createLocalTransportSchema, updateLocalTransportSchema } from './travel_local_transport.validation.js';

const router = Router();

// List all local transports
router.get('/', travelLocalTransportController.getAll);

// Get a single local transport by UUID
router.get('/:uuid', travelLocalTransportController.getByUuid);

// Create a new local transport (validate body first)
router.post('/', validate(createLocalTransportSchema), travelLocalTransportController.create);

// Update an existing local transport by UUID (validate body first)
router.put('/:uuid', validate(updateLocalTransportSchema), travelLocalTransportController.update);

// Soft delete a local transport by UUID
router.delete('/:uuid', travelLocalTransportController.deleteRecord);

export default router;
