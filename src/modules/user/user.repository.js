import db from '../../database/models/index.js';
const { User } = db;

// Fetch all users ordered by creation date (newest first)
export const findAll = async () => User.findAll({ order: [['createdAt', 'DESC']] });

// Find a user by UUID
export const findByUuid = async (uuid) => User.findOne({ where: { uuid } });

// Find a user by primary key ID (internal use)
export const findById = async (id) => User.findByPk(id);

// Find a user by email (includes password field)
export const findByEmail = async (email) => User.scope('withPassword').findOne({ where: { email } });

// Create a new user record
export const create = async (data) => User.create(data);

// Update a user by UUID — returns null if not found
export const update = async (uuid, data) => {
  const user = await User.findOne({ where: { uuid } });
  if (!user) return null;
  return user.update(data);
};

// Soft delete a user by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const user = await User.findOne({ where: { uuid } });
  if (!user) return false;
  await user.destroy();
  return true;
};
