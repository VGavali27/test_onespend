import { encrypt } from '../../utils/encryption.js';

// Amount fields are AES-encrypted at rest (TEXT columns). unit_price and
// total_with_tax aren't matched by the shared encryptAmounts util (which only
// covers *_amount / exchange_rate), so this model encrypts its own set.
const AMOUNT_FIELDS = ['unit_price', 'total_amount', 'tax_amount', 'total_with_tax'];

const encryptChangedAmounts = (instance) => {
  for (const field of AMOUNT_FIELDS) {
    const value = instance.getDataValue(field);
    if (value != null && (instance.isNewRecord || instance.changed(field))) {
      instance.setDataValue(field, encrypt(String(value)));
    }
  }
};

export default (sequelize, DataTypes) => {
  const ProcurementItem = sequelize.define(
    'ProcurementItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      // polymorphic parent — exactly one of pi_id / pr_id / po_id / quotation_id is set
      pi_id: DataTypes.BIGINT.UNSIGNED,
      pr_id: DataTypes.BIGINT.UNSIGNED,
      po_id: DataTypes.BIGINT.UNSIGNED,
      quotation_id: DataTypes.BIGINT.UNSIGNED,
      item_name: { type: DataTypes.STRING(255), allowNull: false },
      description: DataTypes.TEXT,
      category: DataTypes.STRING(100),
      quantity: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
      unit_price: DataTypes.TEXT,
      // tax rate (%) stored plain — only sensitive amounts are encrypted
      tax_rate: DataTypes.DECIMAL(10, 2),
      total_amount: DataTypes.TEXT,
      tax_amount: DataTypes.TEXT,
      total_with_tax: DataTypes.TEXT,
      sort_order: DataTypes.INTEGER,
    },
    {
      tableName: 'procurement_items',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: encryptChangedAmounts,
        beforeUpdate: encryptChangedAmounts,
      },
    },
  );

  ProcurementItem.associate = (models) => {
    ProcurementItem.belongsTo(models.ProcurementIntention, { foreignKey: 'pi_id', as: 'pi' });
    ProcurementItem.belongsTo(models.ProcurementRequest, { foreignKey: 'pr_id', as: 'pr' });
    ProcurementItem.belongsTo(models.ProcurementOrder, { foreignKey: 'po_id', as: 'po' });
    ProcurementItem.belongsTo(models.ProcurementQuotation, { foreignKey: 'quotation_id', as: 'quotation' });
  };

  return ProcurementItem;
};
