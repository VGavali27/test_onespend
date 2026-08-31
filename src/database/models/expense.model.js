import { encryptAmounts } from '../../utils/encryption.js';

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
        defaultValue: DataTypes.UUIDV4,
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
      advance_amount: { type: DataTypes.TEXT, allowNull: true, defaultValue: '0' },
      paid_amount: { type: DataTypes.TEXT, allowNull: true, defaultValue: '0' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'DRAFT' },
      payment_status: {
        type: DataTypes.ENUM('UNPAID', 'PARTIAL_PAID', 'PAID', 'ADVANCE_REFUND_DUE', 'ADDITIONAL_PAYMENT_DUE', 'SETTLED'),
        allowNull: false,
        defaultValue: 'UNPAID',
      },
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
    Expense.hasOne(models.ReimbursementExpense, { foreignKey: 'expense_id', as: 'reimbursementExpense' });
    Expense.hasOne(models.ProcurementOrder, { foreignKey: 'expense_id', as: 'procurementOrder' });
    Expense.hasMany(models.ExpenseDocument, { foreignKey: 'expense_id', as: 'documents' });
    Expense.hasMany(models.ExpenseHandover, { foreignKey: 'expense_id', as: 'handovers' });
    Expense.hasMany(models.ExpensePayment, { foreignKey: 'expense_id', as: 'payments' });
  };

  return Expense;
};
