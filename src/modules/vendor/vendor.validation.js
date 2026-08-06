import Joi from 'joi';

const contactSchema = Joi.object({
  contact_type: Joi.string().max(50).default('PRIMARY'),
  salutation: Joi.string().max(20).allow(null, ''),
  first_name: Joi.string().max(100).required().messages({ 'string.empty': 'Contact first name is required' }),
  last_name: Joi.string().max(100).allow(null, ''),
  designation: Joi.string().max(150).allow(null, ''),
  email: Joi.string().email().allow(null, '').messages({ 'string.email': 'Must be a valid email' }),
  phone: Joi.string().max(40).allow(null, ''),
  mobile: Joi.string().max(40).allow(null, ''),
  is_primary: Joi.boolean().default(false),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const addressSchema = Joi.object({
  address_type: Joi.string().max(50).default('REGISTERED'),
  address_line_1: Joi.string().max(255).allow(null, ''),
  address_line_2: Joi.string().max(255).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  state: Joi.string().max(100).allow(null, ''),
  country: Joi.string().max(100).allow(null, ''),
  pincode: Joi.string().max(20).allow(null, ''),
  is_primary: Joi.boolean().default(false),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const bankAccountSchema = Joi.object({
  account_type: Joi.string().max(50).default('PRIMARY'),
  account_holder_name: Joi.string().max(150).allow(null, ''),
  bank_name: Joi.string().max(150).allow(null, ''),
  bank_branch: Joi.string().max(150).allow(null, ''),
  account_number: Joi.string().allow(null, ''),
  ifsc: Joi.string().max(20).allow(null, ''),
  swift_code: Joi.string().max(20).allow(null, ''),
  currency_code: Joi.string().max(10).default('INR'),
  is_primary: Joi.boolean().default(false),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

// Create a vendor with nested contacts / addresses / bank accounts in one call
export const createVendorSchema = Joi.object({
  name: Joi.string().max(255).required().messages({ 'string.empty': 'Vendor name is required' }),
  code: Joi.string().max(50).required().messages({ 'string.empty': 'Vendor code is required' }),
  vendor_type: Joi.string().max(50).default('VENDOR'),
  logo_img: Joi.string().allow(null, ''),
  website: Joi.string().allow(null, ''),
  gst_number: Joi.string().max(50).allow(null, ''),
  pan_number: Joi.string().max(50).allow(null, ''),
  cin_number: Joi.string().max(50).allow(null, ''),
  payment_terms: Joi.string().max(100).allow(null, ''),
  rating: Joi.number().min(0).max(5).allow(null),
  notes: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
  contacts: Joi.array().items(contactSchema).allow(null),
  addresses: Joi.array().items(addressSchema).allow(null),
  bank_accounts: Joi.array().items(bankAccountSchema).allow(null),
});

// Update a vendor — basic fields + optional child replacement
export const updateVendorSchema = Joi.object({
  name: Joi.string().max(255),
  code: Joi.string().max(50),
  vendor_type: Joi.string().max(50),
  logo_img: Joi.string().allow(null, ''),
  website: Joi.string().allow(null, ''),
  gst_number: Joi.string().max(50).allow(null, ''),
  pan_number: Joi.string().max(50).allow(null, ''),
  cin_number: Joi.string().max(50).allow(null, ''),
  payment_terms: Joi.string().max(100).allow(null, ''),
  rating: Joi.number().min(0).max(5).allow(null),
  notes: Joi.string().allow(null, ''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  contacts: Joi.array().items(contactSchema).allow(null),
  addresses: Joi.array().items(addressSchema).allow(null),
  bank_accounts: Joi.array().items(bankAccountSchema).allow(null),
})
  .min(1)
  .messages({ 'object.min': 'At least one field is required' });

// One vendor document (uploaded file metadata from POST /uploads)
export const vendorDocumentSchema = Joi.object({
  vendor_uuid: Joi.string().uuid().required().messages({ 'string.guid': 'Vendor UUID must be a valid UUID' }),
  document_type: Joi.string().max(50).allow(null, ''),
  document_number: Joi.string().max(100).allow(null, ''),
  issue_date: Joi.date().iso().allow(null, ''),
  expiry_date: Joi.date().iso().allow(null, ''),
  original_file_name: Joi.string().max(255).required(),
  stored_file_name: Joi.string().max(255).required(),
  file_path: Joi.string().required(),
  mime_type: Joi.string().max(100).allow(null, ''),
  file_size: Joi.number().allow(null),
});
