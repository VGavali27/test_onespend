import repo from './travel_misc_expense.repository.js';

import db from '../../database/models/index.js';

import ApiError from '../../utils/ApiError.js';

const { TravelExpense } = db;

class TravelMiscExpenseService {
  // Fetch all misc expenses
  async getAll() {
    return repo.findAll();
  }

  // Fetch a single misc expense by UUID — throws 404 if missing
  async getByUuid(uuid) {
    const r = await repo.findByUuid(uuid);
    if (!r) throw ApiError.notFound('Misc expense not found');
    return r;
  }

  // Create a new misc expense — resolves travel expense UUID
  async create(data) {
    const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
    if (!te) throw ApiError.notFound('Referenced travel expense not found');
    const { travel_expense_uuid, ...clean } = data;
    return repo.create({ ...clean, travel_expense_id: te.id });
  }

  // Update a misc expense by UUID
  async update(uuid, data) {
    const r = await repo.update(uuid, data);
    if (!r) throw ApiError.notFound('Misc expense not found');
    return r;
  }

  // Soft delete a misc expense by UUID
  async delete(uuid) {
    const d = await repo.delete(uuid);
    if (!d) throw ApiError.notFound('Misc expense not found');
    return { message: 'Misc expense deleted successfully' };
  }
}

export default new TravelMiscExpenseService();
