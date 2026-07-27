export default (sequelize, DataTypes) => {
  const TravelExpense = sequelize.define(
    'TravelExpense',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
      travel_type: { type: DataTypes.STRING(30), allowNull: false },
      purpose: { type: DataTypes.TEXT, allowNull: false },
      travel_start_date: { type: DataTypes.DATEONLY, allowNull: false },
      travel_end_date: { type: DataTypes.DATEONLY, allowNull: false },
      total_travellers: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'travel_expenses',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  TravelExpense.associate = (models) => {
    TravelExpense.belongsTo(models.Expense, { foreignKey: 'expense_id', as: 'expense' });
    TravelExpense.hasMany(models.TravelExpenseSegment, { foreignKey: 'travel_expense_id', as: 'segments' });
    TravelExpense.hasMany(models.TravelExpenseAccommodation, { foreignKey: 'travel_expense_id', as: 'accommodations' });
    TravelExpense.hasMany(models.TravelExpenseLocalTransport, { foreignKey: 'travel_expense_id', as: 'localTransports' });
    TravelExpense.hasMany(models.TravelExpenseForex, { foreignKey: 'travel_expense_id', as: 'forex' });
    TravelExpense.hasMany(models.TravelExpenseMiscExpense, { foreignKey: 'travel_expense_id', as: 'miscExpenses' });
  };

  return TravelExpense;
};
