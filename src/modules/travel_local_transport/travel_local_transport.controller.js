import localTransportService from './travel_local_transport.service.js';

import ApiResponse from '../../utils/apiResponse.js';

// Fetch all local transports
export const getAll = async (_req, res, next) => {
  try {
    const data = await localTransportService.getAll();
    return ApiResponse.success(res, data, 'Local transports fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single local transport by UUID
export const getByUuid = async (req, res, next) => {
  try {
    const data = await localTransportService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, data, 'Local transport fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new local transport entry
export const create = async (req, res, next) => {
  try {
    const data = await localTransportService.create(req.body);
    return ApiResponse.created(res, data, 'Local transport created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing local transport by UUID
export const update = async (req, res, next) => {
  try {
    const data = await localTransportService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, data, 'Local transport updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a local transport by UUID
export const deleteRecord = async (req, res, next) => {
  try {
    const result = await localTransportService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
