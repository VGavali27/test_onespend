import Joi from 'joi';

// Schema for a single employment entry within user creation
const employmentSchema = Joi.object({
  company_uuid: Joi.string().uuid().required().messages({
    'string.guid': 'Company UUID must be a valid UUID',
    'any.required': 'Company UUID is required',
  }),
  employee_code: Joi.string().max(50).required().messages({
    'string.empty': 'Employee code is required',
  }),
  designation: Joi.string().max(150).allow(null, ''),
  employment_type: Joi.string().valid('PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT').required().messages({
    'any.only': 'Employment type must be PERMANENT, CONTRACT, INTERN, or CONSULTANT',
  }),
  joining_date: Joi.date().iso().allow(null, ''),
});

// Schema for creating a user — role_uuid required, employments optional
export const createUserSchema = Joi.object({
  role_uuid: Joi.string().uuid().required().messages({
    'string.guid': 'Role UUID must be a valid UUID',
    'any.required': 'Role UUID is required',
  }),
  department_uuid: Joi.string().uuid().allow(null, '').messages({
    'string.guid': 'Department UUID must be a valid UUID',
  }),
  first_name: Joi.string().max(100).required().messages({
    'string.empty': 'First name is required',
    'string.max': 'First name must be at most 100 characters',
  }),
  middle_name: Joi.string().max(100).allow(null, ''),
  last_name: Joi.string().max(100).allow(null, ''),
  email: Joi.string().email().allow(null, '').messages({
    'string.email': 'Must be a valid email',
  }),
  mobile: Joi.string().max(20).allow(null, ''),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.empty': 'Password is required',
  }),
  profile_image: Joi.string().allow(null, ''),
  employments: Joi.array().items(employmentSchema).min(1).allow(null).messages({
    'array.min': 'At least one employment is required',
  }),
});

// Schema for updating a user — all fields optional, at least one required
export const updateUserSchema = Joi.object({
  role_uuid: Joi.string().uuid().messages({
    'string.guid': 'Role UUID must be a valid UUID',
  }),
  department_uuid: Joi.string().uuid().allow(null, '').messages({
    'string.guid': 'Department UUID must be a valid UUID',
  }),
  first_name: Joi.string().max(100),
  middle_name: Joi.string().max(100).allow(null, ''),
  last_name: Joi.string().max(100).allow(null, ''),
  email: Joi.string().email().allow(null, '').messages({
    'string.email': 'Must be a valid email',
  }),
  mobile: Joi.string().max(20).allow(null, ''),
  password: Joi.string().min(6).max(128),
  profile_image: Joi.string().allow(null, ''),
}).min(1).messages({ 'object.min': 'At least one field is required' });
