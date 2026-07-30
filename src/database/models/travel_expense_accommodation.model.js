import { encryptAmounts } from '../../utils/encryption.js';

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
      tableName: 'travel_expense_accommodations',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (instance) => { encryptAmounts(instance.dataValues); },
        beforeUpdate: (instance) => { encryptAmounts(instance.dataValues); },
      },
    },
  );

  TravelExpenseAccommodation.associate = (models) => {
    TravelExpenseAccommodation.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseAccommodation;
};
