export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('user_employments', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: { type: Sequelize.UUID, allowNull: false },
    user_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    company_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    employee_code: { type: Sequelize.STRING(50), allowNull: true },
    designation: { type: Sequelize.STRING(150), allowNull: true },
    email: { type: Sequelize.STRING(150), allowNull: true },
    reporting_manager_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    employment_type: { type: Sequelize.ENUM('PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT'), allowNull: true },
    joining_date: { type: Sequelize.DATEONLY, allowNull: true },
    relieving_date: { type: Sequelize.DATEONLY, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED'), defaultValue: 'ACTIVE' },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('user_employments', ['uuid'], { name: 'idx_ue_uuid' });
  await queryInterface.addIndex('user_employments', ['user_id'], { name: 'idx_ue_user_id' });
  await queryInterface.addIndex('user_employments', ['company_id'], { name: 'idx_ue_company_id' });
  await queryInterface.addIndex('user_employments', ['employee_code'], { name: 'idx_ue_employee_code' });
  await queryInterface.addIndex('user_employments', ['email'], { name: 'idx_ue_email' });
  await queryInterface.addConstraint('user_employments', {
    fields: ['user_id'],
    type: 'foreign key',
    name: 'fk_ue_user_id',
    references: { table: 'users', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('user_employments', {
    fields: ['company_id'],
    type: 'foreign key',
    name: 'fk_ue_company_id',
    references: { table: 'companies', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}
export async function down(queryInterface, _Sequelize) {
  // Remove ALL FKs from any table referencing user_employments before dropping
  const [constraints] = await queryInterface.sequelize.query(`
    SELECT DISTINCT kcu.CONSTRAINT_NAME, kcu.TABLE_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
    WHERE rc.REFERENCED_TABLE_NAME = 'user_employments'
  `);
  for (const c of constraints) {
    try {
      await queryInterface.removeConstraint(c.TABLE_NAME, c.CONSTRAINT_NAME);
    } catch (err) {
      console.log(`  Skipping constraint ${c.CONSTRAINT_NAME} on ${c.TABLE_NAME}: ${err.message}`);
    }
  }

  await queryInterface.dropTable('user_employments');
}
