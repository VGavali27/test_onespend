export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('role_permissions', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    role_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    permission_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: 'permissions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
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
  });
  await queryInterface.addIndex('role_permissions', ['role_id'], { name: 'idx_rp_role_id' });
  await queryInterface.addIndex('role_permissions', ['permission_id'], { name: 'idx_rp_permission_id' });
  await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], {
    unique: true,
    name: 'idx_rp_unique',
  });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('role_permissions');
}
