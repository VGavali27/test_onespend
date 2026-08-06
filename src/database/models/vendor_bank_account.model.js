import { encrypt } from '../../utils/encryption.js';

export default (sequelize, DataTypes) => {
  const VendorBankAccount = sequelize.define(
    'VendorBankAccount',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      account_type: { type: DataTypes.STRING(50), defaultValue: 'PRIMARY' },
      account_holder_name: DataTypes.STRING(150),
      bank_name: DataTypes.STRING(150),
      bank_branch: DataTypes.STRING(150),
      account_number: DataTypes.TEXT, // AES-encrypted at rest (see hooks)
      ifsc: DataTypes.STRING(20),
      swift_code: DataTypes.STRING(20),
      currency_code: { type: DataTypes.STRING(10), defaultValue: 'INR' },
      is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
      status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'vendor_bank_accounts',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: (inst) => {
          if (inst.account_number) inst.account_number = encrypt(String(inst.account_number));
        },
        beforeUpdate: (inst) => {
          if (inst.account_number && !String(inst.account_number).includes(':')) {
            inst.account_number = encrypt(String(inst.account_number));
          }
        },
      },
    },
  );

  VendorBankAccount.associate = (models) => {
    VendorBankAccount.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
  };

  return VendorBankAccount;
};
