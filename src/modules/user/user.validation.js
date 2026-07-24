import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Must be a valid email',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.empty': 'Password is required',
  }),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Name must be at least 2 characters',
  }),
  email: Joi.string().email().messages({
    'string.email': 'Must be a valid email',
  }),
  password: Joi.string().min(6).max(128).messages({
    'string.min': 'Password must be at least 6 characters',
  }),
}).min(1).messages({ 'object.min': 'At least one field is required' });
