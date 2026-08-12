import * as procurementRepository from './procurement.repository.js';
import * as companyRepository from '../company/company.repository.js';
import * as roleRepository from '../role/role.repository.js';
import * as expenseService from '../expense/expense.service.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
import { decrypt, decryptResults } from '../../utils/encryption.js';
import { getEmploymentIdsByUser, getActiveCompanyIdsByUser, getActiveEmploymentByUser, getActiveEmploymentByUserAndCompany } from '../../modules/user_employment/user_employment.service.js';

const { Vendor, RoleHandoverRule, ProcurementIntention, ProcurementRequest, ProcurementOrder, ProcurementQuotation, ProcurementItem, Expense, sequelize } = db;

// Role ids (see seeders/20260724000002-seed-roles.js)
const ROLE_IDS = {
  SUPER_ADMIN: 100,
  CFO: 101,
  PAYMENT_MGR: 102,
  FINANCE_MGR: 104,
  ADMIN_MGR: 106,
  HOD: 110,
};

// Who acts next after an APPROVE at the given (type, status).
// next_role null = no further approver (chain continues via a document action,
// e.g. the admin creating the PR/PO).
const APPROVAL_STEPS = {
  'PI:SUBMITTED': { next_status: 'APPROVED', next_role: null },
  // No separate PR approval: when the admin creates a PR from an approved PI it is
  // created directly in the quotation-gathering state (HOD_APPROVED), where the
  // admin fills quotations and runs submit-quotations. The requester's only action
  // is picking a quotation blind (select-quotation → QUOTATION_APPROVED for CFO).
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

// Header model + polymorphic owner column for a given type
const HEADER = {
  PI: { model: ProcurementIntention, ownerColumn: 'pi_id' },
  PR: { model: ProcurementRequest, ownerColumn: 'pr_id' },
  PO: { model: ProcurementOrder, ownerColumn: 'po_id' },
};

// Load a document, resolving which header table owns it.
const resolveDoc = async (uuid, t) => {
  const type = await procurementRepository.resolveType(uuid);
  if (!type) return null;
  const doc = await procurementRepository.findByUuid(uuid, t);
  return doc ? { type, doc } : null;
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
  decryptQuotations(doc.quotations);
  return doc;
};

const decryptQuotations = (quotations = []) => {
  quotations.forEach((q) => {
    decryptAmountField(q, 'total_amount');
    decryptAmountField(q, 'tax_amount');
    decryptAmountField(q, 'grand_total');
    decryptItems(q.items); // quotation line items carry encrypted amounts too
  });
  return quotations;
};

// Mask vendor identity for the requester ("blind" rule): the person who raised
// the PI must never see who might supply it, so null out the vendor link and any
// quotation files (a scanned quotation would reveal the vendor). Admin/finance/
// global roles keep the real vendor.
const maskVendorForRequester = (doc, employmentIds) => {
  const isRequester = employmentIds.includes(doc.requested_by_employment_id);
  if (!isRequester) return doc;
  doc.vendor_id = null;
  doc.vendor = null;
  (doc.quotations || []).forEach((q) => {
    q.vendor_id = null;
    q.vendor = null;
    q.file_path = null;
    q.original_file_name = null;
    q.stored_file_name = null;
  });
  return doc;
};

const plainGrandTotal = (doc) => (doc?.grand_total != null ? decrypt(String(doc.grand_total)) : null);

// Write an audit handover row inside a transaction — polymorphic parent column.
const logHandover = async ({ type, docId, actionType, fromRoleId, toRoleId, employmentId, remarks, amount, t }) => {
  const ownerColumn = HEADER[type].ownerColumn;
  await db.ProcurementHandover.create(
    {
      [ownerColumn]: docId,
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
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  let result;
  if (GLOBAL_ROLES.includes(user.roleCode)) {
    result = await procurementRepository.findAll({}, params);
  } else if (MANAGER_ROLES.includes(user.roleCode)) {
    const companyIds = await getActiveCompanyIdsByUser(user.userId);
    result = companyIds.length ? await procurementRepository.findByCompanyIds(companyIds, params) : { rows: [], total: 0 };
  } else {
    result = employmentIds.length ? await procurementRepository.findByEmploymentIds(employmentIds, params) : { rows: [], total: 0 };
  }
  result.rows = (result.rows || []).map((r) => {
    decryptRequest(r);
    maskVendorForRequester(r, employmentIds);
    return r;
  });
  return result;
};

export const getByUuid = async (uuid, user) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved) throw ApiError.notFound('Procurement document not found');

  const [employmentIds, companyIds] = await Promise.all([
    getEmploymentIdsByUser(user.userId),
    getActiveCompanyIdsByUser(user.userId),
  ]);
  const visible =
    GLOBAL_ROLES.includes(user.roleCode) ||
    employmentIds.includes(resolved.doc.requested_by_employment_id) ||
    companyIds.includes(resolved.doc.company_id);
  if (!visible) throw ApiError.notFound('Procurement document not found');

  // Work on a plain object so masking/decryption mutations survive JSON serialization
  const plain = resolved.doc.get({ plain: true });
  decryptDeep(plain);
  plain.request_type = resolved.type;
  plain.is_requester = employmentIds.includes(plain.requested_by_employment_id);

  // Price-comparison history across PI → PR → quotations → PO
  const chain = await procurementRepository.findByUuidWithChain(uuid);
  if (chain) {
    const toPlain = (v) => (v?.get ? v.get({ plain: true }) : v);
    const dec = (v) => (v ? (decryptRequest(v), decryptQuotations(v.quotations), v) : null);
    chain.pi = dec(toPlain(chain.pi));
    chain.pr = dec(toPlain(chain.pr));
    chain.po = dec(toPlain(chain.po));
    chain.quotations = decryptQuotations((chain.quotations || []).map((q) => (q.get ? q.get({ plain: true }) : q)));
    // hide vendors from the requester across the whole chain
    if (plain.is_requester) {
      [chain.pi, chain.pr, chain.po].forEach((v) => {
        if (v) { v.vendor_id = null; v.vendor = null; }
      });
      chain.quotations.forEach((q) => {
        q.vendor_id = null;
        q.vendor = null;
        q.file_path = null;
        q.original_file_name = null;
        q.stored_file_name = null;
      });
    }
    plain.price_history = chain;

    // Approval timeline spans the whole chain (PI → PR → PO), not just the
    // document being viewed — fetch every handover across the chain and merge
    // with the current document's own handovers, sorted chronologically.
    const chainHandovers = await procurementRepository.findChainHandovers({
      piId: chain.pi?.id,
      prId: chain.pr?.id,
      poId: chain.po?.id,
    });
    const decHandover = (h) => {
      const p = h?.get ? h.get({ plain: true }) : h;
      decryptAmountField(p, 'amount_at_step');
      return p;
    };
    const byUuid = new Map((plain.handovers || []).map((h) => [h.uuid, h]));
    chainHandovers.forEach((h) => {
      const p = decHandover(h);
      if (!byUuid.has(p.uuid)) byUuid.set(p.uuid, p);
    });
    plain.handovers = [...byUuid.values()].sort((a, b) => new Date(a.createdAt ?? a.created_at) - new Date(b.createdAt ?? b.created_at));
  }

  return maskVendorForRequester(plain, employmentIds);
};

// ── Create / update (PI) ──

export const create = async (user, data) => {
  const { company_uuid, items = [], ...rest } = data;

  const company = await companyRepository.findByUuid(company_uuid);
  if (!company) throw ApiError.notFound('Referenced company not found');
  // The requester must be actively employed at the selected company
  const employment =
    (await getActiveEmploymentByUserAndCompany(user.userId, company.id)) ??
    (await getActiveEmploymentByUser(user.userId));
  if (!employment) throw ApiError.notFound('No active employment found for the user');

  const totals = computeTotals(items);
  const documentNumber = await generateDocumentNumber('PI');

  return sequelize.transaction(async (t) => {
    const doc = await ProcurementIntention.create(
      {
        ...rest,
        document_number: documentNumber,
        status: 'DRAFT',
        company_id: company.id,
        requested_by_employment_id: employment.id,
        current_role_id: null,
        ...totals,
      },
      { transaction: t },
    );
    await procurementRepository.replaceItems('pi_id', doc.id, items.map(computeItemAmounts), t);
    return procurementRepository.findByUuid(doc.uuid, t);
  });
};

export const update = async (uuid, user, data) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PI') throw ApiError.notFound('Procurement document not found');
  const doc = resolved.doc;
  if (doc.status !== 'DRAFT') throw ApiError.badRequest('Only a draft PI can be edited');

  const employmentIds = await getEmploymentIdsByUser(user.userId);
  const isRequester = employmentIds.includes(doc.requested_by_employment_id);
  if (!isRequester && !['SUPER_ADMIN', 'ADMIN_MGR'].includes(user.roleCode)) {
    throw ApiError.forbidden('You can only edit your own draft PI');
  }

  const { company_uuid, items, ...rest } = data;
  if (company_uuid) {
    const company = await companyRepository.findByUuid(company_uuid);
    if (!company) throw ApiError.notFound('Referenced company not found');
    rest.company_id = company.id;
  }

  const totals = items !== undefined ? computeTotals(items) : {};

  return sequelize.transaction(async (t) => {
    await doc.update({ ...rest, ...totals }, { transaction: t });
    if (items !== undefined) {
      await procurementRepository.replaceItems('pi_id', doc.id, items.map(computeItemAmounts), t);
    }
    return procurementRepository.findByUuid(uuid, t);
  });
};

// Admin may adjust the PR's line items (qty / unit price) while quotations are
// still being gathered — before the requester selects one. Uses QUOTE_EDITABLE_STATUSES
// for consistency: the PR is created at HOD_APPROVED and stays editable through
// QUOTATION_SELECTION.
export const updateItems = async (uuid, user, items = []) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PR') throw ApiError.badRequest('Only a PR can have its line items updated');
  const pr = resolved.doc;
  if (!PR_ITEM_EDITABLE_STATUSES.includes(pr.status)) {
    throw ApiError.badRequest('PR line items can no longer be edited on this request');
  }
  if (!['SUPER_ADMIN', 'ADMIN_MGR'].includes(user.roleCode)) {
    throw ApiError.forbidden('Only admin can edit PR line items');
  }

  const totals = computeTotals(items);
  return sequelize.transaction(async (t) => {
    await pr.update({ ...totals }, { transaction: t });
    await procurementRepository.replaceItems('pr_id', pr.id, items.map(computeItemAmounts), t);
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const deleteRecord = async (uuid, user) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PI') throw ApiError.notFound('Procurement document not found');
  const doc = resolved.doc;
  if (doc.status !== 'DRAFT') {
    throw ApiError.badRequest('Only a draft PI can be deleted');
  }
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (!employmentIds.includes(doc.requested_by_employment_id) && !['SUPER_ADMIN', 'ADMIN_MGR'].includes(user.roleCode)) {
    throw ApiError.forbidden('You can only delete your own draft PI');
  }
  await procurementRepository.deleteRecord(uuid);
  return { message: 'Procurement request deleted successfully' };
};

// ── Quotations (admin fills them on a PR; requester picks one blind) ──

const ensureQuotationAdmin = (user) => {
  if (!['SUPER_ADMIN', 'ADMIN_MGR'].includes(user.roleCode)) {
    throw ApiError.forbidden('Only admin can manage quotations');
  }
};

// Quotations may be edited while the PR is still pre-selection: SUBMITTED (admin
// filling), HOD_APPROVED, or QUOTATION_SELECTION. Once the requester selects
// (QUOTATION_APPROVED) or beyond, quotations lock.
const QUOTE_EDITABLE_STATUSES = ['SUBMITTED', 'HOD_APPROVED', 'QUOTATION_SELECTION'];

// PR line items lock earlier: once quotations are submitted to the requester
// (QUOTATION_SELECTION) the admin can no longer change the qty/prices the
// requester is comparing. Quotations themselves stay editable through selection.
const PR_ITEM_EDITABLE_STATUSES = ['SUBMITTED', 'HOD_APPROVED'];

const loadPrForQuotation = async (uuid) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PR') throw ApiError.badRequest('Quotations can only be managed on a PR');
  if (!QUOTE_EDITABLE_STATUSES.includes(resolved.doc.status)) {
    throw ApiError.badRequest('Quotations can no longer be edited on this request');
  }
  return resolved.doc;
};

const findQuotationOn = async (pr, quotationUuid) => {
  const quotation = await ProcurementQuotation.findOne({
    where: { uuid: quotationUuid, pr_id: pr.id },
  });
  if (!quotation) throw ApiError.notFound('Quotation not found on this request');
  return quotation;
};

export const addQuotation = async (uuid, user, data) => {
  const { vendor_uuid, items = [], ...rest } = data;
  const pr = await loadPrForQuotation(uuid);
  ensureQuotationAdmin(user);

  const vendor = await Vendor.findOne({ where: { uuid: vendor_uuid } });
  if (!vendor) throw ApiError.notFound('Referenced vendor not found');
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  // Totals are computed server-side from the line items (qty × price × tax rate),
  // never trusted from the client.
  const totals = computeTotals(items);

  return sequelize.transaction(async (t) => {
    const quotation = await ProcurementQuotation.create(
      {
        ...rest,
        pr_id: pr.id,
        vendor_id: vendor.id,
        created_by_employment_id: actorEmployment?.id ?? null,
        ...totals,
      },
      { transaction: t },
    );
    if (items.length) {
      await procurementRepository.replaceItems('quotation_id', quotation.id, items.map(computeItemAmounts), t);
    }
    await logHandover({
      type: 'PR', docId: pr.id, actionType: 'ADD_QUOTATION',
      fromRoleId: null, toRoleId: null,
      employmentId: actorEmployment?.id, remarks: null, amount: totals.grand_total, t,
    });
    const created = await ProcurementQuotation.findOne({
      where: { uuid: quotation.uuid },
      include: [{ model: Vendor, as: 'vendor' }, { model: ProcurementItem, as: 'items' }],
      transaction: t,
    });
    return decryptQuotations([created])[0];
  });
};

export const updateQuotation = async (uuid, quotationUuid, user, data) => {
  const pr = await loadPrForQuotation(uuid);
  const quotation = await findQuotationOn(pr, quotationUuid);
  if (quotation.status !== 'ACTIVE') throw ApiError.badRequest('Only an ACTIVE quotation can be edited');
  ensureQuotationAdmin(user);

  const { vendor_uuid, items, ...rest } = data;
  const patch = { ...rest };
  if (vendor_uuid !== undefined) {
    const vendor = await Vendor.findOne({ where: { uuid: vendor_uuid } });
    if (!vendor) throw ApiError.notFound('Referenced vendor not found');
    patch.vendor_id = vendor.id;
  }
  // Totals are recomputed from the full item list when it's sent (the frontend
  // always sends it); otherwise the stored totals are kept untouched.
  const totals = items !== undefined ? computeTotals(items) : {};
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await quotation.update({ ...patch, ...totals }, { transaction: t });
    if (items !== undefined) {
      await procurementRepository.replaceItems('quotation_id', quotation.id, items.map(computeItemAmounts), t);
    }
    await logHandover({
      type: 'PR', docId: pr.id, actionType: 'UPDATE_QUOTATION',
      fromRoleId: null, toRoleId: null,
      employmentId: actorEmployment?.id, remarks: null, amount: totals.grand_total ?? plainGrandTotal(quotation), t,
    });
    const updated = await ProcurementQuotation.findOne({
      where: { uuid: quotation.uuid },
      include: [{ model: Vendor, as: 'vendor' }, { model: ProcurementItem, as: 'items' }],
      transaction: t,
    });
    return decryptQuotations([updated])[0];
  });
};

export const deleteQuotation = async (uuid, quotationUuid, user) => {
  const pr = await loadPrForQuotation(uuid);
  const quotation = await findQuotationOn(pr, quotationUuid);
  if (quotation.status !== 'ACTIVE') throw ApiError.badRequest('Only an ACTIVE quotation can be deleted');
  ensureQuotationAdmin(user);

  return sequelize.transaction(async (t) => {
    // Quotations are soft-deleted (paranoid), so the DB-level ON DELETE CASCADE on
    // quotation items never fires — force-delete them so they're not orphaned.
    await ProcurementItem.destroy({ where: { quotation_id: quotation.id }, force: true, transaction: t });
    await quotation.destroy({ transaction: t });
    return { message: 'Quotation deleted successfully' };
  });
};

export const submitQuotations = async (uuid, user) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PR') throw ApiError.badRequest('Quotations can only be submitted on a PR');
  const pr = resolved.doc;
  if (pr.status !== 'HOD_APPROVED') throw ApiError.badRequest('Only a HOD-approved PR can have its quotations submitted');
  ensureQuotationAdmin(user);

  const activeQuotations = await ProcurementQuotation.count({
    where: { pr_id: pr.id, status: 'ACTIVE' },
  });
  if (activeQuotations === 0) throw ApiError.badRequest('Add at least one quotation before submitting');

  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    // The requester becomes the handler; they must pick a quotation before CFO.
    await pr.update(
      {
        status: 'QUOTATION_SELECTION',
        current_role_id: null,
        current_employment_id: pr.requested_by_employment_id,
      },
      { transaction: t },
    );
    await logHandover({
      type: 'PR', docId: pr.id, actionType: 'SUBMIT_QUOTATIONS',
      fromRoleId: ROLE_IDS.ADMIN_MGR, toRoleId: null,
      employmentId: actorEmployment?.id, remarks: null, amount: plainGrandTotal(pr), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const selectQuotation = async (uuid, user, quotationUuid) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PR') throw ApiError.badRequest('A quotation can only be selected on a PR');
  const pr = resolved.doc;
  if (pr.status !== 'QUOTATION_SELECTION') throw ApiError.badRequest('Quotation selection is not open for this request');

  const employmentIds = await getEmploymentIdsByUser(user.userId);
  const isRequester = employmentIds.includes(pr.requested_by_employment_id);
  if (!isRequester && user.roleCode !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only the requester can select a quotation');
  }

  const quotation = await ProcurementQuotation.findOne({
    where: { uuid: quotationUuid, pr_id: pr.id, status: 'ACTIVE' },
  });
  if (!quotation) throw ApiError.notFound('Quotation not found on this request');

  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await quotation.update({ status: 'SELECTED' }, { transaction: t });
    await pr.update(
      {
        status: 'QUOTATION_APPROVED',
        current_role_id: ROLE_IDS.CFO,
        current_employment_id: null,
        vendor_id: quotation.vendor_id, // vendor revealed to approvers from here on
      },
      { transaction: t },
    );
    await logHandover({
      type: 'PR', docId: pr.id, actionType: 'SELECT_QUOTATION',
      fromRoleId: null, toRoleId: ROLE_IDS.CFO,
      employmentId: actorEmployment?.id, remarks: null, amount: plainGrandTotal(pr), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

// ── Workflow actions ──

export const submit = async (uuid, user, remarks) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PI') throw ApiError.badRequest('Only a PI can be submitted');
  const doc = resolved.doc;
  if (doc.status !== 'DRAFT') throw ApiError.badRequest('Only a draft PI can be submitted');

  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (!employmentIds.includes(doc.requested_by_employment_id) && user.roleCode !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('You can only submit your own PI');
  }

  // Raising + submitting a PI is gated by the procurement:create permission at the
  // route (role_permissions), not by a handover rule — so any role granted the
  // permission can submit their own PI to admin.
  const actorRole = await findRoleByCode(user.roleCode);
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await doc.update(
      { status: 'SUBMITTED', current_role_id: ROLE_IDS.ADMIN_MGR, current_employment_id: null },
      { transaction: t },
    );
    await logHandover({
      type: 'PI', docId: doc.id, actionType: 'SUBMIT',
      fromRoleId: actorRole?.id, toRoleId: ROLE_IDS.ADMIN_MGR,
      employmentId: actorEmployment?.id, remarks, amount: plainGrandTotal(doc), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const approve = async (uuid, user, remarks) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved) throw ApiError.notFound('Procurement document not found');
  const { type, doc } = resolved;

  const step = APPROVAL_STEPS[`${type}:${doc.status}`];
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
    await logHandover({
      type, docId: doc.id, actionType: 'APPROVE',
      fromRoleId: fromRole, toRoleId: step.next_role,
      employmentId: actorEmployment?.id, remarks, amount: plainGrandTotal(doc), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const reject = async (uuid, user, remarks) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved) throw ApiError.notFound('Procurement document not found');
  const { type, doc } = resolved;
  if (doc.status === 'REJECTED' || doc.status === 'PAID') throw ApiError.badRequest('This document is already closed');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && doc.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can reject this document');
  }
  const fromRole = doc.current_role_id;
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await doc.update({ status: 'REJECTED', current_role_id: null, current_employment_id: null }, { transaction: t });
    await logHandover({
      type, docId: doc.id, actionType: 'REJECT',
      fromRoleId: fromRole, toRoleId: null,
      employmentId: actorEmployment?.id, remarks, amount: plainGrandTotal(doc), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const createPr = async (uuid, user) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PI') throw ApiError.badRequest('A purchase request can only be created from a PI');
  const pi = resolved.doc;
  if (pi.status !== 'APPROVED') throw ApiError.badRequest('The PI must be approved before creating a PR');

  // Duplicate guard: only one PR per PI
  const existingPr = await ProcurementRequest.findOne({ where: { pi_id: pi.id } });
  if (existingPr) throw ApiError.badRequest('A purchase request has already been created for this PI');

  const actorEmployment = await getActiveEmploymentByUser(user.userId);
  const documentNumber = await generateDocumentNumber('PR');

  return sequelize.transaction(async (t) => {
    const pr = await ProcurementRequest.create(
      {
        document_number: documentNumber,
        pi_id: pi.id,
        title: pi.title,
        company_id: pi.company_id,
        // Created directly in the quotation-gathering state — no separate PR approval.
        // The admin fills quotations + edits line items here, then sends the PR to the
        // requester to pick a quotation blind.
        status: 'HOD_APPROVED',
        current_role_id: null,
        current_employment_id: null,
        requested_by_employment_id: pi.requested_by_employment_id,
        total_amount: pi.total_amount != null ? decrypt(String(pi.total_amount)) : null,
        tax_amount: pi.tax_amount != null ? decrypt(String(pi.tax_amount)) : null,
        grand_total: pi.grand_total != null ? decrypt(String(pi.grand_total)) : null,
        expected_delivery_date: pi.expected_delivery_date,
        notes: pi.notes,
      },
      { transaction: t },
    );
    const copiedItems = copyItems(pi.items);
    if (copiedItems.length) {
      await db.ProcurementItem.bulkCreate(
        copiedItems.map((it, i) => ({ ...it, pr_id: pr.id, sort_order: i })),
        { transaction: t, individualHooks: true },
      );
    }
    await logHandover({
      type: 'PR', docId: pr.id, actionType: 'CREATE_PR',
      fromRoleId: ROLE_IDS.ADMIN_MGR, toRoleId: null,
      employmentId: actorEmployment?.id, remarks: null, amount: plainGrandTotal(pi), t,
    });
    return procurementRepository.findByUuid(pr.uuid, t);
  });
};

export const createPo = async (uuid, user) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PR') throw ApiError.badRequest('A purchase order can only be created from a PR');
  const pr = resolved.doc;
  if (pr.status !== 'APPROVED') throw ApiError.badRequest('The PR must be approved before creating a PO');
  if (!pr.vendor_id) throw ApiError.badRequest('The PR has no selected vendor yet');

  // Duplicate guard: only one PO per PR
  const existingPo = await ProcurementOrder.findOne({ where: { pr_id: pr.id } });
  if (existingPo) throw ApiError.badRequest('A purchase order has already been created for this PR');

  const actorEmployment = await getActiveEmploymentByUser(user.userId);
  const documentNumber = await generateDocumentNumber('PO');

  return sequelize.transaction(async (t) => {
    const po = await ProcurementOrder.create(
      {
        document_number: documentNumber,
        pr_id: pr.id,
        title: pr.title,
        company_id: pr.company_id,
        vendor_id: pr.vendor_id,
        status: 'CREATED',
        current_role_id: ROLE_IDS.ADMIN_MGR,
        current_employment_id: null,
        requested_by_employment_id: pr.requested_by_employment_id,
        total_amount: pr.total_amount != null ? decrypt(String(pr.total_amount)) : null,
        tax_amount: pr.tax_amount != null ? decrypt(String(pr.tax_amount)) : null,
        grand_total: pr.grand_total != null ? decrypt(String(pr.grand_total)) : null,
        expected_delivery_date: pr.expected_delivery_date,
        notes: pr.notes,
      },
      { transaction: t },
    );
    const copiedItems = copyItems(pr.items);
    if (copiedItems.length) {
      await db.ProcurementItem.bulkCreate(
        copiedItems.map((it, i) => ({ ...it, po_id: po.id, sort_order: i })),
        { transaction: t, individualHooks: true },
      );
    }
    await logHandover({
      type: 'PO', docId: po.id, actionType: 'CREATE_PO',
      fromRoleId: ROLE_IDS.ADMIN_MGR, toRoleId: ROLE_IDS.ADMIN_MGR,
      employmentId: actorEmployment?.id, remarks: null, amount: plainGrandTotal(pr), t,
    });
    // Link the expense to this PO. If the PR was already converted to an expense
    // (Convert to Expense), reuse it and just attach the PO link — never duplicate.
    // Same transaction as the PO — atomic.
    const existingExpense = await Expense.findOne({ where: { procurement_pr_id: pr.id }, transaction: t });
    if (existingExpense) {
      await existingExpense.update({ procurement_po_id: po.id }, { transaction: t });
    } else {
      await expenseService.createProcurementExpense({ po, t });
    }
    return procurementRepository.findByUuid(po.uuid, t);
  });
};

// Admin converts a quotation-approved PR into an expense (category PROCUREMENT) so it
// shows in All Expenses and flows through the expense approval chain. Only valid once
// a quotation is approved (selected) and before a PO is created (the PO auto-creates
// its own expense). One expense per chain — guarded against duplicates.
export const convertToExpense = async (uuid, user) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PR') throw ApiError.badRequest('Only a PR can be converted to an expense');
  const pr = resolved.doc;

  if (!['QUOTATION_APPROVED', 'APPROVED'].includes(pr.status)) {
    throw ApiError.badRequest('Convert the request to an expense only after its quotation is approved');
  }
  if (!['SUPER_ADMIN', 'ADMIN_MGR'].includes(user.roleCode)) {
    throw ApiError.forbidden('Only admin can convert this request to an expense');
  }

  // The approved quotation carries the agreed amount
  const quotation = await ProcurementQuotation.findOne({ where: { pr_id: pr.id, status: 'SELECTED' } });
  if (!quotation) throw ApiError.badRequest('This request has no approved quotation to convert');

  const existingPo = await ProcurementOrder.findOne({ where: { pr_id: pr.id } });
  if (existingPo) throw ApiError.badRequest('The PO already created the expense for this chain — use the linked expense');

  const existingExpense = await Expense.findOne({ where: { procurement_pr_id: pr.id } });
  if (existingExpense) throw ApiError.badRequest('This request has already been converted to an expense');

  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await expenseService.createProcurementExpenseFromQuotation({ pr, quotation, t });
    await logHandover({
      type: 'PR', docId: pr.id, actionType: 'CONVERT_TO_EXPENSE',
      fromRoleId: ROLE_IDS.ADMIN_MGR, toRoleId: ROLE_IDS.ADMIN_MGR,
      employmentId: actorEmployment?.id, remarks: null, amount: plainGrandTotal(pr), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const received = async (uuid, user) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PO') throw ApiError.badRequest('Only a PO can be marked received');
  const po = resolved.doc;
  if (po.status !== 'CREATED') throw ApiError.badRequest('Only a CREATED PO can be marked received');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && po.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can mark this PO received');
  }
  await requireHandoverRule(ROLE_IDS.ADMIN_MGR, ROLE_IDS.FINANCE_MGR);
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await po.update(
      { status: 'RECEIVED', received_date: new Date(), current_role_id: ROLE_IDS.FINANCE_MGR, current_employment_id: null },
      { transaction: t },
    );
    await logHandover({
      type: 'PO', docId: po.id, actionType: 'RECEIVED',
      fromRoleId: ROLE_IDS.ADMIN_MGR, toRoleId: ROLE_IDS.FINANCE_MGR,
      employmentId: actorEmployment?.id, remarks: null, amount: plainGrandTotal(po), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

export const pay = async (uuid, user, remarks) => {
  const resolved = await resolveDoc(uuid);
  if (!resolved || resolved.type !== 'PO') throw ApiError.badRequest('Only a PO can be paid');
  const po = resolved.doc;
  if (po.status !== 'APPROVED') throw ApiError.badRequest('Only an APPROVED PO can be paid');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && po.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the payment team can process payment for this PO');
  }
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await po.update({ status: 'PAID', current_role_id: null, current_employment_id: null }, { transaction: t });
    await logHandover({
      type: 'PO', docId: po.id, actionType: 'PAY',
      fromRoleId: ROLE_IDS.PAYMENT_MGR, toRoleId: null,
      employmentId: actorEmployment?.id, remarks, amount: plainGrandTotal(po), t,
    });
    return procurementRepository.findByUuid(uuid, t);
  });
};

// ── Documents (uploaded file metadata, mirror the vendor document flow) ──

export const addDocument = async (data) => {
  const { procurement_uuid, quotation_uuid, ...docData } = data;
  const resolved = await resolveDoc(procurement_uuid);
  if (!resolved) throw ApiError.notFound('Procurement document not found');

  let quotationId = null;
  if (quotation_uuid) {
    const quotation = await ProcurementQuotation.findOne({
      where: { uuid: quotation_uuid, pr_id: resolved.doc.id },
    });
    if (!quotation) throw ApiError.notFound('Quotation not found on this request');
    quotationId = quotation.id;
  }

  // A document attached to a quotation lives only under that quotation (linked by
  // procurement_quotation_id) — it must NOT also carry the parent header's owner
  // column, otherwise it duplicates into the header's Documents section. Documents
  // without a quotation attach to the header owner column as before.
  const owner = quotationId
    ? { procurement_quotation_id: quotationId }
    : { [HEADER[resolved.type].ownerColumn]: resolved.doc.id };

  return db.ProcurementDocument.create({ ...docData, ...owner });
};

export const deleteDocument = async (uuid) => {
  const doc = await db.ProcurementDocument.findOne({ where: { uuid } });
  if (!doc) throw ApiError.notFound('Document not found');
  await doc.destroy();
  return { message: 'Document deleted successfully' };
};
