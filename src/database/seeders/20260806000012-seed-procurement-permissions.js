/**
 * Seeder: procurement permissions + role assignments
 *
 * Permission IDs: 135-141 procurement
 * Role IDs: 100 SUPER_ADMIN, 101 CFO, 102 PAYMENT_MGR, 104 FINANCE_MGR,
 * 106 ADMIN_MGR, 110 HOD, 111 EMP_MGR, 112 EMPLOYEE
 */
export async function up({ context }) {
  await context.bulkInsert('permissions', [
    // ── Procurement Module ──
    { id: 135, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789036', resource: 'procurement', action: 'create', permission_key: 'procurement:create', description: 'Create procurement requests (PI)', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 136, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789037', resource: 'procurement', action: 'read', permission_key: 'procurement:read', description: 'View procurement documents', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 137, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789038', resource: 'procurement', action: 'update', permission_key: 'procurement:update', description: 'Edit procurement requests', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 138, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789039', resource: 'procurement', action: 'approve', permission_key: 'procurement:approve', description: 'Approve or reject procurement documents', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 139, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789040', resource: 'procurement', action: 'po', permission_key: 'procurement:po', description: 'Create PR/PO from an approved document', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 140, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789041', resource: 'procurement', action: 'received', permission_key: 'procurement:received', description: 'Mark a PO as received', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 141, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789042', resource: 'procurement', action: 'pay', permission_key: 'procurement:pay', description: 'Process payment for a PO', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
  ]);

  const row = (role_id, permission_id) => ({ role_id, permission_id, created_at: new Date(), updated_at: new Date() });

  await context.bulkInsert('role_permissions', [
    // SUPER_ADMIN (100) — everything
    ...([135, 136, 137, 138, 139, 140, 141].map((pid) => row(100, pid))),
    // CFO (101) — read, approve, pay
    row(101, 136), row(101, 138), row(101, 141),
    // PAYMENT_MGR (102) — read, pay
    row(102, 136), row(102, 141),
    // FINANCE_MGR (104) — read, approve
    row(104, 136), row(104, 138),
    // ADMIN_MGR (106) — create/read/update/approve/po/received
    row(106, 135), row(106, 136), row(106, 137), row(106, 138), row(106, 139), row(106, 140),
    // HOD (110) — read, approve
    row(110, 136), row(110, 138),
    // EMP_MGR (111) — create, read
    row(111, 135), row(111, 136),
    // EMPLOYEE (112) — create, read
    row(112, 135), row(112, 136),
  ]);
}

export async function down({ context }) {
  await context.bulkDelete('role_permissions', { permission_id: [135, 136, 137, 138, 139, 140, 141] }, {});
  await context.bulkDelete('permissions', { id: [135, 136, 137, 138, 139, 140, 141] }, {});
}
