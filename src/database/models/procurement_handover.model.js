import { encrypt } from '../../utils/encryption.js';

// amount_at_step is an AES-encrypted snapshot of the document total at each step.
const encryptChangedAmounts = (instance) => {
  const value = instance.getDataValue('amount_at_step');
  if (value != null && (instance.isNewRecord || instance.changed('amount_at_step'))) {
    instance.setDataValue('amount_at_step', encrypt(String(value)));
  }
};

export default (sequelize, DataTypes) => {
  const ProcurementHandover = sequelize.define(
    'ProcurementHandover',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      procurement_request_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      action_type: { type: DataTypes.STRING(50), allowNull: false },
      from_role_id: DataTypes.BIGINT.UNSIGNED,
      to_role_id: DataTypes.BIGINT.UNSIGNED,
      action_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      amount_at_step: DataTypes.TEXT,
      remarks: DataTypes.TEXT,
    },
    {
      tableName: 'procurement_handovers',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: encryptChangedAmounts,
        beforeUpdate: encryptChangedAmounts,
      },
    },
  );

  ProcurementHandover.associate = (models) => {
    ProcurementHandover.belongsTo(models.ProcurementRequest, { foreignKey: 'procurement_request_id', as: 'request' });
    ProcurementHandover.belongsTo(models.Role, { foreignKey: 'from_role_id', as: 'fromRole' });
    ProcurementHandover.belongsTo(models.Role, { foreignKey: 'to_role_id', as: 'toRole' });
    ProcurementHandover.belongsTo(models.UserEmployment, { foreignKey: 'action_by_employment_id', as: 'actionBy' });
  };

  return ProcurementHandover;
};
