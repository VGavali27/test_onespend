export default (sequelize, DataTypes) => {
  const ExpenseHandover = sequelize.define(
    'ExpenseHandover',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      from_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      to_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      action_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      action_type: { type: DataTypes.STRING(30), allowNull: false },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      created_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      updated_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      deleted_by_employment_id: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'expense_handovers',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  ExpenseHandover.associate = (models) => {
    ExpenseHandover.belongsTo(models.Expense, { foreignKey: 'expense_id', as: 'expense' });
    ExpenseHandover.belongsTo(models.Role, { foreignKey: 'from_role_id', as: 'fromRole' });
    ExpenseHandover.belongsTo(models.Role, { foreignKey: 'to_role_id', as: 'toRole' });
    ExpenseHandover.belongsTo(models.UserEmployment, { foreignKey: 'action_by_employment_id', as: 'actionBy' });
  };

  return ExpenseHandover;
};
