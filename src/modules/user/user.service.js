import bcrypt from 'bcryptjs';
import * as userRepository from './user.repository.js';
import * as companyRepository from '../company/company.repository.js';
import * as roleRepository from '../role/role.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { Department, UserEmployment, sequelize } = db;

// Fetch users with pagination/search/filter/sort
export const getAll = async (params = {}) => userRepository.findAll(params);

// Fetch a single user by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const user = await userRepository.findByUuid(uuid);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

// Fetch a user's full profile (role, department, employments) — throws 404 if missing
export const getProfile = async (uuid) => {
  const user = await userRepository.findProfileByUuid(uuid);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

// Create a new user with optional employments — all in a transaction
export const create = async (data) => {
  const role = await roleRepository.findByUuid(data.role_uuid);
  if (!role) throw ApiError.notFound('Referenced role not found');

  let departmentId = null;
  if (data.department_uuid) {
    const department = await Department.findOne({ where: { uuid: data.department_uuid } });
    if (!department) throw ApiError.notFound('Referenced department not found');
    departmentId = department.id;
  }

  if (data.email) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw ApiError.conflict('Email already registered');
  }

  const { role_uuid, department_uuid, employments, ...userData } = data;
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }

  return sequelize.transaction(async (t) => {
    const user = await userRepository.create({ ...userData, role_id: role.id, department_id: departmentId });

    const createdEmployments = [];
    if (employments?.length > 0) {
      for (const emp of employments) {
        const company = await companyRepository.findByUuid(emp.company_uuid);
        if (!company) throw ApiError.notFound(`Company not found for UUID: ${emp.company_uuid}`);
        const { company_uuid, ...empData } = emp;
        const employment = await user.createEmployment({ ...empData, company_id: company.id }, { transaction: t });
        createdEmployments.push(employment);
      }
    }

    const result = user.toJSON();
    result.employments = createdEmployments;
    return result;
  });
};

// Update a user by UUID — resolves role_uuid / department_uuid, hashes password,
// and replaces employments when provided
export const update = async (uuid, data) => {
  const user = await userRepository.findByUuid(uuid);
  if (!user) throw ApiError.notFound('User not found');

  if (data.role_uuid) {
    const role = await roleRepository.findByUuid(data.role_uuid);
    if (!role) throw ApiError.notFound('Referenced role not found');
    data.role_id = role.id;
    delete data.role_uuid;
  }

  if (data.department_uuid !== undefined) {
    if (data.department_uuid) {
      const department = await Department.findOne({ where: { uuid: data.department_uuid } });
      if (!department) throw ApiError.notFound('Referenced department not found');
      data.department_id = department.id;
    } else {
      data.department_id = null;
    }
    delete data.department_uuid;
  }

  if (data.email && data.email !== user.email) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw ApiError.conflict('Email already registered');
  }

  const { employments, ...userData } = data;
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }

  return sequelize.transaction(async (t) => {
    await user.update(userData, { transaction: t });

    if (employments) {
      // Replace the user's employments with the submitted list
      await UserEmployment.destroy({ where: { user_id: user.id }, force: true, transaction: t });
      for (const emp of employments) {
        const company = await companyRepository.findByUuid(emp.company_uuid);
        if (!company) throw ApiError.notFound(`Company not found for UUID: ${emp.company_uuid}`);
        const { company_uuid, ...empData } = emp;
        await user.createEmployment({ ...empData, company_id: company.id }, { transaction: t });
      }
    }

    return userRepository.findProfileByUuid(uuid, t);
  });
};

// Soft delete a user by UUID — throws 404 if missing
export const deleteRecord = async (uuid) => {
  const deleted = await userRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('User not found');
  return { message: 'User deleted successfully' };
};

// Get the authenticated user's permissions with all permissions grouped by resource
export const getMyPermissions = async (userUuid) => {
  const { Permission, Role, sequelize } = db;
  
  // Get user's role with permissions
  const user = await userRepository.findByUuid(userUuid);
  if (!user) throw ApiError.notFound('User not found');
  
  const role = await Role.findByPk(user.role_id, {
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  if (!role) throw ApiError.notFound('User role not found');
  
  // User's granted permissions
  const grantedKeys = role.permissions?.map(p => p.permission_key) || [];
  
  // Get all permissions grouped by resource
  const allPermissions = await Permission.findAll({
    where: { status: 'ACTIVE' },
    order: [['resource', 'ASC'], ['action', 'ASC']],
  });
  
  // Group by resource
  const grouped = {};
  for (const p of allPermissions) {
    const resource = p.resource;
    if (!grouped[resource]) {
      grouped[resource] = [];
    }
    grouped[resource].push({
      uuid: p.uuid,
      permission_key: p.permission_key,
      resource: p.resource,
      action: p.action,
      description: p.description,
      granted: grantedKeys.includes(p.permission_key),
    });
  }
  
  // Sort resources alphabetically
  const sortedGrouped = Object.keys(grouped).sort().reduce((acc, key) => {
    acc[key] = grouped[key];
    return acc;
  }, {});
  
  return {
    role: { id: role.id, code: role.code, name: role.name },
    grantedKeys,
    grouped: sortedGrouped,
    totalGranted: grantedKeys.length,
    totalAvailable: allPermissions.length,
  };
};
