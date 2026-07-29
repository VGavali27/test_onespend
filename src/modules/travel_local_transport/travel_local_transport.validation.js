import Joi from 'joi';
export const createLocalTransportSchema = Joi.object({
  travel_expense_uuid: Joi.string().uuid().required(),
  transport_type: Joi.string().max(30).required(),
  from_location: Joi.string().max(255).required(),
  to_location: Joi.string().max(255).required(),
  travel_datetime: Joi.date().iso().required(),
  estimated_amount: Joi.string().required(),
  remarks: Joi.string().allow(null, ''),
});
export const updateLocalTransportSchema = Joi.object({
  transport_type: Joi.string().max(30),
  from_location: Joi.string().max(255),
  to_location: Joi.string().max(255),
  travel_datetime: Joi.date().iso(),
  estimated_amount: Joi.string(),
  final_amount: Joi.string().allow(null, ''),
  paid_amount: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  remarks: Joi.string().allow(null, ''),
}).min(1);
