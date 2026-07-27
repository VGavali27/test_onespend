/**
 * Seeder: Insert SUPER_ADMIN user with employments across all companies
 */
export async function up(queryInterface, Sequelize) {
  // ── 1. Create SUPER_ADMIN user ──────────────────────────────
  await queryInterface.bulkInsert('users', [
    {
      id: 100,
      uuid: 'e1f2a3b4-c5d6-7890-efab-123456789001',
      role_id: 100,
      first_name: 'Super',
      last_name: 'Admin',
      email: 'superadmin@kingsgroup.com',
      mobile: '9999999999',
      password: '$2b$10$fZyk8GfYE7bj5ToCP3/baOq9i0lvzHsmgv1GATNWKViyB5XVxFaxm', // plain: Admin@123
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  // ── 2. Create user_employment for each company ──────────────
  const employments = [];
  const companyIds = [];
  for (let id = 100; id <= 127; id++) companyIds.push(id);

  companyIds.forEach((companyId, index) => {
    const seq = String(index + 1).padStart(3, '0');
    employments.push({
      id: 100 + index,
      uuid: `e1f2a3b4-c5d6-7890-efab-12345679${seq}`,
      user_id: 100,
      company_id: companyId,
      department_id: null,
      employee_code: `KGV-EMP-${seq}`,
      designation: 'Super Administrator',
      employment_type: 'PERMANENT',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  await queryInterface.bulkInsert('user_employments', employments);
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.bulkDelete('user_employments', { user_id: 100 }, {});
  await queryInterface.bulkDelete('users', { id: [100] }, {});
}
