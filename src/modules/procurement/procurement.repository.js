import db from '../../database/models/index.js';

const {
  ProcurementIntention,
  ProcurementRequest,
  ProcurementOrder,
  ProcurementItem,
  ProcurementHandover,
  ProcurementDocument,
  ProcurementQuotation,
  Company,
  Vendor,
  Role,
  UserEmployment,
  User,
  Expense,
} = db;

// Names shown in list views (company, who requested it, current role).
// Vendor is included only for PR/PO (a PI has no vendor).
const baseListInclude = [
  { model: Company, as: 'company' },
  { model: Role, as: 'currentRole' },
  {
    model: UserEmployment,
    as: 'requestedByEmployment',
    include: [
      { model: User, as: 'user' },
      { model: Company, as: 'company' },
    ],
  },
];

const withVendor = (includes) => [{ model: Vendor, as: 'vendor' }, ...includes];

// PO list rows include the parent PR (id + pi_id) so the all-types projection can
// resolve which chain a PO belongs to (PO → PR → PI).
const poListInclude = withVendor([
  ...baseListInclude,
  { model: ProcurementRequest, as: 'pr', attributes: ['id', 'pi_id'] },
]);

// Full nested graph used by the detail endpoint, per header type
const detailIncludes = {
  PI: [
    ...baseListInclude,
    { model: ProcurementItem, as: 'items' },
    { model: ProcurementDocument, as: 'documents' },
    {
      model: ProcurementHandover,
      as: 'handovers',
      include: [
        { model: Role, as: 'fromRole' },
        { model: Role, as: 'toRole' },
        { model: UserEmployment, as: 'actionBy', include: [{ model: User, as: 'user' }] },
      ],
    },
    { model: ProcurementRequest, as: 'prs' },
  ],
  PR: [
    ...withVendor(baseListInclude),
    { model: ProcurementItem, as: 'items' },
    { model: ProcurementDocument, as: 'documents' },
    {
      model: ProcurementQuotation,
      as: 'quotations',
      include: [
        { model: Vendor, as: 'vendor' },
        { model: ProcurementItem, as: 'items' },
        { model: ProcurementDocument, as: 'documents' },
      ],
    },
    {
      model: ProcurementHandover,
      as: 'handovers',
      include: [
        { model: Role, as: 'fromRole' },
        { model: Role, as: 'toRole' },
        { model: UserEmployment, as: 'actionBy', include: [{ model: User, as: 'user' }] },
      ],
    },
    { model: ProcurementIntention, as: 'pi' },
    { model: ProcurementOrder, as: 'pos' },
  ],
  PO: [
    ...withVendor(baseListInclude),
    { model: ProcurementItem, as: 'items' },
    { model: ProcurementDocument, as: 'documents' },
    {
      model: ProcurementHandover,
      as: 'handovers',
      include: [
        { model: Role, as: 'fromRole' },
        { model: Role, as: 'toRole' },
        { model: UserEmployment, as: 'actionBy', include: [{ model: User, as: 'user' }] },
      ],
    },
    { model: ProcurementRequest, as: 'pr' },
    // PO-created expense (expense is parent, PO has expense_id)
    { model: Expense, as: 'expense' },
  ],
};

// header model + the polymorphic column + label per type
const HEADERS = [
  { type: 'PI', model: ProcurementIntention, idColumn: 'pi_id' },
  { type: 'PR', model: ProcurementRequest, idColumn: 'pr_id' },
  { type: 'PO', model: ProcurementOrder, idColumn: 'po_id' },
];

const { Op } = db.Sequelize;

// Sortable columns. Amounts are excluded — they're AES-encrypted TEXT so the DB can't sort them.
const ALLOWED_SORT_FIELDS = ['createdAt', 'document_number', 'title'];
const DEFAULT_SORT = [['createdAt', 'DESC']];

// Merge the scoping `where` with filters (status, search). Type is handled by
// choosing which header table(s) to query.
const buildWhere = (where, params = {}) => {
  const w = { ...where };
  const status = params.status || '';
  const search = (params.search || '').trim();

  if (status) {
    // If there's already a status condition (e.g., from draftPiFilter with Op.or/Op.ne),
    // combine them with Op.and instead of overwriting.
    if (w.status != null) {
      w.status = { [Op.and]: [w.status, status] };
    } else {
      w.status = status;
    }
  }
  if (search) {
    w[Op.or] = [
      { document_number: { [Op.like]: `%${search}%` } },
      { title: { [Op.like]: `%${search}%` } },
      { '$vendor.name$': { [Op.like]: `%${search}%` } },
    ];
  }
  return w;
};

// Type precedence for the "latest document per chain" projection — a PO beats a
// PR beats a PI. Used only when no single request_type filter is applied.
const CHAIN_PRIORITY = { PO: 3, PR: 2, PI: 1 };

// Collapse a merged PI/PR/PO list down to one row per procurement chain: the most
// advanced document (PO if it exists, else PR, else PI). A chain is rooted at its
// PI — a PR links to it via `pi_id`, a PO via its parent PR's `pi_id` (already
// resolved by `poListInclude`). Rows without a resolvable parent (orphaned) get a
// unique key so they're never wrongly merged.
const projectLatestPerChain = (rows = []) => {
  const best = new Map();
  for (const row of rows) {
    const type = row.request_type;
    const piId = type === 'PI' ? row.id : type === 'PR' ? row.pi_id : row.pr?.pi_id;
    const chainKey = piId != null ? `pi:${piId}` : `orphan:${type}:${row.id}`;
    const priority = CHAIN_PRIORITY[type] ?? 0;
    const current = best.get(chainKey);
    if (!current || priority > current.priority) {
      best.set(chainKey, { row, priority });
    }
  }
  return [...best.values()].map((v) => v.row);
};

// Paginated, filtered, sorted list across the header tables.
// `where` is the visibility scope (own employments / visible companies);
// `params` carries page/limit/type/status/search. Rows carry a `request_type`
// label so the frontend can render the type badge.
export const findAll = async (where = {}, params = {}) => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = (params.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const order = ALLOWED_SORT_FIELDS.includes(sortBy) ? [[sortBy, sortOrder]] : DEFAULT_SORT;
  const requestedType = (params.requestType || params.type || '').toUpperCase();

  const targets = requestedType ? HEADERS.filter((h) => h.type === requestedType) : HEADERS;
  const w = buildWhere(where, params);

  const collected = [];
  for (const { type, model } of targets) {
    const include = type === 'PI' ? baseListInclude : type === 'PO' ? poListInclude : withVendor(baseListInclude);
    const { count, rows } = await model.findAndCountAll({
      where: w,
      include,
      order,
      distinct: true,
    });
    rows.forEach((r) => {
      const plain = r.get({ plain: true });
      plain.request_type = type;
      collected.push(plain);
    });
    if (count === 0 && requestedType) {
      // keep total at 0 for the filtered case
    }
  }

  // Collapse to one row per chain (PO > PR > PI) unless a single type filter is
  // active — a filtered view shows every document of that type for auditability.
  const visibleRows = requestedType ? collected : projectLatestPerChain(collected);

  // Merge + sort + paginate in JS (acceptable at this scale; amounts are excluded from sort)
  visibleRows.sort((a, b) => {
    const av = a[sortBy] ?? a.createdAt;
    const bv = b[sortBy] ?? b.createdAt;
    if (av === bv) return 0;
    const cmp = av > bv ? 1 : -1;
    return sortOrder === 'ASC' ? cmp : -cmp;
  });

  const total = visibleRows.length;
  const rows = visibleRows.slice((page - 1) * limit, page * limit);
  return { rows, total };
};

// Documents requested under any of the given employment ids
export const findByEmploymentIds = async (employmentIds, params = {}) =>
  findAll({ requested_by_employment_id: { [Op.in]: employmentIds } }, params);

// Documents belonging to any of the given companies
export const findByCompanyIds = async (companyIds, params = {}) =>
  findAll({ company_id: { [Op.in]: companyIds } }, params);

// Which header table owns this uuid (PI / PR / PO) — null if not found.
export const resolveType = async (uuid) => {
  for (const { type, model } of HEADERS) {
    const found = await model.findOne({ where: { uuid }, attributes: ['id'] });
    if (found) return type;
  }
  return null;
};

// Full document by UUID with type-specific nested graph. Accepts a transaction so
// reads inside create/update/action transactions see uncommitted rows.
export const findByUuid = async (uuid, transaction) => {
  for (const { type, model } of HEADERS) {
    const doc = await model.findOne({
      where: { uuid },
      include: detailIncludes[type],
      ...(transaction ? { transaction } : {}),
    });
    if (doc) return doc;
  }
  return null;
};

// Price-comparison chain for a given uuid: the PI, PR, quotations, PO (each with
// decrypted totals) so the UI can render stage-by-stage history.
export const findByUuidWithChain = async (uuid) => {
  const type = await resolveType(uuid);
  if (!type) return null;

  const chain = { type, pi: null, pr: null, quotations: [], po: null };

  if (type === 'PI') {
    chain.pi = await ProcurementIntention.findOne({ where: { uuid }, include: baseListInclude });
    const pr = await ProcurementRequest.findOne({
      where: { pi_id: chain.pi?.id },
      include: withVendor([{ model: ProcurementQuotation, as: 'quotations', include: [{ model: Vendor, as: 'vendor' }, { model: ProcurementItem, as: 'items' }] }]),
    });
    if (pr) {
      chain.pr = pr;
      chain.quotations = pr.quotations || [];
      const po = await ProcurementOrder.findOne({ where: { pr_id: pr.id }, include: withVendor(baseListInclude) });
      chain.po = po;
    }
  } else if (type === 'PR') {
    const pr = await ProcurementRequest.findOne({ where: { uuid }, include: withVendor(baseListInclude) });
    chain.pr = pr;
    chain.quotations = await ProcurementQuotation.findAll({
      where: { pr_id: pr?.id },
      include: [{ model: Vendor, as: 'vendor' }, { model: ProcurementItem, as: 'items' }],
    });
    if (pr?.pi_id) chain.pi = await ProcurementIntention.findOne({ where: { id: pr.pi_id }, include: baseListInclude });
    chain.po = await ProcurementOrder.findOne({ where: { pr_id: pr?.id }, include: withVendor(baseListInclude) });
  } else {
    const po = await ProcurementOrder.findOne({ where: { uuid }, include: withVendor(baseListInclude) });
    chain.po = po;
    if (po?.pr_id) {
      const pr = await ProcurementRequest.findOne({ where: { id: po.pr_id }, include: withVendor(baseListInclude) });
      chain.pr = pr;
      chain.quotations = await ProcurementQuotation.findAll({
        where: { pr_id: po.pr_id },
        include: [{ model: Vendor, as: 'vendor' }, { model: ProcurementItem, as: 'items' }],
      });
      if (pr?.pi_id) chain.pi = await ProcurementIntention.findOne({ where: { id: pr.pi_id }, include: baseListInclude });
    }
  }

  return chain;
};

// Chain (PI → PR → quotations → PO) rooted at a PR id — used by the expense detail
// to render the procurement history behind a PO-created / converted expense.
export const findChainByPrId = async (prId) => {
  if (prId == null) return null;
  const pr = await ProcurementRequest.findOne({ where: { id: prId }, include: withVendor(baseListInclude) });
  if (!pr) return null;
  const chain = { type: 'PR', pi: null, pr, quotations: [], po: null };
  if (pr.pi_id) chain.pi = await ProcurementIntention.findOne({ where: { id: pr.pi_id }, include: baseListInclude });
  chain.quotations = await ProcurementQuotation.findAll({
    where: { pr_id: pr.id },
    include: [{ model: Vendor, as: 'vendor' }, { model: ProcurementItem, as: 'items' }],
  });
  chain.po = await ProcurementOrder.findOne({ where: { pr_id: pr.id }, include: withVendor(baseListInclude) });
  return chain;
};

// Handover include reused by the detail graph and chain-timeline queries
const handoverInclude = [
  { model: Role, as: 'fromRole' },
  { model: Role, as: 'toRole' },
  { model: UserEmployment, as: 'actionBy', include: [{ model: User, as: 'user' }] },
];

// All handovers across a chain (PI + PR + PO) so a document's approval timeline
// shows the full journey (submit PI → approve → create PR → add/submit/select
// quotation → PO → …) regardless of which document in the chain is being viewed.
export const findChainHandovers = async ({ piId, prId, poId }) => {
  const or = [];
  if (piId != null) or.push({ pi_id: piId });
  if (prId != null) or.push({ pr_id: prId });
  if (poId != null) or.push({ po_id: poId });
  if (or.length === 0) return [];
  return ProcurementHandover.findAll({
    where: { [Op.or]: or },
    include: handoverInclude,
    order: [['createdAt', 'ASC']],
  });
};

// Latest document number for a request type + date prefix (PI-YYYYMMDD-%, PR-…, PO-…)
export const findLatestDocumentNumber = async (requestType, pattern) => {
  const target = HEADERS.find((h) => h.type === requestType);
  if (!target) return null;
  return target.model.findOne({
    where: { document_number: { [Op.like]: pattern } },
    order: [['document_number', 'DESC']],
    paranoid: false,
  });
};

export const findById = async (id) => ProcurementIntention.findByPk(id);

// Replace a document's line items in a transaction. The polymorphic column
// (pi_id/pr_id/po_id) is chosen by the caller via `ownerColumn`.
export const replaceItems = async (ownerColumn, ownerId, items, t) => {
  await ProcurementItem.destroy({ where: { [ownerColumn]: ownerId }, force: true, transaction: t });
  if (items.length) {
    await ProcurementItem.bulkCreate(
      items.map((item, i) => ({ ...item, [ownerColumn]: ownerId, sort_order: i })),
      { transaction: t, individualHooks: true }, // run beforeCreate → encrypt amounts
    );
  }
};

export const deleteRecord = async (uuid) => {
  const type = await resolveType(uuid);
  if (!type) return false;
  const target = HEADERS.find((h) => h.type === type);
  const doc = await target.model.findOne({ where: { uuid } });
  if (!doc) return false;
  await doc.destroy();
  return true;
};
