export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
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
      },

      role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      department_id: DataTypes.BIGINT.UNSIGNED,

      first_name: DataTypes.STRING(100),
      middle_name: DataTypes.STRING(100),
      last_name: DataTypes.STRING(100),

      email: DataTypes.STRING(150),

      mobile: DataTypes.STRING(20),

      password: DataTypes.STRING,

      profile_image: DataTypes.STRING,

      last_login_at: DataTypes.DATE,
      email_verified_at: DataTypes.DATE,
      mobile_verified_at: DataTypes.DATE,

      status: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'),

      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      underscored: true,
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
    },
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
    });

    User.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
    });

    User.hasMany(models.UserEmployment, {
      foreignKey: 'user_id',
      as: 'employments',
    });
  };

  return User;
};
