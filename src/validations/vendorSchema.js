import { z } from 'zod';

const contactSchema = z.object({
  contact_type: z.string().default('PRIMARY'),
  salutation: z.string(),
  first_name: z.string().trim().min(1, 'First name is required').max(100, 'At most 100 characters'),
  last_name: z.string().max(100, 'At most 100 characters'),
  designation: z.string().max(150, 'At most 150 characters'),
  email: z.string().email('Must be a valid email').or(z.literal('')),
  phone: z.string(),
  mobile: z.string(),
  is_primary: z.boolean().default(false),
});

const addressSchema = z.object({
  address_type: z.string().default('REGISTERED'),
  address_line_1: z.string().max(255, 'At most 255 characters'),
  address_line_2: z.string().max(255, 'At most 255 characters'),
  city: z.string().max(100, 'At most 100 characters'),
  state: z.string().max(100, 'At most 100 characters'),
  country: z.string().max(100, 'At most 100 characters'),
  pincode: z.string().max(20, 'At most 20 characters'),
  is_primary: z.boolean().default(false),
});

const bankAccountSchema = z.object({
  account_type: z.string().default('PRIMARY'),
  account_holder_name: z.string().max(150, 'At most 150 characters'),
  bank_name: z.string().max(150, 'At most 150 characters'),
  bank_branch: z.string().max(150, 'At most 150 characters'),
  account_number: z.string(),
  ifsc: z.string().max(20, 'At most 20 characters'),
  swift_code: z.string().max(20, 'At most 20 characters'),
  currency_code: z.string().default('INR'),
  is_primary: z.boolean().default(false),
});

// Vendor form (create + edit). Contacts / addresses / bank accounts are nested arrays
// (mirrors the backend nested create/update).
export const vendorFormSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required').max(255, 'At most 255 characters'),
  code: z.string().trim().min(1, 'Vendor code is required').max(50, 'At most 50 characters'),
  vendor_type: z.string().default('VENDOR'),
  logo_img: z.string(),
  website: z.string().url('Must be a valid URL').or(z.literal('')),
  gst_number: z.string().max(50, 'At most 50 characters'),
  pan_number: z.string().max(50, 'At most 50 characters'),
  cin_number: z.string().max(50, 'At most 50 characters'),
  payment_terms: z.string().max(100, 'At most 100 characters'),
  rating: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  notes: z.string(),
  contacts: z.array(contactSchema).default([]),
  addresses: z.array(addressSchema).default([]),
  bank_accounts: z.array(bankAccountSchema).default([]),
  category_uuids: z.array(z.string()).default([]),
  documents: z.array(z.any()).default([]), // Files (new) or { uuid, name, url } (existing) — handled on save
});
