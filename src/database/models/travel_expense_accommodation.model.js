export default (sequelize, DataTypes) => {
  const TravelExpenseAccommodation = sequelize.define(
    'TravelExpenseAccommodation',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      travel_expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      accommodation_type: { type: DataTypes.STRING(50), allowNull: false },
      city: { type: DataTypes.STRING(150), allowNull: false },
      property_name: { type: DataTypes.STRING(255), allowNull: true },
      property_address: { type: DataTypes.TEXT, allowNull: true },
      check_in: { type: DataTypes.DATE, allowNull: false },
      check_out: { type: DataTypes.DATE, allowNull: false },
      total_rooms: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      total_guests: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      estimated_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
      final_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      paid_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      created_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      updated_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      deleted_by_employment_id: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'travel_expense_accommodations',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  TravelExpenseAccommodation.associate = (models) => {
    TravelExpenseAccommodation.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseAccommodation;
};
