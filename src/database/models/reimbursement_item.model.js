import { encryptAmounts } from '../../utils/encryption.js';

export default (sequelize, DataTypes) => {
  const ReimbursementItem = sequelize.define(
    'ReimbursementItem',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      reimbursement_expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      expense_date: DataTypes.DATEONLY,
      description: { type: DataTypes.STRING(255), allowNull: false },
      bill_number: DataTypes.STRING(100),
      expense_type: DataTypes.STRING(50),
      total_amount: DataTypes.TEXT,
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'reimbursement_expense_items',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (instance) => { encryptAmounts(instance.dataValues); },
        beforeUpdate: (instance) => { encryptAmounts(instance.dataValues); },
      },
    },
  );

  ReimbursementItem.associate = (models) => {
    ReimbursementItem.belongsTo(models.ReimbursementExpense, {
      foreignKey: 'reimbursement_expense_id',
      as: 'reimbursementExpense',
    });
  };

  return ReimbursementItem;
};
