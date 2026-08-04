import Joi from 'joi';

// One line item (mirrors the reimbursement statement: Date / Description / Bill No. / Exps. Type / Total)
export const reimbursementItemSchema = Joi.object({
  expense_date: Joi.date().iso().allow(null, ''),
  description: Joi.string().max(255).required().messages({
    'string.empty': 'Description is required',
    'string.max': 'Description must be at most 255 characters',
  }),
  bill_number: Joi.string().max(100).allow(null, ''),
  expense_type: Joi.string().max(50).allow(null, ''),
  total_amount: Joi.string().required().messages({ 'string.empty': 'Amount is required' }),
});

// Schema for updating a reimbursement — header fields + optional item replacement
export const updateReimbursementSchema = Joi.object({
  advance_amount: Joi.string().allow(null, ''),
  advance_date: Joi.date().iso().allow(null, ''),
  payment_method: Joi.string().max(20),
  remarks: Joi.string().allow(null, ''),
  items: Joi.array().items(reimbursementItemSchema).allow(null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });
