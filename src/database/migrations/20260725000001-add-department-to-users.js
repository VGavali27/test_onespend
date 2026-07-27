/**
 * Migration: Move department_id from user_employments to users
 */
export async function up(queryInterface, Sequelize) {
  // Add department_id to users table
  await queryInterface.addColumn('users', 'department_id', {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: true,
    after: 'role_id',
  });

  await queryInterface.addConstraint('users', {
    fields: ['department_id'],
    type: 'foreign key',
    name: 'fk_users_department_id',
    references: { table: 'departments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('users', ['department_id'], { name: 'idx_users_department_id' });

  // Remove department_id from user_employments table
  const constraints = await queryInterface.getForeignKeyReferencesForTable('user_employments');
  const deptConstraint = constraints.find((c) => c.columnName === 'department_id');
  if (deptConstraint) {
    await queryInterface.removeConstraint('user_employments', deptConstraint.constraintName);
  }

  await queryInterface.removeIndex('user_employments', 'idx_ue_department_id');
  await queryInterface.removeColumn('user_employments', 'department_id');
}

export async function down(queryInterface, Sequelize) {
  // Restore department_id in user_employments
  await queryInterface.addColumn('user_employments', 'department_id', {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: true,
    after: 'company_id',
  });

  await queryInterface.addConstraint('user_employments', {
    fields: ['department_id'],
    type: 'foreign key',
    name: 'fk_ue_department_id',
    references: { table: 'departments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('user_employments', ['department_id'], { name: 'idx_ue_department_id' });

  // Remove department_id from users
  await queryInterface.removeConstraint('users', 'fk_users_department_id');
  await queryInterface.removeIndex('users', 'idx_users_department_id');
  await queryInterface.removeColumn('users', 'department_id');
}
