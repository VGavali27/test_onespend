import { encryptAmounts } from '../../utils/encryption.js';

export default (sequelize, DataTypes) => {
  const TravelExpenseForex = sequelize.define(
    'TravelExpenseForex',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      travel_expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      currency_code: { type: DataTypes.STRING(10), allowNull: false },
      exchange_rate: { type: DataTypes.TEXT, allowNull: true },
      estimated_foreign_amount: { type: DataTypes.TEXT, allowNull: true },
      final_foreign_amount: { type: DataTypes.TEXT, allowNull: true },
      estimated_amount: { type: DataTypes.TEXT, allowNull: true },
      final_amount: { type: DataTypes.TEXT, allowNull: true },
      paid_amount: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'travel_expense_forex',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (instance) => { encryptAmounts(instance.dataValues); },
        beforeUpdate: (instance) => { encryptAmounts(instance.dataValues); },
      },
    },
  );

  TravelExpenseForex.associate = (models) => {
    TravelExpenseForex.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseForex;
};
