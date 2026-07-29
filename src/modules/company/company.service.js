import companyRepository from './company.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { Group } = db;

class CompanyService {
  // Fetch all companies
  async getAll() {
    return companyRepository.findAll();
  }
  // Fetch a single company by UUID — throws 404 if missing
  async getByUuid(uuid) {
    const company = await companyRepository.findByUuid(uuid);
    if (!company) {
      throw ApiError.notFound('Company not found');
    }
    return company;
  }
  // Create a new company — resolves group_uuid to group_id, checks code uniqueness
  async create(data) {
    const group = await Group.findOne({ where: { uuid: data.group_uuid } });
    if (!group) {
      throw ApiError.notFound('Referenced group not found');
    }
    if (data.code) {
      const existing = await companyRepository.findByCode(data.code);
      if (existing) {
        throw ApiError.conflict('Company code already exists');
      }
    }
    const { group_uuid, ...cleanData } = data;
    return companyRepository.create({ ...cleanData, group_id: group.id });
  }
  // Update a company by UUID — resolves group_uuid if provided, checks code uniqueness
  async update(uuid, data) {
    const company = await companyRepository.findByUuid(uuid);
    if (!company) {
      throw ApiError.notFound('Company not found');
    }
    if (data.group_uuid) {
      const group = await Group.findOne({ where: { uuid: data.group_uuid } });
      if (!group) {
        throw ApiError.notFound('Referenced group not found');
      }
      data.group_id = group.id;
      delete data.group_uuid;
    }
    if (data.code && data.code !== company.code) {
      const existing = await companyRepository.findByCode(data.code);
      if (existing) {
        throw ApiError.conflict('Company code already exists');
      }
    }
    return company.update(data);
  }
  // Soft delete a company by UUID — throws 404 if missing
  async delete(uuid) {
    const deleted = await companyRepository.delete(uuid);
    if (!deleted) {
      throw ApiError.notFound('Company not found');
    }
    return { message: 'Company deleted successfully' };
  }
}

export default new CompanyService();
