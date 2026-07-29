import db from '../../database/models/index.js';

const { TravelExpenseAccommodation } = db;

class TravelAccommodationRepository {
  // Fetch all records ordered by creation date (newest first)
  async findAll() {
    return TravelExpenseAccommodation.findAll({ order: [['createdAt', 'DESC']] });
  }

  // Find a record by UUID
  async findByUuid(uuid) {
    return TravelExpenseAccommodation.findOne({ where: { uuid } });
  }

  // Create a new record
  async create(data) {
    return TravelExpenseAccommodation.create(data);
  }

  // Update a record by UUID — returns null if not found
  async update(uuid, data) {
    const r = await this.findByUuid(uuid);
    if (!r) return null;
    return r.update(data);
  }

  // Soft delete a record by UUID — returns false if not found
  async delete(uuid) {
    const r = await this.findByUuid(uuid);
    if (!r) return false;
    await r.destroy();
    return true;
  }
}

export default new TravelAccommodationRepository();
