/**
 * Migration: Reimbursement expense tables
 *
 * Reimbursement = an employee paid an expense out of pocket (card/cash) and is
 * claiming it back from the company. It can be ANY kind of expense (a license,
 * an app, meals, travel, fuel, ...). Mirrors the existing paper
 * "EXPENSES REIMBURSEMENT STATEMENT":
 *   - header: Advance Received (amount + date), Remarks
 *   - detail rows: Date, Description, Bill No., Exps. Type, Total (INR)
 * Total Exp. and Balance Amount are derived (Σ items, minus advance).
 *
 * Money columns are TEXT because amounts are AES-encrypted at the model layer.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('reimbursement_expenses', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: { type: Sequelize.UUID, allowNull: false },
    expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    advance_amount: { type: Sequelize.TEXT, allowNull: true },
    advance_date: { type: Sequelize.DATEONLY, allowNull: true },
    payment_method: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'CASH' },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
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
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('reimbursement_expenses', ['uuid'], { name: 'idx_re_expenses_uuid' });
  await queryInterface.addIndex('reimbursement_expenses', ['expense_id'], { name: 'idx_re_expenses_expense_id', unique: true });
  await queryInterface.addConstraint('reimbursement_expenses', {
    fields: ['expense_id'],
    type: 'foreign key',
    name: 'fk_re_expenses_expense_id',
    references: { table: 'expenses', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  await queryInterface.createTable('reimbursement_expense_items', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: { type: Sequelize.UUID, allowNull: false },
    reimbursement_expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    expense_date: { type: Sequelize.DATEONLY, allowNull: true },
    description: { type: Sequelize.STRING(255), allowNull: false },
    bill_number: { type: Sequelize.STRING(100), allowNull: true },
    expense_type: { type: Sequelize.STRING(50), allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
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
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('reimbursement_expense_items', ['uuid'], { name: 'idx_re_items_uuid' });
  await queryInterface.addIndex('reimbursement_expense_items', ['reimbursement_expense_id'], { name: 'idx_re_items_re_expense_id' });
  await queryInterface.addConstraint('reimbursement_expense_items', {
    fields: ['reimbursement_expense_id'],
    type: 'foreign key',
    name: 'fk_re_items_re_expense_id',
    references: { table: 'reimbursement_expenses', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('reimbursement_expense_items');
  await queryInterface.dropTable('reimbursement_expenses');
}
