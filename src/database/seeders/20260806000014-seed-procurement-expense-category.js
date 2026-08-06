/**
 * Seeder: Procurement expense category
 *
 * Adds the 'procurement' module to the Expense Categories master so a
 * converted procurement expense (deferred) has a category to land on.
 * First receiver = ADMIN_MGR, final approver = CFO (matches the procurement chain).
 */
export async function up({ context }) {
  return context.bulkInsert('expense_categories', [
    {
      id: 102,
      uuid: 'a2b3c4d5-e6f7-8901-abcd-ef1234567803',
      code: 'PROCUREMENT',
      module: 'procurement',
      name: 'Procurement',
      description: 'Expenses converted from approved purchase orders',
      first_receiver_role_id: 106, // ADMIN_MGR
      final_approver_role_id: 101, // CFO
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down({ context }) {
  return context.bulkDelete('expense_categories', { id: 102 }, {});
}
