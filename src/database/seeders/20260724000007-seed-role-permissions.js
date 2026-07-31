/**
 * Seeder: Assign permissions to roles
 *
 * Permission IDs:  100-103 users, 104-107 companies, 108-111 departments,
 * 112-115 roles, 116 permissions, 117-120 expense_categories,
 * 121-128 expenses, 129-132 travel_expenses, 133-134 reports
 *
 * Role IDs: 100 SUPER_ADMIN, 101 CFO, 102 PAYMENT_MGR, 103 PAYMENT_JR,
 * 104 FINANCE_MGR, 105 FINANCE_JR, 106 ADMIN_MGR, 107 ADMIN_JR,
 * 108 TRAVEL_MGR, 109 TRAVEL_JR, 110 HOD, 111 EMP_MGR, 112 EMPLOYEE
 */
export async function up({ context }) {
  const allPermissionIds = [];
  for (let i = 100; i <= 134; i++) allPermissionIds.push(i);

  // ── SUPER_ADMIN (id: 100) — everything ──
  const superAdminRows = allPermissionIds.map((pid) => ({
    role_id: 100,
    permission_id: pid,
    created_at: new Date(),
    updated_at: new Date(),
  }));

  // ── CFO (id: 101) — read all, approve/reject, manage categories, reports ──
  const cfoRows = [
    // users: read
    { role_id: 101, permission_id: 101, created_at: new Date(), updated_at: new Date() },
    // companies: read
    { role_id: 101, permission_id: 105, created_at: new Date(), updated_at: new Date() },
    // departments: read
    { role_id: 101, permission_id: 109, created_at: new Date(), updated_at: new Date() },
    // roles: read
    { role_id: 101, permission_id: 113, created_at: new Date(), updated_at: new Date() },
    // expense_categories: read, update
    { role_id: 101, permission_id: 118, created_at: new Date(), updated_at: new Date() },
    { role_id: 101, permission_id: 119, created_at: new Date(), updated_at: new Date() },
    // expenses: read, approve, reject, pay
    { role_id: 101, permission_id: 122, created_at: new Date(), updated_at: new Date() },
    { role_id: 101, permission_id: 126, created_at: new Date(), updated_at: new Date() },
    { role_id: 101, permission_id: 127, created_at: new Date(), updated_at: new Date() },
    { role_id: 101, permission_id: 128, created_at: new Date(), updated_at: new Date() },
    // travel_expenses: read
    { role_id: 101, permission_id: 130, created_at: new Date(), updated_at: new Date() },
    // reports: view, export
    { role_id: 101, permission_id: 133, created_at: new Date(), updated_at: new Date() },
    { role_id: 101, permission_id: 134, created_at: new Date(), updated_at: new Date() },
  ];

  // ── PAYMENT_MGR (id: 102) ──
  const paymentMgrRows = [
    { role_id: 102, permission_id: 122, created_at: new Date(), updated_at: new Date() }, // expenses: read
    { role_id: 102, permission_id: 126, created_at: new Date(), updated_at: new Date() }, // expenses: approve
    { role_id: 102, permission_id: 128, created_at: new Date(), updated_at: new Date() }, // expenses: pay
    { role_id: 102, permission_id: 133, created_at: new Date(), updated_at: new Date() }, // reports: view
  ];

  // ── PAYMENT_JR (id: 103) ──
  const paymentJrRows = [
    { role_id: 103, permission_id: 122, created_at: new Date(), updated_at: new Date() }, // expenses: read
    { role_id: 103, permission_id: 128, created_at: new Date(), updated_at: new Date() }, // expenses: pay
  ];

  // ── FINANCE_MGR (id: 104) ──
  const financeMgrRows = [
    // expense_categories: read, update
    { role_id: 104, permission_id: 118, created_at: new Date(), updated_at: new Date() },
    { role_id: 104, permission_id: 119, created_at: new Date(), updated_at: new Date() },
    // expenses: read, approve, reject
    { role_id: 104, permission_id: 122, created_at: new Date(), updated_at: new Date() },
    { role_id: 104, permission_id: 126, created_at: new Date(), updated_at: new Date() },
    { role_id: 104, permission_id: 127, created_at: new Date(), updated_at: new Date() },
    // reports: view, export
    { role_id: 104, permission_id: 133, created_at: new Date(), updated_at: new Date() },
    { role_id: 104, permission_id: 134, created_at: new Date(), updated_at: new Date() },
  ];

  // ── FINANCE_JR (id: 105) ──
  const financeJrRows = [
    { role_id: 105, permission_id: 118, created_at: new Date(), updated_at: new Date() }, // expense_categories: read
    { role_id: 105, permission_id: 122, created_at: new Date(), updated_at: new Date() }, // expenses: read
  ];

  // ── ADMIN_MGR (id: 106) ──
  const adminMgrRows = [
    // users: full CRUD
    { role_id: 106, permission_id: 100, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 101, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 102, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 103, created_at: new Date(), updated_at: new Date() },
    // companies: full CRUD
    { role_id: 106, permission_id: 104, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 105, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 106, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 107, created_at: new Date(), updated_at: new Date() },
    // departments: full CRUD
    { role_id: 106, permission_id: 108, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 109, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 110, created_at: new Date(), updated_at: new Date() },
    { role_id: 106, permission_id: 111, created_at: new Date(), updated_at: new Date() },
    // roles: read
    { role_id: 106, permission_id: 113, created_at: new Date(), updated_at: new Date() },
  ];

  // ── ADMIN_JR (id: 107) ──
  const adminJrRows = [
    { role_id: 107, permission_id: 101, created_at: new Date(), updated_at: new Date() }, // users: read
    { role_id: 107, permission_id: 105, created_at: new Date(), updated_at: new Date() }, // companies: read
    { role_id: 107, permission_id: 109, created_at: new Date(), updated_at: new Date() }, // departments: read
    { role_id: 107, permission_id: 113, created_at: new Date(), updated_at: new Date() }, // roles: read
  ];

  // ── TRAVEL_MGR (id: 108) ──
  const travelMgrRows = [
    // travel_expenses: full CRUD
    { role_id: 108, permission_id: 129, created_at: new Date(), updated_at: new Date() },
    { role_id: 108, permission_id: 130, created_at: new Date(), updated_at: new Date() },
    { role_id: 108, permission_id: 131, created_at: new Date(), updated_at: new Date() },
    { role_id: 108, permission_id: 132, created_at: new Date(), updated_at: new Date() },
    // expenses: read
    { role_id: 108, permission_id: 122, created_at: new Date(), updated_at: new Date() },
  ];

  // ── TRAVEL_JR (id: 109) ──
  const travelJrRows = [
    { role_id: 109, permission_id: 130, created_at: new Date(), updated_at: new Date() }, // travel_expenses: read
  ];

  // ── HOD (id: 110) ──
  const hodRows = [
    { role_id: 110, permission_id: 122, created_at: new Date(), updated_at: new Date() }, // expenses: read
    { role_id: 110, permission_id: 126, created_at: new Date(), updated_at: new Date() }, // expenses: approve
    { role_id: 110, permission_id: 127, created_at: new Date(), updated_at: new Date() }, // expenses: reject
    { role_id: 110, permission_id: 133, created_at: new Date(), updated_at: new Date() }, // reports: view
  ];

  // ── EMP_MGR (id: 111) ──
  const empMgrRows = [
    { role_id: 111, permission_id: 101, created_at: new Date(), updated_at: new Date() }, // users: read
    { role_id: 111, permission_id: 121, created_at: new Date(), updated_at: new Date() }, // expenses: create
    { role_id: 111, permission_id: 122, created_at: new Date(), updated_at: new Date() }, // expenses: read
    { role_id: 111, permission_id: 125, created_at: new Date(), updated_at: new Date() }, // expenses: submit
  ];

  // ── EMPLOYEE (id: 112) ──
  const employeeRows = [
    { role_id: 112, permission_id: 121, created_at: new Date(), updated_at: new Date() }, // expenses: create
    { role_id: 112, permission_id: 122, created_at: new Date(), updated_at: new Date() }, // expenses: read (own)
    { role_id: 112, permission_id: 125, created_at: new Date(), updated_at: new Date() }, // expenses: submit
  ];

  await context.bulkInsert('role_permissions', [
    ...superAdminRows,
    ...cfoRows,
    ...paymentMgrRows,
    ...paymentJrRows,
    ...financeMgrRows,
    ...financeJrRows,
    ...adminMgrRows,
    ...adminJrRows,
    ...travelMgrRows,
    ...travelJrRows,
    ...hodRows,
    ...empMgrRows,
    ...employeeRows,
  ]);
}

export async function down({ context }) {
  return context.bulkDelete('role_permissions', {
    role_id: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112],
  }, {});
}
