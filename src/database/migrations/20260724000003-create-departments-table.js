export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('departments', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
    },
    name: { type: Sequelize.STRING(150), allowNull: false },
    code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
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
  await queryInterface.addIndex('departments', ['code'], { unique: true, name: 'idx_departments_code' });
  await queryInterface.addIndex('departments', ['uuid'], { unique: true, name: 'idx_departments_uuid' });
}
export async function down(queryInterface, _Sequelize) {
  // Remove ALL FKs from any table referencing departments before dropping
  const [constraints] = await queryInterface.sequelize.query(`
    SELECT DISTINCT kcu.CONSTRAINT_NAME, kcu.TABLE_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
    WHERE rc.REFERENCED_TABLE_NAME = 'departments'
  `);
  for (const c of constraints) {
    try {
      await queryInterface.removeConstraint(c.TABLE_NAME, c.CONSTRAINT_NAME);
    } catch (err) {
      console.log(`  Skipping constraint ${c.CONSTRAINT_NAME} on ${c.TABLE_NAME}: ${err.message}`);
    }
  }

  await queryInterface.dropTable('departments');
}
