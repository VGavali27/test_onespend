export default (sequelize, DataTypes) => {
  const VendorContact = sequelize.define(
    'VendorContact',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      contact_type: { type: DataTypes.STRING(50), defaultValue: 'PRIMARY' },
      salutation: DataTypes.STRING(20),
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name: DataTypes.STRING(100),
      designation: DataTypes.STRING(150),
      email: DataTypes.STRING(255),
      phone: DataTypes.STRING(40),
      mobile: DataTypes.STRING(40),
      is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
      status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    { tableName: 'vendor_contacts', timestamps: true, paranoid: true, underscored: true },
  );

  VendorContact.associate = (models) => {
    VendorContact.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
  };

  return VendorContact;
};
