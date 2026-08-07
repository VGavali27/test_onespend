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
      // polymorphic parent — exactly one of pi_id / pr_id / po_id is set
      pi_id: DataTypes.BIGINT.UNSIGNED,
      pr_id: DataTypes.BIGINT.UNSIGNED,
      po_id: DataTypes.BIGINT.UNSIGNED,
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
    ProcurementHandover.belongsTo(models.ProcurementIntention, { foreignKey: 'pi_id', as: 'pi' });
    ProcurementHandover.belongsTo(models.ProcurementRequest, { foreignKey: 'pr_id', as: 'pr' });
    ProcurementHandover.belongsTo(models.ProcurementOrder, { foreignKey: 'po_id', as: 'po' });
    ProcurementHandover.belongsTo(models.Role, { foreignKey: 'from_role_id', as: 'fromRole' });
    ProcurementHandover.belongsTo(models.Role, { foreignKey: 'to_role_id', as: 'toRole' });
    ProcurementHandover.belongsTo(models.UserEmployment, { foreignKey: 'action_by_employment_id', as: 'actionBy' });
  };

  return ProcurementHandover;
};
