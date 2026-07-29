import userRepository from './user.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { Role, Company, Department, sequelize } = db;

class UserService {
  // Fetch all users
  async getAll() {
    return userRepository.findAll();
  }
  // Fetch a single user by UUID — throws 404 if missing
  async getByUuid(uuid) {
    const user = await userRepository.findByUuid(uuid);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
  // Create a new user with optional employments — all in a transaction
  async create(data) {
    const role = await Role.findOne({ where: { uuid: data.role_uuid } });
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
    return sequelize.transaction(async (t) => {
      // 1. Create the user      const user = await userRepository.create({        ...userData,        role_id: role.id,        department_id: departmentId,      });
      // 2. Create employments if provided      const createdEmployments = [];      if (employments && employments.length > 0) {        for (const emp of employments) {          const company = await Company.findOne({ where: { uuid: emp.company_uuid } });          if (!company) throw ApiError.notFound(`Company not found for UUID: ${emp.company_uuid}`);          const { company_uuid, ...empData } = emp;          const employment = await user.createEmployment(            { ...empData, company_id: company.id },            { transaction: t },          );          createdEmployments.push(employment);        }      }
      // Return user with employments attached      const result = user.toJSON();      result.employments = createdEmployments;      return result;
    });
  }
  // Update a user by UUID — resolves role_uuid / department_uuid if provided
  async update(uuid, data) {
    const user = await userRepository.findByUuid(uuid);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    if (data.role_uuid) {
      const role = await Role.findOne({ where: { uuid: data.role_uuid } });
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
    return user.update(data);
  }
  // Soft delete a user by UUID — throws 404 if missing
  async delete(uuid) {
    const deleted = await userRepository.delete(uuid);
    if (!deleted) {
      throw ApiError.notFound('User not found');
    }
    return { message: 'User deleted successfully' };
  }
}

export default new UserService();
