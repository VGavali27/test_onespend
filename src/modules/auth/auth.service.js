import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../../database/models/index.js';
import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';

const { User, Role, Permission } = db;

// Login — verify credentials, generate JWT
export const login = async (email, password) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  // Get role info with permissions
  const role = await Role.findByPk(user.role_id, {
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  if (!role) throw ApiError.unauthorized('User role not found');

  // Extract permission keys
  const permissionKeys = role.permissions?.map(p => p.permission_key) || [];

  // JWT contains only identity — employment/company context is resolved per-request
  const payload = {
    userUuid: user.uuid,
    userId: user.id,
    roleId: role.id,
    roleCode: role.code,
  };

  const token = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

  return {
    token,
    user: {
      uuid: user.uuid,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      department_id: user.department_id,
      role: role.code,
      permissions: permissionKeys,
    },
  };
};
