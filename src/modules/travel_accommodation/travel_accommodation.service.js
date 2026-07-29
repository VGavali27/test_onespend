import accommodationRepository from './travel_accommodation.repository.js';

import db from '../../database/models/index.js';

import ApiError from '../../utils/ApiError.js';

const { TravelExpense } = db;

class TravelAccommodationService {
  // Fetch all accommodations
  async getAll() {
    return accommodationRepository.findAll();
  }

  // Fetch a single accommodation by UUID — throws 404 if missing
  async getByUuid(uuid) {
    const r = await accommodationRepository.findByUuid(uuid);
    if (!r) throw ApiError.notFound('Accommodation not found');
    return r;
  }

  // Create a new accommodation — resolves travel expense UUID
  async create(data) {
    const te = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
    if (!te) throw ApiError.notFound('Referenced travel expense not found');
    const { travel_expense_uuid, ...clean } = data;
    return accommodationRepository.create({ ...clean, travel_expense_id: te.id });
  }

  // Update an accommodation by UUID
  async update(uuid, data) {
    const r = await accommodationRepository.update(uuid, data);
    if (!r) throw ApiError.notFound('Accommodation not found');
    return r;
  }

  // Soft delete an accommodation by UUID
  async delete(uuid) {
    const d = await accommodationRepository.delete(uuid);
    if (!d) throw ApiError.notFound('Accommodation not found');
    return { message: 'Accommodation deleted successfully' };
  }
}

export default new TravelAccommodationService();
