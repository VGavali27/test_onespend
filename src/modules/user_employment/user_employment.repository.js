import db from '../../database/models/index.js';
const { UserEmployment } = db;

export const findAll = async () => UserEmployment.findAll({ order: [['createdAt', 'DESC']] });
export const findByUuid = async (uuid) => UserEmployment.findOne({ where: { uuid } });
export const findByUserId = async (userId) =>
  UserEmployment.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']] });
export const findByEmployeeCode = async (code) => UserEmployment.findOne({ where: { employee_code: code } });
export const create = async (data) => UserEmployment.create(data);
export const update = async (uuid, data) => {
  const employment = await UserEmployment.findOne({ where: { uuid } });
  if (!employment) return null;
  return employment.update(data);
};
export const deleteRecord = async (uuid) => {
  const employment = await UserEmployment.findOne({ where: { uuid } });
  if (!employment) return false;
  await employment.destroy();
  return true;
};
