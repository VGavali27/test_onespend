/**
 * Seeder: Insert one user per role with employments.
 *
 * All users get employment at ON DIRECT MARKETING SERVICES LLP (company 114).
 * CFO additionally gets employment across all 28 companies.
 */
export async function up(queryInterface, Sequelize) {
  // ── 1. Users ────────────────────────────────────────────────
  await queryInterface.bulkInsert('users', [
    { id: 101, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789101', role_id: 101, first_name: 'Michael', last_name: 'Chen', email: 'cfo@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 102, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789102', role_id: 102, first_name: 'Sarah', last_name: 'Patel', email: 'payment.mgr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 103, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789103', role_id: 103, first_name: 'Ravi', last_name: 'Kumar', email: 'payment.jr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 104, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789104', role_id: 104, first_name: 'Anita', last_name: 'Desai', email: 'finance.mgr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 105, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789105', role_id: 105, first_name: 'Priya', last_name: 'Sharma', email: 'finance.jr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 106, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789106', role_id: 106, first_name: 'Vikram', last_name: 'Singh', email: 'admin.mgr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 107, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789107', role_id: 107, first_name: 'Deepa', last_name: 'Reddy', email: 'admin.jr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 108, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789108', role_id: 108, first_name: 'Arjun', last_name: 'Nair', email: 'travel.mgr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 109, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789109', role_id: 109, first_name: 'Neha', last_name: 'Gupta', email: 'travel.jr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 110, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789110', role_id: 110, first_name: 'Rajesh', last_name: 'Joshi', email: 'hod@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 111, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789111', role_id: 111, first_name: 'Sunil', last_name: 'Verma', email: 'emp.mgr@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 112, uuid: 'e1f2a3b4-c5d6-7890-efab-123456789112', role_id: 112, first_name: 'Amit', last_name: 'Kumar', email: 'employee@kingsgroup.com', password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
  ]);

  // ── 2. User Employments ─────────────────────────────────────
  const employments = [];

  // CFO — employment across all 28 companies
  const allCompanyIds = [];
  for (let id = 100; id <= 127; id++) allCompanyIds.push(id);

  allCompanyIds.forEach((companyId, index) => {
    const seq = String(index + 1).padStart(3, '0');
    employments.push({
      id: 200 + index,
      uuid: `e1f2a3b4-c5d6-7890-efab-12345679${seq}`,
      user_id: 101,
      company_id: companyId,
      employee_code: `CFO-EMP-${seq}`,
      designation: 'Chief Financial Officer',
      employment_type: 'PERMANENT',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  // Other roles — single employment at ON DIRECT MARKETING SERVICES LLP (company 114)
  const roleUsers = [
    { userId: 102, code: 'PAY', designation: 'Payment Manager' },
    { userId: 103, code: 'PAYJR', designation: 'Payment Junior' },
    { userId: 104, code: 'FIN', designation: 'Finance Manager' },
    { userId: 105, code: 'FINJR', designation: 'Finance Junior' },
    { userId: 106, code: 'ADM', designation: 'Admin Manager' },
    { userId: 107, code: 'ADMJR', designation: 'Admin Junior' },
    { userId: 108, code: 'TRV', designation: 'Travel Manager' },
    { userId: 109, code: 'TRVJR', designation: 'Travel Junior' },
    { userId: 110, code: 'HOD', designation: 'Head of Department' },
    { userId: 111, code: 'EMPMGR', designation: 'Employee Manager' },
    { userId: 112, code: 'EMP', designation: 'Employee' },
  ];

  roleUsers.forEach((user, index) => {
    const seq = String(29 + index).padStart(3, '0');
    employments.push({
      id: 228 + index,
      uuid: `e1f2a3b4-c5d6-7890-efab-12345679${seq}`,
      user_id: user.userId,
      company_id: 114,
      employee_code: `${user.code}-EMP-${seq}`,
      designation: user.designation,
      employment_type: 'PERMANENT',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  await queryInterface.bulkInsert('user_employments', employments);
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.bulkDelete('user_employments', { user_id: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112] }, {});
  await queryInterface.bulkDelete('users', { id: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112] }, {});
}
