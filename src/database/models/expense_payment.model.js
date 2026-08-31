import { encryptAmounts } from '../../utils/encryption.js';

export default (sequelize, DataTypes) => {
  const ExpensePayment = sequelize.define(
    'ExpensePayment',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      amount: { type: DataTypes.TEXT, allowNull: false },
      payment_method: { type: DataTypes.STRING(30), allowNull: false },
      payment_date: { type: DataTypes.DATE, allowNull: false },
      payment_type: {
        type: DataTypes.ENUM('PARTIAL', 'FULL', 'ADVANCE_REFUND', 'ADDITIONAL', 'REFUND_RECEIVED'),
        allowNull: false,
        defaultValue: 'PARTIAL',
      },
      reference_number: { type: DataTypes.STRING(100), allowNull: true },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      processed_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      deleted_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'expense_payments',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (instance) => { encryptAmounts(instance.dataValues); },
        beforeUpdate: (instance) => { encryptAmounts(instance.dataValues); },
      },
    },
  );

  ExpensePayment.associate = (models) => {
    ExpensePayment.belongsTo(models.Expense, { foreignKey: 'expense_id', as: 'expense' });
    ExpensePayment.belongsTo(models.UserEmployment, { foreignKey: 'processed_by_employment_id', as: 'processedByEmployment' });
    ExpensePayment.hasMany(models.ExpensePaymentProof, { foreignKey: 'expense_payment_id', as: 'proofs' });
  };

  return ExpensePayment;
};