export default (sequelize, DataTypes) => {
  const TravelExpenseMiscExpense = sequelize.define(
    'TravelExpenseMiscExpense',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      travel_expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      expense_type: { type: DataTypes.STRING(100), allowNull: false },
      expense_date: { type: DataTypes.DATEONLY, allowNull: false },
      vendor_name: { type: DataTypes.STRING(255), allowNull: true },
      estimated_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.0 },
      final_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.0 },
      paid_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.0 },
      status: { type: DataTypes.STRING(20), defaultValue: 'ACTIVE' },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      created_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      updated_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      deleted_by_employment_id: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'travel_expense_misc_expenses',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  TravelExpenseMiscExpense.associate = (models) => {
    TravelExpenseMiscExpense.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseMiscExpense;
};
