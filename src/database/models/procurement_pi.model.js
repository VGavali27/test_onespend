import { encrypt } from '../../utils/encryption.js';

// Amount fields are AES-encrypted at rest (TEXT columns). The shared encryptAmounts
// util covers *_amount / exchange_rate only, so this model encrypts its own set.
const AMOUNT_FIELDS = ['total_amount', 'tax_amount', 'grand_total'];

const encryptChangedAmounts = (instance) => {
  for (const field of AMOUNT_FIELDS) {
    const value = instance.getDataValue(field);
    if (value != null && (instance.isNewRecord || instance.changed(field))) {
      instance.setDataValue(field, encrypt(String(value)));
    }
  }
};

export default (sequelize, DataTypes) => {
  const ProcurementPi = sequelize.define(
    'ProcurementPi',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      document_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'DRAFT' },
      company_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      requested_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      current_role_id: DataTypes.BIGINT.UNSIGNED,
      current_employment_id: DataTypes.BIGINT.UNSIGNED,
      total_amount: DataTypes.TEXT,
      tax_amount: DataTypes.TEXT,
      grand_total: DataTypes.TEXT,
      expected_delivery_date: DataTypes.DATEONLY,
      notes: DataTypes.TEXT,
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'procurement_pis',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: encryptChangedAmounts,
        beforeUpdate: encryptChangedAmounts,
      },
    },
  );

  ProcurementPi.associate = (models) => {
    ProcurementPi.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    ProcurementPi.belongsTo(models.UserEmployment, { foreignKey: 'requested_by_employment_id', as: 'requestedByEmployment' });
    ProcurementPi.belongsTo(models.UserEmployment, { foreignKey: 'current_employment_id', as: 'currentEmployment' });
    ProcurementPi.belongsTo(models.Role, { foreignKey: 'current_role_id', as: 'currentRole' });
    ProcurementPi.hasMany(models.ProcurementItem, { foreignKey: 'pi_id', as: 'items' });
    ProcurementPi.hasMany(models.ProcurementHandover, { foreignKey: 'pi_id', as: 'handovers' });
    ProcurementPi.hasMany(models.ProcurementDocument, { foreignKey: 'pi_id', as: 'documents' });
    ProcurementPi.hasMany(models.ProcurementPr, { foreignKey: 'pi_id', as: 'prs' });
  };

  return ProcurementPi;
};
