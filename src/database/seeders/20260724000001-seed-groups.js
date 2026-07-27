/**
 * Seeder: Insert demo group — Kings Group Ventures
 */
export async function up(queryInterface, Sequelize) {
  return queryInterface.bulkInsert('groups', [
    {
      id: 100,
      uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Kings Group Ventures',
      code: 'KGV',
      description: 'Kings Group Ventures',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface, _Sequelize) {
  return queryInterface.bulkDelete('groups', { id: [100] }, {});
}
