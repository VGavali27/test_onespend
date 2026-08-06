export default (sequelize, DataTypes) => {
  const VendorCategory = sequelize.define(
    'VendorCategory',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      description: DataTypes.TEXT,
      status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    { tableName: 'vendor_categories', timestamps: true, paranoid: true, underscored: true },
  );

  VendorCategory.associate = (models) => {
    VendorCategory.belongsToMany(models.Vendor, {
      through: models.VendorCategoryMapping,
      foreignKey: 'vendor_category_id',
      otherKey: 'vendor_id',
      as: 'vendors',
    });
  };

  return VendorCategory;
};
