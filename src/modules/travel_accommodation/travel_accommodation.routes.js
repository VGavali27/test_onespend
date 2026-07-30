import { Router } from 'express';
import * as travelAccommodationController from './travel_accommodation.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createAccommodationSchema, updateAccommodationSchema } from './travel_accommodation.validation.js';

const router = Router();
router.use(authMiddleware);

const router = Router();

// List all accommodations
router.get('/', travelAccommodationController.getAll);

// Get a single accommodation by UUID
router.get('/:uuid', travelAccommodationController.getByUuid);

// Create a new accommodation (validate body first)
router.post('/', validate(createAccommodationSchema), travelAccommodationController.create);

// Update an existing accommodation by UUID (validate body first)
router.put('/:uuid', validate(updateAccommodationSchema), travelAccommodationController.update);

// Soft delete an accommodation by UUID
router.delete('/:uuid', travelAccommodationController.deleteRecord);

export default router;
