import * as userEmploymentRepository from './user_employment.repository.js';
import * as companyRepository from '../company/company.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { User, UserEmployment } = db;

// Fetch all employments
export const getAll = async () => userEmploymentRepository.findAll();

// Fetch employments for a specific user by user UUID
export const getByUserUuid = async (userUuid) => {
  const user = await User.findOne({ where: { uuid: userUuid } });
  if (!user) throw ApiError.notFound('User not found');
  return userEmploymentRepository.findByUserId(user.id);
};

// Fetch a single employment by UUID — throws 404 if missing
export const getByUuid = async (uuid) => {
  const employment = await userEmploymentRepository.findByUuid(uuid);
  if (!employment) throw ApiError.notFound('Employment not found');
  return employment;
};

// Create a new employment — resolves UUIDs to IDs, checks employee_code uniqueness
export const create = async (data) => {
  const user = await User.findOne({ where: { uuid: data.user_uuid } });
  if (!user) throw ApiError.notFound('Referenced user not found');
  const company = await companyRepository.findByUuid(data.company_uuid);
  if (!company) throw ApiError.notFound('Referenced company not found');

  let reportingManagerId = null;
  if (data.reporting_manager_employment_uuid) {
    const manager = await UserEmployment.findOne({ where: { uuid: data.reporting_manager_employment_uuid } });
    if (!manager) throw ApiError.notFound('Referenced reporting manager not found');
    reportingManagerId = manager.id;
  }

  if (data.employee_code) {
    const existing = await userEmploymentRepository.findByEmployeeCode(data.employee_code);
    if (existing) throw ApiError.conflict('Employee code already exists');
  }

  const { user_uuid, company_uuid, reporting_manager_employment_uuid, ...cleanData } = data;
  return userEmploymentRepository.create({
    ...cleanData, user_id: user.id, company_id: company.id,
    reporting_manager_employment_id: reportingManagerId,
  });
};

// Update an employment by UUID — resolves UUIDs if provided
export const update = async (uuid, data) => {
  const employment = await userEmploymentRepository.findByUuid(uuid);
  if (!employment) throw ApiError.notFound('Employment not found');

  if (data.company_uuid) {
    const company = await companyRepository.findByUuid(data.company_uuid);
    if (!company) throw ApiError.notFound('Referenced company not found');
    data.company_id = company.id;
    delete data.company_uuid;
  }

  if (data.reporting_manager_employment_uuid !== undefined) {
    if (data.reporting_manager_employment_uuid) {
      const manager = await UserEmployment.findOne({ where: { uuid: data.reporting_manager_employment_uuid } });
      if (!manager) throw ApiError.notFound('Referenced reporting manager not found');
      data.reporting_manager_employment_id = manager.id;
    } else {
      data.reporting_manager_employment_id = null;
    }
    delete data.reporting_manager_employment_uuid;
  }

  if (data.employee_code && data.employee_code !== employment.employee_code) {
    const existing = await userEmploymentRepository.findByEmployeeCode(data.employee_code);
    if (existing) throw ApiError.conflict('Employee code already exists');
  }
  return employment.update(data);
};

// Soft delete an employment by UUID — throws 404 if missing
export const deleteRecord = async (uuid) => {
  const deleted = await userEmploymentRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Employment not found');
  return { message: 'Employment deleted successfully' };
};

// ── Shared helpers for other modules (expense, procurement, travel, ...) ──
// Employment data-access lives here (the user_employment module owns it); other
// modules import these instead of re-querying UserEmployment themselves.
export const getEmploymentIdsByUser = (userId) => userEmploymentRepository.findIdsByUserId(userId);
export const getActiveCompanyIdsByUser = (userId) => userEmploymentRepository.findActiveCompanyIdsByUserId(userId);
export const getActiveEmploymentByUser = (userId) => userEmploymentRepository.findActiveByUserId(userId);
export const getActiveEmploymentByUserAndCompany = (userId, companyId) =>
  userEmploymentRepository.findActiveByUserAndCompany(userId, companyId);
