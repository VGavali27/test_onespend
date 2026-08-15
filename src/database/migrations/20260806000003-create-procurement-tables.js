/**
 * Migration: procurement module.
 *
 * Three header tables — procurement_intentions (Purchase Intention), procurement_requests
 * (Purchase Request), procurement_orders (Purchase Order) — chained via explicit
 * FKs (prs.pi_id, pos.pr_id). Child tables (items / documents / handovers) are
 * polymorphic: nullable pi_id / pr_id / po_id, exactly one set per row.
 * procurement_quotations belong to a PR only (pr_id). Amounts are TEXT because
 * they store AES-encrypted values (see src/utils/encryption.js + model hooks).
 */
export async function up(queryInterface, Sequelize) {
  // ── procurement_intentions ──
  await queryInterface.createTable('procurement_intentions', {
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
  await queryInterface.addIndex('procurement_intentions', ['uuid'], { name: 'idx_pc_pi_uuid', unique: true });
  await queryInterface.addIndex('procurement_intentions', ['document_number'], { name: 'uq_pc_pi_document_number', unique: true });
  await queryInterface.addIndex('procurement_intentions', ['status'], { name: 'idx_pc_pi_status' });
  await queryInterface.addIndex('procurement_intentions', ['company_id'], { name: 'idx_pc_pi_company_id' });
  await queryInterface.addIndex('procurement_intentions', ['requested_by_employment_id'], { name: 'idx_pc_pi_requested_by' });

  // ── procurement_requests ──
  await queryInterface.createTable('procurement_requests', {
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
  await queryInterface.addIndex('procurement_requests', ['uuid'], { name: 'idx_pc_pr_uuid', unique: true });
  await queryInterface.addIndex('procurement_requests', ['document_number'], { name: 'uq_pc_pr_document_number', unique: true });
  await queryInterface.addIndex('procurement_requests', ['status'], { name: 'idx_pc_pr_status' });
  await queryInterface.addIndex('procurement_requests', ['pi_id'], { name: 'idx_pc_pr_pi_id' });
  await queryInterface.addIndex('procurement_requests', ['vendor_id'], { name: 'idx_pc_pr_vendor_id' });
  await queryInterface.addIndex('procurement_requests', ['company_id'], { name: 'idx_pc_pr_company_id' });
  await queryInterface.addIndex('procurement_requests', ['requested_by_employment_id'], { name: 'idx_pc_pr_requested_by' });

  // ── procurement_orders ──
  await queryInterface.createTable('procurement_orders', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    document_number: { type: Sequelize.STRING(50), allowNull: false },
    pr_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    expense_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
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
  await queryInterface.addIndex('procurement_orders', ['uuid'], { name: 'idx_pc_po_uuid', unique: true });
  await queryInterface.addIndex('procurement_orders', ['document_number'], { name: 'uq_pc_po_document_number', unique: true });
  await queryInterface.addIndex('procurement_orders', ['status'], { name: 'idx_pc_po_status' });
  await queryInterface.addIndex('procurement_orders', ['pr_id'], { name: 'idx_pc_po_pr_id' });
  await queryInterface.addIndex('procurement_orders', ['vendor_id'], { name: 'idx_pc_po_vendor_id' });
  await queryInterface.addIndex('procurement_orders', ['company_id'], { name: 'idx_pc_po_company_id' });
  await queryInterface.addIndex('procurement_orders', ['requested_by_employment_id'], { name: 'idx_pc_po_requested_by' });
  await queryInterface.addIndex('procurement_orders', ['expense_id'], { name: 'idx_pc_po_expense_id', unique: true });

  // ── procurement_items (polymorphic) ──
  await queryInterface.createTable('procurement_items', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    pi_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    pr_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    po_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    // quotation-specific items (per-vendor prices/tax on a quotation)
    quotation_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    item_name: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    category: { type: Sequelize.STRING(100), allowNull: true },
    quantity: { type: Sequelize.DECIMAL(18, 2), allowNull: true, defaultValue: 1 },
    unit_price: { type: Sequelize.TEXT, allowNull: true },
    // tax rate (%) stored plain — only sensitive amounts are encrypted
    tax_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
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
  await queryInterface.addIndex('procurement_items', ['quotation_id'], { name: 'idx_pc_item_quotation_id' });

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
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['pi_id'], type: 'foreign key', name: 'fk_pc_pr_pi_id',
    references: { table: 'procurement_intentions', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_orders', {
    fields: ['pr_id'], type: 'foreign key', name: 'fk_pc_po_pr_id',
    references: { table: 'procurement_requests', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });

  for (const table of ['procurement_intentions', 'procurement_requests', 'procurement_orders']) {
    const prefix = table === 'procurement_intentions' ? 'pi' : table === 'procurement_requests' ? 'pr' : 'po';
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
  await queryInterface.addConstraint('procurement_requests', {
    fields: ['vendor_id'], type: 'foreign key', name: 'fk_pc_pr_vendor_id',
    references: { table: 'vendors', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
  await queryInterface.addConstraint('procurement_orders', {
    fields: ['vendor_id'], type: 'foreign key', name: 'fk_pc_po_vendor_id',
    references: { table: 'vendors', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });

  for (const [table, idx] of [['procurement_items', 'item'], ['procurement_handovers', 'handover'], ['procurement_documents', 'doc']]) {
    await queryInterface.addConstraint(table, {
      fields: ['pi_id'], type: 'foreign key', name: `fk_pc_${idx}_pi_id`,
      references: { table: 'procurement_intentions', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
    });
    await queryInterface.addConstraint(table, {
      fields: ['pr_id'], type: 'foreign key', name: `fk_pc_${idx}_pr_id`,
      references: { table: 'procurement_requests', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
    });
    await queryInterface.addConstraint(table, {
      fields: ['po_id'], type: 'foreign key', name: `fk_pc_${idx}_po_id`,
      references: { table: 'procurement_orders', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
    });
  }
  await queryInterface.addConstraint('procurement_quotations', {
    fields: ['pr_id'], type: 'foreign key', name: 'fk_pc_quote_pr_id',
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
  await queryInterface.addConstraint('procurement_items', {
    fields: ['quotation_id'], type: 'foreign key', name: 'fk_pc_item_quotation_id',
    references: { table: 'procurement_quotations', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE',
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

  // ── Link procurement-created expenses ← procurement_orders ──
  // Expense is the parent (just like travel / reimbursement): the procurement PO
  // carries the `expense_id` FK. The PO points back at the expense it spawned.
  await queryInterface.addConstraint('procurement_orders', {
    fields: ['expense_id'], type: 'foreign key', name: 'fk_pc_po_expense_id',
    references: { table: 'expenses', field: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL',
  });
}

export async function down(queryInterface, _Sequelize) {
  // Remove the expense FKs from `procurement_orders` before dropping procurement tables.
  // (defensive: only remove if they exist — the schema may predate this addition)
  const [expenseFk] = await queryInterface.sequelize.query(
    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_NAME = 'procurement_orders' AND CONSTRAINT_NAME = 'fk_pc_po_expense_id' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
  );
  if (expenseFk.length > 0) {
    await queryInterface.removeConstraint('procurement_orders', 'fk_pc_po_expense_id');
    await queryInterface.removeIndex('procurement_orders', 'idx_pc_po_expense_id');
  }

  await queryInterface.dropTable('procurement_documents');
  // procurement_items references procurement_quotations (quotation_id), so it must
  // be dropped before the quotations table.
  await queryInterface.dropTable('procurement_items');
  await queryInterface.dropTable('procurement_quotations');
  await queryInterface.dropTable('procurement_handovers');
  await queryInterface.dropTable('procurement_orders');
  await queryInterface.dropTable('procurement_requests');
  await queryInterface.dropTable('procurement_intentions');
}
