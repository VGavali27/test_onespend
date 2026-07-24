export default (sequelize, DataTypes) => {
  const Company = sequelize.define(
    'Company',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },

      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      group_id: DataTypes.BIGINT.UNSIGNED,

      name: DataTypes.STRING(150),
      code: DataTypes.STRING(30),

      email: DataTypes.STRING,
      phone: DataTypes.STRING,

      website: DataTypes.STRING,

      gst_number: DataTypes.STRING,
      pan_number: DataTypes.STRING,
      cin_number: DataTypes.STRING,

      address_line_1: DataTypes.STRING,
      address_line_2: DataTypes.STRING,

      city: DataTypes.STRING,
      state: DataTypes.STRING,
      country: DataTypes.STRING,
      pincode: DataTypes.STRING,

      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
      },

      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'companies',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  Company.associate = (models) => {
    Company.belongsTo(models.Group, {
      foreignKey: 'group_id',
      as: 'group',
    });

    Company.hasMany(models.UserEmployment, {
      foreignKey: 'company_id',
      as: 'employments',
    });
  };

  return Company;
};
