import { Router } from 'express';
import * as travelSegmentController from './travel_segment.controller.js';
import validate from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createSegmentSchema, updateSegmentSchema } from './travel_segment.validation.js';

const router = Router();
router.use(authMiddleware);


// List all segments
router.get('/', travelSegmentController.getAll);

// Get a single segment by UUID
router.get('/:uuid', travelSegmentController.getByUuid);

// Create a new segment (validate body first)
router.post('/', validate(createSegmentSchema), travelSegmentController.create);

// Update an existing segment by UUID (validate body first)
router.put('/:uuid', validate(updateSegmentSchema), travelSegmentController.update);

// Soft delete a segment by UUID
router.delete('/:uuid', travelSegmentController.deleteRecord);

export default router;
