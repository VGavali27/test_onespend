export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('roles', {
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
    name: { type: Sequelize.STRING(100), allowNull: false },
    code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    level: { type: Sequelize.SMALLINT.UNSIGNED, defaultValue: 100 },
    is_system: { type: Sequelize.BOOLEAN, defaultValue: true },
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
  await queryInterface.addIndex('roles', ['code'], { unique: true, name: 'idx_roles_code' });
  await queryInterface.addIndex('roles', ['uuid'], { unique: true, name: 'idx_roles_uuid' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('roles');
}
