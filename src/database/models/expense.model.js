import { encryptAmounts, decryptAmounts } from '../../utils/encryption.js';

export default (sequelize, DataTypes) => {
  const Expense = sequelize.define(
    'Expense',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      expense_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true, len: [3, 255] },
      },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      company_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      requested_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      current_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      current_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      estimated_amount: { type: DataTypes.TEXT, allowNull: true },
      final_amount: { type: DataTypes.TEXT, allowNull: true },
      paid_amount: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'DRAFT' },
      submitted_at: { type: DataTypes.DATE, allowNull: true },
      closed_at: { type: DataTypes.DATE, allowNull: true },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      deleted_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'expenses',
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

  Expense.associate = (models) => {
    Expense.belongsTo(models.ExpenseCategory, { foreignKey: 'category_id', as: 'category' });
    Expense.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    Expense.belongsTo(models.UserEmployment, { foreignKey: 'requested_by_employment_id', as: 'requestedByEmployment' });
    Expense.belongsTo(models.UserEmployment, { foreignKey: 'current_employment_id', as: 'currentEmployment' });
    Expense.belongsTo(models.Role, { foreignKey: 'current_role_id', as: 'currentRole' });
    Expense.hasOne(models.TravelExpense, { foreignKey: 'expense_id', as: 'travelExpense' });
    Expense.hasMany(models.ExpenseDocument, { foreignKey: 'expense_id', as: 'documents' });
    Expense.hasMany(models.ExpenseHandover, { foreignKey: 'expense_id', as: 'handovers' });
  };

  return Expense;
};
