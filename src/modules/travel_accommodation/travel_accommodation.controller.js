import * as accommodationService from './travel_accommodation.service.js';

import ApiResponse from '../../utils/apiResponse.js';

// Fetch all accommodations
export const getAll = async (_req, res, next) => {
  try {
    const data = await accommodationService.getAll();
    return ApiResponse.success(res, data, 'Accommodations fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single accommodation by UUID
export const getByUuid = async (req, res, next) => {
  try {
    const data = await accommodationService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, data, 'Accommodation fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new accommodation
export const create = async (req, res, next) => {
  try {
    const data = await accommodationService.create(req.body);
    return ApiResponse.created(res, data, 'Accommodation created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing accommodation by UUID
export const update = async (req, res, next) => {
  try {
    const data = await accommodationService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, data, 'Accommodation updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete an accommodation by UUID
export const deleteRecord = async (req, res, next) => {
  try {
    const result = await accommodationService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
