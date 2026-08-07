import { encrypt } from '../../utils/encryption.js';

// Amount fields are AES-encrypted at rest (TEXT columns). Encrypt only the fields
// actually being created/updated so an already-encrypted stored value is never
// double-encrypted on a partial update.
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
  const ProcurementRequest = sequelize.define(
    'ProcurementRequest',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      request_type: { type: DataTypes.ENUM('PI', 'PR', 'PO'), allowNull: false },
      document_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'DRAFT' },
      company_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      requested_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      current_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      current_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      total_amount: { type: DataTypes.TEXT, allowNull: true },
      tax_amount: { type: DataTypes.TEXT, allowNull: true },
      grand_total: { type: DataTypes.TEXT, allowNull: true },
      vendor_contact: { type: DataTypes.STRING(150), allowNull: true },
      delivery_address: { type: DataTypes.TEXT, allowNull: true },
      expected_delivery_date: { type: DataTypes.DATEONLY, allowNull: true },
      payment_terms: { type: DataTypes.STRING(100), allowNull: true },
      received_date: { type: DataTypes.DATEONLY, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'procurement_requests',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: encryptChangedAmounts,
        beforeUpdate: encryptChangedAmounts,
      },
    },
  );

  ProcurementRequest.associate = (models) => {
    ProcurementRequest.belongsTo(models.ProcurementRequest, { foreignKey: 'parent_id', as: 'parent' });
    ProcurementRequest.hasMany(models.ProcurementRequest, { foreignKey: 'parent_id', as: 'children' });
    ProcurementRequest.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    ProcurementRequest.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    ProcurementRequest.belongsTo(models.UserEmployment, { foreignKey: 'requested_by_employment_id', as: 'requestedByEmployment' });
    ProcurementRequest.belongsTo(models.UserEmployment, { foreignKey: 'current_employment_id', as: 'currentEmployment' });
    ProcurementRequest.belongsTo(models.Role, { foreignKey: 'current_role_id', as: 'currentRole' });
    ProcurementRequest.hasMany(models.ProcurementItem, { foreignKey: 'procurement_request_id', as: 'items' });
    ProcurementRequest.hasMany(models.ProcurementHandover, { foreignKey: 'procurement_request_id', as: 'handovers' });
    ProcurementRequest.hasMany(models.ProcurementDocument, { foreignKey: 'procurement_request_id', as: 'documents' });
    ProcurementRequest.hasMany(models.ProcurementQuotation, { foreignKey: 'procurement_request_id', as: 'quotations' });
  };

  return ProcurementRequest;
};
