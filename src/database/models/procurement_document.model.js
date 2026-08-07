export default (sequelize, DataTypes) => {
  const ProcurementDocument = sequelize.define(
    'ProcurementDocument',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, unique: true },
      // polymorphic parent — exactly one of pi_id / pr_id / po_id is set
      pi_id: DataTypes.BIGINT.UNSIGNED,
      pr_id: DataTypes.BIGINT.UNSIGNED,
      po_id: DataTypes.BIGINT.UNSIGNED,
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
    ProcurementDocument.belongsTo(models.ProcurementIntention, { foreignKey: 'pi_id', as: 'pi' });
    ProcurementDocument.belongsTo(models.ProcurementRequest, { foreignKey: 'pr_id', as: 'pr' });
    ProcurementDocument.belongsTo(models.ProcurementOrder, { foreignKey: 'po_id', as: 'po' });
    ProcurementDocument.belongsTo(models.ProcurementQuotation, { foreignKey: 'procurement_quotation_id', as: 'quotation' });
  };

  return ProcurementDocument;
};
