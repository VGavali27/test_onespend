import { z } from 'zod';

const itemSchema = z.object({
  item_name: z.string().trim().min(1, 'Item name is required').max(255, 'At most 255 characters'),
  description: z.string(),
  category: z.string().max(100, 'At most 100 characters'),
  quantity: z.coerce.number({ invalid_type_error: 'Quantity must be a number' }).int('Quantity must be a whole number').min(0, 'Quantity cannot be negative').default(1),
  unit_price: z.coerce.number({ invalid_type_error: 'Unit price must be a number' }).min(0, 'Unit price cannot be negative').default(0),
});

// PI create/edit form (amounts sent raw; the backend computes and encrypts totals).
// NOTE: no vendor — the vendor is only introduced when an admin fills quotations
// on the PR; the requester must not know the vendor. company_uuid is validated as
// a non-empty string (NOT z.string().uuid) because the seeded UUIDs are not
// RFC-4122 compliant — matches the expense form's company validation.
export const procurementFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255, 'At most 255 characters'),
  company_uuid: z.string().min(1, 'Company is required'),
  expected_delivery_date: z.string(),
  notes: z.string(),
  items: z.array(itemSchema).default([]),
});
