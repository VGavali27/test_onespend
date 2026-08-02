export default (sequelize, DataTypes) => {
  const ExpenseCategory = sequelize.define(
    'ExpenseCategory',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: { notEmpty: true },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      first_receiver_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      final_approver_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      deleted_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'expense_categories',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  ExpenseCategory.associate = (models) => {
    ExpenseCategory.hasMany(models.Expense, { foreignKey: 'category_id', as: 'expenses' });
    ExpenseCategory.belongsTo(models.Role, { foreignKey: 'first_receiver_role_id', as: 'firstReceiverRole' });
    ExpenseCategory.belongsTo(models.Role, { foreignKey: 'final_approver_role_id', as: 'finalApproverRole' });
  };

  return ExpenseCategory;
};
