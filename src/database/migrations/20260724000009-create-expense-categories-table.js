export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('expense_categories', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
    module: { type: Sequelize.STRING(50), allowNull: false },
    name: { type: Sequelize.STRING(100), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    first_receiver_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    final_approver_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
    created_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('expense_categories', ['code'], { unique: true, name: 'idx_ec_code' });
  await queryInterface.addIndex('expense_categories', ['module'], { name: 'idx_ec_module' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('expense_categories');
}
