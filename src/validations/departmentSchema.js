import { z } from 'zod';

// Mirrors backend src/modules/department/department.validation.js
export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required').max(150, 'At most 150 characters'),
  code: z.string().trim().min(1, 'Department code is required').max(30, 'At most 30 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  description: z.string().trim().max(500, 'At most 500 characters'),
});