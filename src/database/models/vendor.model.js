export default (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    'Vendor',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      name: { type: DataTypes.STRING(255), allowNull: false },
      code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      vendor_type: { type: DataTypes.STRING(50), defaultValue: 'VENDOR' },
      logo_img: DataTypes.STRING(255),
      website: DataTypes.STRING(255),
      gst_number: DataTypes.STRING(50),
      pan_number: DataTypes.STRING(50),
      cin_number: DataTypes.STRING(50),
      payment_terms: DataTypes.STRING(100),
      rating: DataTypes.DECIMAL(2, 1),
      notes: DataTypes.TEXT,
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
      },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'vendors',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  Vendor.associate = (models) => {
    Vendor.hasMany(models.VendorContact, { foreignKey: 'vendor_id', as: 'contacts' });
    Vendor.hasMany(models.VendorAddress, { foreignKey: 'vendor_id', as: 'addresses' });
    Vendor.hasMany(models.VendorBankAccount, { foreignKey: 'vendor_id', as: 'bankAccounts' });
    Vendor.hasMany(models.VendorDocument, { foreignKey: 'vendor_id', as: 'documents' });
  };

  return Vendor;
};
