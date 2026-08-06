import * as vendorCategoryService from './vendor_category.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export const getAllVendorCategories = async (_req, res, next) => {
  try {
    const categories = await vendorCategoryService.getAll();
    return ApiResponse.success(res, categories, 'Vendor categories fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getVendorCategoryOptions = async (_req, res, next) => {
  try {
    const options = await vendorCategoryService.getOptions();
    return ApiResponse.success(res, options, 'Vendor category options fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getVendorCategoryByUuid = async (req, res, next) => {
  try {
    const category = await vendorCategoryService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, category, 'Vendor category fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const createVendorCategory = async (req, res, next) => {
  try {
    const category = await vendorCategoryService.create(req.body);
    return ApiResponse.created(res, category, 'Vendor category created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateVendorCategory = async (req, res, next) => {
  try {
    const category = await vendorCategoryService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, category, 'Vendor category updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteVendorCategory = async (req, res, next) => {
  try {
    const result = await vendorCategoryService.deleteRecord(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
