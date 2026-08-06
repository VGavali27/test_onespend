/**
 * Migration: procurement module.
 *
 * One row in procurement_requests per document (PI / PR / PO); documents chain
 * to their source via parent_id. Items are the line items, handovers the approval
 * audit trail, documents the attached files (quotation / invoice / delivery).
 *
 * Amount columns are TEXT because they store AES-encrypted values (see
 * src/utils/encryption.js + the model hooks).
 */
export async function up(queryInterface, Sequelize) {
  // ── procurement_requests ──
  await queryInterface.createTable('procurement_requests', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    request_type: { type: Sequelize.ENUM('PI', 'PR', 'PO'), allowNull: false },
    document_number: { type: Sequelize.STRING(50), allowNull: false },
    parent_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    title: { type: Sequelize.STRING(255), allowNull: false },
    status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'DRAFT' },
    company_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    requested_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    current_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    current_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    tax_amount: { type: Sequelize.TEXT, allowNull: true },
    grand_total: { type: Sequelize.TEXT, allowNull: true },
    vendor_contact: { type: Sequelize.STRING(150), allowNull: true },
    delivery_address: { type: Sequelize.TEXT, allowNull: true },
    expected_delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
    payment_terms: { type: Sequelize.STRING(100), allowNull: true },
    received_date: { type: Sequelize.DATEONLY, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('procurement_requests', ['uuid'], { name: 'idx_pc_req_uuid' });
  await queryInterface.addIndex('procurement_requests', ['document_number'], { name: 'uq_pc_req_document_number', unique: true });
  await queryInterface.addIndex('procurement_requests', ['request_type'], { name: 'idx_pc_req_type' });
  await queryInterface.addIndex('procurement_requests', ['status'], { name: 'idx_pc_req_status' });
  await queryInterface.addIndex('procurement_requests', ['parent_id'], { name: 'idx_pc_req_parent_id' });
  await queryInterface.addIndex('procurement_requests', ['vendor_id'], { name: 'idx_pc_req_vendor_id' });
  await queryInterface.addIndex('procurement_requests', ['company_id'], { name: 'idx_pc_req_company_id' });
  await queryInterface.addIndex('procurement_requests', ['requested_by_employment_id'], { name: 'idx_pc_req_requested_by' });
  await queryInterface.addIndex('procurement_requests', ['current_role_id'], { name: 'idx_pc_req_current_role' });

  // ── procurement_items ──
  await queryInterface.createTable('procurement_items', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    procurement_request_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    item_name: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    category: { type: Sequelize.STRING(100), allowNull: true },
    quantity: { type: Sequelize.DECIMAL(18, 2), allowNull: true, defaultValue: 1 },
    unit: { type: Sequelize.STRING(20), allowNull: true },
    unit_price: { type: Sequelize.TEXT, allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    tax_rate: { type: Sequelize.DECIMAL(6, 2), allowNull: true, defaultValue: 0 },
    tax_amount: { type: Sequelize.TEXT, allowNull: true },
    total_with_tax: { type: Sequelize.TEXT, allowNull: true },
    sort_order: { type: Sequelize.INTEGER, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  });
  await queryInterface.addIndex('procurement_items', ['uuid'], { name: 'idx_pc_item_uuid' });
  await queryInterface.addIndex('procurement_items', ['procurement_request_id'], { name: 'idx_pc_item_request_id' });

  // ── procurement_handovers ──
  await queryInterface.createTable('procurement_handovers', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    procurement_request_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    action_type: { type: Sequelize.STRING(50), allowNull: false },
    from_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    to_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    action_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    amount_at_step: { type: Sequelize.TEXT, allowNull: true },
    remarks: { type: Sequelize.TEXT, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  });
  await queryInterface.addIndex('procurement_handovers', ['uuid'], { name: 'idx_pc_handover_uuid' });
  await queryInterface.addIndex('procurement_handovers', ['procurement_request_id'], { name: 'idx_pc_handover_request_id' });

  // ── procurement_documents ──
  await queryInterface.createTable('procurement_documents', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    procurement_request_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    document_type: { type: Sequelize.STRING(50), allowNull: true },
    document_number: { type: Sequelize.STRING(100), allowNull: true },
    issue_date: { type: Sequelize.DATEONLY, allowNull: true },
    original_file_name: { type: Sequelize.STRING(255), allowNull: false },
    stored_file_name: { type: Sequelize.STRING(255), allowNull: false },
    file_path: { type: Sequelize.TEXT, allowNull: false },
    mime_type: { type: Sequelize.STRING(100), allowNull: true },
    file_size: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    uploaded_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('procurement_documents', ['uuid'], { name: 'idx_pc_doc_uuid' });
  await queryInterface.addIndex('procurement_documents', ['procurement_request_id'], { name: 'idx_pc_doc_request_id' });

  // ── foreign keys ──
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['parent_id'], type: 'foreign key', name: 'fk_pc_req_parent_id',
    references: { table: 'procurement_requests', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['company_id'], type: 'foreign key', name: 'fk_pc_req_company_id',
    references: { table: 'companies', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['vendor_id'], type: 'foreign key', name: 'fk_pc_req_vendor_id',
    references: { table: 'vendors', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['requested_by_employment_id'], type: 'foreign key', name: 'fk_pc_req_requested_by',
    references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['current_role_id'], type: 'foreign key', name: 'fk_pc_req_current_role',
    references: { table: 'roles', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['current_employment_id'], type: 'foreign key', name: 'fk_pc_req_current_employment',
    references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });

  await queryInterface.addConstraint('procurement_items', {
    fields: ['procurement_request_id'], type: 'foreign key', name: 'fk_pc_item_request_id',
    references: { table: 'procurement_requests', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
  });

  await queryInterface.addConstraint('procurement_handovers', {
    fields: ['procurement_request_id'], type: 'foreign key', name: 'fk_pc_handover_request_id',
    references: { table: 'procurement_requests', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('procurement_handovers', {
    fields: ['from_role_id'], type: 'foreign key', name: 'fk_pc_handover_from_role',
    references: { table: 'roles', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_handovers', {
    fields: ['to_role_id'], type: 'foreign key', name: 'fk_pc_handover_to_role',
    references: { table: 'roles', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_handovers', {
    fields: ['action_by_employment_id'], type: 'foreign key', name: 'fk_pc_handover_action_by',
    references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });

  await queryInterface.addConstraint('procurement_documents', {
    fields: ['procurement_request_id'], type: 'foreign key', name: 'fk_pc_doc_request_id',
    references: { table: 'procurement_requests', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('procurement_documents');
  await queryInterface.dropTable('procurement_handovers');
  await queryInterface.dropTable('procurement_items');
  await queryInterface.dropTable('procurement_requests');
}
