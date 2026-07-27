export default (sequelize, DataTypes) => {
  const TravelExpenseSegment = sequelize.define(
    'TravelExpenseSegment',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      travel_expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      travel_mode: { type: DataTypes.STRING(30), allowNull: false },
      from_location: { type: DataTypes.STRING(255), allowNull: false },
      to_location: { type: DataTypes.STRING(255), allowNull: false },
      departure_datetime: { type: DataTypes.DATE, allowNull: false },
      arrival_datetime: { type: DataTypes.DATE, allowNull: false },
      preferred_vendor: { type: DataTypes.STRING(255), allowNull: true },
      preferred_number: { type: DataTypes.STRING(100), allowNull: true },
      seat_preference: { type: DataTypes.STRING(50), allowNull: true },
      meal_preference: { type: DataTypes.STRING(50), allowNull: true },
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
      tableName: 'travel_expense_segments',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  TravelExpenseSegment.associate = (models) => {
    TravelExpenseSegment.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseSegment;
};
