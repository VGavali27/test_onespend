import * as expenseRepository from './expense.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
import { decryptAmounts } from '../../utils/encryption.js';
const { ExpenseCategory, Company, User, UserEmployment, sequelize } = db;

// Roles that see every company's expenses (global visibility)
const EXPENSE_GLOBAL_ROLES = ['SUPER_ADMIN', 'CFO'];

// Roles allowed to view the company-scoped "all expenses" list (everyone else uses /expenses/my)
export const EXPENSE_MANAGER_ROLES = [
  'SUPER_ADMIN',
  'CFO',
  'PAYMENT_MGR',
  'PAYMENT_JR',
  'FINANCE_MGR',
  'FINANCE_JR',
  'TRAVEL_MGR',
  'HOD',
];

// All employment ids for a user (no status filter — historical own-expenses still match)
const getUserEmploymentIds = async (userId) => {
  const employments = await UserEmployment.findAll({ where: { user_id: userId } });
  return employments.map((e) => e.id);
};

// Company ids of the user's ACTIVE employments (drives company-scoped visibility)
const getUserCompanyIds = async (userId) => {
  const employments = await UserEmployment.findAll({ where: { user_id: userId, status: 'ACTIVE' } });
  return employments.map((e) => e.company_id);
};

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

// Decrypt amount fields in an expense object or array (mutates in place)
export const decryptResults = (data) => {
  if (!data) return data;
  const items = Array.isArray(data) ? data : [data];
  items.forEach((item) => {
    if (item?.dataValues) decryptAmounts(item.dataValues);
    else if (item) decryptAmounts(item);
  });
  return data;
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
  const employmentIds = await getUserEmploymentIds(userId);
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
    const companyIds = await getUserCompanyIds(user.userId);
    result =
      companyIds.length > 0
        ? await expenseRepository.findByCompanyIds(companyIds, params)
        : { rows: [], total: 0 };
  }
  if (params.decrypt) decryptResults(result.rows);
  const employmentIds = await getUserEmploymentIds(user.userId);
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

// Fetch a single expense by UUID — visible only to the creator, global roles, or users
// employed in the expense's company. Returns 404 (not 403) so hidden expenses don't leak.
export const getByUuid = async (uuid, user, decrypt = false) => {
  const expense = await expenseRepository.findByUuid(uuid);
  if (!expense) throw ApiError.notFound('Expense not found');

  const [employmentIds, companyIds] = await Promise.all([
    getUserEmploymentIds(user.userId),
    getUserCompanyIds(user.userId),
  ]);
  const visible =
    EXPENSE_GLOBAL_ROLES.includes(user.roleCode) ||
    employmentIds.includes(expense.requested_by_employment_id) ||
    companyIds.includes(expense.company_id);

  if (!visible) throw ApiError.notFound('Expense not found');

  expense.setDataValue('canEdit', expense.status === 'DRAFT' && employmentIds.includes(expense.requested_by_employment_id));

  return decrypt ? decryptExpenseDeep(expense) : expense;
};

// Create an expense — handles nested module data based on category (travel, etc.)
export const create = async (data) => {
  const category = await ExpenseCategory.findOne({ where: { uuid: data.category_uuid } });
  if (!category) throw ApiError.notFound('Referenced expense category not found');
  const company = await Company.findOne({ where: { uuid: data.company_uuid } });
  if (!company) throw ApiError.notFound('Referenced company not found');
  const user = await User.findOne({ where: { uuid: data.requested_by_user_uuid } });
  if (!user) throw ApiError.notFound('Referenced user not found');
  const employment = await UserEmployment.findOne({ where: { user_id: user.id, status: 'ACTIVE' } });
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
  const employmentIds = await getUserEmploymentIds(user.userId);
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
    const company = await Company.findOne({ where: { uuid: company_uuid } });
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

    return expenseRepository.findByUuid(uuid);
  });
};

// Soft delete an expense by UUID
export const deleteRecord = async (uuid) => {
  const deleted = await expenseRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Expense not found');
  return { message: 'Expense deleted successfully' };
};
