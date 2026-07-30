import db from '../../database/models/index.js';
const { Permission } = db;

export const findAll = async () =>
  Permission.findAll({
    order: [
      ['resource', 'ASC'],
      ['action', 'ASC'],
    ],
  });
export const findByUuid = async (uuid) => Permission.findOne({ where: { uuid } });
export const findByKey = async (permissionKey) => Permission.findOne({ where: { permission_key: permissionKey } });
export const create = async (data) => Permission.create(data);
export const update = async (uuid, data) => {
  const permission = await Permission.findOne({ where: { uuid } });
  if (!permission) return null;
  return permission.update(data);
};
export const deleteRecord = async (uuid) => {
  const permission = await Permission.findOne({ where: { uuid } });
  if (!permission) return false;
  await permission.destroy();
  return true;
};
