export default (sequelize, DataTypes) => {
  const TravelExpenseForex = sequelize.define(
    'TravelExpenseForex',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      travel_expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      currency_code: { type: DataTypes.STRING(10), allowNull: false },
      exchange_rate: { type: DataTypes.DECIMAL(15, 6), allowNull: false },
      estimated_foreign_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
      final_foreign_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
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
      tableName: 'travel_expense_forex',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  TravelExpenseForex.associate = (models) => {
    TravelExpenseForex.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseForex;
};
