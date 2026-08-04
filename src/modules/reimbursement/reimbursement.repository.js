import db from '../../database/models/index.js';

const { ReimbursementExpense, ReimbursementItem, Expense } = db;

// Reimbursement header + its items (used on every read)
const withItems = [{ model: ReimbursementItem, as: 'items' }];

// Find a reimbursement by the associated expense UUID (via join)
export const findByExpenseUuid = async (expenseUuid) =>
  ReimbursementExpense.findOne({
    include: [
      { model: Expense, as: 'expense', where: { uuid: expenseUuid }, required: true },
      ...withItems,
    ],
  });

// Find a reimbursement by its own UUID
export const findByUuid = async (uuid) =>
  ReimbursementExpense.findOne({ where: { uuid }, include: withItems });

// Update a reimbursement header by UUID — returns null if not found
export const update = async (uuid, data) => {
  const re = await ReimbursementExpense.findOne({ where: { uuid } });
  if (!re) return null;
  await re.update(data);
  return findByUuid(uuid);
};

// Replace all line items for a reimbursement (force delete, then bulk create)
export const replaceItems = async (reimbursementExpenseId, items) => {
  await ReimbursementItem.destroy({ where: { reimbursement_expense_id: reimbursementExpenseId }, force: true });
  if (items && items.length > 0) {
    await ReimbursementItem.bulkCreate(
      items.map((i) => ({ ...i, reimbursement_expense_id: reimbursementExpenseId })),
      { individualHooks: true }
    );
  }
};
