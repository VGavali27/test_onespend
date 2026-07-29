import db from '../../database/models/index.js';
const { Role } = db;

class RoleRepository {
  // Fetch all roles ordered by level (highest first), then creation date
  async findAll() {
    return Role.findAll({
      order: [
        ['level', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  }
  // Find a role by its UUID
  async findByUuid(uuid) {
    return Role.findOne({ where: { uuid } });
  }
  // Find a role by its unique code
  async findByCode(code) {
    return Role.findOne({ where: { code } });
  }
  // Create a new role record
  async create(data) {
    return Role.create(data);
  }
  // Update a role by UUID — returns null if not found
  async update(uuid, data) {
    const role = await Role.findOne({ where: { uuid } });
    if (!role) return null;
    return role.update(data);
  }
  // Soft delete a role by UUID — returns false if not found
  async delete(uuid) {
    const role = await Role.findOne({ where: { uuid } });
    if (!role) return false;
    await role.destroy();
    return true;
  }
}

export default new RoleRepository();
