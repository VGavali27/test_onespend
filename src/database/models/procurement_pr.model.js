import { encrypt } from '../../utils/encryption.js';

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
  const ProcurementPr = sequelize.define(
    'ProcurementPr',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      document_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      pi_id: DataTypes.BIGINT.UNSIGNED,
      title: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'SUBMITTED' },
      company_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      vendor_id: DataTypes.BIGINT.UNSIGNED,
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
      tableName: 'procurement_prs',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: encryptChangedAmounts,
        beforeUpdate: encryptChangedAmounts,
      },
    },
  );

  ProcurementPr.associate = (models) => {
    ProcurementPr.belongsTo(models.ProcurementPi, { foreignKey: 'pi_id', as: 'pi' });
    ProcurementPr.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    ProcurementPr.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    ProcurementPr.belongsTo(models.UserEmployment, { foreignKey: 'requested_by_employment_id', as: 'requestedByEmployment' });
    ProcurementPr.belongsTo(models.UserEmployment, { foreignKey: 'current_employment_id', as: 'currentEmployment' });
    ProcurementPr.belongsTo(models.Role, { foreignKey: 'current_role_id', as: 'currentRole' });
    ProcurementPr.hasMany(models.ProcurementItem, { foreignKey: 'pr_id', as: 'items' });
    ProcurementPr.hasMany(models.ProcurementHandover, { foreignKey: 'pr_id', as: 'handovers' });
    ProcurementPr.hasMany(models.ProcurementDocument, { foreignKey: 'pr_id', as: 'documents' });
    ProcurementPr.hasMany(models.ProcurementQuotation, { foreignKey: 'pr_id', as: 'quotations' });
    ProcurementPr.hasMany(models.ProcurementPo, { foreignKey: 'pr_id', as: 'pos' });
  };

  return ProcurementPr;
};
