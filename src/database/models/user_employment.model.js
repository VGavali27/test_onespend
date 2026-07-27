export default (sequelize, DataTypes) => {
  const UserEmployment = sequelize.define(
    'UserEmployment',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      user_id: DataTypes.BIGINT.UNSIGNED,
      company_id: DataTypes.BIGINT.UNSIGNED,
      department_id: DataTypes.BIGINT.UNSIGNED,

      employee_code: DataTypes.STRING(50),
      designation: DataTypes.STRING(150),

      reporting_manager_employment_id: DataTypes.BIGINT.UNSIGNED,

      employment_type: DataTypes.ENUM('PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT'),

      joining_date: DataTypes.DATEONLY,
      relieving_date: DataTypes.DATEONLY,

      status: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED'),

      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'user_employments',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  UserEmployment.associate = (models) => {
    UserEmployment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    UserEmployment.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company',
    });

    UserEmployment.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
    });

    UserEmployment.belongsTo(models.UserEmployment, {
      foreignKey: 'reporting_manager_employment_id',
      as: 'reportingManager',
    });

    UserEmployment.hasMany(models.UserEmployment, {
      foreignKey: 'reporting_manager_employment_id',
      as: 'subordinates',
    });

    UserEmployment.hasMany(models.Expense, {
      foreignKey: 'requested_by_employment_id',
      as: 'requestedExpenses',
    });

    UserEmployment.hasMany(models.Expense, {
      foreignKey: 'current_employment_id',
      as: 'currentProcessingExpenses',
    });

    UserEmployment.hasMany(models.ExpenseDocument, {
      foreignKey: 'uploaded_by_employment_id',
      as: 'uploadedDocuments',
    });

    UserEmployment.hasMany(models.ExpenseHandover, {
      foreignKey: 'action_by_employment_id',
      as: 'actionedHandovers',
    });
  };

  return UserEmployment;
};
