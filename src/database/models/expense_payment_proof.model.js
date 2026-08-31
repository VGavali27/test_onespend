export default (sequelize, DataTypes) => {
  const ExpensePaymentProof = sequelize.define(
    'ExpensePaymentProof',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      expense_payment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      file_path: { type: DataTypes.STRING(500), allowNull: false },
      file_name: { type: DataTypes.STRING(255), allowNull: false },
      file_type: { type: DataTypes.STRING(100), allowNull: true },
      uploaded_by_employment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      deleted_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'expense_payment_proofs',
      timestamps: true,
      paranoid: true,
      underscored: true,
    },
  );

  ExpensePaymentProof.associate = (models) => {
    ExpensePaymentProof.belongsTo(models.ExpensePayment, { foreignKey: 'expense_payment_id', as: 'payment' });
    ExpensePaymentProof.belongsTo(models.UserEmployment, { foreignKey: 'uploaded_by_employment_id', as: 'uploadedByEmployment' });
  };

  return ExpensePaymentProof;
};