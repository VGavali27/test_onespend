import db from '../../database/models/index.js';
const {
  TravelExpense, TravelExpenseSegment, TravelExpenseAccommodation,
  TravelExpenseLocalTransport, TravelExpenseForex, TravelExpenseMiscExpense,
} = db;

// Find travel expense by associated expense UUID (via join)
export const findByExpenseUuid = async (expenseUuid) => {
  return TravelExpense.findOne({
    include: [{ model: db.Expense, as: 'expense', where: { uuid: expenseUuid }, required: true }],
  });
};

// Find travel expense by its own UUID
export const findByUuid = async (uuid) => TravelExpense.findOne({ where: { uuid } });

// Create a travel expense record
export const create = async (data) => TravelExpense.create(data);

// Update travel expense by UUID — returns null if not found
export const update = async (uuid, data) => {
  const te = await TravelExpense.findOne({ where: { uuid } });
  if (!te) return null;
  return te.update(data);
};

// Bulk create segments for a travel expense
export const bulkCreateSegments = async (id, items) =>
  TravelExpenseSegment.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));

// Bulk create accommodations for a travel expense
export const bulkCreateAccommodations = async (id, items) =>
  TravelExpenseAccommodation.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));

// Bulk create local transports for a travel expense
export const bulkCreateLocalTransports = async (id, items) =>
  TravelExpenseLocalTransport.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));

// Bulk create forex entries for a travel expense
export const bulkCreateForex = async (id, items) =>
  TravelExpenseForex.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));

// Bulk create misc expenses for a travel expense
export const bulkCreateMiscExpenses = async (id, items) =>
  TravelExpenseMiscExpense.bulkCreate(items.map((i) => ({ ...i, travel_expense_id: id })));
