import db from '../../database/models/index.js';

const {
  Expense,
  ExpenseCategory,
  Company,
  TravelExpense,
  TravelExpenseSegment,
  TravelExpenseAccommodation,
  TravelExpenseForex,
  TravelExpenseLocalTransport,
  TravelExpenseMiscExpense,
  ReimbursementExpense,
  ReimbursementItem,
  ExpenseDocument,
  ExpenseHandover,
  Role,
  UserEmployment,
  User,
  ProcurementOrder,
} = db;

// Names shown in list views (category/company + who submitted it)
const listInclude = [
  { model: ExpenseCategory, as: 'category', include: [
    { model: Role, as: 'firstReceiverRole' },
    { model: Role, as: 'finalApproverRole' },
  ]},
  { model: Company, as: 'company' },
  { model: Role, as: 'currentRole' },
  { model: TravelExpense, as: 'travelExpense', required: false }, // for date filtering on travel dates
  {
    model: UserEmployment,
    as: 'requestedByEmployment',
    include: [
      { model: User, as: 'user' },
      { model: Company, as: 'company' },
    ],
  },
];

// Full nested graph used by the detail endpoint
const detailInclude = [
  ...listInclude,
  {
    model: TravelExpense,
    as: 'travelExpense',
    include: [
      { model: TravelExpenseSegment, as: 'segments' },
      { model: TravelExpenseAccommodation, as: 'accommodations' },
      { model: TravelExpenseForex, as: 'forex' },
      { model: TravelExpenseLocalTransport, as: 'localTransports' },
      { model: TravelExpenseMiscExpense, as: 'miscExpenses' },
    ],
  },
  {
    model: ReimbursementExpense,
    as: 'reimbursementExpense',
    include: [{ model: ReimbursementItem, as: 'items' }],
  },
  {
    model: ProcurementOrder,
    as: 'procurementOrder',
    include: [
      { model: db.ProcurementRequest, as: 'pr', include: [
        { model: db.ProcurementIntention, as: 'pi' }
      ]},
      { model: db.Vendor, as: 'vendor' },
      { model: db.ProcurementItem, as: 'items' },
    ],
  },
  { model: ExpenseDocument, as: 'documents' },
  {
    model: ExpenseHandover,
    as: 'handovers',
    include: [
      { model: Role, as: 'fromRole' },
      { model: Role, as: 'toRole' },
      { model: UserEmployment, as: 'actionBy', include: [{ model: User, as: 'user' }] },
    ],
  },
];

const { Op } = db.Sequelize;

// Sortable columns. NOTE: estimated_amount is excluded because amounts are stored
// as AES-encrypted TEXT — the DB can't sort that column numerically.
const ALLOWED_SORT_FIELDS = ['createdAt', 'title', 'submitted_at'];
const DEFAULT_SORT = [['createdAt', 'DESC']];

// Merge the scoping `where` with server-side filters (search, status, category, date ranges)
const buildWhere = (where, params = {}) => {
  const w = { ...where };
  const status = params.status || '';
  const category = params.category || '';
  const search = (params.search || '').trim();
  const dateFrom = params.dateFrom || '';
  const dateTo = params.dateTo || '';

  if (status) w.status = status;
  if (category) w['$category.name$'] = category; // company & category are in listInclude
  if (search) {
    w[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { expense_number: { [Op.like]: `%${search}%` } },
      { '$company.name$': { [Op.like]: `%${search}%` } },
    ];
  }

  // Date range filtering — only apply if BOTH from and to are provided
  // Filter by submitted_at date on the expense model
  if (dateFrom && dateTo) {
    w.submitted_at = {
      [Op.gte]: dateFrom,
      [Op.lte]: dateTo,
    };
  }

  return w;
};

// Paginated, filtered, sorted expense list. `where` is the visibility scope
// (own employments / visible companies); `params` carries page/limit/search/status/category/sortBy/sortOrder.
export const findAll = async (where = {}, params = {}) => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = (params.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const order = ALLOWED_SORT_FIELDS.includes(sortBy) ? [[sortBy, sortOrder]] : DEFAULT_SORT;

  const { count, rows } = await Expense.findAndCountAll({
    where: buildWhere(where, params),
    include: listInclude,
    order,
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return { rows, total: count };
};

// Expenses belonging to any of the given requester employment ids (used for "my expenses")
export const findByEmploymentIds = async (employmentIds, params = {}) =>
  findAll({ requested_by_employment_id: { [Op.in]: employmentIds } }, params);

// Expenses belonging to any of the given companies (used for company-scoped visibility)
export const findByCompanyIds = async (companyIds, params = {}) =>
  findAll({ company_id: { [Op.in]: companyIds } }, params);

// Find an expense by its UUID (with the full detail graph)
// Accepts a transaction so action handlers (submit/approve/reject) can return the
// post-update state read inside the same transaction (a separate connection would
// see the pre-commit row).
export const findByUuid = async (uuid, transaction) =>
  Expense.findOne({ where: { uuid }, include: detailInclude, ...(transaction ? { transaction } : {}) });

// Find the latest expense number for a given prefix/date
export const findLatestExpenseNumber = async (pattern) => {
  return Expense.findOne({
    where: { expense_number: { [db.Sequelize.Op.like]: pattern } },
    order: [['expense_number', 'DESC']],
    paranoid: false,
  });
};

// Create a new expense record
export const create = async (data) => Expense.create(data);

// Update an expense by UUID — returns null if not found
export const update = async (uuid, data) => {
  const expense = await Expense.findOne({ where: { uuid } });
  if (!expense) return null;
  return expense.update(data);
};

// Soft delete an expense by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const expense = await Expense.findOne({ where: { uuid } });
  if (!expense) return false;
  await expense.destroy();
  return true;
};
