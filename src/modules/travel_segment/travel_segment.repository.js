import db from '../../database/models/index.js';

const { TravelExpenseSegment } = db;

class TravelSegmentRepository {
  // Fetch all records ordered by creation date (newest first)
  async findAll() {
    return TravelExpenseSegment.findAll({ order: [['createdAt', 'DESC']] });
  }

  // Find a record by UUID
  async findByUuid(uuid) {
    return TravelExpenseSegment.findOne({ where: { uuid } });
  }

  // Find all segments for a given travel expense
  async findByTravelExpenseId(travelExpenseId) {
    return TravelExpenseSegment.findAll({
      where: { travel_expense_id: travelExpenseId },
      order: [['departure_datetime', 'ASC']],
    });
  }

  // Create a new record
  async create(data) {
    return TravelExpenseSegment.create(data);
  }

  // Update a record by UUID — returns null if not found
  async update(uuid, data) {
    const record = await TravelExpenseSegment.findOne({ where: { uuid } });
    if (!record) return null;
    return record.update(data);
  }

  // Soft delete a record by UUID — returns false if not found
  async delete(uuid) {
    const record = await TravelExpenseSegment.findOne({ where: { uuid } });
    if (!record) return false;
    await record.destroy();
    return true;
  }
}

export default new TravelSegmentRepository();
