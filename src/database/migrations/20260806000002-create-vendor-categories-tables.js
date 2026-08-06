/**
 * Migration: vendor categories (business type a vendor serves) + the many-to-many
 * junction linking a vendor to one or more categories.
 */
export async function up(queryInterface, Sequelize) {
  // ── vendor_categories (master) ──
  await queryInterface.createTable('vendor_categories', {
    id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false },
    name: { type: Sequelize.STRING(150), allowNull: false },
    code: { type: Sequelize.STRING(50), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('vendor_categories', ['uuid'], { name: 'idx_vendor_categories_uuid' });
  await queryInterface.addIndex('vendor_categories', ['code'], { name: 'idx_vendor_categories_code', unique: true });

  // ── vendor_category_mappings (junction) ──
  await queryInterface.createTable('vendor_category_mappings', {
    id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false, autoIncrement: true, primaryKey: true },
    vendor_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    vendor_category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
  });
  await queryInterface.addIndex('vendor_category_mappings', ['vendor_id'], { name: 'idx_vcm_vendor_id' });
  await queryInterface.addIndex('vendor_category_mappings', ['vendor_category_id'], { name: 'idx_vcm_vendor_category_id' });
  await queryInterface.addIndex('vendor_category_mappings', ['vendor_id', 'vendor_category_id'], { name: 'uq_vcm_vendor_category', unique: true });
  await queryInterface.addConstraint('vendor_category_mappings', {
    fields: ['vendor_id'],
    type: 'foreign key',
    name: 'fk_vcm_vendor_id',
    references: { table: 'vendors', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('vendor_category_mappings', {
    fields: ['vendor_category_id'],
    type: 'foreign key',
    name: 'fk_vcm_vendor_category_id',
    references: { table: 'vendor_categories', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}

export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('vendor_category_mappings');
  await queryInterface.dropTable('vendor_categories');
}
