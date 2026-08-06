export default (sequelize, DataTypes) => {
  const VendorAddress = sequelize.define(
    'VendorAddress',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      address_type: { type: DataTypes.STRING(50), defaultValue: 'REGISTERED' },
      address_line_1: DataTypes.STRING(255),
      address_line_2: DataTypes.STRING(255),
      city: DataTypes.STRING(100),
      state: DataTypes.STRING(100),
      country: DataTypes.STRING(100),
      pincode: DataTypes.STRING(20),
      is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
      status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    { tableName: 'vendor_addresses', timestamps: true, paranoid: true, underscored: true },
  );

  VendorAddress.associate = (models) => {
    VendorAddress.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
  };

  return VendorAddress;
};
