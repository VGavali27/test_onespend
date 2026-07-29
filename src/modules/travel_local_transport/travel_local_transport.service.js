import repo from './travel_local_transport.repository.js';

import db from '../../database/models/index.js';

import ApiError from '../../utils/ApiError.js';

const { TravelExpense } = db;

class TravelLocalTransportService {
  // Fetch all local transport records
  async getAll() {
    return repo.findAll();
  }

  // Fetch a single record by UUID — throws 404 if missing
  async getByUuid(uuid) {
    const r = await repo.findByUuid(uuid);
    if (!r) throw ApiError.notFound('Local transport not found');
    return r;
  }

  // Create a new local transport — resolves travel expense UUID
  async create(data) {
    const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
    if (!te) throw ApiError.notFound('Referenced travel expense not found');
    const { travel_expense_uuid, ...clean } = data;
    return repo.create({ ...clean, travel_expense_id: te.id });
  }

  // Update a local transport by UUID
  async update(uuid, data) {
    const r = await repo.update(uuid, data);
    if (!r) throw ApiError.notFound('Local transport not found');
    return r;
  }

  // Soft delete a local transport by UUID
  async delete(uuid) {
    const d = await repo.delete(uuid);
    if (!d) throw ApiError.notFound('Local transport not found');
    return { message: 'Local transport deleted successfully' };
  }
}

export default new TravelLocalTransportService();
