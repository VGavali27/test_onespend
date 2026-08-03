import * as roleHandoverRuleService from './role_handover_rule.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Fetch all rules — optional ?module= filter
export const getAllRules = async (req, res, next) => {
  try {
    const rules = await roleHandoverRuleService.getAll(req.query.module);
    return ApiResponse.success(res, rules, 'Rules fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Fetch a single rule by UUID
export const getRuleByUuid = async (req, res, next) => {
  try {
    const rule = await roleHandoverRuleService.getByUuid(req.params.uuid);
    return ApiResponse.success(res, rule, 'Rule fetched successfully');
  } catch (error) {
    next(error);
  }
};

// Create a new rule
export const createRule = async (req, res, next) => {
  try {
    const rule = await roleHandoverRuleService.create(req.body);
    return ApiResponse.created(res, rule, 'Rule created successfully');
  } catch (error) {
    next(error);
  }
};

// Update an existing rule by UUID
export const updateRule = async (req, res, next) => {
  try {
    const rule = await roleHandoverRuleService.update(req.params.uuid, req.body);
    return ApiResponse.success(res, rule, 'Rule updated successfully');
  } catch (error) {
    next(error);
  }
};

// Sync a from-role's rules — replaces the to-role set to match the body
export const syncRules = async (req, res, next) => {
  try {
    const result = await roleHandoverRuleService.sync(req.body.module, req.body.from_role_uuid, req.body.to_role_uuids);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

// Soft delete a rule by UUID
export const deleteRule = async (req, res, next) => {
  try {
    const result = await roleHandoverRuleService.deleteRecord(req.params.uuid);
    return ApiResponse.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
