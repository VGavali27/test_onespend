export default (sequelize, DataTypes) => {
  const VendorCategoryMapping = sequelize.define(
    'VendorCategoryMapping',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      vendor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      vendor_category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    },
    { tableName: 'vendor_category_mappings', timestamps: true, underscored: true },
  );

  VendorCategoryMapping.associate = (models) => {
    VendorCategoryMapping.belongsTo(models.Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
    VendorCategoryMapping.belongsTo(models.VendorCategory, { foreignKey: 'vendor_category_id', as: 'category' });
  };

  return VendorCategoryMapping;
};
