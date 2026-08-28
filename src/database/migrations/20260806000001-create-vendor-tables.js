/**
 * Migration: Vendor master + child tables (contacts, addresses, bank accounts, documents).
 *
 * A vendor is a master record (name, code, tax identity, logo) with one-to-many child
 * tables for the real-world variability: multiple contacts, addresses, bank accounts,
 * and certificates/documents. Bank account numbers are stored as TEXT so they can be
 * AES-encrypted at the model layer.
 */
const baseColumns = (Sequelize) => ({
  id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
  uuid: { type: Sequelize.UUID, allowNull: false },
  created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
  updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
  deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
  created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  deleted_at: { type: Sequelize.DATE, allowNull: true },
});

export async function up(queryInterface, Sequelize) {
  // ── vendors (master) ──
  await queryInterface.createTable('vendors', {
    ...baseColumns(Sequelize),
    name: { type: Sequelize.STRING(255), allowNull: false },
    code: { type: Sequelize.STRING(50), allowNull: false },
    vendor_type: { type: Sequelize.STRING(50), defaultValue: 'VENDOR' },
    logo_img: { type: Sequelize.STRING(255), allowNull: true },
    website: { type: Sequelize.STRING(255), allowNull: true },
    gst_number: { type: Sequelize.STRING(50), allowNull: true },
    pan_number: { type: Sequelize.STRING(50), allowNull: true },
    cin_number: { type: Sequelize.STRING(50), allowNull: true },
    payment_terms: { type: Sequelize.STRING(100), allowNull: true },
    rating: { type: Sequelize.DECIMAL(2, 1), allowNull: true },
    notes: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  });
  await queryInterface.addIndex('vendors', ['uuid'], { name: 'idx_vendors_uuid' });
  await queryInterface.addIndex('vendors', ['code'], { name: 'idx_vendors_code', unique: true });

  // ── vendor_contacts ──
  await queryInterface.createTable('vendor_contacts', {
    ...baseColumns(Sequelize),
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    contact_type: { type: Sequelize.STRING(50), defaultValue: 'PRIMARY' },
    salutation: { type: Sequelize.STRING(20), allowNull: true },
    first_name: { type: Sequelize.STRING(100), allowNull: false },
    last_name: { type: Sequelize.STRING(100), allowNull: true },
    designation: { type: Sequelize.STRING(150), allowNull: true },
    email: { type: Sequelize.STRING(255), allowNull: true },
    phone: { type: Sequelize.STRING(40), allowNull: true },
    mobile: { type: Sequelize.STRING(40), allowNull: true },
    is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  });
  await queryInterface.addIndex('vendor_contacts', ['uuid'], { name: 'idx_vendor_contacts_uuid' });
  await queryInterface.addIndex('vendor_contacts', ['vendor_id'], { name: 'idx_vendor_contacts_vendor_id' });
  await queryInterface.addConstraint('vendor_contacts', {
    fields: ['vendor_id'],
    type: 'foreign key',
    name: 'fk_vendor_contacts_vendor_id',
    references: { table: 'vendors', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  // ── vendor_addresses ──
  await queryInterface.createTable('vendor_addresses', {
    ...baseColumns(Sequelize),
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    address_type: { type: Sequelize.STRING(50), defaultValue: 'REGISTERED' },
    address_line_1: { type: Sequelize.STRING(255), allowNull: true },
    address_line_2: { type: Sequelize.STRING(255), allowNull: true },
    city: { type: Sequelize.STRING(100), allowNull: true },
    state: { type: Sequelize.STRING(100), allowNull: true },
    country: { type: Sequelize.STRING(100), allowNull: true },
    pincode: { type: Sequelize.STRING(20), allowNull: true },
    is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  });
  await queryInterface.addIndex('vendor_addresses', ['uuid'], { name: 'idx_vendor_addresses_uuid' });
  await queryInterface.addIndex('vendor_addresses', ['vendor_id'], { name: 'idx_vendor_addresses_vendor_id' });
  await queryInterface.addConstraint('vendor_addresses', {
    fields: ['vendor_id'],
    type: 'foreign key',
    name: 'fk_vendor_addresses_vendor_id',
    references: { table: 'vendors', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  // ── vendor_bank_accounts ──
  await queryInterface.createTable('vendor_bank_accounts', {
    ...baseColumns(Sequelize),
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    account_type: { type: Sequelize.STRING(50), defaultValue: 'PRIMARY' },
    account_holder_name: { type: Sequelize.STRING(150), allowNull: true },
    bank_name: { type: Sequelize.STRING(150), allowNull: true },
    bank_branch: { type: Sequelize.STRING(150), allowNull: true },
    account_number: { type: Sequelize.TEXT, allowNull: true }, // AES-encrypted at model layer
    ifsc: { type: Sequelize.STRING(20), allowNull: true },
    swift_code: { type: Sequelize.STRING(20), allowNull: true },
    currency_code: { type: Sequelize.STRING(10), defaultValue: 'INR' },
    is_primary: { type: Sequelize.BOOLEAN, defaultValue: false },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  });
  await queryInterface.addIndex('vendor_bank_accounts', ['uuid'], { name: 'idx_vendor_banks_uuid' });
  await queryInterface.addIndex('vendor_bank_accounts', ['vendor_id'], { name: 'idx_vendor_banks_vendor_id' });
  await queryInterface.addConstraint('vendor_bank_accounts', {
    fields: ['vendor_id'],
    type: 'foreign key',
    name: 'fk_vendor_banks_vendor_id',
    references: { table: 'vendors', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  // ── vendor_documents ──
  await queryInterface.createTable('vendor_documents', {
    ...baseColumns(Sequelize),
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    document_type: { type: Sequelize.STRING(50), allowNull: true },
    document_number: { type: Sequelize.STRING(100), allowNull: true },
    issue_date: { type: Sequelize.DATEONLY, allowNull: true },
    expiry_date: { type: Sequelize.DATEONLY, allowNull: true },
    original_file_name: { type: Sequelize.STRING(255), allowNull: false },
    stored_file_name: { type: Sequelize.STRING(255), allowNull: false },
    file_path: { type: Sequelize.TEXT, allowNull: false },
    mime_type: { type: Sequelize.STRING(100), allowNull: true },
    file_size: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    uploaded_by_employment_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  });
  await queryInterface.addIndex('vendor_documents', ['uuid'], { name: 'idx_vendor_documents_uuid' });
  await queryInterface.addIndex('vendor_documents', ['vendor_id'], { name: 'idx_vendor_documents_vendor_id' });
  await queryInterface.addConstraint('vendor_documents', {
    fields: ['vendor_id'],
    type: 'foreign key',
    name: 'fk_vendor_documents_vendor_id',
    references: { table: 'vendors', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}

export async function down(queryInterface, _Sequelize) {
  // Remove ALL FKs from any table referencing vendors before dropping vendor tables
  const [constraints] = await queryInterface.sequelize.query(`
    SELECT DISTINCT kcu.CONSTRAINT_NAME, kcu.TABLE_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
    WHERE rc.REFERENCED_TABLE_NAME = 'vendors'
  `);
  for (const c of constraints) {
    try {
      await queryInterface.removeConstraint(c.TABLE_NAME, c.CONSTRAINT_NAME);
    } catch (err) {
      // Constraint might have been already removed or doesn't exist
      console.log(`  Skipping constraint ${c.CONSTRAINT_NAME} on ${c.TABLE_NAME}: ${err.message}`);
    }
  }

  await queryInterface.dropTable('vendor_documents');
  await queryInterface.dropTable('vendor_bank_accounts');
  await queryInterface.dropTable('vendor_addresses');
  await queryInterface.dropTable('vendor_contacts');
  await queryInterface.dropTable('vendors');
}
