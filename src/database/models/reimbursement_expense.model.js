import { encryptAmounts } from '../../utils/encryption.js';

export default (sequelize, DataTypes) => {
  const ReimbursementExpense = sequelize.define(
    'ReimbursementExpense',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
      advance_amount: DataTypes.TEXT,
      advance_date: DataTypes.DATEONLY,
      payment_method: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'CASH' },
      remarks: DataTypes.TEXT,
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'reimbursement_expenses',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (instance) => { encryptAmounts(instance.dataValues); },
        beforeUpdate: (instance) => { encryptAmounts(instance.dataValues); },
      },
    },
  );

  ReimbursementExpense.associate = (models) => {
    ReimbursementExpense.belongsTo(models.Expense, { foreignKey: 'expense_id', as: 'expense' });
    ReimbursementExpense.hasMany(models.ReimbursementItem, {
      foreignKey: 'reimbursement_expense_id',
      as: 'items',
    });
  };

  return ReimbursementExpense;
};
