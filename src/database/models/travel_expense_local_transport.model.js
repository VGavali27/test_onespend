export default (sequelize, DataTypes) => {
  const TravelExpenseLocalTransport = sequelize.define(
    'TravelExpenseLocalTransport',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      travel_expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      transport_type: { type: DataTypes.STRING(30), allowNull: false },
      from_location: { type: DataTypes.STRING(255), allowNull: false },
      to_location: { type: DataTypes.STRING(255), allowNull: false },
      travel_datetime: { type: DataTypes.DATE, allowNull: false },
      estimated_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
      final_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
      paid_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.0 },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      created_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      deleted_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'travel_expense_local_transports',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  TravelExpenseLocalTransport.associate = (models) => {
    TravelExpenseLocalTransport.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseLocalTransport;
};
