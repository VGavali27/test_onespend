export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('expenses', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    expense_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
    title: { type: Sequelize.STRING(255), allowNull: false },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    company_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    requested_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    current_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    current_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    estimated_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
    final_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
    paid_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
    status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'DRAFT' },
    submitted_at: { type: Sequelize.DATE, allowNull: true },
    closed_at: { type: Sequelize.DATE, allowNull: true },
    created_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('expenses', ['expense_number'], { unique: true, name: 'idx_exp_number' });
  await queryInterface.addIndex('expenses', ['category_id'], { name: 'idx_exp_category' });
  await queryInterface.addIndex('expenses', ['company_id'], { name: 'idx_exp_company' });
  await queryInterface.addIndex('expenses', ['status'], { name: 'idx_exp_status' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('expenses');
}
