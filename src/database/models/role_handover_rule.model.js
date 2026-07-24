export default (sequelize, DataTypes) => {
  const RoleHandoverRule = sequelize.define(
    'RoleHandoverRule',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, allowNull: false, unique: true },
      module: { type: DataTypes.STRING(50), allowNull: false },
      from_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      to_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.STRING(20), defaultValue: 'ACTIVE' },
      created_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      updated_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      deleted_by_employment_id: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'role_handover_rules',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  RoleHandoverRule.associate = (models) => {
    RoleHandoverRule.belongsTo(models.Role, { foreignKey: 'from_role_id', as: 'fromRole' });
    RoleHandoverRule.belongsTo(models.Role, { foreignKey: 'to_role_id', as: 'toRole' });
  };

  return RoleHandoverRule;
};
