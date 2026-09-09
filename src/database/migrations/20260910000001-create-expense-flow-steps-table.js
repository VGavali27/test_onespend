/**
 * Table-driven approval flows.
 *
 * `expense_flow_steps` holds the ordered approval ladder for a category
 * (one row per step: position, handler role, human label, is_final). A
 * category whose `flow_mode` = 'FIXED' is driven by this table instead of
 * the handover-rule engine — editing the ladder is now a data change, no
 * code deploy. Categories with `flow_mode` = 'HANDOVER' keep the existing
 * role_handover_rules behavior.
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('expense_categories', 'flow_mode', {
    type: Sequelize.STRING(20),
    allowNull: false,
    defaultValue: 'HANDOVER',
  });
  // Existing dev DBs already have the PROCUREMENT category row — flip it now.
  // Fresh installs get this from the flow-steps seeder (runs after categories are seeded).
  await queryInterface.sequelize.query(
    "UPDATE expense_categories SET flow_mode = 'FIXED' WHERE module = 'procurement'",
  );

  await queryInterface.createTable('expense_flow_steps', {
    id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
    category_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    step_position: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false },
    role_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: false },
    step_label: { type: Sequelize.STRING(80), allowNull: false },
    is_final: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'ACTIVE' },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('expense_flow_steps', ['category_id', 'step_position'], {
    unique: true,
    name: 'idx_efs_category_position',
  });
  await queryInterface.addIndex('expense_flow_steps', ['role_id'], { name: 'idx_efs_role' });
  await queryInterface.addConstraint('expense_flow_steps', {
    fields: ['category_id'],
    type: 'foreign key',
    name: 'fk_efs_category_id',
    references: { table: 'expense_categories', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
  await queryInterface.addConstraint('expense_flow_steps', {
    fields: ['role_id'],
    type: 'foreign key',
    name: 'fk_efs_role_id',
    references: { table: 'roles', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('expense_flow_steps');
  await queryInterface.removeColumn('expense_categories', 'flow_mode');
}