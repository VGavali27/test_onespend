import db from '../../database/models/index.js';
const { User } = db;

export const findAll = async () => User.findAll({ order: [['createdAt', 'DESC']] });
export const findByUuid = async (uuid) => User.findOne({ where: { uuid } });
export const findById = async (id) => User.findByPk(id);
export const findByEmail = async (email) => User.scope('withPassword').findOne({ where: { email } });
export const create = async (data) => User.create(data);
export const update = async (uuid, data) => {
  const user = await User.findOne({ where: { uuid } });
  if (!user) return null;
  return user.update(data);
};
export const deleteRecord = async (uuid) => {
  const user = await User.findOne({ where: { uuid } });
  if (!user) return false;
  await user.destroy();
  return true;
};
