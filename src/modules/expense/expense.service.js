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
const EXPENSE_GLOBAL_ROLES = ['SUPER_ADMIN', 'CFO', 'ADMIN_MGR'];

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
  (rows || []).forEach((r) =>
    r.setDataValue('canEdit', r.status === 'DRAFT' && employmentIds.includes(r.requested_by_employment_id))
  );
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
export const getVisible = async (user, params = {}) => {
  let result;
  if (EXPENSE_GLOBAL_ROLES.includes(user.roleCode)) {
    result = await expenseRepository.findAll({}, params);
  } else {
    const companyIds = await getActiveCompanyIdsByUser(user.userId);
    result =
      companyIds.length > 0
        ? await expenseRepository.findByCompanyIds(companyIds, params)
        : { rows: [], total: 0 };
  }
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

  expense.setDataValue('canEdit', expense.status === 'DRAFT' && employmentIds.includes(expense.requested_by_employment_id));

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

// Update an expense by UUID — only the creator may edit their own expense while it's DRAFT.
// Supports editing the module children (travel / reimbursement) and recomputes the
// estimated amount from the submitted line items.
export const update = async (uuid, user, data) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status !== 'DRAFT') throw ApiError.badRequest('Cannot update a non-draft expense');

  // Only the requesting employee can edit their own draft
  const employmentIds = await getEmploymentIdsByUser(user.userId);
  if (!employmentIds.includes(expense.requested_by_employment_id)) {
    throw ApiError.forbidden('You can only edit your own draft expenses');
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
      final_amount: grandTotal,
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

// Submit a DRAFT expense — creator-only, moves to SUBMITTED with the category's
// first receiver as handler (used by manual expenses; PO-created ones start SUBMITTED).
export const submit = async (uuid, user, remarks) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');
  if (expense.status !== 'DRAFT') throw ApiError.badRequest('Only a draft expense can be submitted');

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
      await expense.update(
        { status: 'APPROVED', current_role_id: null, current_employment_id: null, closed_at: new Date() },
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
