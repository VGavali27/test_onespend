export default (sequelize, DataTypes) => {
  const ExpenseFlowStep = sequelize.define(
    'ExpenseFlowStep',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      step_position: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      step_label: { type: DataTypes.STRING(80), allowNull: false },
      is_final: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      deleted_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'expense_flow_steps',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  ExpenseFlowStep.associate = (models) => {
    ExpenseFlowStep.belongsTo(models.ExpenseCategory, { foreignKey: 'category_id', as: 'category' });
    ExpenseFlowStep.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
  };

  return ExpenseFlowStep;
};