import { z } from 'zod';

const optionalEmail = z
  .string()
  .trim()
  .max(150, 'Must be at most 150 characters')
  .email('Must be a valid email')
  .or(z.literal(''));

const optionalText = (max) => z.string().trim().max(max, `Must be at most ${max} characters`);

// Mirrors backend src/modules/company/company.validation.js
export const companyFormSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(150, 'At most 150 characters'),
  code: z.string().trim().min(1, 'Company code is required').max(30, 'At most 30 characters'),
  group_uuid: z.string().min(1, 'Group is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  logo_img: z.string(),

  email: optionalEmail,
  phone: optionalText(40),
  website: z.string().trim().url('Must be a valid URL').or(z.literal('')),

  gst_number: optionalText(50),
  pan_number: optionalText(50),
  cin_number: optionalText(50),

  address_line_1: optionalText(255),
  address_line_2: optionalText(255),
  city: optionalText(100),
  state: optionalText(100),
  country: optionalText(100),
  pincode: optionalText(20),
});