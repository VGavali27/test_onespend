export default (sequelize, DataTypes) => {
  const Role = sequelize.define(
    'Role',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      description: DataTypes.TEXT,

      level: {
        type: DataTypes.SMALLINT.UNSIGNED,
        defaultValue: 100,
      },

      is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      tableName: 'roles',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  Role.associate = (models) => {
    Role.hasMany(models.User, {
      foreignKey: 'role_id',
      as: 'users',
    });

    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
    });

    Role.hasMany(models.Expense, {
      foreignKey: 'current_role_id',
      as: 'expenses',
    });

    Role.hasMany(models.ExpenseCategory, {
      foreignKey: 'first_receiver_role_id',
      as: 'firstReceiverCategories',
    });

    Role.hasMany(models.ExpenseCategory, {
      foreignKey: 'final_approver_role_id',
      as: 'finalApproverCategories',
    });

    Role.hasMany(models.RoleHandoverRule, {
      foreignKey: 'from_role_id',
      as: 'fromHandoverRules',
    });

    Role.hasMany(models.RoleHandoverRule, {
      foreignKey: 'to_role_id',
      as: 'toHandoverRules',
    });

    Role.hasMany(models.ExpenseHandover, {
      foreignKey: 'from_role_id',
      as: 'fromExpenseHandovers',
    });

    Role.hasMany(models.ExpenseHandover, {
      foreignKey: 'to_role_id',
      as: 'toExpenseHandovers',
    });
  };

  return Role;
};
