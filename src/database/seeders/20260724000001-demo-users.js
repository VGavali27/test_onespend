/**
 * Seeder: Insert demo users
 */
export async function up(queryInterface, Sequelize) {
  return queryInterface.bulkInsert('users', [
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: '$2a$10$dummyHashedPasswordForDemo1', // plain: Demo@123
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: '$2a$10$dummyHashedPasswordForDemo2', // plain: Demo@123
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Bob Wilson',
      email: 'bob@example.com',
      password: '$2a$10$dummyHashedPasswordForDemo3', // plain: Demo@123
      is_active: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  return queryInterface.bulkDelete('users', null, {});
}
