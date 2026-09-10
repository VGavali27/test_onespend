import { z } from 'zod';

// Mirrors backend src/modules/vendor_category/vendor_category.validation.js
export const vendorCategoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(150, 'At most 150 characters'),
  code: z.string().trim().min(1, 'Category code is required').max(50, 'At most 50 characters'),
  description: z.string().trim().max(500, 'At most 500 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
