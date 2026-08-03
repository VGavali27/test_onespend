import * as groupRepository from './group.repository.js';
import ApiResponse from '../../utils/apiResponse.js';

// Fetch all groups
export const getGroups = async (_req, res, next) => {
  try {
    const groups = await groupRepository.findAll();
    return ApiResponse.success(res, groups, 'Groups fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Lightweight group options for dropdowns
export const getGroupOptions = async (_req, res, next) => {
  try {
    const options = await groupRepository.findOptions();
    return ApiResponse.success(res, options, 'Group options fetched successfully');
  } catch (error) {
    next(error);
  }
};