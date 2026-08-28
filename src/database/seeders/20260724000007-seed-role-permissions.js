/**
 * Seeder: Assign permissions to roles
 *
 * Permission IDs:  100-176 (77 permissions covering all modules)
 * Role IDs: 100 SUPER_ADMIN
 */
export async function up({ context }) {
  // SUPER_ADMIN (id: 100) — all permissions 100-176
  const allPermissionIds = [];
  for (let i = 100; i <= 176; i++) allPermissionIds.push(i);

  const superAdminRows = allPermissionIds.map((pid) => ({
    role_id: 100,
    permission_id: pid,
    created_at: new Date(),
    updated_at: new Date(),
  }));

  await context.bulkInsert('role_permissions', [
    ...superAdminRows,
  ]);
}

export async function down({ context }) {
  return context.bulkDelete('role_permissions', {
    role_id: [100],
  }, {});
}