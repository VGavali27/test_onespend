/**
 * Migration: procurement quotations.
 *
 * Vendor quotations on a Purchase Request (PR). Each quotation links a vendor to
 * a quoted amount (total + tax, stored AES-encrypted as TEXT). Attached files
 * (quotation PDFs, terms, …) live in procurement_documents, linked back here via
 * procurement_quotation_id (see 20260807000002). The requester selects one
 * quotation blind — vendor identity is hidden from them; only the admin/finance
 * roles see it.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('procurement_quotations', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    procurement_request_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    title: { type: Sequelize.STRING(255), allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    tax_amount: { type: Sequelize.TEXT, allowNull: true },
    grand_total: { type: Sequelize.TEXT, allowNull: true },
    valid_until: { type: Sequelize.DATEONLY, allowNull: true },
    terms: { type: Sequelize.TEXT, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'SELECTED', 'REJECTED'), allowNull: false, defaultValue: 'ACTIVE' },
    created_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('procurement_quotations', ['uuid'], { name: 'idx_pc_quote_uuid', unique: true });
  await queryInterface.addIndex('procurement_quotations', ['procurement_request_id'], { name: 'idx_pc_quote_request_id' });
  await queryInterface.addIndex('procurement_quotations', ['vendor_id'], { name: 'idx_pc_quote_vendor_id' });

  await queryInterface.addConstraint('procurement_quotations', {
    fields: ['procurement_request_id'], type: 'foreign key', name: 'fk_pc_quote_request_id',
    references: { table: 'procurement_requests', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('procurement_quotations', {
    fields: ['vendor_id'], type: 'foreign key', name: 'fk_pc_quote_vendor_id',
    references: { table: 'vendors', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('procurement_quotations', {
    fields: ['created_by_employment_id'], type: 'foreign key', name: 'fk_pc_quote_created_by',
    references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('procurement_quotations');
}
