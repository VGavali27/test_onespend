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
  const ProcurementQuotation = sequelize.define(
    'ProcurementQuotation',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      pr_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      title: DataTypes.STRING(255),
      total_amount: DataTypes.TEXT,
      tax_amount: DataTypes.TEXT,
      grand_total: DataTypes.TEXT,
      valid_until: DataTypes.DATEONLY,
      terms: DataTypes.TEXT,
      notes: DataTypes.TEXT,
      status: { type: DataTypes.ENUM('ACTIVE', 'SELECTED', 'REJECTED'), allowNull: false, defaultValue: 'ACTIVE' },
      created_by_employment_id: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'procurement_quotations',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: encryptChangedAmounts,
        beforeUpdate: encryptChangedAmounts,
      },
    },
  );

  ProcurementQuotation.associate = (models) => {
    ProcurementQuotation.belongsTo(models.ProcurementRequest, { foreignKey: 'pr_id', as: 'pr' });
    ProcurementQuotation.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    ProcurementQuotation.hasMany(models.ProcurementDocument, { foreignKey: 'procurement_quotation_id', as: 'documents' });
  };

  return ProcurementQuotation;
};
