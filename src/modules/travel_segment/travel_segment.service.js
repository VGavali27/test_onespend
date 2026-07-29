import segmentRepository from './travel_segment.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { TravelExpense } = db;

class TravelExpenseSegmentService {
  async getAll() {
    return segmentRepository.findAll();
  }
  async getByUuid(uuid) {
    const record = await segmentRepository.findByUuid(uuid);
    if (!record) throw ApiError.notFound('Segment not found');
    return record;
  }
  async create(data) {
    const travelExpense = await TravelExpense.findOne({ where: { uuid: data.travel_expense_uuid } });
    if (!travelExpense) throw ApiError.notFound('Referenced travel expense not found');
    const { travel_expense_uuid, ...cleanData } = data;
    return segmentRepository.create({ ...cleanData, travel_expense_id: travelExpense.id });
  }
  async update(uuid, data) {
    const updated = await segmentRepository.update(uuid, data);
    if (!updated) throw ApiError.notFound('Segment not found');
    return updated;
  }
  async delete(uuid) {
    const deleted = await segmentRepository.delete(uuid);
    if (!deleted) throw ApiError.notFound('Segment not found');
    return { message: 'Segment deleted successfully' };
  }
}

export default new TravelExpenseSegmentService();
