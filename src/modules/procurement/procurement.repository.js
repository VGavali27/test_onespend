import db from '../../database/models/index.js';

const {
  ProcurementRequest,
  ProcurementItem,
  ProcurementHandover,
  ProcurementDocument,
  Company,
  Vendor,
  Role,
  UserEmployment,
  User,
} = db;

// Names shown in list views (company, vendor, who requested it, current role)
const listInclude = [
  { model: Company, as: 'company' },
  { model: Vendor, as: 'vendor' },
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

// Full nested graph used by the detail endpoint
const detailInclude = [
  ...listInclude,
  { model: ProcurementItem, as: 'items' },
  { model: ProcurementDocument, as: 'documents' },
  { model: ProcurementRequest, as: 'parent' },
  { model: ProcurementRequest, as: 'children' },
  {
    model: ProcurementHandover,
    as: 'handovers',
    include: [
      { model: Role, as: 'fromRole' },
      { model: Role, as: 'toRole' },
      { model: UserEmployment, as: 'actionBy', include: [{ model: User, as: 'user' }] },
    ],
  },
];

const { Op } = db.Sequelize;

// Sortable columns. Amounts are excluded — they're AES-encrypted TEXT so the DB can't sort them.
const ALLOWED_SORT_FIELDS = ['createdAt', 'document_number', 'title'];
const DEFAULT_SORT = [['createdAt', 'DESC']];

// Merge the scoping `where` with filters (request type, status, search)
const buildWhere = (where, params = {}) => {
  const w = { ...where };
  const requestType = params.requestType || params.type || '';
  const status = params.status || '';
  const search = (params.search || '').trim();

  if (requestType) w.request_type = requestType;
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

// Paginated, filtered, sorted list. `where` is the visibility scope
// (own employments / visible companies); `params` carries page/limit/type/status/search.
export const findAll = async (where = {}, params = {}) => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = (params.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const order = ALLOWED_SORT_FIELDS.includes(sortBy) ? [[sortBy, sortOrder]] : DEFAULT_SORT;

  const { count, rows } = await ProcurementRequest.findAndCountAll({
    where: buildWhere(where, params),
    include: listInclude,
    order,
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return { rows, total: count };
};

// Documents requested under any of the given employment ids
export const findByEmploymentIds = async (employmentIds, params = {}) =>
  findAll({ requested_by_employment_id: { [Op.in]: employmentIds } }, params);

// Documents belonging to any of the given companies
export const findByCompanyIds = async (companyIds, params = {}) =>
  findAll({ company_id: { [Op.in]: companyIds } }, params);

// Full document by UUID (items, handovers, vendor, company, parent/children, documents).
// Accepts a transaction so reads inside create/update/action transactions see uncommitted rows.
export const findByUuid = async (uuid, transaction) =>
  ProcurementRequest.findOne({
    where: { uuid },
    include: detailInclude,
    ...(transaction ? { transaction } : {}),
  });

// Latest document number for a request type + date prefix (PI-YYYYMMDD-%, PR-…, PO-…)
export const findLatestDocumentNumber = async (requestType, pattern) =>
  ProcurementRequest.findOne({
    where: { request_type: requestType, document_number: { [Op.like]: pattern } },
    order: [['document_number', 'DESC']],
    paranoid: false,
  });

export const create = async (data) => ProcurementRequest.create(data);
export const findById = async (id) => ProcurementRequest.findByPk(id);

// Replace a document's line items in a transaction (used on create/edit of a draft PI)
export const replaceItems = async (requestId, items, t) => {
  await ProcurementItem.destroy({ where: { procurement_request_id: requestId }, force: true, transaction: t });
  if (items.length) {
    await ProcurementItem.bulkCreate(
      items.map((item, i) => ({ ...item, procurement_request_id: requestId, sort_order: i })),
      { transaction: t, individualHooks: true }, // run beforeCreate → encrypt amounts
    );
  }
};

export const deleteRecord = async (uuid) => {
  const doc = await ProcurementRequest.findOne({ where: { uuid } });
  if (!doc) return false;
  await doc.destroy();
  return true;
};
