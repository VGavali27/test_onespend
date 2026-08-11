/**
 * Seeder: expense handover rules (module='expense')
 *
 * A PO-created expense follows the expense role-handover chain: it is created
 * SUBMITTED with the category's first receiver (ADMIN_MGR) as handler, then
 * ADMIN_MGR approves → CFO (final approver) → APPROVED. These rules authorize
 * those hops (mirrors procurement's module='procurement' rules).
 *
 * Role IDs: 100 SUPER_ADMIN, 101 CFO, 106 ADMIN_MGR
 */
// 32-char prefix + 3-digit suffix = 35 chars, fits the CHAR(36) uuid column
// (a 36-char prefix + suffix would truncate and collide on the unique index).
const PREFIX = 'f5e6d7c8-b9c0-1234-4567-abcdef12';

export async function up({ context }) {
  const rows = [
    [106, 101], // ADMIN_MGR → CFO
    [100, 101], // SUPER_ADMIN → CFO
  ].map(([from, to], i) => ({
    uuid: `${PREFIX}${String(i + 1).padStart(3, '0')}`,
    module: 'expense',
    from_role_id: from,
    to_role_id: to,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  }));

  await context.bulkInsert('role_handover_rules', rows);
}

export async function down({ context }) {
  return context.bulkDelete('role_handover_rules', { module: 'expense' }, {});
}