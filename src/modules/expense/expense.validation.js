import Joi from 'joi';

// One uploaded attachment (metadata returned by POST /uploads)
const attachmentSchema = Joi.object({
  url: Joi.string().required(),
  original_file_name: Joi.string(),
  file_size: Joi.number(),
  mime_type: Joi.string(),
  file_extension: Joi.string(),
});
const attachmentsField = Joi.array().items(attachmentSchema).allow(null);

// Schema for a segment within a travel expense
const segmentSchema = Joi.object({
  travel_mode: Joi.string().max(30).required(),
  from_location: Joi.string().max(255).required(),
  to_location: Joi.string().max(255).required(),
  departure_datetime: Joi.date().iso().required(),
  arrival_datetime: Joi.date().iso().required(),
  preferred_vendor: Joi.string().max(255).allow(null, ''),
  preferred_number: Joi.string().max(100).allow(null, ''),
  seat_preference: Joi.string().max(50).allow(null, ''),
  meal_preference: Joi.string().max(50).allow(null, ''),
  estimated_amount: Joi.string().required(),
  attachments: attachmentsField,
  remarks: Joi.string().allow(null, ''),
});

// Schema for accommodation
const accommodationSchema = Joi.object({
  accommodation_type: Joi.string().max(50).required(),
  city: Joi.string().max(150).required(),
  property_name: Joi.string().max(255).allow(null, ''),
  property_address: Joi.string().allow(null, ''),
  check_in: Joi.date().iso().required(),
  check_out: Joi.date().iso().required(),
  total_rooms: Joi.number().integer().default(1),
  total_guests: Joi.number().integer().default(1),
  estimated_amount: Joi.string().required(),
  attachments: attachmentsField,
  remarks: Joi.string().allow(null, ''),
});

// Schema for local transport
const localTransportSchema = Joi.object({
  transport_type: Joi.string().max(30).required(),
  from_location: Joi.string().max(255).required(),
  to_location: Joi.string().max(255).required(),
  travel_datetime: Joi.date().iso().required(),
  estimated_amount: Joi.string().required(),
  attachments: attachmentsField,
  remarks: Joi.string().allow(null, ''),
});

// Schema for forex
const forexSchema = Joi.object({
  currency_code: Joi.string().max(10).required(),
  exchange_rate: Joi.string().required(),
  estimated_foreign_amount: Joi.string().required(),
  estimated_amount: Joi.string().required(),
  attachments: attachmentsField,
  remarks: Joi.string().allow(null, ''),
});

// Schema for misc expense
const miscExpenseSchema = Joi.object({
  expense_type: Joi.string().max(100).required(),
  expense_date: Joi.date().iso().required(),
  vendor_name: Joi.string().max(255).allow(null, ''),
  estimated_amount: Joi.string().required(),
  attachments: attachmentsField,
  remarks: Joi.string().allow(null, ''),
});

// One reimbursement line item (Date / Description / Bill No. / Exps. Type / Total)
const reimbursementItemSchema = Joi.object({
  expense_date: Joi.date().iso().allow(null, ''),
  description: Joi.string().max(255).required().messages({
    'string.empty': 'Description is required',
    'string.max': 'Description must be at most 255 characters',
  }),
  bill_number: Joi.string().max(100).allow(null, ''),
  expense_type: Joi.string().max(50).allow(null, ''),
  total_amount: Joi.string().required().messages({ 'string.empty': 'Amount is required' }),
  attachments: attachmentsField,
});

// Schema for travel expense fields (conditionally required when category is travel)
const travelFieldsSchema = Joi.object({
  travel_type: Joi.string().max(30),
  purpose: Joi.string(),
  travel_start_date: Joi.date().iso(),
  travel_end_date: Joi.date().iso(),
  total_travellers: Joi.number().integer().default(1),
  notes: Joi.string().allow(null, ''),
  segments: Joi.array().items(segmentSchema).allow(null),
  accommodations: Joi.array().items(accommodationSchema).allow(null),
  local_transports: Joi.array().items(localTransportSchema).allow(null),
  forex: Joi.array().items(forexSchema).allow(null),
  misc_expenses: Joi.array().items(miscExpenseSchema).allow(null),
});

// Combined schema — creates expense + any module-specific data in one call
export const createExpenseSchema = Joi.object({
  category_uuid: Joi.string().uuid().required().messages({
    'string.guid': 'Category UUID must be a valid UUID',
    'any.required': 'Category UUID is required',
  }),
  company_uuid: Joi.string().uuid().required().messages({
    'string.guid': 'Company UUID must be a valid UUID',
    'any.required': 'Company UUID is required',
  }),
  requested_by_user_uuid: Joi.string().uuid().required().messages({
    'string.guid': 'User UUID must be a valid UUID',
    'any.required': 'User UUID is required',
  }),
  title: Joi.string().max(255).required().messages({
    'string.empty': 'Title is required',
    'string.max': 'Title must be at most 255 characters',
  }),
  remarks: Joi.string().allow(null, ''),
  estimated_amount: Joi.string().allow(null, ''),
  // Travel fields (optional — only used when category module is 'travel')
  travel_type: Joi.string().max(30),
  purpose: Joi.string(),
  travel_start_date: Joi.date().iso(),
  travel_end_date: Joi.date().iso(),
  total_travellers: Joi.number().integer().default(1),
  notes: Joi.string().allow(null, ''),
  segments: Joi.array().items(segmentSchema).allow(null),
  accommodations: Joi.array().items(accommodationSchema).allow(null),
  local_transports: Joi.array().items(localTransportSchema).allow(null),
  forex: Joi.array().items(forexSchema).allow(null),
  misc_expenses: Joi.array().items(miscExpenseSchema).allow(null),
  // Reimbursement fields (optional — only used when category module is 'reimbursement')
  advance_amount: Joi.string().allow(null, ''),
  advance_date: Joi.date().iso().allow(null, ''),
  payment_method: Joi.string().max(20),
  items: Joi.array().items(reimbursementItemSchema).allow(null),
});

// Workflow actions (submit / approve / reject) carry an optional remark
export const actionSchema = Joi.object({
  remarks: Joi.string().allow(null, ''),
});

// Schema for updating an expense — basic fields + module children, all optional.
// Only DRAFT expenses can be updated (enforced in the service).
export const updateExpenseSchema = Joi.object({
  category_uuid: Joi.string().uuid(),
  company_uuid: Joi.string().uuid(),
  title: Joi.string().max(255),
  remarks: Joi.string().allow(null, ''),
  estimated_amount: Joi.string().allow(null, ''),
  // Travel fields (used when the category module is 'travel')
  travel_type: Joi.string().max(30),
  purpose: Joi.string(),
  travel_start_date: Joi.date().iso(),
  travel_end_date: Joi.date().iso(),
  total_travellers: Joi.number().integer().default(1),
  notes: Joi.string().allow(null, ''),
  segments: Joi.array().items(segmentSchema).allow(null),
  accommodations: Joi.array().items(accommodationSchema).allow(null),
  local_transports: Joi.array().items(localTransportSchema).allow(null),
  forex: Joi.array().items(forexSchema).allow(null),
  misc_expenses: Joi.array().items(miscExpenseSchema).allow(null),
  // Reimbursement fields (used when the category module is 'reimbursement')
  advance_amount: Joi.string().allow(null, ''),
  advance_date: Joi.date().iso().allow(null, ''),
  payment_method: Joi.string().max(20),
  items: Joi.array().items(reimbursementItemSchema).allow(null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });
