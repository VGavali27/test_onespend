export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('departments', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
    },
    name: { type: Sequelize.STRING(150), allowNull: false },
    code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
    description: { type: Sequelize.TEXT, allowNull: true },
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
  await queryInterface.addIndex('departments', ['code'], { unique: true, name: 'idx_departments_code' });
  await queryInterface.addIndex('departments', ['uuid'], { unique: true, name: 'idx_departments_uuid' });
}
export async function down(queryInterface, _Sequelize) {
  await queryInterface.dropTable('departments');
}
