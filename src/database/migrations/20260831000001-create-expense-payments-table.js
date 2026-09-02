export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('expense_payments', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    amount: { type: Sequelize.TEXT, allowNull: false },
    payment_method: { type: Sequelize.STRING(30), allowNull: false },
    payment_date: { type: Sequelize.DATE, allowNull: false },
    payment_type: {
      type: Sequelize.ENUM('PARTIAL', 'FULL', 'ADVANCE_REFUND', 'ADDITIONAL', 'REFUND_RECEIVED'),
      allowNull: false,
      defaultValue: 'PARTIAL',
    },
    reference_number: { type: Sequelize.STRING(100), allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    processed_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });

  await queryInterface.addIndex('expense_payments', ['expense_id'], { name: 'idx_ep_expense_id' });
  await queryInterface.addIndex('expense_payments', ['payment_type'], { name: 'idx_ep_payment_type' });
  await queryInterface.addIndex('expense_payments', ['payment_date'], { name: 'idx_ep_payment_date' });

  await queryInterface.addConstraint('expense_payments', {
    fields: ['expense_id'],
    type: 'foreign key',
    name: 'fk_ep_expense_id',
    references: { table: 'expenses', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('expense_payments', {
    fields: ['processed_by_employment_id'],
    type: 'foreign key',
    name: 'fk_ep_processed_by_emp',
    references: { table: 'user_employments', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('expense_payments');
}