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
      procurement_request_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      item_name: { type: DataTypes.STRING(255), allowNull: false },
      description: DataTypes.TEXT,
      category: DataTypes.STRING(100),
      quantity: { type: DataTypes.DECIMAL(18, 2), defaultValue: 1 },
      unit: DataTypes.STRING(20),
      unit_price: DataTypes.TEXT,
      total_amount: DataTypes.TEXT,
      tax_rate: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
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
    ProcurementItem.belongsTo(models.ProcurementRequest, { foreignKey: 'procurement_request_id', as: 'request' });
  };

  return ProcurementItem;
};
