import Joi from 'joi';

// Line items carry no unit/tax at the PI stage — quantity + unit price only.
// Tax is applied at the quotation stage, not on the intent.
const itemSchema = Joi.object({
  item_name: Joi.string().max(255).required().messages({ 'string.empty': 'Item name is required' }),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(100).allow(null, ''),
  quantity: Joi.number().min(0).allow(null),
  unit_price: Joi.number().min(0).allow(null),
});

// Create a PI with line items in one call. NOTE: no vendor — the vendor is only
// introduced later when an admin fills quotations on the PR (the requester must
// not know the vendor).
export const createProcurementSchema = Joi.object({
  title: Joi.string().max(255).required().messages({ 'string.empty': 'Title is required' }),
  company_uuid: Joi.string().uuid().required().messages({ 'string.guid': 'Company is required' }),
  expected_delivery_date: Joi.date().iso().allow(null, ''),
  notes: Joi.string().allow(null, ''),
  items: Joi.array().items(itemSchema).allow(null),
});

// Update a draft PI — basic fields + optional line-item replacement
export const updateProcurementSchema = Joi.object({
  title: Joi.string().max(255),
  company_uuid: Joi.string().uuid(),
  expected_delivery_date: Joi.date().iso().allow(null, ''),
  notes: Joi.string().allow(null, ''),
  items: Joi.array().items(itemSchema).allow(null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

// Workflow actions (submit / approve / reject / pay) carry an optional remark
export const actionSchema = Joi.object({
  remarks: Joi.string().allow(null, ''),
});

// One vendor quotation on a PR (admin fills these; the requester picks one blind).
// Amounts are plain numbers — the service computes + encrypts the stored totals.
export const quotationSchema = Joi.object({
  vendor_uuid: Joi.string().uuid().required().messages({ 'string.guid': 'Vendor is required' }),
  title: Joi.string().max(255).allow(null, ''),
  total_amount: Joi.number().min(0).allow(null),
  tax_amount: Joi.number().min(0).allow(null),
  valid_until: Joi.date().iso().allow(null, ''),
  terms: Joi.string().allow(null, ''),
  notes: Joi.string().allow(null, ''),
});

// Requester picks one quotation (blind — vendor not visible to them)
export const selectQuotationSchema = Joi.object({
  quotation_uuid: Joi.string().uuid().required().messages({ 'string.guid': 'Quotation is required' }),
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
