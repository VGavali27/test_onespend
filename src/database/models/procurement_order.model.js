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
  const ProcurementOrder = sequelize.define(
    'ProcurementOrder',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      document_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      pr_id: DataTypes.BIGINT.UNSIGNED,
      title: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'CREATED' },
      company_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      vendor_id: DataTypes.BIGINT.UNSIGNED,
      requested_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      current_role_id: DataTypes.BIGINT.UNSIGNED,
      current_employment_id: DataTypes.BIGINT.UNSIGNED,
      total_amount: DataTypes.TEXT,
      tax_amount: DataTypes.TEXT,
      grand_total: DataTypes.TEXT,
      expected_delivery_date: DataTypes.DATEONLY,
      received_date: DataTypes.DATEONLY,
      notes: DataTypes.TEXT,
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'procurement_orders',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: encryptChangedAmounts,
        beforeUpdate: encryptChangedAmounts,
      },
    },
  );

  ProcurementOrder.associate = (models) => {
    ProcurementOrder.belongsTo(models.ProcurementRequest, { foreignKey: 'pr_id', as: 'pr' });
    ProcurementOrder.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    ProcurementOrder.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    ProcurementOrder.belongsTo(models.UserEmployment, { foreignKey: 'requested_by_employment_id', as: 'requestedByEmployment' });
    ProcurementOrder.belongsTo(models.UserEmployment, { foreignKey: 'current_employment_id', as: 'currentEmployment' });
    ProcurementOrder.belongsTo(models.Role, { foreignKey: 'current_role_id', as: 'currentRole' });
    ProcurementOrder.hasMany(models.ProcurementItem, { foreignKey: 'po_id', as: 'items' });
    ProcurementOrder.hasMany(models.ProcurementHandover, { foreignKey: 'po_id', as: 'handovers' });
    ProcurementOrder.hasMany(models.ProcurementDocument, { foreignKey: 'po_id', as: 'documents' });
    // PO-created expenses (follow the expense role-handover chain)
    ProcurementOrder.hasMany(models.Expense, { foreignKey: 'procurement_po_id', as: 'expenses' });
  };

  return ProcurementOrder;
};
