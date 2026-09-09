/**
 * Seeder: Procurement expense category
 *
 * Adds the 'procurement' module to the Expense Categories master so a
 * converted procurement expense has a category to land on.
 * First receiver = CFO, final approver = CFO (the ordered approval flow
 * CFO → ADMIN_MGR → FINANCE_MGR → CFO → PAYMENT_MGR → CFO (final) → payments is driven
 * by expenses.flow_position, so first/final approver are both the CFO).
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
      first_receiver_role_id: 101, // CFO
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
