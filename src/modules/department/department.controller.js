import * as departmentService from './department.service.js';
import ApiResponse from '../../utils/apiResponse.js';
// Fetch all departments
export const getAllDepartments = async (_req, res, next) => {
  try {
    const departments = await departmentService.getAll();
    return ApiResponse.success(res, departments, 'Departments fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Lightweight department options for dropdowns
export const getDepartmentOptions = async (_req, res, next) => {
  try {
    const options = await departmentService.getOptions();
    return ApiResponse.success(res, options, 'Department options fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single department by UUID
export const getDepartmentByUuid = async (req, res, next) => {
  try {
    const department = await departmentService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, department, 'Department fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new department
export const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.create(req.body);
    return ApiResponse.created(res, department, 'Department created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing department by UUID
export const updateDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, department, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a department by UUID
export const deleteDepartment = async (req, res, next) => {
  try {
    const result = await departmentService.delete(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
