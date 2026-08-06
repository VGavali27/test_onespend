import * as procurementRepository from './procurement.repository.js';
import * as companyRepository from '../company/company.repository.js';
import * as roleRepository from '../role/role.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
import { decrypt, decryptResults } from '../../utils/encryption.js';
import { getEmploymentIdsByUser, getActiveCompanyIdsByUser, getActiveEmploymentByUser, getActiveEmploymentByUserAndCompany } from '../../modules/user_employment/user_employment.service.js';

const { Vendor, RoleHandoverRule, sequelize } = db;

// Role ids (see seeders/20260724000002-seed-roles.js)
const ROLE_IDS = {
  SUPER_ADMIN: 100,
  CFO: 101,
  PAYMENT_MGR: 102,
  FINANCE_MGR: 104,
  ADMIN_MGR: 106,
  HOD: 110,
};

// Who acts next after an APPROVE at the given (request_type, status).
// next_role null = no further approver (chain continues via a document action,
// e.g. the admin creating the PR/PO).
const APPROVAL_STEPS = {
  'PI:SUBMITTED': { next_status: 'APPROVED', next_role: null },
  'PR:SUBMITTED': { next_status: 'HOD_APPROVED', next_role: ROLE_IDS.ADMIN_MGR },
  'PR:HOD_APPROVED': { next_status: 'QUOTATION_APPROVED', next_role: ROLE_IDS.CFO },
  'PR:QUOTATION_APPROVED': { next_status: 'APPROVED', next_role: ROLE_IDS.ADMIN_MGR },
  'PO:RECEIVED': { next_status: 'FINANCE_APPROVED', next_role: ROLE_IDS.CFO },
  'PO:FINANCE_APPROVED': { next_status: 'APPROVED', next_role: ROLE_IDS.PAYMENT_MGR },
};

// Roles that see every company's procurement documents (global visibility)
const GLOBAL_ROLES = ['SUPER_ADMIN', 'CFO'];

// Roles that see their company's documents (everyone else only sees their own requests)
const MANAGER_ROLES = [
  'SUPER_ADMIN', 'CFO', 'PAYMENT_MGR', 'PAYMENT_JR', 'FINANCE_MGR', 'FINANCE_JR',
  'ADMIN_MGR', 'ADMIN_JR', 'HOD',
];

// ── Helpers ──

const findRoleByCode = async (code) => roleRepository.findByCode(code);

// Every role→role hop must be authorized by an ACTIVE role_handover_rules row for
// module='procurement' — editing those rules reconfigures who can hand off to whom.
const requireHandoverRule = async (fromRoleId, toRoleId) => {
  const rule = await RoleHandoverRule.findOne({
    where: { module: 'procurement', from_role_id: fromRoleId, to_role_id: toRoleId, status: 'ACTIVE' },
  });
  if (!rule) throw ApiError.forbidden('This approval handover is not configured');
};

// Generate PI/PR/PO-YYYYMMDD-XXXX (mirrors the expense number generator)
const generateDocumentNumber = async (requestType) => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const pattern = `${requestType}-${dateStr}-%`;
  const last = await procurementRepository.findLatestDocumentNumber(requestType, pattern);
  let seq = 1;
  if (last) seq = parseInt(last.document_number.split('-')[2], 10) + 1;
  return `${requestType}-${dateStr}-${String(seq).padStart(4, '0')}`;
};

// Per-item amounts (qty × unit_price, plus tax) — amounts are strings; encrypted on save
const computeItemAmounts = (item) => {
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unit_price) || 0;
  const rate = Number(item.tax_rate) || 0;
  const total = qty * price;
  const tax = (total * rate) / 100;
  return {
    ...item,
    total_amount: total.toFixed(2),
    tax_amount: tax.toFixed(2),
    total_with_tax: (total + tax).toFixed(2),
  };
};

// Server-computed request totals from line items (amounts are strings; encrypted on save)
const computeTotals = (items = []) => {
  let total = 0;
  let tax = 0;
  items.forEach((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    const rate = Number(it.tax_rate) || 0;
    total += qty * price;
    tax += (qty * price * rate) / 100;
  });
  const grand = total + tax;
  return {
    total_amount: total.toFixed(2),
    tax_amount: tax.toFixed(2),
    grand_total: grand.toFixed(2),
  };
};

// ── Decrypt helpers (amounts are AES-encrypted TEXT) ──

const decryptAmountField = (obj, field) => {
  const value = obj?.[field];
  if (value != null) obj[field] = parseFloat(decrypt(String(value)));
};

// Decrypt a request's amount fields — also handles grand_total (not matched by
// decryptAmounts, which only covers *_amount)
const decryptRequest = (row) => {
  decryptResults(row);
  decryptAmountField(row, 'grand_total');
  return row;
};

const decryptItems = (items = []) => {
  items.forEach((item) => {
    ['unit_price', 'total_amount', 'tax_amount', 'total_with_tax'].forEach((f) => decryptAmountField(item, f));
  });
  return items;
};

const decryptDeep = (doc) => {
  decryptRequest(doc);
  decryptItems(doc.items);
  (doc.handovers || []).forEach((h) => decryptAmountField(h, 'amount_at_step'));
  return doc;
};

const plainGrandTotal = (doc) => (doc?.grand_total != null ? decrypt(String(doc.grand_total)) : null);

// Write an audit handover row inside a transaction
const logHandover = async (requestId, actionType, fromRoleId, toRoleId, employmentId, remarks, amount, t) => {
  await db.ProcurementHandover.create(
    {
      procurement_request_id: requestId,
      action_type: actionType,
      from_role_id: fromRoleId ?? null,
      to_role_id: toRoleId ?? null,
      action_by_employment_id: employmentId ?? null,
      amount_at_step: amount != null ? String(amount) : null,
      remarks: remarks || null,
    },
    { transaction: t },
  );
};

// Copy a source doc's line items — decrypts unit_price (so the target re-encrypts
// once) and recomputes the amounts server-side from qty × price × tax.
const copyItems = (sourceItems = []) =>
  sourceItems.map((it) => {
    const s = it.get ? it.get({ plain: true }) : it;
    return computeItemAmounts({
      item_name: s.item_name,
      description: s.description,
      category: s.category,
      quantity: s.quantity,
      unit: s.unit,
      unit_price: s.unit_price != null ? decrypt(String(s.unit_price)) : null,
      tax_rate: s.tax_rate,
    });
  });

// ── List / detail ──

export const getVisible = async (user, params = {}) => {
  let result;
  if (GLOBAL_ROLES.includes(user.roleCode)) {
    result = await procurementRepository.findAll({}, params);
  } else if (MANAGER_ROLES.includes(user.roleCode)) {
    const companyIds = await getActiveCompanyIdsByUser(user.userId);
    result = companyIds.length ? await procurementRepository.findByCompanyIds(companyIds, params) : { rows: [], total: 0 };
  } else {
    const employmentIds = await getEmploymentIdsByUser(user.userId);
    result = employmentIds.length ? await procurementRepository.findByEmploymentIds(employmentIds, params) : { rows: [], total: 0 };
  }
  (result.rows || []).forEach((r) => decryptRequest(r));
  return result;
};

export const getByUuid = async (uuid, user) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');

  const [employmentIds, companyIds] = await Promise.all([
    getEmploymentIdsByUser(user.userId),
    getActiveCompanyIdsByUser(user.userId),
  ]);
  const visible =
    GLOBAL_ROLES.includes(user.roleCode) ||
    employmentIds.includes(doc.requested_by_employment_id) ||
    companyIds.includes(doc.company_id);
  if (!visible) throw ApiError.notFound('Procurement document not found');

  return decryptDeep(doc);
};

// ── Create / update (PI) ──

export const create = async (user, data) => {
  const { company_uuid, vendor_uuid, items = [], ...rest } = data;

  const company = await companyRepository.findByUuid(company_uuid);
  if (!company) throw ApiError.notFound('Referenced company not found');
  let vendor = null;
  if (vendor_uuid) {
    vendor = await Vendor.findOne({ where: { uuid: vendor_uuid } });
    if (!vendor) throw ApiError.notFound('Referenced vendor not found');
  }
  // The requester must be actively employed at the selected company
  const employment =
    (await getActiveEmploymentByUserAndCompany(user.userId, company.id)) ??
    (await getActiveEmploymentByUser(user.userId));
  if (!employment) throw ApiError.notFound('No active employment found for the user');

  const totals = computeTotals(items);
  const documentNumber = await generateDocumentNumber('PI');

  return sequelize.transaction(async (t) => {
    const doc = await db.ProcurementRequest.create(
      {
        ...rest,
        request_type: 'PI',
        document_number: documentNumber,
        status: 'DRAFT',
        company_id: company.id,
        vendor_id: vendor?.id ?? null,
        requested_by_employment_id: employment.id,
        current_role_id: null,
        ...totals,
      },
      { transaction: t },
    );
    await procurementRepository.replaceItems(doc.id, items.map(computeItemAmounts), t);
    return procurementRepository.findByUuid(doc.uuid, t);
  });
};

export const update = async (uuid, user, data) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.request_type !== 'PI') throw ApiError.badRequest('Only a PI can be edited');
  if (doc.status !== 'DRAFT') throw ApiError.badRequest('Only a draft PI can be edited');

  const employmentIds = await getEmploymentIdsByUser(user.userId);
  const isRequester = employmentIds.includes(doc.requested_by_employment_id);
  if (!isRequester && !['SUPER_ADMIN', 'ADMIN_MGR'].includes(user.roleCode)) {
    throw ApiError.forbidden('You can only edit your own draft PI');
  }

  const { company_uuid, vendor_uuid, items, ...rest } = data;
  if (company_uuid) {
    const company = await companyRepository.findByUuid(company_uuid);
    if (!company) throw ApiError.notFound('Referenced company not found');
    rest.company_id = company.id;
  }
  if (vendor_uuid !== undefined) {
    rest.vendor_id = vendor_uuid ? (await Vendor.findOne({ where: { uuid: vendor_uuid } }))?.id ?? null : null;
    if (vendor_uuid && !rest.vendor_id) throw ApiError.notFound('Referenced vendor not found');
  }

  const totals = items !== undefined ? computeTotals(items) : {};

  return sequelize.transaction(async (t) => {
    await doc.update({ ...rest, ...totals }, { transaction: t });
    if (items !== undefined) {
      await procurementRepository.replaceItems(doc.id, items.map(computeItemAmounts), t);
    }
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const deleteRecord = async (uuid, user) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.request_type !== 'PI' || doc.status !== 'DRAFT') {
    throw ApiError.badRequest('Only a draft PI can be deleted');
  }
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (!employmentIds.includes(doc.requested_by_employment_id) && !['SUPER_ADMIN', 'ADMIN_MGR'].includes(user.roleCode)) {
    throw ApiError.forbidden('You can only delete your own draft PI');
  }
  await procurementRepository.deleteRecord(uuid);
  return { message: 'Procurement request deleted successfully' };
};

// ── Workflow actions ──

export const submit = async (uuid, user, remarks) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.request_type !== 'PI') throw ApiError.badRequest('Only a PI can be submitted');
  if (doc.status !== 'DRAFT') throw ApiError.badRequest('Only a draft PI can be submitted');

  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (!employmentIds.includes(doc.requested_by_employment_id) && user.roleCode !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('You can only submit your own PI');
  }

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN') {
    await requireHandoverRule(actorRole.id, ROLE_IDS.ADMIN_MGR);
  }
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await doc.update(
      { status: 'SUBMITTED', current_role_id: ROLE_IDS.ADMIN_MGR, current_employment_id: null },
      { transaction: t },
    );
    await logHandover(doc.id, 'SUBMIT', actorRole?.id, ROLE_IDS.ADMIN_MGR, actorEmployment?.id, remarks, plainGrandTotal(doc), t);
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const approve = async (uuid, user, remarks) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');

  const step = APPROVAL_STEPS[`${doc.request_type}:${doc.status}`];
  if (!step) throw ApiError.badRequest('This document is not pending approval');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && doc.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can approve this document');
  }
  if (step.next_role) {
    await requireHandoverRule(doc.current_role_id, step.next_role);
  }
  const fromRole = doc.current_role_id;
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await doc.update(
      { status: step.next_status, current_role_id: step.next_role, current_employment_id: null },
      { transaction: t },
    );
    await logHandover(doc.id, 'APPROVE', fromRole, step.next_role, actorEmployment?.id, remarks, plainGrandTotal(doc), t);
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const reject = async (uuid, user, remarks) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.status === 'REJECTED' || doc.status === 'PAID') throw ApiError.badRequest('This document is already closed');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && doc.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can reject this document');
  }
  const fromRole = doc.current_role_id;
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await doc.update({ status: 'REJECTED', current_role_id: null, current_employment_id: null }, { transaction: t });
    await logHandover(doc.id, 'REJECT', fromRole, null, actorEmployment?.id, remarks, plainGrandTotal(doc), t);
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const createPr = async (uuid, user) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.request_type !== 'PI') throw ApiError.badRequest('A purchase request can only be created from a PI');
  if (doc.status !== 'APPROVED') throw ApiError.badRequest('The PI must be approved before creating a PR');

  await requireHandoverRule(ROLE_IDS.ADMIN_MGR, ROLE_IDS.HOD);
  const actorEmployment = await getActiveEmploymentByUser(user.userId);
  const documentNumber = await generateDocumentNumber('PR');

  return sequelize.transaction(async (t) => {
    const pr = await db.ProcurementRequest.create(
      {
        request_type: 'PR',
        document_number: documentNumber,
        parent_id: doc.id,
        title: doc.title,
        company_id: doc.company_id,
        vendor_id: doc.vendor_id,
        status: 'SUBMITTED',
        current_role_id: ROLE_IDS.HOD,
        current_employment_id: null,
        requested_by_employment_id: doc.requested_by_employment_id,
        total_amount: doc.total_amount != null ? decrypt(String(doc.total_amount)) : null,
        tax_amount: doc.tax_amount != null ? decrypt(String(doc.tax_amount)) : null,
        grand_total: doc.grand_total != null ? decrypt(String(doc.grand_total)) : null,
        vendor_contact: doc.vendor_contact,
        delivery_address: doc.delivery_address,
        expected_delivery_date: doc.expected_delivery_date,
        payment_terms: doc.payment_terms,
        notes: doc.notes,
      },
      { transaction: t },
    );
    const copiedItems = copyItems(doc.items);
    if (copiedItems.length) {
      await db.ProcurementItem.bulkCreate(
        copiedItems.map((it, i) => ({ ...it, procurement_request_id: pr.id, sort_order: i })),
        { transaction: t, individualHooks: true },
      );
    }
    await logHandover(pr.id, 'CREATE_PR', ROLE_IDS.ADMIN_MGR, ROLE_IDS.HOD, actorEmployment?.id, null, plainGrandTotal(doc), t);
    return procurementRepository.findByUuid(pr.uuid, t);
  });
};

export const createPo = async (uuid, user) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.request_type !== 'PR') throw ApiError.badRequest('A purchase order can only be created from a PR');
  if (doc.status !== 'APPROVED') throw ApiError.badRequest('The PR must be approved before creating a PO');

  const actorEmployment = await getActiveEmploymentByUser(user.userId);
  const documentNumber = await generateDocumentNumber('PO');

  return sequelize.transaction(async (t) => {
    const po = await db.ProcurementRequest.create(
      {
        request_type: 'PO',
        document_number: documentNumber,
        parent_id: doc.id,
        title: doc.title,
        company_id: doc.company_id,
        vendor_id: doc.vendor_id,
        status: 'CREATED',
        current_role_id: ROLE_IDS.ADMIN_MGR,
        current_employment_id: null,
        requested_by_employment_id: doc.requested_by_employment_id,
        total_amount: doc.total_amount != null ? decrypt(String(doc.total_amount)) : null,
        tax_amount: doc.tax_amount != null ? decrypt(String(doc.tax_amount)) : null,
        grand_total: doc.grand_total != null ? decrypt(String(doc.grand_total)) : null,
        vendor_contact: doc.vendor_contact,
        delivery_address: doc.delivery_address,
        expected_delivery_date: doc.expected_delivery_date,
        payment_terms: doc.payment_terms,
        notes: doc.notes,
      },
      { transaction: t },
    );
    const copiedItems = copyItems(doc.items);
    if (copiedItems.length) {
      await db.ProcurementItem.bulkCreate(
        copiedItems.map((it, i) => ({ ...it, procurement_request_id: po.id, sort_order: i })),
        { transaction: t, individualHooks: true },
      );
    }
    await logHandover(po.id, 'CREATE_PO', ROLE_IDS.ADMIN_MGR, ROLE_IDS.ADMIN_MGR, actorEmployment?.id, null, plainGrandTotal(doc), t);
    return procurementRepository.findByUuid(po.uuid, t);
  });
};

export const received = async (uuid, user) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.request_type !== 'PO') throw ApiError.badRequest('Only a PO can be marked received');
  if (doc.status !== 'CREATED') throw ApiError.badRequest('Only a CREATED PO can be marked received');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && doc.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can mark this PO received');
  }
  await requireHandoverRule(ROLE_IDS.ADMIN_MGR, ROLE_IDS.FINANCE_MGR);
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await doc.update(
      { status: 'RECEIVED', received_date: new Date(), current_role_id: ROLE_IDS.FINANCE_MGR, current_employment_id: null },
      { transaction: t },
    );
    await logHandover(doc.id, 'RECEIVED', ROLE_IDS.ADMIN_MGR, ROLE_IDS.FINANCE_MGR, actorEmployment?.id, null, plainGrandTotal(doc), t);
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const pay = async (uuid, user, remarks) => {
  const doc = await procurementRepository.findByUuid(uuid);
  if (!doc) throw ApiError.notFound('Procurement document not found');
  if (doc.request_type !== 'PO') throw ApiError.badRequest('Only a PO can be paid');
  if (doc.status !== 'APPROVED') throw ApiError.badRequest('Only an APPROVED PO can be paid');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && doc.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the payment team can process payment for this PO');
  }
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await doc.update({ status: 'PAID', current_role_id: null, current_employment_id: null }, { transaction: t });
    await logHandover(doc.id, 'PAY', ROLE_IDS.PAYMENT_MGR, null, actorEmployment?.id, remarks, plainGrandTotal(doc), t);
    return procurementRepository.findByUuid(uuid, t);
  });
};

// ── Documents (uploaded file metadata, mirror the vendor document flow) ──

export const addDocument = async (data) => {
  const { procurement_uuid, ...docData } = data;
  const doc = await db.ProcurementRequest.findOne({ where: { uuid: procurement_uuid } });
  if (!doc) throw ApiError.notFound('Procurement document not found');
  return db.ProcurementDocument.create({ ...docData, procurement_request_id: doc.id });
};

export const deleteDocument = async (uuid) => {
  const doc = await db.ProcurementDocument.findOne({ where: { uuid } });
  if (!doc) throw ApiError.notFound('Document not found');
  await doc.destroy();
  return { message: 'Document deleted successfully' };
};
