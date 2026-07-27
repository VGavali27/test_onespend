export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_expense_segments', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    travel_expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    travel_mode: { type: Sequelize.STRING(30), allowNull: false },
    from_location: { type: Sequelize.STRING(255), allowNull: false },
    to_location: { type: Sequelize.STRING(255), allowNull: false },
    departure_datetime: { type: Sequelize.DATE, allowNull: false },
    arrival_datetime: { type: Sequelize.DATE, allowNull: false },
    preferred_vendor: { type: Sequelize.STRING(255), allowNull: true },
    preferred_number: { type: Sequelize.STRING(100), allowNull: true },
    seat_preference: { type: Sequelize.STRING(50), allowNull: true },
    meal_preference: { type: Sequelize.STRING(50), allowNull: true },
    estimated_amount: { type: Sequelize.TEXT, allowNull: true },
    final_amount: { type: Sequelize.TEXT, allowNull: true },
    paid_amount: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('travel_expense_segments', ['travel_expense_id'], { name: 'idx_tes_travel' });
  await queryInterface.addConstraint('travel_expense_segments', {
    fields: ['travel_expense_id'],
    type: 'foreign key',
    name: 'fk_tes_travel_expense_id',
    references: { table: 'travel_expenses', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('travel_expense_segments');
}
