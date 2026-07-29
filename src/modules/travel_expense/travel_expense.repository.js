import db from '../../database/models/index.js';
const {
  TravelExpense,
  TravelExpenseSegment,
  TravelExpenseAccommodation,
  TravelExpenseLocalTransport,
  TravelExpenseForex,
  TravelExpenseMiscExpense,
} = db;

class TravelExpenseRepository {
  // Find travel expense by expense UUID (via join)
  async findByExpenseUuid(expenseUuid) {
    return TravelExpense.findOne({
      include: [{ model: db.Expense, as: 'expense', where: { uuid: expenseUuid }, required: true }],
    });
  }
  // Find travel expense by its own UUID
  async findByUuid(uuid) {
    return TravelExpense.findOne({ where: { uuid } });
  }
  // Create travel expense
  async create(data) {
    return TravelExpense.create(data);
  }
  // Update travel expense by UUID
  async update(uuid, data) {
    const travelExpense = await TravelExpense.findOne({ where: { uuid } });
    if (!travelExpense) return null;
    return travelExpense.update(data);
  }
  // Bulk create child items
  async bulkCreateSegments(travelExpenseId, items) {
    const data = items.map((item) => ({ ...item, travel_expense_id: travelExpenseId }));
    return TravelExpenseSegment.bulkCreate(data);
  }
  async bulkCreateAccommodations(travelExpenseId, items) {
    const data = items.map((item) => ({ ...item, travel_expense_id: travelExpenseId }));
    return TravelExpenseAccommodation.bulkCreate(data);
  }
  async bulkCreateLocalTransports(travelExpenseId, items) {
    const data = items.map((item) => ({ ...item, travel_expense_id: travelExpenseId }));
    return TravelExpenseLocalTransport.bulkCreate(data);
  }
  async bulkCreateForex(travelExpenseId, items) {
    const data = items.map((item) => ({ ...item, travel_expense_id: travelExpenseId }));
    return TravelExpenseForex.bulkCreate(data);
  }
  async bulkCreateMiscExpenses(travelExpenseId, items) {
    const data = items.map((item) => ({ ...item, travel_expense_id: travelExpenseId }));
    return TravelExpenseMiscExpense.bulkCreate(data);
  }
}

export default new TravelExpenseRepository();
