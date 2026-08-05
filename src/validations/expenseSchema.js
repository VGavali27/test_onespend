import { z } from 'zod';

// Amounts travel as strings (the backend encrypts them as TEXT).
const amountOptional = z.string().refine((v) => v === '' || !Number.isNaN(Number(v)), 'Enter a number (digits only)');
const amountRequired = z
  .string()
  .trim()
  .min(1, 'Enter an amount')
  .refine((v) => !Number.isNaN(Number(v)), 'Amount must be a number (e.g. 1000)');

// Attachments hold File objects (new picks) or { name, url } (already uploaded on edit);
// they're uploaded separately on submit, so validation just keeps the array.
const attachmentsSchema = z.array(z.any()).default([]);

// Mirrors the backend travel child schemas (src/modules/expense/expense.validation.js).
// These fields are `.required()` on the backend too, so requiring them here surfaces a
// clear message instead of a backend "…is not allowed to be empty" failure.
const segmentSchema = z.object({
  travel_mode: z.string().min(1, 'Select a travel mode').max(30, 'Travel mode is too long (max 30 characters)'),
  from_location: z.string().trim().min(1, 'From location is required').max(255, 'From location is too long (max 255 characters)'),
  to_location: z.string().trim().min(1, 'To location is required').max(255, 'To location is too long (max 255 characters)'),
  departure_datetime: z.string().min(1, 'Departure time is required'),
  arrival_datetime: z.string().min(1, 'Arrival time is required'),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const accommodationSchema = z.object({
  accommodation_type: z.string().min(1, 'Select a type').max(50, 'Type is too long (max 50 characters)'),
  city: z.string().trim().min(1, 'City is required').max(150, 'City is too long (max 150 characters)'),
  property_name: z.string().max(255, 'Property name is too long (max 255 characters)'),
  check_in: z.string().min(1, 'Check-in date is required'),
  check_out: z.string().min(1, 'Check-out date is required'),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const forexSchema = z.object({
  currency_code: z.string().trim().min(1, 'Currency is required').max(10, 'Currency code must be at most 10 characters (e.g. INR, USD)'),
  exchange_rate: amountRequired,
  estimated_foreign_amount: amountRequired,
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const localTransportSchema = z.object({
  transport_type: z.string().min(1, 'Select a type').max(30, 'Type is too long (max 30 characters)'),
  from_location: z.string().trim().min(1, 'From location is required').max(255, 'From location is too long (max 255 characters)'),
  to_location: z.string().trim().min(1, 'To location is required').max(255, 'To location is too long (max 255 characters)'),
  travel_datetime: z.string().min(1, 'Travel time is required'),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const miscSchema = z.object({
  expense_type: z.string().trim().min(1, 'Type is required').max(100, 'Type is too long (max 100 characters)'),
  expense_date: z.string().min(1, 'Date is required'),
  vendor_name: z.string().max(255, 'Vendor name is too long (max 255 characters)'),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

// One reimbursement line item (Date / Description / Bill No. / Exps. Type / Total)
const reimbursementItemSchema = z.object({
  expense_date: z.string(),
  description: z.string().trim().min(1, 'Description is required').max(255, 'Description is too long (max 255 characters)'),
  bill_number: z.string().max(100, 'Bill no. is too long (max 100 characters)'),
  expense_type: z.string().max(50, 'Expense type is too long (max 50 characters)'),
  total_amount: amountRequired,
  attachments: attachmentsSchema,
});

// A hidden field set by the form from the selected category's `module`
// (travel | reimbursement | ''). The required checks below are conditional on it —
// so a reimbursement isn't blocked by empty travel fields (and vice versa).
const moduleSchema = z.enum(['travel', 'reimbursement', '']).catch('');

const addIssue = (ctx, path, message) =>
  ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

// UI form for creating an expense via the real API.
// `category` and `company` hold UUIDs (from /expense-categories and /companies/options).
// Travel and reimbursement required-fields are enforced per-module via superRefine.
export const expenseFormSchema = z
  .object({
    module: moduleSchema,
    category: z.string().min(1, 'Category is required'),
    title: z.string().trim().min(3, 'Title is required (min 3 characters)').max(255, 'At most 255 characters'),
    company: z.string().min(1, 'Company is required'),
    remarks: z.string(),

    travel: z.object({
      travel_type: z.enum(['DOMESTIC', 'INTERNATIONAL']),
      purpose: z.string(),
      travel_start_date: z.string(),
      travel_end_date: z.string(),
      total_travellers: z.coerce.number().min(1, 'At least 1 traveller'),
      notes: z.string(),
      segments: z.array(segmentSchema).default([]),
      accommodations: z.array(accommodationSchema).default([]),
      forex: z.array(forexSchema).default([]),
      localTransports: z.array(localTransportSchema).default([]),
      miscExpenses: z.array(miscSchema).default([]),
    }),

    reimbursement: z.object({
      advance_amount: amountOptional,
      advance_date: z.string(),
      payment_method: z.string(),
      remarks: z.string(),
      items: z.array(reimbursementItemSchema).default([]),
    }),
  })
  .superRefine((val, ctx) => {
    if (val.module === 'travel') {
      if (!val.travel.purpose?.trim()) addIssue(ctx, ['travel', 'purpose'], 'Purpose is required');
      if (!val.travel.travel_start_date) addIssue(ctx, ['travel', 'travel_start_date'], 'Start date is required');
      if (!val.travel.travel_end_date) addIssue(ctx, ['travel', 'travel_end_date'], 'End date is required');
      if (val.travel.travel_start_date && val.travel.travel_end_date && val.travel.travel_end_date < val.travel.travel_start_date) {
        addIssue(ctx, ['travel', 'travel_end_date'], 'End date must be on or after the start date');
      }
    }
    if (val.module === 'reimbursement') {
      if (!val.reimbursement.advance_date) addIssue(ctx, ['reimbursement', 'advance_date'], 'Advance date is required');
      val.reimbursement.items.forEach((it, i) => {
        if (!it.expense_date) addIssue(ctx, ['reimbursement', 'items', i, 'expense_date'], 'Date is required');
      });
    }
  });
