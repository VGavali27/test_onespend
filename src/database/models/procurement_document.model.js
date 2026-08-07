export default (sequelize, DataTypes) => {
  const ProcurementDocument = sequelize.define(
    'ProcurementDocument',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      procurement_request_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      procurement_quotation_id: DataTypes.BIGINT.UNSIGNED,
      document_type: DataTypes.STRING(50),
      document_number: DataTypes.STRING(100),
      issue_date: DataTypes.DATEONLY,
      original_file_name: { type: DataTypes.STRING(255), allowNull: false },
      stored_file_name: { type: DataTypes.STRING(255), allowNull: false },
      file_path: { type: DataTypes.TEXT, allowNull: false },
      mime_type: DataTypes.STRING(100),
      file_size: DataTypes.BIGINT.UNSIGNED,
      uploaded_by_employment_id: DataTypes.BIGINT.UNSIGNED,
      status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
      created_by: DataTypes.BIGINT.UNSIGNED,
      updated_by: DataTypes.BIGINT.UNSIGNED,
      deleted_by: DataTypes.BIGINT.UNSIGNED,
    },
    { tableName: 'procurement_documents', timestamps: true, paranoid: true, underscored: true },
  );

  ProcurementDocument.associate = (models) => {
    ProcurementDocument.belongsTo(models.ProcurementRequest, { foreignKey: 'procurement_request_id', as: 'request' });
    ProcurementDocument.belongsTo(models.ProcurementQuotation, { foreignKey: 'procurement_quotation_id', as: 'quotation' });
  };

  return ProcurementDocument;
};
