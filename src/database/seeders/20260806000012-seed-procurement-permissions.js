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

  // Any role may raise & submit a PI only if it has procurement:create (135) /
  // procurement:read (136). We grant create+read to every user role so "anyone" can
  // raise an intent; tailor per-role by editing role_permissions.
  // SUPER_ADMIN (100) is already granted create+read via the "everything" spread
  // above, so it must NOT be in this list or the (role_id, permission_id) unique
  // constraint is violated by duplicate rows.
  const ALL_CREATE_READ_ROLES = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112];

  await context.bulkInsert('role_permissions', [
    // SUPER_ADMIN (100) — everything
    ...([135, 136, 137, 138, 139, 140, 141].map((pid) => row(100, pid))),
    // every role — create + read (raise & submit a PI)
    ...(ALL_CREATE_READ_ROLES.flatMap((roleId) => [row(roleId, 135), row(roleId, 136)])),
    // CFO (101) — approve, pay
    row(101, 138), row(101, 141),
    // PAYMENT_MGR (102) — pay
    row(102, 141),
    // FINANCE_MGR (104) — approve
    row(104, 138),
    // ADMIN_MGR (106) — update/approve/po/received
    row(106, 137), row(106, 138), row(106, 139), row(106, 140),
    // HOD (110) — approve
    row(110, 138),
  ]);
}

export async function down({ context }) {
  await context.bulkDelete('role_permissions', { permission_id: [135, 136, 137, 138, 139, 140, 141] }, {});
  await context.bulkDelete('permissions', { id: [135, 136, 137, 138, 139, 140, 141] }, {});
}
