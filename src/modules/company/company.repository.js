import db from '../../database/models/index.js';
const { Company } = db;

class CompanyRepository {
  // Fetch all companies ordered by creation date (newest first)
  async findAll() {
    return Company.findAll({ order: [['createdAt', 'DESC']] });
  }
  // Find a company by its UUID
  async findByUuid(uuid) {
    return Company.findOne({ where: { uuid } });
  }
  // Find a company by its primary key ID
  async findById(id) {
    return Company.findByPk(id);
  }
  // Find a company by its unique code
  async findByCode(code) {
    return Company.findOne({ where: { code } });
  }
  // Create a new company record
  async create(data) {
    return Company.create(data);
  }
  // Update a company by UUID — returns null if not found
  async update(uuid, data) {
    const company = await Company.findOne({ where: { uuid } });
    if (!company) return null;
    return company.update(data);
  }
  // Soft delete a company by UUID — returns false if not found
  async delete(uuid) {
    const company = await Company.findOne({ where: { uuid } });
    if (!company) return false;
    await company.destroy();
    return true;
  }
}

export default new CompanyRepository();
