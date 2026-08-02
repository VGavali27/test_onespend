export default (sequelize, DataTypes) => {
  const RoleHandoverRule = sequelize.define(
    'RoleHandoverRule',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      module: { type: DataTypes.STRING(50), allowNull: false },
      from_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      to_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.STRING(20), defaultValue: 'ACTIVE' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
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
