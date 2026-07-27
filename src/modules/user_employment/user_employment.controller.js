import userEmploymentService from './user_employment.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Fetch all employments
export const getAllEmployments = async (_req, res, next) => {
  try {
    const employments = await userEmploymentService.getAll();
    return ApiResponse.success(res, employments, 'Employments fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch employments for a specific user by user UUID
export const getEmploymentsByUser = async (req, res, next) => {
  try {
    const employments = await userEmploymentService.getByUserUuid(req.params.userUuid);
    return ApiResponse.success(res, employments, 'Employments fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single employment by UUID
export const getEmploymentByUuid = async (req, res, next) => {
  try {
    const employment = await userEmploymentService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, employment, 'Employment fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new employment
export const createEmployment = async (req, res, next) => {
  try {
    const employment = await userEmploymentService.create(req.body);
    return ApiResponse.created(res, employment, 'Employment created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing employment by UUID
export const updateEmployment = async (req, res, next) => {
  try {
    const employment = await userEmploymentService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, employment, 'Employment updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete an employment by UUID
export const deleteEmployment = async (req, res, next) => {
  try {
    const result = await userEmploymentService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
