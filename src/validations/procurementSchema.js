import { z } from 'zod';

const itemSchema = z.object({
  item_name: z.string().trim().min(1, 'Item name is required').max(255, 'At most 255 characters'),
  description: z.string(),
  category: z.string().max(100, 'At most 100 characters'),
  quantity: z.coerce.number({ invalid_type_error: 'Quantity must be a number' }).min(0, 'Quantity cannot be negative').default(1),
  unit: z.string().max(20, 'At most 20 characters'),
  unit_price: z.coerce.number({ invalid_type_error: 'Unit price must be a number' }).min(0, 'Unit price cannot be negative').default(0),
  tax_rate: z.coerce.number({ invalid_type_error: 'Tax rate must be a number' }).min(0, 'Tax rate cannot be negative').max(100, 'Tax rate at most 100').default(0),
});

// PI create/edit form (amounts sent raw; the backend computes and encrypts totals).
// NOTE: no vendor — the vendor is only introduced when an admin fills quotations
// on the PR; the requester must not know the vendor.
export const procurementFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'At most 255 characters'),
  company_uuid: z.string().uuid('Company is required'),
  delivery_address: z.string(),
  expected_delivery_date: z.string(),
  payment_terms: z.string().max(100, 'At most 100 characters'),
  notes: z.string(),
  items: z.array(itemSchema).default([]),
});
