import forexService from './travel_forex.service.js';

import ApiResponse from '../../utils/apiResponse.js';

// Fetch all forex entries
export const getAll = async (_req, res, next) => {
  try {
    const data = await forexService.getAll();
    return ApiResponse.success(res, data, 'Forex entries fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single forex entry by UUID
export const getByUuid = async (req, res, next) => {
  try {
    const data = await forexService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, data, 'Forex entry fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new forex entry
export const create = async (req, res, next) => {
  try {
    const data = await forexService.create(req.body);
    return ApiResponse.created(res, data, 'Forex entry created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing forex entry by UUID
export const update = async (req, res, next) => {
  try {
    const data = await forexService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, data, 'Forex entry updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a forex entry by UUID
export const deleteRecord = async (req, res, next) => {
  try {
    const result = await forexService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
