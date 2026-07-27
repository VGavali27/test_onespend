/**
 * Seeder: Insert role handover rules for travel module
 *
 * Defines which roles can hand over expense approval to which other roles.
 *
 * Role IDs: 100 SUPER_ADMIN, 101 CFO, 102 PAYMENT_MGR, 103 PAYMENT_JR,
 * 104 FINANCE_MGR, 105 FINANCE_JR, 106 ADMIN_MGR, 107 ADMIN_JR,
 * 108 TRAVEL_MGR, 109 TRAVEL_JR, 110 HOD, 111 EMP_MGR, 112 EMPLOYEE
 */
export async function up(queryInterface, Sequelize) {
  const module = 'travel';
  const rows = [];

  const addRule = (fromRoleId, toRoleId) => {
    rows.push({ module, from_role_id: fromRoleId, to_role_id: toRoleId, status: 'ACTIVE', created_at: new Date(), updated_at: new Date() });
  };

  // Manager role IDs for "all mgr" references
  const mgrRoles = [102, 104, 106, 108]; // PAYMENT_MGR, FINANCE_MGR, ADMIN_MGR, TRAVEL_MGR

  // ── SUPER_ADMIN (100) → all mgr + HOD + CFO ──
  mgrRoles.forEach((r) => addRule(100, r));
  addRule(100, 110); // HOD
  addRule(100, 101); // CFO

  // ── CFO (101) → all mgr + HOD ──
  mgrRoles.forEach((r) => addRule(101, r));
  addRule(101, 110); // HOD

  // ── FINANCE_MGR (104) → all other mgr + HOD + CFO ──
  mgrRoles.filter((r) => r !== 104).forEach((r) => addRule(104, r));
  addRule(104, 110); // HOD
  addRule(104, 101); // CFO

  // ── PAYMENT_MGR (102) → all other mgr + HOD + CFO ──
  mgrRoles.filter((r) => r !== 102).forEach((r) => addRule(102, r));
  addRule(102, 110); // HOD
  addRule(102, 101); // CFO

  // ── ADMIN_MGR (106) → all other mgr + HOD + CFO ──
  mgrRoles.filter((r) => r !== 106).forEach((r) => addRule(106, r));
  addRule(106, 110); // HOD
  addRule(106, 101); // CFO

  // ── TRAVEL_MGR (108) → all other mgr + HOD + CFO ──
  mgrRoles.filter((r) => r !== 108).forEach((r) => addRule(108, r));
  addRule(108, 110); // HOD
  addRule(108, 101); // CFO

  // ── HOD (110) → all mgr + CFO ──
  mgrRoles.forEach((r) => addRule(110, r));
  addRule(110, 101); // CFO

  // ── FINANCE_JR (105) → FINANCE_MGR (104) ──
  addRule(105, 104);

  // ── PAYMENT_JR (103) → PAYMENT_MGR (102) ──
  addRule(103, 102);

  // ── ADMIN_JR (107) → ADMIN_MGR (106) ──
  addRule(107, 106);

  // ── TRAVEL_JR (109) → TRAVEL_MGR (108) ──
  addRule(109, 108);

  await queryInterface.bulkInsert('role_handover_rules', rows);
}

export async function down(queryInterface, _Sequelize) {
  return queryInterface.bulkDelete('role_handover_rules', { module: 'travel' }, {});
}
