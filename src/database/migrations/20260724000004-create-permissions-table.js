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
  await queryInterface.dropTable('permissions');
}
