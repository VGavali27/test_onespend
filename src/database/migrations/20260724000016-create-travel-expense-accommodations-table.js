export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('travel_expense_accommodations', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    travel_expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    accommodation_type: { type: Sequelize.STRING(50), allowNull: false },
    city: { type: Sequelize.STRING(150), allowNull: false },
    property_name: { type: Sequelize.STRING(255), allowNull: true },
    property_address: { type: Sequelize.TEXT, allowNull: true },
    check_in: { type: Sequelize.DATE, allowNull: false },
    check_out: { type: Sequelize.DATE, allowNull: false },
    total_rooms: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    total_guests: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    estimated_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
    final_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
    paid_amount: { type: Sequelize.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    created_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('travel_expense_accommodations', ['travel_expense_id'], { name: 'idx_tea_travel' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('travel_expense_accommodations');
}
