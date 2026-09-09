import db from '../../database/models/index.js';

const {
  ExpensePayment,
  Expense,
  ExpenseCategory,
  Company,
  Role,
  UserEmployment,
  User,
  ProcurementOrder,
  Vendor,
} = db;

// Includes shared by the payments ledger and its summary: the expense (required —
// payment rows always belong to one), its category/company/requester, the
// procurement vendor when the expense is PO-linked, and who processed the payment.
const REPORT_PAYMENT_INCLUDES = [
  {
    model: Expense,
    as: 'expense',
    required: true,
    include: [
      { model: ExpenseCategory, as: 'category', attributes: ['id', 'name', 'module'] },
      { model: Company, as: 'company', attributes: ['id', 'uuid', 'name', 'gst_number', 'pan_number'] },
      { model: Role, as: 'currentRole', attributes: ['id', 'name', 'code'] },
      {
        model: UserEmployment,
        as: 'requestedByEmployment',
        attributes: ['id'],
        include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
      },
      {
        model: ProcurementOrder,
        as: 'procurementOrder',
        required: false,
        attributes: ['id', 'document_number'],
        include: [
          { model: Vendor, as: 'vendor', attributes: ['id', 'uuid', 'name', 'code', 'gst_number', 'pan_number'] },
        ],
      },
    ],
  },
  {
    model: UserEmployment,
    as: 'processedByEmployment',
    required: false,
    attributes: ['id'],
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
  },
];

// Virtual attribute: number of uploaded payment proofs per installment (subquery —
// expense_payment_proofs is keyed by expense_payment_id).
const PROOF_COUNT_ATTRIBUTE = [
  db.Sequelize.literal('(SELECT COUNT(*) FROM expense_payment_proofs p WHERE p.expense_payment_id = ExpensePayment.id)'),
  'proofCount',
];

// Paginated payments ledger (page/limit applied here; filters live in the service).
export const findAndCountPayments = (where, order, limit, offset) =>
  ExpensePayment.findAndCountAll({
    where,
    include: REPORT_PAYMENT_INCLUDES,
    attributes: { include: [PROOF_COUNT_ATTRIBUTE] },
    distinct: true,
    order,
    limit,
    offset,
  });

// Full payments list for the summary + CSV export (no pagination).
export const findAllPayments = (where, order) =>
  ExpensePayment.findAll({
    where,
    include: REPORT_PAYMENT_INCLUDES,
    attributes: { include: [PROOF_COUNT_ATTRIBUTE] },
    order,
  });

// Expenses still awaiting payment (status APPROVED) within the same role scope —
// feeds the "outstanding" figure on the summary.
export const findOutstandingExpenses = (scopeWhere) =>
  Expense.findAll({
    where: { ...scopeWhere, status: 'APPROVED' },
    attributes: ['id', 'uuid', 'title', 'expense_number', 'final_amount', 'advance_amount', 'paid_amount', 'payment_status'],
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
  });