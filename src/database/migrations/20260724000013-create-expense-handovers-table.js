export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('expense_handovers', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    from_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    to_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    action_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    action_type: { type: Sequelize.STRING(30), allowNull: false },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    created_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('expense_handovers', ['expense_id'], { name: 'idx_eh_expense' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('expense_handovers');
}
