import { z } from 'zod';

// Mirrors backend src/modules/permission/permission.validation.js
export const permissionFormSchema = z.object({
  resource: z.string().trim().min(1, 'Resource is required').max(150, 'At most 150 characters'),
  action: z.string().trim().min(1, 'Action is required').max(50, 'At most 50 characters'),
  permission_key: z.string().trim().min(1, 'Permission key is required').max(150, 'At most 150 characters'),
  description: z.string().trim().max(500, 'At most 500 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});