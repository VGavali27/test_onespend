import * as expenseRepository from './expense.repository.js';
import * as companyRepository from '../company/company.repository.js';
import * as roleRepository from '../role/role.repository.js';
import * as procurementRepository from '../procurement/procurement.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
import { decrypt, decryptResults } from '../../utils/encryption.js';
import { getEmploymentIdsByUser, getActiveCompanyIdsByUser, getActiveEmploymentByUser } from '../../modules/user_employment/user_employment.service.js';

const {
  ExpenseCategory,
  User,
  Expense,
  ExpenseHandover,
  RoleHandoverRule,
  UserEmployment,
  ProcurementOrder,
  sequelize,
} = db;

// Roles that see every company's expenses (global visibility). ADMIN_MGR is included
// because the procurement admin converts quotes into expenses (Convert to Expense) and
// must be able to see the result in All Expenses.
export const EXPENSE_GLOBAL_ROLES = ['SUPER_ADMIN', 'CFO', 'ADMIN_MGR'];

// Roles allowed to view the "all expenses" list (everyone else uses /expenses/my)
// Also used for /expenses/assigned (expenses pending approval for the user's role)
export const EXPENSE_MANAGER_ROLES = [
  'SUPER_ADMIN',
  'CFO',
  'ADMIN_MGR',
  'PAYMENT_MGR',
  'PAYMENT_JR',
  'FINANCE_MGR',
  'FINANCE_JR',
  'TRAVEL_MGR',
  'HOD',
  'EMP_MGR',
];

// Persist uploaded attachments as expense_documents, each linked to its own sub-part record
// (module_name + module_record_id). `sourceItems` are the submitted payload rows (with
// attachments); `createdRows` are the DB instances just inserted (they carry the new ids).
const createDocuments = async (expenseId, moduleName, sourceItems, createdRows, uploadedByEmploymentId, t) => {
  for (let i = 0; i < sourceItems.length; i++) {
    const attachments = sourceItems[i].attachments;
    const recordId = createdRows[i]?.id;
    if (!attachments?.length || !recordId) continue;
    await db.ExpenseDocument.bulkCreate(
      attachments.map((a) => ({
        expense_id: expenseId,
        module_name: moduleName,
        module_record_id: recordId,
        original_file_name: a.original_file_name,
        stored_file_name: (a.url || '').split('/').pop(),
        file_path: a.url,
        mime_type: a.mime_type,
        file_extension: a.file_extension,
        file_size: a.file_size,
        uploaded_by_employment_id: uploadedByEmploymentId,
      })),
      { transaction: t },
    );
  }
};

// Generate expense number: EXP-YYYYMMDD-XXXX
const generateExpenseNumber = async () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const pattern = `EXP-${dateStr}-%`;
  const last = await expenseRepository.findLatestExpenseNumber(pattern);
  let seq = 1;
  if (last) {
    const parts = last.expense_number.split('-');
    seq = parseInt(parts[2], 10) + 1; // "EXP-YYYYMMDD-SEQ" → seq is at index 2
  }
  return `EXP-${dateStr}-${String(seq).padStart(4, '0')}`;
};

// Attach a `canEdit` flag to each row — a user may edit an expense only while it's
// DRAFT and they are the one who created it (the backend also enforces this on PUT).
const markCanEdit = (rows, employmentIds) => {
  (rows || []).forEach((r) => {
    const isRequester = employmentIds.includes(r.requested_by_employment_id);
    r.setDataValue(
      'canEdit',
      r.status === 'DRAFT' || (r.status === 'REJECTED' && isRequester),
    );
  });
  return rows;
};

// Expenses the logged-in user created (under any of their employments) — paginated.
export const getMyExpenses = async (userId, params = {}) => {
  const employmentIds = await getEmploymentIdsByUser(userId);
  if (employmentIds.length === 0) return { rows: [], total: 0 };
  const result = await expenseRepository.findByEmploymentIds(employmentIds, params);
  if (params.decrypt) decryptResults(result.rows);
  markCanEdit(result.rows, employmentIds);
  return result;
};

// Scoped "all expenses" list — global roles (SUPER_ADMIN/CFO) see everything, other
// expense-manager roles see only the companies they're actively employed in. Paginated.
// DRAFT expenses are excluded from this list — only "My Expenses" surfaces them so a
// requester can continue their own drafts. Status filter (if any) is applied on top.
export const getVisible = async (user, params = {}) => {
  const visibility = EXPENSE_GLOBAL_ROLES.includes(user.roleCode)
    ? {}
    : await getActiveCompanyIdsByUser(user.userId);

  const scope =
    EXPENSE_GLOBAL_ROLES.includes(user.roleCode)
      ? {}
      : visibility.length > 0
        ? { company_id: { [db.Sequelize.Op.in]: visibility } }
        : null;

  if (scope === null) return { rows: [], total: 0 };

  const where = { ...scope, status: { [db.Sequelize.Op.ne]: 'DRAFT' } };
  const result = await expenseRepository.findAll(where, params);
  if (params.decrypt) decryptResults(result.rows);
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  markCanEdit(result.rows, employmentIds);
  return result;
};

// Expenses assigned to the logged-in user's role (current_role_id = their role) and
// scoped to the companies they're actively employed in — so a FINANCE_MGR only sees the
// expenses pending their approval in the companies they belong to. SUPER_ADMIN/CFO are
// global and see every assigned expense regardless of company. Paginated.
export const getAssigned = async (user, params = {}) => {
  const role = await roleRepository.findByCode(user.roleCode);
  if (!role) return { rows: [], total: 0 };

  let companyIds = [];
  if (!EXPENSE_GLOBAL_ROLES.includes(user.roleCode)) {
    companyIds = await getActiveCompanyIdsByUser(user.userId);
  }

  const where = { current_role_id: role.id, status: 'SUBMITTED' };
  if (companyIds.length > 0) where.company_id = { [db.Sequelize.Op.in]: companyIds };

  const result = await expenseRepository.findAll(where, params);
  if (params.decrypt) decryptResults(result.rows);
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  markCanEdit(result.rows, employmentIds);
  return result;
};

// Decrypt an expense and its nested module children (travel children, reimbursement items)
const decryptExpenseDeep = (expense) => {
  decryptResults(expense); // top-level amounts

  const travel = expense?.travelExpense;
  if (travel) {
    decryptResults(travel);
    (travel.segments || []).forEach((s) => decryptResults(s));
    (travel.accommodations || []).forEach((a) => decryptResults(a));
    (travel.forex || []).forEach((f) => decryptResults(f));
    (travel.localTransports || []).forEach((lt) => decryptResults(lt));
    (travel.miscExpenses || []).forEach((m) => decryptResults(m));
  }

  const reimbursement = expense?.reimbursementExpense;
  if (reimbursement) {
    decryptResults(reimbursement);
    (reimbursement.items || []).forEach((i) => decryptResults(i));
  }

  return expense;
};

// Build a compact procurement-chain summary (PI → PR → quotations → PO) plus the chain's
// approval logs, shown on the expense detail of a PO-created expense. Vendor
// is masked for the requester (consistent with the procurement module); amounts decrypted.
// Now expense is the parent: we find the PO via expense_id, then follow PR → PI.
const buildProcurementChain = async (expense, requesterIsOwner) => {
  // Find the PO linked to this expense (expense is parent, PO has expense_id)
  const po = await ProcurementOrder.findOne({ where: { expense_id: expense.id } });
  if (!po) return null;

  const chain = await procurementRepository.findChainByPrId(po.pr_id);
  if (!chain) return null;
  const { pi, pr, quotations, po: chainPo } = chain;

  const fin = (v) => (v != null ? Number(decrypt(String(v))) || null : null);
  const vendorOf = (doc) => (requesterIsOwner ? null : doc?.vendor?.name || null);
  const handovers = await procurementRepository.findChainHandovers({ piId: pi?.id, prId: pr.id, poId: chainPo?.id });

  // Find the selected quotation (status = 'SELECTED')
  const selectedQuotation = (quotations || []).find(q => q.status === 'SELECTED');

  return {
    pi: pi ? { uuid: pi.uuid, document_number: pi.document_number, title: pi.title, status: pi.status, grand_total: fin(pi.grand_total) } : null,
    pr: { uuid: pr.uuid, document_number: pr.document_number, title: pr.title, status: pr.status, vendor: vendorOf(pr), grand_total: fin(pr.grand_total) },
    quotations: (quotations || []).map((q) => ({
      uuid: q.uuid,
      vendor: vendorOf(q),
      status: q.status,
      valid_until: q.valid_until,
      total_amount: fin(q.total_amount),
      tax_amount: fin(q.tax_amount),
      grand_total: fin(q.grand_total),
    })),
    // Include selected quotation with its items for display on expense detail
    selectedQuotation: selectedQuotation ? {
      uuid: selectedQuotation.uuid,
      vendor: vendorOf(selectedQuotation),
      status: selectedQuotation.status,
      valid_until: selectedQuotation.valid_until,
      total_amount: fin(selectedQuotation.total_amount),
      tax_amount: fin(selectedQuotation.tax_amount),
      grand_total: fin(selectedQuotation.grand_total),
      items: (selectedQuotation.items || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: fin(item.unit_price),
        tax_rate: item.tax_rate,
        total_with_tax: fin(item.total_with_tax),
      })),
    } : null,
    po: chainPo ? { uuid: chainPo.uuid, document_number: chainPo.document_number, status: chainPo.status, vendor: vendorOf(chainPo), grand_total: fin(chainPo.grand_total) } : null,
    handovers: (handovers || []).map((h) => {
      const p = h.get ? h.get({ plain: true }) : h;
      const u = p.actionBy?.user;
      return {
        action_type: p.action_type,
        remarks: p.remarks,
        from_role: p.fromRole?.name,
        to_role: p.toRole?.name,
        action_by: u ? [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email : null,
        created_at: p.created_at ?? p.createdAt,
      };
    }),
  };
};

// Fetch a single expense by UUID — visible only to the creator, global roles, or users
// employed in the expense's company. Returns 404 (not 403) so hidden expenses don't leak.
export const getByUuid = async (uuid, user, decrypt = false) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');

  const [employmentIds, companyIds] = await Promise.all([
    getEmploymentIdsByUser(user.userId),
    getActiveCompanyIdsByUser(user.userId),
  ]);
  const visible =
    EXPENSE_GLOBAL_ROLES.includes(user.roleCode) ||
    employmentIds.includes(expense.requested_by_employment_id) ||
    companyIds.includes(expense.company_id);

  if (!visible) throw ApiError.notFound('Expense not found');

  expense.setDataValue('canEdit', (expense.status === 'DRAFT' || expense.status === 'REJECTED') && employmentIds.includes(expense.requested_by_employment_id));

  return decrypt ? decryptExpenseDeep(expense) : expense;
};

// Lazy-load the source procurement chain for a procurement-linked expense (PO-created).
// Called only when the frontend expands the "Procurement history" section —
// the detail response no longer carries it, keeping the default detail call light.
export const getProcurementChain = async (uuid, user) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');

  const [employmentIds, companyIds] = await Promise.all([
    getEmploymentIdsByUser(user.userId),
    getActiveCompanyIdsByUser(user.userId),
  ]);
  const visible =
    EXPENSE_GLOBAL_ROLES.includes(user.roleCode) ||
    employmentIds.includes(expense.requested_by_employment_id) ||
    companyIds.includes(expense.company_id);
  if (!visible) throw ApiError.notFound('Expense not found');

  // Check if this expense has a linked procurement order (via expense_id on PO)
  const po = await ProcurementOrder.findOne({ where: { expense_id: expense.id } });
  if (!po) {
    return { procurement_chain: null };
  }

  const requesterIsOwner = employmentIds.includes(expense.requested_by_employment_id);
  const chain = await buildProcurementChain(expense, requesterIsOwner);
  return { procurement_chain: chain };
};

// Create an expense — handles nested module data based on category (travel, etc.)
export const create = async (data) => {
  const category = await ExpenseCategory.findOne({ where: { uuid: data.category_uuid } });
  if (!category) throw ApiError.notFound('Referenced expense category not found');
  const company = await companyRepository.findByUuid(data.company_uuid);
  if (!company) throw ApiError.notFound('Referenced company not found');
  const user = await User.findOne({ where: { uuid: data.requested_by_user_uuid } });
  if (!user) throw ApiError.notFound('Referenced user not found');
  const employment = await getActiveEmploymentByUser(user.id);
  if (!employment) throw ApiError.notFound('No active employment found for the user');

  const expenseNumber = await generateExpenseNumber();
  const travelFields = {};
  const travelChildFields = {};
  if (category.module === 'travel') {
    travelFields.travel_type = data.travel_type;
    travelFields.purpose = data.purpose;
    travelFields.travel_start_date = data.travel_start_date;
    travelFields.travel_end_date = data.travel_end_date;
    travelFields.total_travellers = data.total_travellers || 1;
    travelFields.notes = data.notes || null;
    travelChildFields.segments = data.segments || [];
    travelChildFields.accommodations = data.accommodations || [];
    travelChildFields.local_transports = data.local_transports || [];
    travelChildFields.forex = data.forex || [];
    travelChildFields.misc_expenses = data.misc_expenses || [];
  }

  const reimbursementItems = data.items || [];
  const reimbursementFields = {};
  if (category.module === 'reimbursement') {
    reimbursementFields.advance_amount = data.advance_amount || null;
    reimbursementFields.advance_date = data.advance_date || null;
    reimbursementFields.payment_method = data.payment_method || 'CASH';
    reimbursementFields.remarks = data.remarks || null;
  }

  const {
    category_uuid,
    company_uuid,
    requested_by_user_uuid,
    travel_type,
    purpose,
    travel_start_date,
    travel_end_date,
    total_travellers,
    notes,
    segments,
    accommodations,
    local_transports,
    forex,
    misc_expenses,
    advance_amount,
    advance_date,
    payment_method,
    items,
    ...expenseData
  } = data;

  // Backend-computed estimated amount from the line items (the frontend doesn't send it)
  const computedEstimated =
    category.module === 'travel'
      ? (segments || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
        (accommodations || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
        (local_transports || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
        (forex || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
        (misc_expenses || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0)
      : category.module === 'reimbursement'
        ? (items || []).reduce((s, x) => s + (Number(x.total_amount) || 0), 0)
        : null;

  return sequelize.transaction(async (t) => {
    const expense = await db.Expense.create(
      {
        ...expenseData,
        estimated_amount: computedEstimated ?? expenseData.estimated_amount ?? null,
        expense_number: expenseNumber,
        category_id: category.id,
        company_id: company.id,
        requested_by_employment_id: employment.id,
        status: 'DRAFT',
      },
      { transaction: t },
    );

    if (category.module === 'travel' && travelFields.travel_type) {
      const travelExpense = await db.TravelExpense.create(
        {
          expense_id: expense.id,
          ...travelFields,
        },
        { transaction: t },
      );

      if (travelChildFields.segments.length > 0) {
        const created = await db.TravelExpenseSegment.bulkCreate(
          travelChildFields.segments.map(({ attachments: _a, ...s }) => ({ ...s, travel_expense_id: travelExpense.id })),
          { transaction: t, individualHooks: true }, // run beforeCreate → encrypt amounts
        );
        await createDocuments(expense.id, 'travel_segment', travelChildFields.segments, created, employment.id, t);
      }
      if (travelChildFields.accommodations.length > 0) {
        const created = await db.TravelExpenseAccommodation.bulkCreate(
          travelChildFields.accommodations.map(({ attachments: _a, ...a }) => ({ ...a, travel_expense_id: travelExpense.id })),
          { transaction: t, individualHooks: true },
        );
        await createDocuments(expense.id, 'travel_accommodation', travelChildFields.accommodations, created, employment.id, t);
      }
      if (travelChildFields.local_transports.length > 0) {
        const created = await db.TravelExpenseLocalTransport.bulkCreate(
          travelChildFields.local_transports.map(({ attachments: _a, ...lt }) => ({ ...lt, travel_expense_id: travelExpense.id })),
          { transaction: t, individualHooks: true },
        );
        await createDocuments(expense.id, 'travel_local_transport', travelChildFields.local_transports, created, employment.id, t);
      }
      if (travelChildFields.forex.length > 0) {
        const created = await db.TravelExpenseForex.bulkCreate(
          travelChildFields.forex.map(({ attachments: _a, ...f }) => ({ ...f, travel_expense_id: travelExpense.id })),
          { transaction: t, individualHooks: true },
        );
        await createDocuments(expense.id, 'travel_forex', travelChildFields.forex, created, employment.id, t);
      }
      if (travelChildFields.misc_expenses.length > 0) {
        const created = await db.TravelExpenseMiscExpense.bulkCreate(
          travelChildFields.misc_expenses.map(({ attachments: _a, ...m }) => ({ ...m, travel_expense_id: travelExpense.id })),
          { transaction: t, individualHooks: true },
        );
        await createDocuments(expense.id, 'travel_misc_expense', travelChildFields.misc_expenses, created, employment.id, t);
      }
    }

    if (category.module === 'reimbursement') {
      const reimbursement = await db.ReimbursementExpense.create(
        { expense_id: expense.id, ...reimbursementFields },
        { transaction: t },
      );
      if (reimbursementItems.length > 0) {
        const created = await db.ReimbursementItem.bulkCreate(
          reimbursementItems.map(({ attachments: _a, ...i }) => ({ ...i, reimbursement_expense_id: reimbursement.id })),
          { transaction: t, individualHooks: true },
        );
        await createDocuments(expense.id, 'reimbursement_item', reimbursementItems, created, employment.id, t);
      }
    }
    return expense;
  });
};

// Update an expense by UUID — only the creator may edit their own expense while it's
// DRAFT or REJECTED (rejected expenses can be edited by the original requester to resubmit).
// Supports editing the module children (travel / reimbursement) and recomputes the
// estimated amount from the submitted line items.
export const update = async (uuid, user, data) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status !== 'DRAFT' && expense.status !== 'REJECTED') {
    throw ApiError.badRequest('Cannot update a non-draft expense');
  }

  // Only the requesting employee can edit their own draft/rejected expenses
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (!employmentIds.includes(expense.requested_by_employment_id)) {
    throw ApiError.forbidden('You can only edit your own expenses');
  }

  const {
    category_uuid,
    company_uuid,
    travel_type,
    purpose,
    travel_start_date,
    travel_end_date,
    total_travellers,
    notes,
    segments,
    accommodations,
    local_transports,
    forex,
    misc_expenses,
    advance_amount,
    advance_date,
    payment_method,
    items,
    ...expenseData
  } = data;

  if (category_uuid) {
    const category = await ExpenseCategory.findOne({ where: { uuid: category_uuid } });
    if (!category) throw ApiError.notFound('Referenced expense category not found');
    expenseData.category_id = category.id;
  }
  if (company_uuid) {
    const company = await companyRepository.findByUuid(company_uuid);
    if (!company) throw ApiError.notFound('Referenced company not found');
    expenseData.company_id = company.id;
  }

  return sequelize.transaction(async (t) => {
    await expense.update(expenseData, { transaction: t });

    // Effective module after any category change
    const categoryId = expenseData.category_id ?? expense.category_id;
    const category = await ExpenseCategory.findByPk(categoryId);
    const module = category?.module;

    const hasTravelData = [travel_type, purpose, travel_start_date, travel_end_date, total_travellers, notes, segments, accommodations, local_transports, forex, misc_expenses].some((v) => v !== undefined);
    const hasReimbursementData = [advance_amount, advance_date, payment_method, items].some((v) => v !== undefined);

    if (module === 'travel' && hasTravelData) {
      // If the module changed from reimbursement, remove the old reimbursement records
      if (expense.reimbursementExpense) {
        await db.ReimbursementItem.destroy({
          where: { reimbursement_expense_id: expense.reimbursementExpense.id },
          force: true,
          transaction: t,
        });
        await expense.reimbursementExpense.destroy({ force: true, transaction: t });
      }

      let travelExpense = expense.travelExpense;
      // Only overwrite the travel header fields that were actually sent
      const travelFields = {};
      if (travel_type !== undefined) travelFields.travel_type = travel_type;
      if (purpose !== undefined) travelFields.purpose = purpose;
      if (travel_start_date !== undefined) travelFields.travel_start_date = travel_start_date;
      if (travel_end_date !== undefined) travelFields.travel_end_date = travel_end_date;
      if (total_travellers !== undefined) travelFields.total_travellers = total_travellers;
      if (notes !== undefined) travelFields.notes = notes;
      if (travelExpense) {
        await travelExpense.update(travelFields, { transaction: t });
      } else {
        travelExpense = await db.TravelExpense.create({ expense_id: expense.id, ...travelFields }, { transaction: t });
      }

      const replaceChildren = async (Model, moduleName, rows) => {
        // Drop documents attached to the old records of this module
        const oldIds = (
          await Model.findAll({ where: { travel_expense_id: travelExpense.id }, attributes: ['id'], transaction: t })
        ).map((r) => r.id);
        if (oldIds.length) {
          await db.ExpenseDocument.destroy({
            where: { module_name: moduleName, module_record_id: { [db.Sequelize.Op.in]: oldIds } },
            force: true,
            transaction: t,
          });
        }
        await Model.destroy({ where: { travel_expense_id: travelExpense.id }, force: true, transaction: t });
        if (rows.length === 0) return;
        const created = await Model.bulkCreate(
          rows.map(({ attachments: _a, ...r }) => ({ ...r, travel_expense_id: travelExpense.id })),
          { transaction: t, individualHooks: true } // run beforeCreate → encrypt amounts
        );
        await createDocuments(expense.id, moduleName, rows, created, expense.requested_by_employment_id, t);
      };
      if (segments !== undefined) await replaceChildren(db.TravelExpenseSegment, 'travel_segment', segments);
      if (accommodations !== undefined) await replaceChildren(db.TravelExpenseAccommodation, 'travel_accommodation', accommodations);
      if (forex !== undefined) await replaceChildren(db.TravelExpenseForex, 'travel_forex', forex);
      if (local_transports !== undefined) await replaceChildren(db.TravelExpenseLocalTransport, 'travel_local_transport', local_transports);
      if (misc_expenses !== undefined) await replaceChildren(db.TravelExpenseMiscExpense, 'travel_misc_expense', misc_expenses);

      // Recompute the estimated amount when any line items were submitted
      if (segments !== undefined || accommodations !== undefined || forex !== undefined || local_transports !== undefined || misc_expenses !== undefined) {
        const estimated =
          (segments || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
          (accommodations || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
          (local_transports || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
          (forex || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0) +
          (misc_expenses || []).reduce((s, x) => s + (Number(x.estimated_amount) || 0), 0);
        await expense.update({ estimated_amount: String(estimated) }, { transaction: t });
      }
    }

    if (module === 'reimbursement' && hasReimbursementData) {
      // If the module changed from travel, remove the old travel records
      if (expense.travelExpense) {
        const travelId = expense.travelExpense.id;
        await Promise.all([
          db.TravelExpenseSegment.destroy({ where: { travel_expense_id: travelId }, force: true, transaction: t }),
          db.TravelExpenseAccommodation.destroy({ where: { travel_expense_id: travelId }, force: true, transaction: t }),
          db.TravelExpenseForex.destroy({ where: { travel_expense_id: travelId }, force: true, transaction: t }),
          db.TravelExpenseLocalTransport.destroy({ where: { travel_expense_id: travelId }, force: true, transaction: t }),
          db.TravelExpenseMiscExpense.destroy({ where: { travel_expense_id: travelId }, force: true, transaction: t }),
        ]);
        await expense.travelExpense.destroy({ force: true, transaction: t });
      }

      let reimbursement = expense.reimbursementExpense;
      const reFields = {};
      if (advance_amount !== undefined) reFields.advance_amount = advance_amount;
      if (advance_date !== undefined) reFields.advance_date = advance_date;
      if (payment_method !== undefined) reFields.payment_method = payment_method || 'CASH';
      if (reimbursement) {
        await reimbursement.update(reFields, { transaction: t });
      } else {
        reimbursement = await db.ReimbursementExpense.create({ expense_id: expense.id, ...reFields }, { transaction: t });
      }

      if (items !== undefined) {
        const oldIds = (
          await db.ReimbursementItem.findAll({ where: { reimbursement_expense_id: reimbursement.id }, attributes: ['id'], transaction: t })
        ).map((r) => r.id);
        if (oldIds.length) {
          await db.ExpenseDocument.destroy({
            where: { module_name: 'reimbursement_item', module_record_id: { [db.Sequelize.Op.in]: oldIds } },
            force: true,
            transaction: t,
          });
        }
        await db.ReimbursementItem.destroy({
          where: { reimbursement_expense_id: reimbursement.id },
          force: true,
          transaction: t,
        });
        if (items.length > 0) {
          const created = await db.ReimbursementItem.bulkCreate(
            items.map(({ attachments: _a, ...i }) => ({ ...i, reimbursement_expense_id: reimbursement.id })),
            { transaction: t, individualHooks: true }
          );
          await createDocuments(expense.id, 'reimbursement_item', items, created, expense.requested_by_employment_id, t);
        }
        const estimated = items.reduce((s, x) => s + (Number(x.total_amount) || 0), 0);
        await expense.update({ estimated_amount: String(estimated) }, { transaction: t });
      }
    }

    return expenseRepository.findByUuid(uuid, t);
  });
};

// Soft delete an expense by UUID
export const deleteRecord = async (uuid) => {
  const deleted = await expenseRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Expense not found');
  return { message: 'Expense deleted successfully' };
};

// ── Approval flow (PO-created expenses follow the expense role-handover chain) ──

const findRoleByCode = async (code) => roleRepository.findByCode(code);

// Every role→role hop must be authorized by an ACTIVE role_handover_rules row for
// the expense's category module (travel/reimbursement/procurement) — editing those rules reconfigures who can forward to whom.
const requireHandoverRule = async (fromRoleId, toRoleId, module) => {
  const rule = await RoleHandoverRule.findOne({
    where: { module, from_role_id: fromRoleId, to_role_id: toRoleId, status: 'ACTIVE' },
  });
  if (!rule) throw ApiError.forbidden('This expense handover is not configured');
};

// Log an audit handover row inside a transaction. from/to always non-null (the
// handover table requires them) — fall back across the pair if one is missing.
const logExpenseHandover = async ({ expenseId, fromRoleId, toRoleId, employmentId, actionType, remarks, t }) => {
  await ExpenseHandover.create(
    {
      expense_id: expenseId,
      from_role_id: fromRoleId ?? toRoleId,
      to_role_id: toRoleId ?? fromRoleId,
      action_by_employment_id: employmentId,
      action_type: actionType,
      remarks: remarks || null,
    },
    { transaction: t },
  );
};

// Shared: create a SUBMITTED PROCUREMENT-category expense + its initial SUBMIT
// handover (requester → first receiver). Used by PO auto-creation.
// Runs inside the caller's transaction (atomic with it).
const createProcurementExpenseRecord = async ({
  title, companyId, requestedByEmploymentId, grandTotal, t,
}) => {
  const category = await ExpenseCategory.findOne({ where: { module: 'procurement' } });
  if (!category) throw ApiError.notFound('PROCUREMENT expense category not found');

  const requesterEmployment = await UserEmployment.findByPk(requestedByEmploymentId, {
    include: [{ model: User, as: 'user' }],
    transaction: t,
  });
  const requesterRoleId = requesterEmployment?.user?.role_id ?? null;
  const expenseNumber = await generateExpenseNumber();

  const expense = await Expense.create(
    {
      expense_number: expenseNumber,
      title,
      category_id: category.id,
      company_id: companyId,
      requested_by_employment_id: requestedByEmploymentId,
      current_role_id: category.first_receiver_role_id,
      current_employment_id: null,
      status: 'SUBMITTED',
      submitted_at: new Date(),
      estimated_amount: grandTotal,
    },
    { transaction: t },
  );

  // Initial SUBMIT handover: requester → first receiver.
  await logExpenseHandover({
    expenseId: expense.id,
    fromRoleId: requesterRoleId,
    toRoleId: category.first_receiver_role_id,
    employmentId: requestedByEmploymentId,
    actionType: 'SUBMIT',
    remarks: null,
    t,
  });

  return expense;
};

// Create the expense that backs a procurement PO. Called inside createPo's
// transaction so the PO + expense commit atomically.
// The PO is updated with expense_id after the expense is created (in procurement service).
export const createProcurementExpense = async ({ po, t }) =>
  createProcurementExpenseRecord({
    title: po.title,
    companyId: po.company_id,
    requestedByEmploymentId: po.requested_by_employment_id,
    // po.grand_total is already the AES ciphertext (the PO model's beforeCreate hook
    // encrypts amount fields, mutating the in-memory instance). Decrypt it back to the
    // plaintext so the expense hook encrypts it exactly once.
    grandTotal: po.grand_total != null ? decrypt(String(po.grand_total)) : null,
    t,
  });

// Submit a DRAFT or REJECTED expense — creator-only, moves to SUBMITTED
// with the category's first receiver as handler. REJECTED expenses can be
// resubmitted after the creator fixes the issues.
export const submit = async (uuid, user, remarks) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status !== 'DRAFT' && expense.status !== 'REJECTED') {
    throw ApiError.badRequest('Only a draft or rejected expense can be submitted');
  }

  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (!employmentIds.includes(expense.requested_by_employment_id)) {
    throw ApiError.forbidden('You can only submit your own expenses');
  }

  const category = await ExpenseCategory.findByPk(expense.category_id);
  const actorRole = await findRoleByCode(user.roleCode);
  const actorEmployment = await getActiveEmploymentByUser(user.userId);
  const firstReceiver = category?.first_receiver_role_id ?? null;

  return sequelize.transaction(async (t) => {
    await expense.update(
      { status: 'SUBMITTED', current_role_id: firstReceiver, current_employment_id: null, submitted_at: new Date() },
      { transaction: t },
    );
    await logExpenseHandover({
      expenseId: expense.id,
      fromRoleId: actorRole?.id,
      toRoleId: firstReceiver,
      employmentId: actorEmployment?.id,
      actionType: 'SUBMIT',
      remarks,
      t,
    });
    return expenseRepository.findByUuid(uuid, t);
  });
};

// Approve a SUBMITTED expense with optional handover to a specific role.
// If toRoleId is provided, validates against role_handover_rules (module='expense').
// If toRoleId is not provided, defaults to the category's final_approver_role_id.
// If the current handler IS the category's final_approver_role_id, the expense is
// closed as APPROVED — any to_role_id is ignored (nothing hands over past the final approver).
export const approve = async (uuid, user, remarks, toRoleId = null) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status !== 'SUBMITTED') throw ApiError.badRequest('This expense is not pending approval');

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && expense.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can approve this expense');
  }

  const category = await ExpenseCategory.findByPk(expense.category_id);
  const finalApprover = category?.final_approver_role_id ?? null;
  const fromRole = expense.current_role_id;
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  // Determine the target role for handover
  const targetRoleId = toRoleId ?? finalApprover;

  return sequelize.transaction(async (t) => {
    // If current handler IS the final approver → close as APPROVED.
    // Ignore any to_role_id: nothing hands over past the final approver.
    if (fromRole != null && fromRole === finalApprover) {
      // Compute final_amount from line items when the final approver closes
      let finalAmount = 0;
      let advanceAmount = 0;

      if (category.module === 'travel') {
        const travel = expense.travelExpense;
        if (travel) {
          finalAmount = (travel.segments || []).reduce((s, x) => s + (Number(decrypt(String(x.estimated_amount || '0'))) || 0), 0)
            + (travel.accommodations || []).reduce((s, x) => s + (Number(decrypt(String(x.estimated_amount || '0'))) || 0), 0)
            + (travel.localTransports || []).reduce((s, x) => s + (Number(decrypt(String(x.estimated_amount || '0'))) || 0), 0)
            + (travel.forex || []).reduce((s, x) => s + (Number(decrypt(String(x.estimated_amount || '0'))) || 0), 0)
            + (travel.miscExpenses || []).reduce((s, x) => s + (Number(decrypt(String(x.estimated_amount || '0'))) || 0), 0);
        }
      } else if (category.module === 'reimbursement') {
        const reim = expense.reimbursementExpense;
        if (reim) {
          advanceAmount = Number(decrypt(String(reim.advance_amount || '0')));
          finalAmount = (reim.items || []).reduce((s, x) => s + (Number(decrypt(String(x.total_amount || '0'))) || 0), 0);
        }
      } else if (category.module === 'procurement') {
        // For procurement-linked expenses, final_amount = estimated_amount (set from PO grand total at creation)
        finalAmount = Number(decrypt(String(expense.estimated_amount || '0')));
      }

      const initialPaymentStatus = computePaymentStatus([], finalAmount, advanceAmount);

      // Route for payment after approval. Procurement-linked expenses go back to
      // ADMIN_MGR (the role that raised the PO / owns the procurement chain) rather
      // than the original requester; all other expense types route to the requester.
      const requesterRole = expense.requestedByEmployment?.user?.role_id ?? null;
      let paymentHandlerRoleId;
      if (category.module === 'procurement') {
        const adminMgr = await findRoleByCode('ADMIN_MGR');
        paymentHandlerRoleId = adminMgr?.id ?? requesterRole;
      } else {
        paymentHandlerRoleId = requesterRole;
      }

      await expense.update(
        {
          status: 'APPROVED',
          current_role_id: paymentHandlerRoleId,
          current_employment_id: null,
          closed_at: new Date(),
          final_amount: String(finalAmount),
          advance_amount: String(advanceAmount),
          paid_amount: '0',
          payment_status: initialPaymentStatus,
        },
        { transaction: t },
      );
      await logExpenseHandover({
        expenseId: expense.id, fromRoleId: fromRole, toRoleId: fromRole,
        employmentId: actorEmployment?.id, actionType: 'APPROVE', remarks, t,
      });
    } else {
      // Not the final approver: validate handover and forward
      if (targetRoleId) {
        await requireHandoverRule(fromRole, targetRoleId, category?.module);
      }
      await expense.update(
        { current_role_id: targetRoleId, current_employment_id: null },
        { transaction: t },
      );
      await logExpenseHandover({
        expenseId: expense.id, fromRoleId: fromRole, toRoleId: targetRoleId,
        employmentId: actorEmployment?.id, actionType: 'APPROVE', remarks, t,
      });
    }
    return expenseRepository.findByUuid(uuid, t);
  });
};

// Get valid handover target roles for the current handler of an expense
// Returns roles from role_handover_rules where from_role_id = expense.current_role_id, module=category.module, status='ACTIVE'
export const getValidHandoverRoles = async (uuid) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status !== 'SUBMITTED') throw ApiError.badRequest('This expense is not pending approval');

  const category = await ExpenseCategory.findByPk(expense.category_id);
  if (!category) return [];

  const fromRoleId = expense.current_role_id;
  if (!fromRoleId) return [];

  const rules = await RoleHandoverRule.findAll({
    where: { module: category.module, from_role_id: fromRoleId, status: 'ACTIVE' },
    include: [{ model: db.Role, as: 'toRole', attributes: ['id', 'uuid', 'name', 'code'] }],
    order: [['created_at', 'ASC']],
  });

  return rules.map((r) => ({
    roleId: r.toRole?.id,
    roleUuid: r.toRole?.uuid,
    roleName: r.toRole?.name,
    roleCode: r.toRole?.code,
  }));
};

// Reject a SUBMITTED expense — closes it as REJECTED and clears the handler.
export const reject = async (uuid, user, remarks) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status === 'APPROVED' || expense.status === 'REJECTED' || expense.status === 'PAID') {
    throw ApiError.badRequest('This expense is already closed');
  }
  if (expense.payment_status === 'PAID' || expense.payment_status === 'SETTLED') {
    throw ApiError.badRequest('This expense is already paid');
  }

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && expense.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can reject this expense');
  }
  const fromRole = expense.current_role_id;
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  return sequelize.transaction(async (t) => {
    await expense.update(
      { status: 'REJECTED', current_role_id: null, current_employment_id: null, closed_at: new Date() },
      { transaction: t },
    );
    await logExpenseHandover({
      expenseId: expense.id, fromRoleId: fromRole, toRoleId: fromRole,
      employmentId: actorEmployment?.id, actionType: 'REJECT', remarks, t,
    });
    return expenseRepository.findByUuid(uuid, t);
  });
};

// ── Payment flow (unified for all expense types) ──

// Payment TYPE is direction-aware — it tells us whether money flows from the
// company TO the user (a disbursement toward the expense) or FROM the user TO
// the company (a refund of an over-advanced amount).
//   - Company → user: PARTIAL, FULL, ADDITIONAL
//   - User → company (refund): ADVANCE_REFUND, REFUND_RECEIVED
// A single scalar paid_amount can't tell these apart, so status is computed from
// the individual payments, summing each bucket independently.
const COMPANY_TO_USER_PAYMENT_TYPES = ['PARTIAL', 'FULL', 'ADDITIONAL'];
const USER_TO_COMPANY_PAYMENT_TYPES = ['ADVANCE_REFUND', 'REFUND_RECEIVED'];

// Sum company→user disbursements and user→company refunds separately.
// `payments` is an array of `{ amount, payment_type }` (amounts already decrypted).
const sumPaymentsByDirection = (payments = []) => {
  let companyToUser = 0;
  let userRefund = 0;
  for (const p of payments || []) {
    const amt = Number(p?.amount) || 0;
    if (USER_TO_COMPANY_PAYMENT_TYPES.includes(p?.payment_type)) {
      userRefund += amt;
    } else {
      companyToUser += amt;
    }
  }
  return { companyToUser, userRefund };
};

// Compute payment status from the direction-split payments, final amount, and
// advance amount. Reconciliation happens in the correct currency of money flow:
//   - Over-advanced  (advance > final): user must REFUND the excess (advance - final).
//     Settled once the user→company refunds cover that excess, else ADVANCE_REFUND_DUE.
//   - Under-advanced / no advance (final >= advance): the advance already counts as
//     company money toward the expense, so the company's remaining disbursement is
//     (final - advance). Settled once advance + company→user payments >= final.
const computePaymentStatus = (payments, final, advance) => {
  const f = Number(final) || 0;
  const a = Number(advance) || 0;
  const { companyToUser, userRefund } = sumPaymentsByDirection(payments);

  if (a > f) {
    const excess = a - f; // amount the user must refund
    return userRefund >= excess ? 'SETTLED' : 'ADVANCE_REFUND_DUE';
  }

  // final >= advance — company money toward the expense = advance + company→user payments
  const totalCovered = a + companyToUser;
  if (totalCovered >= f) return a > 0 ? 'SETTLED' : 'PAID';
  if (companyToUser > 0) return 'PARTIAL_PAID';
  return a > 0 ? 'ADDITIONAL_PAYMENT_DUE' : 'UNPAID';
};

// Record a payment installment for an expense
export const recordPayment = async (uuid, user, paymentData) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');

  // Check permissions - only users with expenses:pay can record payments
  const actorRole = await findRoleByCode(user.roleCode);
  const actorRoleWithPerms = await db.Role.findByPk(actorRole?.id, {
    include: [{ model: db.Permission, as: 'permissions', through: { attributes: [] } }],
  });
  const hasPayPermission = actorRoleWithPerms?.permissions?.some(
    (p) => p.permission_key === 'expenses:pay',
  );
  if (!hasPayPermission && user.roleCode !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('You do not have permission to record payments');
  }

  // Only allow payments on APPROVED or payment-pending statuses
  const allowedPaymentStatuses = ['APPROVED', 'PARTIAL_PAID', 'ADVANCE_REFUND_DUE', 'ADDITIONAL_PAYMENT_DUE', 'UNPAID', 'SETTLED'];
  if (!allowedPaymentStatuses.includes(expense.status) && expense.status !== 'APPROVED') {
    throw ApiError.badRequest(`Cannot record payment for expense in ${expense.status} status`);
  }
  if (expense.payment_status === 'PAID' || expense.payment_status === 'SETTLED') {
    throw ApiError.badRequest('This expense is already paid');
  }

  const actorEmployment = await getActiveEmploymentByUser(user.userId);
  const { amount, payment_method, payment_date, payment_type, reference_number, remarks, proofs } = paymentData;

  return sequelize.transaction(async (t) => {
    // Create the payment record
    const payment = await db.ExpensePayment.create(
      {
        expense_id: expense.id,
        amount,
        payment_method,
        payment_date: new Date(payment_date),
        payment_type: payment_type || 'PARTIAL',
        reference_number: reference_number || null,
        remarks: remarks || null,
        processed_by_employment_id: actorEmployment?.id,
      },
      { transaction: t },
    );

    // Handle proof uploads
    if (proofs?.length) {
      await db.ExpensePaymentProof.bulkCreate(
        proofs.map((p) => ({
          expense_payment_id: payment.id,
          file_path: p.file_path,
          file_name: p.file_name,
          file_type: p.file_type || null,
          uploaded_by_employment_id: actorEmployment?.id,
        })),
        { transaction: t },
      );
    }

    // Update expense paid_amount and payment_status. Status must be derived from the
    // direction-split payments (payment_type tells company→user vs user→company), so we
    // read the expense's recorded payments and append the new one.
    const finalAmount = Number(decrypt(String(expense.final_amount || '0')));
    const advanceAmount = Number(decrypt(String(expense.advance_amount || '0')));

    const [existingPayments] = await db.ExpensePayment.findAndCountAll({
      where: { expense_id: expense.id },
      transaction: t,
    });
    decryptResults(existingPayments.rows);
    const allPayments = [
      ...existingPayments.rows.map((p) => ({ amount: p.amount, payment_type: p.payment_type })),
      { amount, payment_type: payment_type || 'PARTIAL' },
    ];
    const newPaymentStatus = computePaymentStatus(allPayments, finalAmount, advanceAmount);

    // paid_amount = net company disbursement via recorded payments (company→user
    // payments minus any user→company refunds received back), never negative.
    const { companyToUser, userRefund } = sumPaymentsByDirection(allPayments);
    const newPaid = Math.max(0, companyToUser - userRefund);

    const isSettled = newPaymentStatus === 'SETTLED' || (newPaymentStatus === 'PAID' && advanceAmount === 0);
    // On settlement, route the expense back to a handler. Procurement-linked expenses go
    // to ADMIN_MGR (consistent with where they route on approval); others go to the requester.
    const requesterRole = expense.requestedByEmployment?.user?.role_id ?? null;
    let settledHandler = requesterRole;
    if (expense.category?.module === 'procurement') {
      const adminMgr = await findRoleByCode('ADMIN_MGR');
      settledHandler = adminMgr?.id ?? requesterRole;
    }

    await expense.update(
      {
        paid_amount: String(newPaid),
        payment_status: newPaymentStatus,
        // Keep the approval status (APPROVED) untouched — only the payment_status
        // reflects payment. When fully settled/paid, route the expense to its handler.
        ...(isSettled
          ? { current_role_id: settledHandler, current_employment_id: null }
          : {}),
      },
      { transaction: t },
    );

    // Log payment handover
    await logExpenseHandover({
      expenseId: expense.id,
      fromRoleId: actorRole?.id,
      toRoleId: actorRole?.id,
      employmentId: actorEmployment?.id,
      actionType: 'PAY',
      remarks: `Payment: ${amount} (${payment_method})`,
      t,
    });

    return { payment, expense: await expenseRepository.findByUuid(uuid, t) };
  });
};

// Get all payments for an expense with proofs
export const getPayments = async (uuid, user) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');

  const [employmentIds, companyIds] = await Promise.all([
    getEmploymentIdsByUser(user.userId),
    getActiveCompanyIdsByUser(user.userId),
  ]);
  const visible =
    EXPENSE_GLOBAL_ROLES.includes(user.roleCode) ||
    employmentIds.includes(expense.requested_by_employment_id) ||
    companyIds.includes(expense.company_id);

  if (!visible) throw ApiError.notFound('Expense not found');

  const payments = await db.ExpensePayment.findAll({
    where: { expense_id: expense.id },
    include: [{ model: db.ExpensePaymentProof, as: 'proofs' }],
    order: [['payment_date', 'ASC']],
  });
  decryptResults(payments);
  payments.forEach(p => {
    if (p.proofs) decryptResults(p.proofs);
  });

  return payments.map(p => ({
    uuid: p.uuid,
    amount: Number(p.amount).toFixed(2),
    payment_method: p.payment_method,
    payment_date: p.payment_date,
    payment_type: p.payment_type,
    reference_number: p.reference_number,
    remarks: p.remarks,
    proofs: (p.proofs || []).map(pr => ({
      uuid: pr.uuid,
      file_path: pr.file_path,
      file_name: pr.file_name,
      file_type: pr.file_type,
    })),
  }));
};

// Get payment summary for an expense (computed values)
export const getPaymentSummary = async (uuid, user) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');

  const [employmentIds, companyIds] = await Promise.all([
    getEmploymentIdsByUser(user.userId),
    getActiveCompanyIdsByUser(user.userId),
  ]);
  const visible =
    EXPENSE_GLOBAL_ROLES.includes(user.roleCode) ||
    employmentIds.includes(expense.requested_by_employment_id) ||
    companyIds.includes(expense.company_id);

  if (!visible) throw ApiError.notFound('Expense not found');

  // Decrypt amounts for computation
  const finalAmount = Number(decrypt(String(expense.final_amount || '0')));
  const advanceAmount = Number(decrypt(String(expense.advance_amount || '0')));

  // Fetch all payments with proofs
  const payments = await db.ExpensePayment.findAll({
    where: { expense_id: expense.id },
    include: [{ model: db.ExpensePaymentProof, as: 'proofs' }],
    order: [['payment_date', 'ASC']],
  });
  decryptResults(payments);
  payments.forEach(p => {
    if (p.proofs) decryptResults(p.proofs);
  });

  // Direction-split the payments — payment_type says whether money flowed company→user
  // (a disbursement toward the expense) or user→company (a refund of an over-advance).
  // paid_amount shown to the user = net company disbursement via recorded payments.
  const { companyToUser, userRefund } = sumPaymentsByDirection(payments);
  const paidAmount = Math.max(0, companyToUser - userRefund);

  // Determine payment status from the direction-split payments (not the conflated paid_amount)
  const paymentStatus = computePaymentStatus(payments, finalAmount, advanceAmount);

  // Compute what's due, in the correct currency of money flow:
  let amountDue = 0;
  let isOverAdvance = false;
  let isUnderAdvance = false;

  if (advanceAmount > finalAmount) {
    // Over-advanced: the user refunds the excess (advance - final). What they still owe
    // is that excess minus any refunds already received back.
    isOverAdvance = true;
    amountDue = (advanceAmount - finalAmount) - userRefund;
  } else if (finalAmount > advanceAmount) {
    // Under-advanced: the company owes (final - advance) on top of the advance. What it
    // still owes is that top-up minus any company→user payments already recorded.
    isUnderAdvance = true;
    amountDue = (finalAmount - advanceAmount) - companyToUser;
  } else {
    // final === advance: the advance already covers the expense; nothing further is due.
    amountDue = 0;
  }

  if (amountDue < 0) amountDue = 0;

  return {
    final_amount: finalAmount.toFixed(2),
    advance_amount: advanceAmount.toFixed(2),
    paid_amount: paidAmount.toFixed(2),
    payment_status: paymentStatus,
    amount_due: amountDue.toFixed(2),
    is_over_advance: isOverAdvance,
    is_under_advance: isUnderAdvance,
    payments: payments.map(p => ({
      uuid: p.uuid,
      amount: Number(p.amount).toFixed(2),
      payment_method: p.payment_method,
      payment_date: p.payment_date,
      payment_type: p.payment_type,
      reference_number: p.reference_number,
      remarks: p.remarks,
      proofs: (p.proofs || []).map(pr => ({
        uuid: pr.uuid,
        file_path: pr.file_path,
        file_name: pr.file_name,
        file_type: pr.file_type,
      })),
    })),
    can_pay: true, // TODO: check if user has expenses:pay permission
  };
};

// ── Payment handover flow ──

// Handover an APPROVED/PAID expense from the current holder to a payment-eligible role.
// Validates against role_handover_rules where module='payment'.
export const handoverForPayment = async (uuid, user, toRoleId, remarks) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (!['APPROVED', 'PAID'].includes(expense.status)) {
    throw ApiError.badRequest('This expense is not in a payment-eligible state');
  }
  const settlable = ['SETTLED', 'PAID'];
  if (settlable.includes(expense.payment_status)) {
    throw ApiError.badRequest('This expense is already fully settled');
  }

  const actorRole = await findRoleByCode(user.roleCode);
  if (user.roleCode !== 'SUPER_ADMIN' && expense.current_role_id !== actorRole?.id) {
    throw ApiError.forbidden('Only the current handler can handover for payment');
  }
  if (!toRoleId) throw ApiError.badRequest('Target role is required');

  const category = await ExpenseCategory.findByPk(expense.category_id);
  const fromRoleId = expense.current_role_id;
  const actorEmployment = await getActiveEmploymentByUser(user.userId);

  // Validate handover rule for module='payment'
  await requireHandoverRule(fromRoleId, toRoleId, 'payment');

  return sequelize.transaction(async (t) => {
    await expense.update(
      { current_role_id: toRoleId, current_employment_id: null },
      { transaction: t },
    );
    await logExpenseHandover({
      expenseId: expense.id, fromRoleId, toRoleId,
      employmentId: actorEmployment?.id, actionType: 'HANDOVER_PAYMENT', remarks, t,
    });
    return expenseRepository.findByUuid(uuid, t);
  });
};

// Get valid handover target roles for payment module from the current handler's role.
export const getPaymentHandoverRoles = async (uuid) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (!['APPROVED', 'PAID'].includes(expense.status)) {
    throw ApiError.badRequest('This expense is not in a payment-eligible state');
  }

  const fromRoleId = expense.current_role_id;
  if (!fromRoleId) return [];

  const rules = await RoleHandoverRule.findAll({
    where: { module: 'payment', from_role_id: fromRoleId, status: 'ACTIVE' },
    include: [{ model: db.Role, as: 'toRole', attributes: ['id', 'uuid', 'name', 'code'] }],
    order: [['created_at', 'ASC']],
  });

  return rules.map((r) => ({
    roleId: r.toRole?.id,
    roleUuid: r.toRole?.uuid,
    roleName: r.toRole?.name,
    roleCode: r.toRole?.code,
  }));
};

// Expenses pending payment at the logged-in user's role — company-scoped for non-global roles.
export const getMyPaymentRequests = async (user, params = {}) => {
  const role = await roleRepository.findByCode(user.roleCode);
  if (!role) return { rows: [], total: 0 };

  let companyIds = [];
  if (!EXPENSE_GLOBAL_ROLES.includes(user.roleCode)) {
    companyIds = await getActiveCompanyIdsByUser(user.userId);
  }

  const where = {
    current_role_id: role.id,
    status: { [db.Sequelize.Op.in]: ['APPROVED', 'PAID'] },
    payment_status: { [db.Sequelize.Op.notIn]: ['SETTLED', 'PAID'] },
  };
  if (companyIds.length > 0) where.company_id = { [db.Sequelize.Op.in]: companyIds };

  const result = await expenseRepository.findAll(where, params);
  if (params.decrypt) decryptResults(result.rows);
  return result;
};
