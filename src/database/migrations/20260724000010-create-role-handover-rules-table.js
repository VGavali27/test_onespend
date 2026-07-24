export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('role_handover_rules', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    module: { type: Sequelize.STRING(50), allowNull: false },
    from_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    to_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    status: { type: Sequelize.STRING(20), defaultValue: 'ACTIVE' },
    created_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('role_handover_rules', ['module'], { name: 'idx_rhr_module' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('role_handover_rules');
}
