import * as companyService from './company.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Fetch all companies
export const getAllCompanies = async (_req, res, next) => {
  try {
    const companies = await companyService.getAll();
    return ApiResponse.success(res, companies, 'Companies fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single company by UUID
export const getCompanyByUuid = async (req, res, next) => {
  try {
    const company = await companyService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, company, 'Company fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new company
export const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.create(req.body);
    return ApiResponse.created(res, company, 'Company created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing company by UUID
export const updateCompany = async (req, res, next) => {
  try {
    const company = await companyService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, company, 'Company updated successfully');
  } catch (error) {
    next(error);
  }
};

// Soft delete a company by UUID
export const deleteCompany = async (req, res, next) => {
  try {
    const result = await companyService.deleteRecord(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
