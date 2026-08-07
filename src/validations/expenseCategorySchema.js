import { z } from 'zod';

// Mirrors backend src/modules/expense_category/expense_category.validation.js
// first_receiver_role_uuid / final_approver_role_uuid hold the selected role's uuid.
export const expenseCategoryFormSchema = z.object({
  code: z.string().trim().min(1, 'Category code is required').max(50, 'At most 50 characters'),
  name: z.string().trim().min(1, 'Category name is required').max(100, 'At most 100 characters'),
  module: z.string().trim().min(1, 'Module is required').max(50, 'At most 50 characters'),
  // Non-empty string (not z.uuid) — seeded UUIDs are not RFC-4122 compliant
  first_receiver_role_uuid: z.string().min(1, 'First receiver role is required'),
  final_approver_role_uuid: z.string().min(1, 'Final approver role is required'),
  description: z.string().trim().max(500, 'At most 500 characters'),
});