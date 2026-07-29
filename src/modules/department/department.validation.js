import Joi from 'joi'; // Schema for creating a department — name and code are required
export const createDepartmentSchema = Joi.object({
  name: Joi.string().max(150).required().messages({
    'string.empty': 'Department name is required',
    'string.max': 'Department name must be at most 150 characters',
  }),
  code: Joi.string().max(30).required().messages({
    'string.empty': 'Department code is required',
    'string.max': 'Department code must be at most 30 characters',
  }),
  description: Joi.string().allow(null, ''),
}); // Schema for updating a department — all fields optional, at least one required
export const updateDepartmentSchema = Joi.object({
  name: Joi.string().max(150).messages({ 'string.max': 'Department name must be at most 150 characters' }),
  code: Joi.string().max(30),
  description: Joi.string().allow(null, ''),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });
