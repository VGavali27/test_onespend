import Joi from 'joi';

const itemSchema = Joi.object({
  item_name: Joi.string().max(255).required().messages({ 'string.empty': 'Item name is required' }),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(100).allow(null, ''),
  quantity: Joi.number().min(0).allow(null),
  unit: Joi.string().max(20).allow(null, ''),
  unit_price: Joi.number().min(0).allow(null),
  tax_rate: Joi.number().min(0).max(100).allow(null),
});

// Create a PI with line items in one call
export const createProcurementSchema = Joi.object({
  title: Joi.string().max(255).required().messages({ 'string.empty': 'Title is required' }),
  company_uuid: Joi.string().uuid().required().messages({ 'string.guid': 'Company is required' }),
  vendor_uuid: Joi.string().uuid().allow(null, ''),
  vendor_contact: Joi.string().max(150).allow(null, ''),
  delivery_address: Joi.string().allow(null, ''),
  expected_delivery_date: Joi.date().iso().allow(null, ''),
  payment_terms: Joi.string().max(100).allow(null, ''),
  notes: Joi.string().allow(null, ''),
  items: Joi.array().items(itemSchema).allow(null),
});

// Update a draft PI — basic fields + optional line-item replacement
export const updateProcurementSchema = Joi.object({
  title: Joi.string().max(255),
  company_uuid: Joi.string().uuid(),
  vendor_uuid: Joi.string().uuid().allow(null, ''),
  vendor_contact: Joi.string().max(150).allow(null, ''),
  delivery_address: Joi.string().allow(null, ''),
  expected_delivery_date: Joi.date().iso().allow(null, ''),
  payment_terms: Joi.string().max(100).allow(null, ''),
  notes: Joi.string().allow(null, ''),
  items: Joi.array().items(itemSchema).allow(null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

// Workflow actions (submit / approve / reject / pay) carry an optional remark
export const actionSchema = Joi.object({
  remarks: Joi.string().allow(null, ''),
});

// One attached file (uploaded file metadata from POST /uploads)
export const procurementDocumentSchema = Joi.object({
  procurement_uuid: Joi.string().uuid().required().messages({ 'string.guid': 'Procurement UUID must be a valid UUID' }),
  document_type: Joi.string().max(50).allow(null, ''),
  document_number: Joi.string().max(100).allow(null, ''),
  issue_date: Joi.date().iso().allow(null, ''),
  original_file_name: Joi.string().max(255).required(),
  stored_file_name: Joi.string().max(255).required(),
  file_path: Joi.string().required(),
  mime_type: Joi.string().max(100).allow(null, ''),
  file_size: Joi.number().allow(null),
});
