export default (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
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

      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },

      description: {
        type: DataTypes.TEXT,
      },

      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
      },

      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'departments',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  Department.associate = (models) => {
    Department.hasMany(models.User, {
      foreignKey: 'department_id',
      as: 'users',
    });
  };

  return Department;
};
