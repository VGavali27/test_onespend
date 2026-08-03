import Joi from 'joi';

// Schema for creating a rule — module and both roles are required
export const createRuleSchema = Joi.object({
  module: Joi.string()
    .max(50)
    .required()
    .messages({ 'string.empty': 'Module is required', 'string.max': 'Module must be at most 50 characters' }),
  from_role_uuid: Joi.string()
    .uuid()
    .required()
    .messages({ 'string.guid': 'From role UUID must be a valid UUID', 'any.required': 'From role is required' }),
  to_role_uuid: Joi.string()
    .uuid()
    .required()
    .messages({ 'string.guid': 'To role UUID must be a valid UUID', 'any.required': 'To role is required' }),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
});

// Schema for updating a rule — all fields optional, at least one required
export const updateRuleSchema = Joi.object({
  module: Joi.string().max(50),
  from_role_uuid: Joi.string().uuid(),
  to_role_uuid: Joi.string().uuid(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

// Schema for syncing a from-role's rules — replaces all to-roles with the given set (empty array = remove all)
export const syncRulesSchema = Joi.object({
  module: Joi.string()
    .max(50)
    .required()
    .messages({ 'string.empty': 'Module is required' }),
  from_role_uuid: Joi.string()
    .uuid()
    .required()
    .messages({ 'string.guid': 'From role UUID must be a valid UUID' }),
  to_role_uuids: Joi.array().items(Joi.string().uuid()).required(),
});
