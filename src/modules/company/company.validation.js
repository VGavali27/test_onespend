import Joi from 'joi'; // Schema for creating a company — group_uuid is required, most other fields are optional
export const createCompanySchema = Joi.object({
  group_uuid: Joi.string()
    .uuid()
    .required()
    .messages({ 'string.guid': 'Group UUID must be a valid UUID', 'any.required': 'Group UUID is required' }),
  name: Joi.string().max(150).required().messages({
    'string.empty': 'Company name is required',
    'string.max': 'Company name must be at most 150 characters',
  }),
  code: Joi.string().max(30).required().messages({
    'string.empty': 'Company code is required',
    'string.max': 'Company code must be at most 30 characters',
  }),
  logo_img: Joi.string().allow(null, ''),
  email: Joi.string().email().allow(null, '').messages({ 'string.email': 'Must be a valid email' }),
  phone: Joi.string().allow(null, ''),
  website: Joi.string()
    .uri()
    .required()
    .messages({ 'string.empty': 'Website is required', 'string.uri': 'Website must be a valid URL' }),
  gst_number: Joi.string().allow(null, ''),
  pan_number: Joi.string().allow(null, ''),
  cin_number: Joi.string().allow(null, ''),
  address_line_1: Joi.string().allow(null, ''),
  address_line_2: Joi.string().allow(null, ''),
  city: Joi.string().allow(null, ''),
  state: Joi.string().allow(null, ''),
  country: Joi.string().allow(null, ''),
  pincode: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
});

// Schema for updating a company — all fields optional, at least one required
export const updateCompanySchema = Joi.object({
  group_uuid: Joi.string().uuid().messages({ 'string.guid': 'Group UUID must be a valid UUID' }),
  name: Joi.string().max(150).messages({ 'string.max': 'Company name must be at most 150 characters' }),
  code: Joi.string().max(30),
  logo_img: Joi.string().allow(null, ''),
  email: Joi.string().email().allow(null, '').messages({ 'string.email': 'Must be a valid email' }),
  phone: Joi.string().allow(null, ''),
  website: Joi.string().uri().allow(null, ''),
  gst_number: Joi.string().allow(null, ''),
  pan_number: Joi.string().allow(null, ''),
  cin_number: Joi.string().allow(null, ''),
  address_line_1: Joi.string().allow(null, ''),
  address_line_2: Joi.string().allow(null, ''),
  city: Joi.string().allow(null, ''),
  state: Joi.string().allow(null, ''),
  country: Joi.string().allow(null, ''),
  pincode: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });