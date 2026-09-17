import db from '../../database/models/index.js';
const { UserEmployment, User, Role, Company } = db;

// Fetch all employments ordered by creation date (newest first)
export const findAll = async () => UserEmployment.findAll({ order: [['createdAt', 'DESC']] });

// Find an employment by UUID
export const findByUuid = async (uuid) => UserEmployment.findOne({ where: { uuid } });

// Find all employments for a given user ID
export const findByUserId = async (userId) =>
  UserEmployment.findAll({ where: { user_id: userId }, order: [['createdAt', 'DESC']] });

// All employment ids for a user (no status filter — historical own-records still match)
export const findIdsByUserId = async (userId) => {
  const employments = await UserEmployment.findAll({ where: { user_id: userId }, attributes: ['id'] });
  return employments.map((e) => e.id);
};

// Company ids of the user's ACTIVE employments (drives company-scoped visibility)
export const findActiveCompanyIdsByUserId = async (userId) => {
  const employments = await UserEmployment.findAll({ where: { user_id: userId, status: 'ACTIVE' }, attributes: ['company_id'] });
  return employments.map((e) => e.company_id);
};

// First ACTIVE employment of a user (for "who is acting" / requester resolution)
export const findActiveByUserId = async (userId) =>
  UserEmployment.findOne({ where: { user_id: userId, status: 'ACTIVE' } });

// ACTIVE employment of a user at a specific company (requester at the selected company)
export const findActiveByUserAndCompany = async (userId, companyId) =>
  UserEmployment.findOne({ where: { user_id: userId, company_id: companyId, status: 'ACTIVE' } });

// Active employments for the "For employee" picker (3rd-person expense creation).
// Optional companyId restricts the list to the expense's company.
export const findActiveOptions = async (companyId = null) => {
  const where = { status: 'ACTIVE' };
  if (companyId) where.company_id = companyId;
  return UserEmployment.findAll({
    where,
    attributes: ['id', 'uuid', 'employee_code', 'company_id'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'uuid', 'first_name', 'middle_name', 'last_name', 'email'],
        include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'code'] }],
      },
      { model: Company, as: 'company', attributes: ['id', 'uuid', 'name'] },
    ],
    order: [['created_at', 'ASC']],
  });
};

// Find an employment by employee code
export const findByEmployeeCode = async (code) => UserEmployment.findOne({ where: { employee_code: code } });

// Create a new employment record
export const create = async (data) => UserEmployment.create(data);

// Update an employment by UUID — returns null if not found
export const update = async (uuid, data) => {
  const employment = await UserEmployment.findOne({ where: { uuid } });
  if (!employment) return null;
  return employment.update(data);
};

// Soft delete an employment by UUID — returns false if not found
export const deleteRecord = async (uuid) => {
  const employment = await UserEmployment.findOne({ where: { uuid } });
  if (!employment) return false;
  await employment.destroy();
  return true;
};
