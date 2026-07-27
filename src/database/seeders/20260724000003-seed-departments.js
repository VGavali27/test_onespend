/**
 * Seeder: Insert demo departments
 */
export async function up(queryInterface, Sequelize) {
  return queryInterface.bulkInsert('departments', [
    {
      id: 100,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567801',
      name: 'Finance',
      code: 'FIN',
      description: 'Finance Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 101,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567802',
      name: 'Admin',
      code: 'ADM',
      description: 'Administration Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 102,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567803',
      name: 'IT',
      code: 'IT',
      description: 'Information Technology Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 103,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567804',
      name: 'HR',
      code: 'HR',
      description: 'Human Resources Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 104,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567805',
      name: 'Travel Desk',
      code: 'TRV',
      description: 'Travel Desk Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 105,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567806',
      name: 'Purchase',
      code: 'PUR',
      description: 'Purchase Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 106,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567807',
      name: 'Ration',
      code: 'RAT',
      description: 'Ration Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 107,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567808',
      name: 'Marketing',
      code: 'MKT',
      description: 'Marketing Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 108,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567809',
      name: 'BU - HR',
      code: 'BUHR',
      description: 'Business Unit - HR Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 109,
      uuid: 'b1c2d3e4-f5a6-7890-bcde-f1234567810',
      name: 'Legal',
      code: 'LGL',
      description: 'Legal Department',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down(queryInterface, _Sequelize) {
  return queryInterface.bulkDelete('departments', {
    id: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109],
  }, {});
}
