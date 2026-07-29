import db from '../../database/models/index.js';
const { TravelExpense, TravelExpenseSegment, TravelExpenseAccommodation,
  TravelExpenseLocalTransport, TravelExpenseForex, TravelExpenseMiscExpense } = db;

export const findByExpenseUuid = async (expenseUuid) => {
  return TravelExpense.findOne({
    include: [{ model: db.Expense, as: 'expense', where: { uuid: expenseUuid }, required: true }],
  });
};

export const findByUuid = async (uuid) => TravelExpense.findOne({ where: { uuid } });
export const create = async (data) => TravelExpense.create(data);
export const update = async (uuid, data) => {
  const te = await TravelExpense.findOne({ where: { uuid } });
  if (!te) return null;
  return te.update(data);
};
export const bulkCreateSegments = async (id, items) => TravelExpenseSegment.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));
export const bulkCreateAccommodations = async (id, items) => TravelExpenseAccommodation.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));
export const bulkCreateLocalTransports = async (id, items) => TravelExpenseLocalTransport.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));
export const bulkCreateForex = async (id, items) => TravelExpenseForex.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));
export const bulkCreateMiscExpenses = async (id, items) => TravelExpenseMiscExpense.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));
