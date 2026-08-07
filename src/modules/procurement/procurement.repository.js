import db from '../../database/models/index.js';

const {
  ProcurementPi,
  ProcurementPr,
  ProcurementPo,
  ProcurementItem,
  ProcurementHandover,
  ProcurementDocument,
  ProcurementQuotation,
  Company,
  Vendor,
  Role,
  UserEmployment,
  User,
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
    { model: ProcurementPr, as: 'prs' },
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
    { model: ProcurementPi, as: 'pi' },
    { model: ProcurementPo, as: 'pos' },
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
    { model: ProcurementPr, as: 'pr' },
  ],
};

// header model + the polymorphic column + label per type
const HEADERS = [
  { type: 'PI', model: ProcurementPi, idColumn: 'pi_id' },
  { type: 'PR', model: ProcurementPr, idColumn: 'pr_id' },
  { type: 'PO', model: ProcurementPo, idColumn: 'po_id' },
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

  if (status) w.status = status;
  if (search) {
    w[Op.or] = [
      { document_number: { [Op.like]: `%${search}%` } },
      { title: { [Op.like]: `%${search}%` } },
      { '$vendor.name$': { [Op.like]: `%${search}%` } },
    ];
  }
  return w;
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
    const include = type === 'PI' ? baseListInclude : withVendor(baseListInclude);
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

  // Merge + sort + paginate in JS (acceptable at this scale; amounts are excluded from sort)
  collected.sort((a, b) => {
    const av = a[sortBy] ?? a.createdAt;
    const bv = b[sortBy] ?? b.createdAt;
    if (av === bv) return 0;
    const cmp = av > bv ? 1 : -1;
    return sortOrder === 'ASC' ? cmp : -cmp;
  });

  const total = collected.length;
  const rows = collected.slice((page - 1) * limit, page * limit);
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
    chain.pi = await ProcurementPi.findOne({ where: { uuid }, include: baseListInclude });
    const pr = await ProcurementPr.findOne({
      where: { pi_id: chain.pi?.id },
      include: withVendor([{ model: ProcurementQuotation, as: 'quotations', include: [{ model: Vendor, as: 'vendor' }] }]),
    });
    if (pr) {
      chain.pr = pr;
      chain.quotations = pr.quotations || [];
      const po = await ProcurementPo.findOne({ where: { pr_id: pr.id }, include: withVendor(baseListInclude) });
      chain.po = po;
    }
  } else if (type === 'PR') {
    const pr = await ProcurementPr.findOne({ where: { uuid }, include: withVendor(baseListInclude) });
    chain.pr = pr;
    chain.quotations = await ProcurementQuotation.findAll({
      where: { pr_id: pr?.id },
      include: [{ model: Vendor, as: 'vendor' }],
    });
    if (pr?.pi_id) chain.pi = await ProcurementPi.findOne({ where: { id: pr.pi_id }, include: baseListInclude });
    chain.po = await ProcurementPo.findOne({ where: { pr_id: pr?.id }, include: withVendor(baseListInclude) });
  } else {
    const po = await ProcurementPo.findOne({ where: { uuid }, include: withVendor(baseListInclude) });
    chain.po = po;
    if (po?.pr_id) {
      const pr = await ProcurementPr.findOne({ where: { id: po.pr_id }, include: withVendor(baseListInclude) });
      chain.pr = pr;
      chain.quotations = await ProcurementQuotation.findAll({
        where: { pr_id: po.pr_id },
        include: [{ model: Vendor, as: 'vendor' }],
      });
      if (pr?.pi_id) chain.pi = await ProcurementPi.findOne({ where: { id: pr.pi_id }, include: baseListInclude });
    }
  }

  return chain;
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

export const findById = async (id) => ProcurementPi.findByPk(id);

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
