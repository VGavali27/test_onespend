export default (sequelize, DataTypes) => {
  const ExpenseDocument = sequelize.define(
    'ExpenseDocument',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      expense_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      module_name: { type: DataTypes.STRING(50), allowNull: false },
      module_record_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      label: { type: DataTypes.STRING(150), allowNull: true },
      original_file_name: { type: DataTypes.STRING(255), allowNull: false },
      stored_file_name: { type: DataTypes.STRING(255), allowNull: false },
      file_path: { type: DataTypes.TEXT, allowNull: false },
      mime_type: { type: DataTypes.STRING(100), allowNull: false },
      file_extension: { type: DataTypes.STRING(20), allowNull: true },
      file_size: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      uploaded_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    {
      tableName: 'expense_documents',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  ExpenseDocument.associate = (models) => {
    ExpenseDocument.belongsTo(models.Expense, { foreignKey: 'expense_id', as: 'expense' });
    ExpenseDocument.belongsTo(models.UserEmployment, { foreignKey: 'uploaded_by_employment_id', as: 'uploadedBy' });
  };

  return ExpenseDocument;
};
