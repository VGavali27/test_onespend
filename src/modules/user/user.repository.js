import { Op } from 'sequelize';
import db from '../../database/models/index.js';
const { User } = db;

const ALLOWED_SORT_FIELDS = ['createdAt', 'first_name', 'last_name', 'email'];
const DEFAULT_SORT = [['createdAt', 'DESC']];

// Fetch users with server-side pagination, search, status filter, and sorting.
// Params (all optional): page, limit, search, status, sortBy, sortOrder
export const findAll = async (params = {}) => {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
  const status = params.status || '';
  const search = (params.search || '').trim();
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = (params.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const where = {};
  if (status) where.status = status;
  if (search) {
    where[Op.or] = ['first_name', 'last_name', 'email', 'mobile'].map((field) => ({
      [field]: { [Op.like]: `%${search}%` },
    }));
  }

  const order = ALLOWED_SORT_FIELDS.includes(sortBy) ? [[sortBy, sortOrder]] : DEFAULT_SORT;

  const { count, rows } = await User.findAndCountAll({
    where,
    order,
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return { rows, total: count };
};

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
