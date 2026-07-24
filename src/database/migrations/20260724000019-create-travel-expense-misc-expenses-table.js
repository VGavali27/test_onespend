export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_expense_misc_expenses', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    travel_expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    expense_type: { type: Sequelize.STRING(100), allowNull: false },
    expense_date: { type: Sequelize.DATEONLY, allowNull: false },
    vendor_name: { type: Sequelize.STRING(255), allowNull: true },
    estimated_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.0 },
    final_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.0 },
    paid_amount: { type: Sequelize.DECIMAL(15, 2), defaultValue: 0.0 },
    status: { type: Sequelize.STRING(20), defaultValue: 'ACTIVE' },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    created_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('travel_expense_misc_expenses', ['travel_expense_id'], { name: 'idx_teme_travel' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('travel_expense_misc_expenses');
}
