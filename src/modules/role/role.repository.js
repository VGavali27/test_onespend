import db from '../../database/models/index.js';
const { Role } = db;

export const findAll = async () => Role.findAll({ order: [['level', 'ASC'], ['createdAt', 'DESC']] });
export const findByUuid = async (uuid) => Role.findOne({ where: { uuid } });
export const findByCode = async (code) => Role.findOne({ where: { code } });
export const create = async (data) => Role.create(data);
export const update = async (uuid, data) => {
  const role = await Role.findOne({ where: { uuid } });
  if (!role) return null;
  return role.update(data);
};
export const deleteRecord = async (uuid) => {
  const role = await Role.findOne({ where: { uuid } });
  if (!role) return false;
  await role.destroy();
  return true;
};
