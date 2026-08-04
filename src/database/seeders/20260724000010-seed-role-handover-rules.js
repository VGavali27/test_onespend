/**
 * Seeder: Insert role handover rules for each expense module.
 *
 * Defines which roles can hand over expense approval to which other roles.
 * Each module gets the same standard manager chain (see buildRules).
 *
 * Role IDs: 100 SUPER_ADMIN, 101 CFO, 102 PAYMENT_MGR, 103 PAYMENT_JR,
 * 104 FINANCE_MGR, 105 FINANCE_JR, 106 ADMIN_MGR, 107 ADMIN_JR,
 * 108 TRAVEL_MGR, 109 TRAVEL_JR, 110 HOD, 111 EMP_MGR, 112 EMPLOYEE
 */

// modules + the uuid prefix used for their rules (prefixes are unique across
// modules so rule UUIDs never collide)
const MODULES = [
  { module: 'travel', prefix: 'd2e3f4a5-b6c7-8901-cdef-12345678' },
  { module: 'reimbursement', prefix: 'd3e4f5a6-b7c8-9012-cdef-12345678' },
];

function buildRules(module, prefix) {
  const rows = [];
  let ruleSeq = 0;
  const addRule = (fromRoleId, toRoleId) => {
    ruleSeq += 1;
    rows.push({
      uuid: `${prefix}${String(ruleSeq).padStart(3, '0')}`,
      module,
      from_role_id: fromRoleId,
      to_role_id: toRoleId,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
  };

  const mgrRoles = [102, 104, 106, 108]; // PAYMENT_MGR, FINANCE_MGR, ADMIN_MGR, TRAVEL_MGR

  // ── SUPER_ADMIN (100) → all mgr + HOD + CFO ──
  mgrRoles.forEach((r) => addRule(100, r));
  addRule(100, 110); // HOD
  addRule(100, 101); // CFO

  // ── CFO (101) → all mgr + HOD ──
  mgrRoles.forEach((r) => addRule(101, r));
  addRule(101, 110); // HOD

  // each manager → all other managers + HOD + CFO
  for (const mgr of [104, 102, 106, 108]) {
    mgrRoles.filter((r) => r !== mgr).forEach((r) => addRule(mgr, r));
    addRule(mgr, 110); // HOD
    addRule(mgr, 101); // CFO
  }

  // ── HOD (110) → all mgr + CFO ──
  mgrRoles.forEach((r) => addRule(110, r));
  addRule(110, 101); // CFO

  // JR → MGR
  addRule(105, 104); // FINANCE_JR → FINANCE_MGR
  addRule(103, 102); // PAYMENT_JR → PAYMENT_MGR
  addRule(107, 106); // ADMIN_JR → ADMIN_MGR
  addRule(109, 108); // TRAVEL_JR → TRAVEL_MGR

  return rows;
}

export async function up({ context }) {
  for (const { module, prefix } of MODULES) {
    await context.bulkInsert('role_handover_rules', buildRules(module, prefix));
  }
}

export async function down({ context }) {
  return context.bulkDelete('role_handover_rules', { module: MODULES.map((m) => m.module) }, {});
}