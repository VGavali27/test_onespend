export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('companies', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: { type: Sequelize.UUID, allowNull: false },
    group_id: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    name: { type: Sequelize.STRING(150), allowNull: true },
    code: { type: Sequelize.STRING(30), allowNull: true },
    email: { type: Sequelize.STRING, allowNull: true },
    phone: { type: Sequelize.STRING, allowNull: true },
    website: { type: Sequelize.STRING, allowNull: true },
    gst_number: { type: Sequelize.STRING, allowNull: true },
    pan_number: { type: Sequelize.STRING, allowNull: true },
    cin_number: { type: Sequelize.STRING, allowNull: true },
    address_line_1: { type: Sequelize.STRING, allowNull: true },
    address_line_2: { type: Sequelize.STRING, allowNull: true },
    city: { type: Sequelize.STRING, allowNull: true },
    state: { type: Sequelize.STRING, allowNull: true },
    country: { type: Sequelize.STRING, allowNull: true },
    pincode: { type: Sequelize.STRING, allowNull: true },
    status: { type: Sequelize.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    created_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    deleted_by: { type: Sequelize.BIGINT.UNSIGNED, allowNull: true },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
    deleted_at: { type: Sequelize.DATE, allowNull: true },
  });
  await queryInterface.addIndex('companies', ['group_id'], { name: 'idx_companies_group_id' });
  await queryInterface.addConstraint('companies', {
    fields: ['group_id'],
    type: 'foreign key',
    name: 'fk_companies_group_id',
    references: { table: 'groups', field: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('companies');
}
