import db from '../../database/models/index.js';
const { Permission } = db;

class PermissionRepository {
  // Fetch all permissions ordered by resource, then action
  async findAll() {
    return Permission.findAll({
      order: [
        ['resource', 'ASC'],
        ['action', 'ASC'],
      ],
    });
  }
  // Find a permission by its UUID
  async findByUuid(uuid) {
    return Permission.findOne({ where: { uuid } });
  }
  // Find a permission by its key
  async findByKey(permissionKey) {
    return Permission.findOne({ where: { permission_key: permissionKey } });
  }
  // Create a new permission record
  async create(data) {
    return Permission.create(data);
  }
  // Update a permission by UUID — returns null if not found
  async update(uuid, data) {
    const permission = await Permission.findOne({ where: { uuid } });
    if (!permission) return null;
    return permission.update(data);
  }
  // Soft delete a permission by UUID — returns false if not found
  async delete(uuid) {
    const permission = await Permission.findOne({ where: { uuid } });
    if (!permission) return false;
    await permission.destroy();
    return true;
  }
}

export default new PermissionRepository();
