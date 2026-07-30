import * as userEmploymentRepository from './user_employment.repository.js';
import db from '../../database/models/index.js';
import ApiError from '../../utils/ApiError.js';
const { User, Company, UserEmployment } = db;

export const getAll = async () => userEmploymentRepository.findAll();

export const getByUserUuid = async (userUuid) => {
  const user = await User.findOne({ where: { uuid: userUuid } });
  if (!user) throw ApiError.notFound('User not found');
  return userEmploymentRepository.findByUserId(user.id);
};

export const getByUuid = async (uuid) => {
  const employment = await userEmploymentRepository.findByUuid(uuid);
  if (!employment) throw ApiError.notFound('Employment not found');
  return employment;
};

export const create = async (data) => {
  const user = await User.findOne({ where: { uuid: data.user_uuid } });
  if (!user) throw ApiError.notFound('Referenced user not found');
  const company = await Company.findOne({ where: { uuid: data.company_uuid } });
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
    ...cleanData,
    user_id: user.id,
    company_id: company.id,
    reporting_manager_employment_id: reportingManagerId,
  });
};

export const update = async (uuid, data) => {
  const employment = await userEmploymentRepository.findByUuid(uuid);
  if (!employment) throw ApiError.notFound('Employment not found');

  if (data.company_uuid) {
    const company = await Company.findOne({ where: { uuid: data.company_uuid } });
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

export const deleteRecord = async (uuid) => {
  const deleted = await userEmploymentRepository.deleteRecord(uuid);
  if (!deleted) throw ApiError.notFound('Employment not found');
  return { message: 'Employment deleted successfully' };
};
