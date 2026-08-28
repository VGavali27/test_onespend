export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: { type: Sequelize.UUID, allowNull: false },
    role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    department_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    first_name: { type: Sequelize.STRING(100), allowNull: true },
    middle_name: { type: Sequelize.STRING(100), allowNull: true },
    last_name: { type: Sequelize.STRING(100), allowNull: true },
    email: { type: Sequelize.STRING(150), allowNull: true },
    mobile: { type: Sequelize.STRING(20), allowNull: true },
    password: { type: Sequelize.STRING, allowNull: true },
    profile_image: { type: Sequelize.STRING, allowNull: true },
    last_login_at: { type: Sequelize.DATE, allowNull: true },
    email_verified_at: { type: Sequelize.DATE, allowNull: true },
    mobile_verified_at: { type: Sequelize.DATE, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'), defaultValue: 'ACTIVE' },
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
  await queryInterface.addIndex('users', ['uuid'], { name: 'idx_users_uuid' });
  await queryInterface.addIndex('users', ['email'], { name: 'idx_users_email' });
  await queryInterface.addIndex('users', ['mobile'], { name: 'idx_users_mobile' });
  await queryInterface.addIndex('users', ['role_id'], { name: 'idx_users_role_id' });
  await queryInterface.addConstraint('users', {
    fields: ['role_id'],
    type: 'foreign key',
    name: 'fk_users_role_id',
    references: { table: 'roles', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
  await queryInterface.addIndex('users', ['department_id'], { name: 'idx_users_department_id' });
  await queryInterface.addConstraint('users', {
    fields: ['department_id'],
    type: 'foreign key',
    name: 'fk_users_department_id',
    references: { table: 'departments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}
export async function down(queryInterface, _Sequelize) {
  // Remove ALL FKs from any table referencing users before dropping
  const [constraints] = await queryInterface.sequelize.query(`
    SELECT DISTINCT kcu.CONSTRAINT_NAME, kcu.TABLE_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
    WHERE rc.REFERENCED_TABLE_NAME = 'users'
  `);
  for (const c of constraints) {
    try {
      await queryInterface.removeConstraint(c.TABLE_NAME, c.CONSTRAINT_NAME);
    } catch (err) {
      console.log(`  Skipping constraint ${c.CONSTRAINT_NAME} on ${c.TABLE_NAME}: ${err.message}`);
    }
  }

  await queryInterface.dropTable('users');
}
