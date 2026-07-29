import Joi from 'joi';
export const createForexSchema = Joi.object({
  travel_expense_uuid: Joi.string().uuid().required(),
  currency_code: Joi.string().max(10).required(),
  exchange_rate: Joi.string().required(),
  estimated_foreign_amount: Joi.string().required(),
  estimated_amount: Joi.string().required(),
  remarks: Joi.string().allow(null, ''),
});
export const updateForexSchema = Joi.object({
  currency_code: Joi.string().max(10),
  exchange_rate: Joi.string(),
  estimated_foreign_amount: Joi.string(),
  final_foreign_amount: Joi.string().allow(null, ''),
  estimated_amount: Joi.string(),
  final_amount: Joi.string().allow(null, ''),
  paid_amount: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  remarks: Joi.string().allow(null, ''),
}).min(1);
