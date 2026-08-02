export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('expense_documents', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    module_name: { type: Sequelize.STRING(50), allowNull: false },
    module_record_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    label: { type: Sequelize.STRING(150), allowNull: true },
    original_file_name: { type: Sequelize.STRING(255), allowNull: false },
    stored_file_name: { type: Sequelize.STRING(255), allowNull: false },
    file_path: { type: Sequelize.TEXT, allowNull: false },
    mime_type: { type: Sequelize.STRING(100), allowNull: false },
    file_extension: { type: Sequelize.STRING(20), allowNull: true },
    file_size: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    uploaded_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('expense_documents', ['expense_id'], { name: 'idx_ed_expense' });
  await queryInterface.addConstraint('expense_documents', {
    fields: ['expense_id'],
    type: 'foreign key',
    name: 'fk_ed_expense_id',
    references: { table: 'expenses', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('expense_documents', {
    fields: ['uploaded_by_employment_id'],
    type: 'foreign key',
    name: 'fk_ed_uploaded_by_emp',
    references: { table: 'user_employments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('expense_documents');
}
