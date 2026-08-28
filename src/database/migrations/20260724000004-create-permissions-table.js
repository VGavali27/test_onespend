export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('permissions', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    resource: { type: Sequelize.STRING, allowNull: true },
    action: { type: Sequelize.STRING, allowNull: true },
    permission_key: { type: Sequelize.STRING, allowNull: true },
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
  await queryInterface.addIndex('permissions', ['uuid'], { name: 'idx_permissions_uuid' });
}
export async function down(queryInterface, _Sequelize) {
  // Remove ALL FKs from any table referencing permissions before dropping
  const [constraints] = await queryInterface.sequelize.query(`
    SELECT DISTINCT kcu.CONSTRAINT_NAME, kcu.TABLE_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
    WHERE rc.REFERENCED_TABLE_NAME = 'permissions'
  `);
  for (const c of constraints) {
    try {
      await queryInterface.removeConstraint(c.TABLE_NAME, c.CONSTRAINT_NAME);
    } catch (err) {
      console.log(`  Skipping constraint ${c.CONSTRAINT_NAME} on ${c.TABLE_NAME}: ${err.message}`);
    }
  }

  await queryInterface.dropTable('permissions');
}
