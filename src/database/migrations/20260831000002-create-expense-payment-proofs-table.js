export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('expense_payment_proofs', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true, defaultValue: Sequelize.literal('UUID()') },
    expense_payment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    file_path: { type: Sequelize.STRING(500), allowNull: false },
    file_name: { type: Sequelize.STRING(255), allowNull: false },
    file_type: { type: Sequelize.STRING(100), allowNull: true },
    uploaded_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });

  await queryInterface.addIndex('expense_payment_proofs', ['expense_payment_id'], { name: 'idx_epp_payment_id' });

  await queryInterface.addConstraint('expense_payment_proofs', {
    fields: ['expense_payment_id'],
    type: 'foreign key',
    name: 'fk_epp_expense_payment_id',
    references: { table: 'expense_payments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('expense_payment_proofs', {
    fields: ['uploaded_by_employment_id'],
    type: 'foreign key',
    name: 'fk_epp_uploaded_by_emp',
    references: { table: 'user_employments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('expense_payment_proofs');
}