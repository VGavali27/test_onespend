import Joi from 'joi'; // Schema for creating a role — name and code are required
export const createRoleSchema = Joi.object({
  name: Joi.string()
    .max(100)
    .required()
    .messages({ 'string.empty': 'Role name is required', 'string.max': 'Role name must be at most 100 characters' }),
  code: Joi.string()
    .max(50)
    .required()
    .messages({ 'string.empty': 'Role code is required', 'string.max': 'Role code must be at most 50 characters' }),
  description: Joi.string().allow(null, ''),
  level: Joi.number().integer().min(0).max(65535).default(100),
  is_system: Joi.boolean().default(true),
}); // Schema for updating a role — all fields optional, at least one required
export const updateRoleSchema = Joi.object({
  name: Joi.string().max(100).messages({ 'string.max': 'Role name must be at most 100 characters' }),
  code: Joi.string().max(50),
  description: Joi.string().allow(null, ''),
  level: Joi.number().integer().min(0).max(65535),
  is_system: Joi.boolean(),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });
