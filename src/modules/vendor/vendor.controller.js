import * as vendorService from './vendor.service.js';
import ApiResponse from '../../utils/apiResponse.js';

export const getAllVendors = async (_req, res, next) => {
  try {
    const vendors = await vendorService.getAll();
    return ApiResponse.success(res, vendors, 'Vendors fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getVendorOptions = async (_req, res, next) => {
  try {
    const options = await vendorService.getOptions();
    return ApiResponse.success(res, options, 'Vendor options fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getVendorByUuid = async (req, res, next) => {
  try {
    const vendor = await vendorService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, vendor, 'Vendor fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.create(req.body);
    return ApiResponse.created(res, vendor, 'Vendor created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, vendor, 'Vendor updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteVendor = async (req, res, next) => {
  try {
    const result = await vendorService.deleteRecord(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

// ── Vendor documents ──

export const addVendorDocument = async (req, res, next) => {
  try {
    const doc = await vendorService.addDocument(req.body);
    return ApiResponse.created(res, doc, 'Document added successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteVendorDocument = async (req, res, next) => {
  try {
    const result = await vendorService.deleteDocument(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
