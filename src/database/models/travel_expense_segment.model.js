import { encryptAmounts } from '../../utils/encryption.js';

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
      tableName: 'travel_expense_segments',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (instance) => { encryptAmounts(instance.dataValues); },
        beforeUpdate: (instance) => { encryptAmounts(instance.dataValues); },
      },
    },
  );

  TravelExpenseSegment.associate = (models) => {
    TravelExpenseSegment.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseSegment;
};
