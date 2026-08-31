import { z } from 'zod';

// Optional string that must be a valid email when non-empty
const optionalEmail = z
  .string()
  .trim()
  .max(150, 'Must be at most 150 characters')
  .email('Must be a valid email')
  .or(z.literal(''));

// One employment row inside the user form
const employmentSchema = z.object({
  company_uuid: z.string().min(1, 'Company is required'),
  employee_code: z.string().trim().max(50, 'Must be at most 50 characters'),
  email: optionalEmail,
  designation: z.string().trim().max(150, 'Must be at most 150 characters'),
  employment_type: z.enum(['PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT']),
  joining_date: z.string(),
});

/**
 * Zod schema for the shared user form (create + edit).
 * Mirrors the backend Joi rules in src/modules/user/user.validation.js.
 *
 * On edit, password is optional ("leave blank to keep current").
 */
export const buildUserFormSchema = ({ isEdit = false } = {}) =>
  z.object({
    first_name: z.string().trim().min(1, 'First name is required').max(100, 'Must be at most 100 characters'),
    middle_name: z.string().trim().max(100, 'Must be at most 100 characters'),
    last_name: z.string().trim().min(1, 'Last name is required').max(100, 'Must be at most 100 characters'),
    email: optionalEmail,
    mobile: z.string().trim().max(20, 'Must be at most 20 characters'),
    password: isEdit
      ? z.string().refine((v) => !v || v.length >= 6, 'Password must be at least 6 characters')
      : z.string().min(6, 'Password must be at least 6 characters').max(128, 'Must be at most 128 characters'),
    profile_image: z.string(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
    role_uuid: z.string().min(1, 'Role is required'),
    department_uuid: z.string().min(1, 'Department is required'),
    employments: z.array(employmentSchema).default([]),
  });

export const EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT'];
