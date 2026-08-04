import { z } from 'zod';

// Amounts travel as strings (the backend encrypts them as TEXT).
const amountOptional = z.string().refine((v) => v === '' || !Number.isNaN(Number(v)), 'Enter a valid amount');
const amountRequired = z.string().trim().min(1, 'Amount is required').refine((v) => !Number.isNaN(Number(v)), 'Enter a valid amount');

const attachmentsSchema = z.array(z.object({ name: z.string() })).default([]);

// Mirrors the backend travel child schemas (src/modules/expense/expense.validation.js)
const segmentSchema = z.object({
  travel_mode: z.string(),
  from_location: z.string(),
  to_location: z.string(),
  departure_datetime: z.string(),
  arrival_datetime: z.string(),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const accommodationSchema = z.object({
  accommodation_type: z.string(),
  city: z.string(),
  property_name: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const forexSchema = z.object({
  currency_code: z.string(),
  exchange_rate: amountRequired,
  estimated_foreign_amount: amountRequired,
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const localTransportSchema = z.object({
  transport_type: z.string(),
  from_location: z.string(),
  to_location: z.string(),
  travel_datetime: z.string(),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

const miscSchema = z.object({
  expense_type: z.string(),
  expense_date: z.string(),
  vendor_name: z.string(),
  estimated_amount: amountRequired,
  attachments: attachmentsSchema,
});

// One reimbursement line item (Date / Description / Bill No. / Exps. Type / Total)
const reimbursementItemSchema = z.object({
  expense_date: z.string(),
  description: z.string().trim().min(1, 'Description is required'),
  bill_number: z.string(),
  expense_type: z.string(),
  total_amount: amountRequired,
  attachments: attachmentsSchema,
});

// UI form for creating an expense via the real API.
// `category` and `company` hold UUIDs (from /expense-categories and /companies/options).
export const expenseFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().trim().min(3, 'Title is required (min 3 characters)').max(255, 'At most 255 characters'),
  company: z.string().min(1, 'Company is required'),
  remarks: z.string(),

  travel: z.object({
    travel_type: z.enum(['DOMESTIC', 'INTERNATIONAL']),
    purpose: z.string().trim().min(3, 'Purpose is required'),
    travel_start_date: z.string().min(1, 'Start date is required'),
    travel_end_date: z.string().min(1, 'End date is required'),
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
});
