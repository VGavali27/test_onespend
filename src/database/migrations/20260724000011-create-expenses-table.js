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
    estimated_amount: { type: Sequelize.TEXT, allowNull: true },
    final_amount: { type: Sequelize.TEXT, allowNull: true },
    paid_amount: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'DRAFT' },
    submitted_at: { type: Sequelize.DATE, allowNull: true },
    closed_at: { type: Sequelize.DATE, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('expenses', ['expense_number'], { unique: true, name: 'idx_exp_number' });
  await queryInterface.addIndex('expenses', ['category_id'], { name: 'idx_exp_category' });
  await queryInterface.addIndex('expenses', ['company_id'], { name: 'idx_exp_company' });
  await queryInterface.addIndex('expenses', ['status'], { name: 'idx_exp_status' });
  await queryInterface.addConstraint('expenses', {
    fields: ['category_id'],
    type: 'foreign key',
    name: 'fk_exp_category_id',
    references: { table: 'expense_categories', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('expenses', {
    fields: ['company_id'],
    type: 'foreign key',
    name: 'fk_exp_company_id',
    references: { table: 'companies', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('expenses', {
    fields: ['requested_by_employment_id'],
    type: 'foreign key',
    name: 'fk_exp_requested_by_emp',
    references: { table: 'user_employments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('expenses', {
    fields: ['current_role_id'],
    type: 'foreign key',
    name: 'fk_exp_current_role_id',
    references: { table: 'roles', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('expenses', {
    fields: ['current_employment_id'],
    type: 'foreign key',
    name: 'fk_exp_current_employment_id',
    references: { table: 'user_employments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('expenses');
}
