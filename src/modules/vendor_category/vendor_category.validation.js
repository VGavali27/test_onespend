import Joi from 'joi';

export const createVendorCategorySchema = Joi.object({
  name: Joi.string().max(150).required().messages({ 'string.empty': 'Category name is required' }),
  code: Joi.string().max(50).required().messages({ 'string.empty': 'Category code is required' }),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

export const updateVendorCategorySchema = Joi.object({
  name: Joi.string().max(150),
  code: Joi.string().max(50),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });
