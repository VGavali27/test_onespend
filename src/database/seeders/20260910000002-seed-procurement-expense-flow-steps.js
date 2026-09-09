/**
 * Seeder: fixed approval ladder for the procurement category.
 *
 * The procurement expense ladder is a data row per step (expense_flow_steps),
 * not a hardcoded array — changing the chain means editing this table, no
 * code deploy. Step handlers repeat the role set of the old hardcoded ladder:
 * 1 CFO → 2 ADMIN_MGR → 3 FINANCE_MGR → 4 CFO → 5 PAYMENT_MGR → 6 CFO (final).
 * The final step closes the expense as APPROVED routed to PAYMENT_MGR, gated on
 * every PO line item being received.
 */
export async function up({ context }) {
  // Fresh installs: the categories seeder inserts the PROCUREMENT row with the
  // column default 'HANDOVER' — flip it here (dev DBs got flipped by the migration).
  await context.sequelize.query(
    "UPDATE expense_categories SET flow_mode = 'FIXED' WHERE module = 'procurement'",
  );

  return context.bulkInsert('expense_flow_steps', [
    {
      id: 1,
      uuid: 'e0f1a2b3-c4d5-4e6f-9a8b-000000000301',
      category_id: 102, // PROCUREMENT
      step_position: 1,
      role_id: 101, // CFO
      step_label: 'CFO review',
      is_final: false,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      uuid: 'e0f1a2b3-c4d5-4e6f-9a8b-000000000302',
      category_id: 102,
      step_position: 2,
      role_id: 106, // ADMIN_MGR (procurement admin — fulfilment happens here)
      step_label: 'Procurement admin',
      is_final: false,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 3,
      uuid: 'e0f1a2b3-c4d5-4e6f-9a8b-000000000303',
      category_id: 102,
      step_position: 3,
      role_id: 104, // FINANCE_MGR
      step_label: 'Finance manager',
      is_final: false,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 4,
      uuid: 'e0f1a2b3-c4d5-4e6f-9a8b-000000000304',
      category_id: 102,
      step_position: 4,
      role_id: 101, // CFO
      step_label: 'CFO',
      is_final: false,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 5,
      uuid: 'e0f1a2b3-c4d5-4e6f-9a8b-000000000305',
      category_id: 102,
      step_position: 5,
      role_id: 102, // PAYMENT_MGR
      step_label: 'Payment manager',
      is_final: false,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 6,
      uuid: 'e0f1a2b3-c4d5-4e6f-9a8b-000000000306',
      category_id: 102,
      step_position: 6,
      role_id: 101, // CFO (final)
      step_label: 'CFO (final)',
      is_final: true,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
}

export async function down({ context }) {
  return context.bulkDelete('expense_flow_steps', { category_id: 102 }, {});
}