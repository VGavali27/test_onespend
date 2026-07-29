import expenseCategoryRepository from './expense_category.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { Role } = db;

class ExpenseCategoryService {
  // Fetch all categories
  async getAll() {
    return expenseCategoryRepository.findAll();
  }
  // Fetch a single category by UUID — throws 404 if missing
  async getByUuid(uuid) {
    const category = await expenseCategoryRepository.findByUuid(uuid);
    if (!category) {
      throw ApiError.notFound('Expense category not found');
    }
    return category;
  }
  // Create a new category — resolves role UUIDs, checks code uniqueness
  async create(data) {
    const firstReceiver = await Role.findOne({ where: { uuid: data.first_receiver_role_uuid } });
    if (!firstReceiver) throw ApiError.notFound('Referenced first receiver role not found');
    const finalApprover = await Role.findOne({ where: { uuid: data.final_approver_role_uuid } });
    if (!finalApprover) throw ApiError.notFound('Referenced final approver role not found');
    const existing = await expenseCategoryRepository.findByCode(data.code);
    if (existing) throw ApiError.conflict('Category code already exists');
    const { first_receiver_role_uuid, final_approver_role_uuid, ...cleanData } = data;
    return expenseCategoryRepository.create({
      ...cleanData,
      first_receiver_role_id: firstReceiver.id,
      final_approver_role_id: finalApprover.id,
    });
  }
  // Update a category by UUID — resolves role UUIDs if provided
  async update(uuid, data) {
    const category = await expenseCategoryRepository.findByUuid(uuid);
    if (!category) throw ApiError.notFound('Expense category not found');
    if (data.first_receiver_role_uuid) {
      const role = await Role.findOne({ where: { uuid: data.first_receiver_role_uuid } });
      if (!role) throw ApiError.notFound('Referenced first receiver role not found');
      data.first_receiver_role_id = role.id;
      delete data.first_receiver_role_uuid;
    }
    if (data.final_approver_role_uuid) {
      const role = await Role.findOne({ where: { uuid: data.final_approver_role_uuid } });
      if (!role) throw ApiError.notFound('Referenced final approver role not found');
      data.final_approver_role_id = role.id;
      delete data.final_approver_role_uuid;
    }
    if (data.code && data.code !== category.code) {
      const existing = await expenseCategoryRepository.findByCode(data.code);
      if (existing) throw ApiError.conflict('Category code already exists');
    }
    return category.update(data);
  }
  // Soft delete a category by UUID
  async delete(uuid) {
    const deleted = await expenseCategoryRepository.delete(uuid);
    if (!deleted) throw ApiError.notFound('Expense category not found');
    return { message: 'Expense category deleted successfully' };
  }
}

export default new ExpenseCategoryService();
