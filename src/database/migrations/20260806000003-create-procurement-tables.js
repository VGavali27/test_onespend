/**
 * Migration: procurement module.
 *
 * Three header tables — procurement_pis (Purchase Intention), procurement_prs
 * (Purchase Request), procurement_pos (Purchase Order) — chained via explicit
 * FKs (prs.pi_id, pos.pr_id). Child tables (items / documents / handovers) are
 * polymorphic: nullable pi_id / pr_id / po_id, exactly one set per row.
 * procurement_quotations belong to a PR only (pr_id). Amounts are TEXT because
 * they store AES-encrypted values (see src/utils/encryption.js + model hooks).
 */
export async function up(queryInterface, Sequelize) {
  // ── procurement_pis ──
  await queryInterface.createTable('procurement_pis', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    document_number: { type: Sequelize.STRING(50), allowNull: false },
    title: { type: Sequelize.STRING(255), allowNull: false },
    status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'DRAFT' },
    company_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    requested_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    current_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    current_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    tax_amount: { type: Sequelize.TEXT, allowNull: true },
    grand_total: { type: Sequelize.TEXT, allowNull: true },
    expected_delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('procurement_pis', ['uuid'], { name: 'idx_pc_pi_uuid', unique: true });
  await queryInterface.addIndex('procurement_pis', ['document_number'], { name: 'uq_pc_pi_document_number', unique: true });
  await queryInterface.addIndex('procurement_pis', ['status'], { name: 'idx_pc_pi_status' });
  await queryInterface.addIndex('procurement_pis', ['company_id'], { name: 'idx_pc_pi_company_id' });
  await queryInterface.addIndex('procurement_pis', ['requested_by_employment_id'], { name: 'idx_pc_pi_requested_by' });

  // ── procurement_prs ──
  await queryInterface.createTable('procurement_prs', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    document_number: { type: Sequelize.STRING(50), allowNull: false },
    pi_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    title: { type: Sequelize.STRING(255), allowNull: false },
    status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'SUBMITTED' },
    company_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    requested_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    current_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    current_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    tax_amount: { type: Sequelize.TEXT, allowNull: true },
    grand_total: { type: Sequelize.TEXT, allowNull: true },
    expected_delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('procurement_prs', ['uuid'], { name: 'idx_pc_pr_uuid', unique: true });
  await queryInterface.addIndex('procurement_prs', ['document_number'], { name: 'uq_pc_pr_document_number', unique: true });
  await queryInterface.addIndex('procurement_prs', ['status'], { name: 'idx_pc_pr_status' });
  await queryInterface.addIndex('procurement_prs', ['pi_id'], { name: 'idx_pc_pr_pi_id' });
  await queryInterface.addIndex('procurement_prs', ['vendor_id'], { name: 'idx_pc_pr_vendor_id' });
  await queryInterface.addIndex('procurement_prs', ['company_id'], { name: 'idx_pc_pr_company_id' });
  await queryInterface.addIndex('procurement_prs', ['requested_by_employment_id'], { name: 'idx_pc_pr_requested_by' });

  // ── procurement_pos ──
  await queryInterface.createTable('procurement_pos', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    document_number: { type: Sequelize.STRING(50), allowNull: false },
    pr_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    title: { type: Sequelize.STRING(255), allowNull: false },
    status: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'CREATED' },
    company_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    requested_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    current_role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    current_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    tax_amount: { type: Sequelize.TEXT, allowNull: true },
    grand_total: { type: Sequelize.TEXT, allowNull: true },
    expected_delivery_date: { type: Sequelize.DATEONLY, allowNull: true },
    received_date: { type: Sequelize.DATEONLY, allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('procurement_pos', ['uuid'], { name: 'idx_pc_po_uuid', unique: true });
  await queryInterface.addIndex('procurement_pos', ['document_number'], { name: 'uq_pc_po_document_number', unique: true });
  await queryInterface.addIndex('procurement_pos', ['status'], { name: 'idx_pc_po_status' });
  await queryInterface.addIndex('procurement_pos', ['pr_id'], { name: 'idx_pc_po_pr_id' });
  await queryInterface.addIndex('procurement_pos', ['vendor_id'], { name: 'idx_pc_po_vendor_id' });
  await queryInterface.addIndex('procurement_pos', ['company_id'], { name: 'idx_pc_po_company_id' });
  await queryInterface.addIndex('procurement_pos', ['requested_by_employment_id'], { name: 'idx_pc_po_requested_by' });

  // ── procurement_items (polymorphic) ──
  await queryInterface.createTable('procurement_items', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    pi_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    pr_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    po_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    item_name: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    category: { type: Sequelize.STRING(100), allowNull: true },
    quantity: { type: Sequelize.DECIMAL(18, 2), allowNull: true, defaultValue: 1 },
    unit_price: { type: Sequelize.TEXT, allowNull: true },
    total_amount: { type: Sequelize.TEXT, allowNull: true },
    tax_amount: { type: Sequelize.TEXT, allowNull: true },
    total_with_tax: { type: Sequelize.TEXT, allowNull: true },
    sort_order: { type: Sequelize.INTEGER, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  });
  await queryInterface.addIndex('procurement_items', ['uuid'], { name: 'idx_pc_item_uuid' });
  await queryInterface.addIndex('procurement_items', ['pi_id'], { name: 'idx_pc_item_pi_id' });
  await queryInterface.addIndex('procurement_items', ['pr_id'], { name: 'idx_pc_item_pr_id' });
  await queryInterface.addIndex('procurement_items', ['po_id'], { name: 'idx_pc_item_po_id' });

  // ── procurement_handovers (polymorphic) ──
  await queryInterface.createTable('procurement_handovers', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    pi_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    pr_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    po_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
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
  await queryInterface.addIndex('procurement_handovers', ['pi_id'], { name: 'idx_pc_handover_pi_id' });
  await queryInterface.addIndex('procurement_handovers', ['pr_id'], { name: 'idx_pc_handover_pr_id' });
  await queryInterface.addIndex('procurement_handovers', ['po_id'], { name: 'idx_pc_handover_po_id' });

  // ── procurement_quotations (belong to a PR) ──
  await queryInterface.createTable('procurement_quotations', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    pr_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
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
  await queryInterface.addIndex('procurement_quotations', ['pr_id'], { name: 'idx_pc_quote_pr_id' });
  await queryInterface.addIndex('procurement_quotations', ['vendor_id'], { name: 'idx_pc_quote_vendor_id' });

  // ── procurement_documents (polymorphic, optional quotation link) ──
  await queryInterface.createTable('procurement_documents', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    pi_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    pr_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    po_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    procurement_quotation_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
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
  await queryInterface.addIndex('procurement_documents', ['pi_id'], { name: 'idx_pc_doc_pi_id' });
  await queryInterface.addIndex('procurement_documents', ['pr_id'], { name: 'idx_pc_doc_pr_id' });
  await queryInterface.addIndex('procurement_documents', ['po_id'], { name: 'idx_pc_doc_po_id' });
  await queryInterface.addIndex('procurement_documents', ['procurement_quotation_id'], { name: 'idx_pc_doc_quotation_id' });

  // ── Foreign keys ──
  await queryInterface.addConstraint('procurement_prs', {
    fields: ['pi_id'], type: 'foreign key', name: 'fk_pc_pr_pi_id',
    references: { table: 'procurement_pis', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_pos', {
    fields: ['pr_id'], type: 'foreign key', name: 'fk_pc_po_pr_id',
    references: { table: 'procurement_prs', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });

  for (const table of ['procurement_pis', 'procurement_prs', 'procurement_pos']) {
    const prefix = table === 'procurement_pis' ? 'pi' : table === 'procurement_prs' ? 'pr' : 'po';
    await queryInterface.addConstraint(table, {
      fields: ['company_id'], type: 'foreign key', name: `fk_pc_${prefix}_company_id`,
      references: { table: 'companies', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    });
    await queryInterface.addConstraint(table, {
      fields: ['requested_by_employment_id'], type: 'foreign key', name: `fk_pc_${prefix}_requested_by`,
      references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
    });
    await queryInterface.addConstraint(table, {
      fields: ['current_role_id'], type: 'foreign key', name: `fk_pc_${prefix}_current_role`,
      references: { table: 'roles', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
    });
    await queryInterface.addConstraint(table, {
      fields: ['current_employment_id'], type: 'foreign key', name: `fk_pc_${prefix}_current_employment`,
      references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
    });
  }
  await queryInterface.addConstraint('procurement_prs', {
    fields: ['vendor_id'], type: 'foreign key', name: 'fk_pc_pr_vendor_id',
    references: { table: 'vendors', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_pos', {
    fields: ['vendor_id'], type: 'foreign key', name: 'fk_pc_po_vendor_id',
    references: { table: 'vendors', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });

  for (const [table, idx] of [['procurement_items', 'item'], ['procurement_handovers', 'handover'], ['procurement_documents', 'doc']]) {
    await queryInterface.addConstraint(table, {
      fields: ['pi_id'], type: 'foreign key', name: `fk_pc_${idx}_pi_id`,
      references: { table: 'procurement_pis', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
    });
    await queryInterface.addConstraint(table, {
      fields: ['pr_id'], type: 'foreign key', name: `fk_pc_${idx}_pr_id`,
      references: { table: 'procurement_prs', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
    });
    await queryInterface.addConstraint(table, {
      fields: ['po_id'], type: 'foreign key', name: `fk_pc_${idx}_po_id`,
      references: { table: 'procurement_pos', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
    });
  }
  await queryInterface.addConstraint('procurement_quotations', {
    fields: ['pr_id'], type: 'foreign key', name: 'fk_pc_quote_pr_id',
    references: { table: 'procurement_prs', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('procurement_quotations', {
    fields: ['vendor_id'], type: 'foreign key', name: 'fk_pc_quote_vendor_id',
    references: { table: 'vendors', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'RESTRICT',
  });
  await queryInterface.addConstraint('procurement_quotations', {
    fields: ['created_by_employment_id'], type: 'foreign key', name: 'fk_pc_quote_created_by',
    references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_documents', {
    fields: ['procurement_quotation_id'], type: 'foreign key', name: 'fk_pc_doc_quotation_id',
    references: { table: 'procurement_quotations', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
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
    fields: ['uploaded_by_employment_id'], type: 'foreign key', name: 'fk_pc_doc_uploaded_by',
    references: { table: 'user_employments', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('procurement_documents');
  await queryInterface.dropTable('procurement_quotations');
  await queryInterface.dropTable('procurement_handovers');
  await queryInterface.dropTable('procurement_items');
  await queryInterface.dropTable('procurement_pos');
  await queryInterface.dropTable('procurement_prs');
  await queryInterface.dropTable('procurement_pis');
}
