import db from '../../database/models/index.js';

const { UserEmployment } = db;

class UserEmploymentRepository {
  // Fetch all employments ordered by creation date (newest first)
  async findAll() {
    return UserEmployment.findAll({ order: [['createdAt', 'DESC']] });
  }

  // Find an employment by its UUID
  async findByUuid(uuid) {
    return UserEmployment.findOne({ where: { uuid } });
  }

  // Find all employments for a given user ID
  async findByUserId(userId) {
    return UserEmployment.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']] });
  }

  // Find an employment by employee code
  async findByEmployeeCode(code) {
    return UserEmployment.findOne({ where: { employee_code: code } });
  }

  // Create a new employment record
  async create(data) {
    return UserEmployment.create(data);
  }

  // Update an employment by UUID — returns null if not found
  async update(uuid, data) {
    const employment = await UserEmployment.findOne({ where: { uuid } });
    if (!employment) return null;
    return employment.update(data);
  }

  // Soft delete an employment by UUID — returns false if not found
  async delete(uuid) {
    const employment = await UserEmployment.findOne({ where: { uuid } });
    if (!employment) return false;
    await employment.destroy();
    return true;
  }
}

export default new UserEmploymentRepository();
