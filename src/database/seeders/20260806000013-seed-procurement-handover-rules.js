/**
 * Seeder: procurement handover rules (module='procurement')
 *
 * Each role→role hop in the procurement chain must be authorized by an ACTIVE
 * role_handover_rules row for module='procurement' (see procurement.service.js
 * requireHandoverRule). Editing these rows reconfigures who can hand off to whom.
 *
 * Chain: PI submit → ADMIN_MGR → (approve) → PR → HOD → quotation (ADMIN_MGR)
 *        → CFO → back to ADMIN_MGR → PO → RECEIVED → FINANCE_MGR → CFO → PAYMENT_MGR
 *
 * Role IDs: 100 SUPER_ADMIN, 101 CFO, 102 PAYMENT_MGR, 104 FINANCE_MGR,
 * 106 ADMIN_MGR, 110 HOD, 111 EMP_MGR, 112 EMPLOYEE
 */
const PREFIX = 'd4e5f6a7-b8c9-0123-cdef-12345678';

export async function up({ context }) {
  const rules = [
    // ── Submit PI → first approver (ADMIN_MGR) ──
    [112, 106], [111, 106], [110, 106], [104, 106], [102, 106], [101, 106], [100, 106], [108, 106],
    // ── PI approved → PR → HOD ──
    [106, 110],
    // ── HOD approves PR → quotation (ADMIN_MGR) ──
    [110, 106],
    // ── Quotation approved → CFO ──
    [106, 101],
    // ── CFO approves PR → back to ADMIN_MGR (creates PO) ──
    [101, 106],
    // ── PO received → FINANCE_MGR ──
    [106, 104],
    // ── FINANCE_MGR approves → CFO ──
    [104, 101],
    // ── CFO approves → PAYMENT_MGR ──
    [101, 102],
    // ── SUPER_ADMIN overrides (can act as any handler) ──
    [100, 110], [100, 101], [100, 104], [100, 102],
  ];

  const rows = rules.map(([from, to], i) => ({
    uuid: `${PREFIX}${String(i + 1).padStart(3, '0')}`,
    module: 'procurement',
    from_role_id: from,
    to_role_id: to,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  }));

  await context.bulkInsert('role_handover_rules', rows);
}

export async function down({ context }) {
  return context.bulkDelete('role_handover_rules', { module: 'procurement' }, {});
}
