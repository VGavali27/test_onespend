import { encryptAmounts, decryptAmounts } from '../../utils/encryption.js';

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
      estimated_amount: { type: DataTypes.TEXT, allowNull: true },
      final_amount: { type: DataTypes.TEXT, allowNull: true },
      paid_amount: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      deleted_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'travel_expense_local_transports',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (instance) => { encryptAmounts(instance.dataValues); },
        beforeUpdate: (instance) => { encryptAmounts(instance.dataValues); },
        afterFind: (result) => {
          if (result) {
            const rows = Array.isArray(result) ? result : [result];
            rows.forEach((row) => decryptAmounts(row.dataValues));
          }
        },
      },
    },
  );

  TravelExpenseLocalTransport.associate = (models) => {
    TravelExpenseLocalTransport.belongsTo(models.TravelExpense, { foreignKey: 'travel_expense_id', as: 'travelExpense' });
  };

  return TravelExpenseLocalTransport;
};
