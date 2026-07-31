/**
 * Seeder: Insert demo expense categories
 *
 * Role IDs: 101 CFO, 104 FINANCE_MGR
 *
 * Note: Travel sub-types (domestic/international) are handled by
 * travel_expenses.travel_type, child tables handle line items.
 */
export async function up({ context }) {
  return context.bulkInsert('expense_categories', [
    {
      id: 100,
      uuid: 'a2b3c4d5-e6f7-8901-abcd-ef1234567801',
      code: 'TRAVEL',
      module: 'travel',
      name: 'Travel',
      description: 'All business travel expenses (domestic & international)',
      first_receiver_role_id: 104,   // FINANCE_MGR
      final_approver_role_id: 101,   // CFO
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down({ context }) {
  return context.bulkDelete('expense_categories', { id: [100] }, {});
}
