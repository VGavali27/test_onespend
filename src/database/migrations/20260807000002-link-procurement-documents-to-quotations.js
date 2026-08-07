/**
 * Migration: link procurement_documents to a quotation.
 *
 * Documents are attached per-request today (procurement_request_id). This adds a
 * nullable procurement_quotation_id so a quotation can carry its own multiple
 * files (quotation PDF, terms, …). Quotation files are hidden from the requester.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('procurement_documents', 'procurement_quotation_id', {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: true,
  });
  await queryInterface.addIndex('procurement_documents', ['procurement_quotation_id'], {
    name: 'idx_pc_doc_quotation_id',
  });
  await queryInterface.addConstraint('procurement_documents', {
    fields: ['procurement_quotation_id'], type: 'foreign key', name: 'fk_pc_doc_quotation_id',
    references: { table: 'procurement_quotations', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.removeConstraint('procurement_documents', 'fk_pc_doc_quotation_id');
  await queryInterface.removeIndex('procurement_documents', 'idx_pc_doc_quotation_id');
  await queryInterface.removeColumn('procurement_documents', 'procurement_quotation_id');
}
