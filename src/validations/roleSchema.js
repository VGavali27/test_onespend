import { z } from 'zod';

// Mirrors backend src/modules/role/role.validation.js
export const roleFormSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required').max(100, 'At most 100 characters'),
  code: z.string().trim().min(1, 'Role code is required').max(50, 'At most 50 characters'),
  description: z.string().trim().max(500, 'At most 500 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});