export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_expenses', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, unique: true },
    travel_type: { type: Sequelize.STRING(30), allowNull: false },
    purpose: { type: Sequelize.TEXT, allowNull: false },
    travel_start_date: { type: Sequelize.DATEONLY, allowNull: false },
    travel_end_date: { type: Sequelize.DATEONLY, allowNull: false },
    total_travellers: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('travel_expenses', ['expense_id'], { unique: true, name: 'idx_te_expense' });
  await queryInterface.addConstraint('travel_expenses', {
    fields: ['expense_id'],
    type: 'foreign key',
    name: 'fk_te_expense_id',
    references: { table: 'expenses', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('travel_expenses');
}
