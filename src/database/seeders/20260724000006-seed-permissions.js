/**
 * Seeder: Insert demo permissions
 */
export async function up({ context }) {
  return context.bulkInsert('permissions', [
    // ── Users Module ──
    { id: 100, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789001', resource: 'users', action: 'create', permission_key: 'users:create', description: 'Create users', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 101, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789002', resource: 'users', action: 'read', permission_key: 'users:read', description: 'View users', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 102, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789003', resource: 'users', action: 'update', permission_key: 'users:update', description: 'Update users', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 103, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789004', resource: 'users', action: 'delete', permission_key: 'users:delete', description: 'Delete users', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Companies Module ──
    { id: 104, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789005', resource: 'companies', action: 'create', permission_key: 'companies:create', description: 'Create companies', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 105, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789006', resource: 'companies', action: 'read', permission_key: 'companies:read', description: 'View companies', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 106, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789007', resource: 'companies', action: 'update', permission_key: 'companies:update', description: 'Update companies', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 107, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789008', resource: 'companies', action: 'delete', permission_key: 'companies:delete', description: 'Delete companies', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Departments Module ──
    { id: 108, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789009', resource: 'departments', action: 'create', permission_key: 'departments:create', description: 'Create departments', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 109, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789010', resource: 'departments', action: 'read', permission_key: 'departments:read', description: 'View departments', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 110, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789011', resource: 'departments', action: 'update', permission_key: 'departments:update', description: 'Update departments', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 111, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789012', resource: 'departments', action: 'delete', permission_key: 'departments:delete', description: 'Delete departments', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Roles Module ──
    { id: 112, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789013', resource: 'roles', action: 'create', permission_key: 'roles:create', description: 'Create roles', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 113, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789014', resource: 'roles', action: 'read', permission_key: 'roles:read', description: 'View roles', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 114, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789015', resource: 'roles', action: 'update', permission_key: 'roles:update', description: 'Update roles', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 115, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789016', resource: 'roles', action: 'delete', permission_key: 'roles:delete', description: 'Delete roles', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Permissions Module ──
    { id: 116, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789017', resource: 'permissions', action: 'manage', permission_key: 'permissions:manage', description: 'Manage permissions', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Expense Categories Module ──
    { id: 117, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789018', resource: 'expense_categories', action: 'create', permission_key: 'expense_categories:create', description: 'Create expense categories', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 118, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789019', resource: 'expense_categories', action: 'read', permission_key: 'expense_categories:read', description: 'View expense categories', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 119, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789020', resource: 'expense_categories', action: 'update', permission_key: 'expense_categories:update', description: 'Update expense categories', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 120, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789021', resource: 'expense_categories', action: 'delete', permission_key: 'expense_categories:delete', description: 'Delete expense categories', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Expenses Module ──
    { id: 121, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789022', resource: 'expenses', action: 'create', permission_key: 'expenses:create', description: 'Create expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 122, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789023', resource: 'expenses', action: 'read', permission_key: 'expenses:read', description: 'View expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 123, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789024', resource: 'expenses', action: 'update', permission_key: 'expenses:update', description: 'Update expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 124, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789025', resource: 'expenses', action: 'delete', permission_key: 'expenses:delete', description: 'Delete expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 125, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789026', resource: 'expenses', action: 'submit', permission_key: 'expenses:submit', description: 'Submit expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 126, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789027', resource: 'expenses', action: 'approve', permission_key: 'expenses:approve', description: 'Approve expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 127, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789028', resource: 'expenses', action: 'reject', permission_key: 'expenses:reject', description: 'Reject expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 128, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789029', resource: 'expenses', action: 'pay', permission_key: 'expenses:pay', description: 'Process payment for expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Travel Expenses Module ──
    { id: 129, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789030', resource: 'travel_expenses', action: 'create', permission_key: 'travel_expenses:create', description: 'Create travel expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 130, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789031', resource: 'travel_expenses', action: 'read', permission_key: 'travel_expenses:read', description: 'View travel expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 131, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789032', resource: 'travel_expenses', action: 'update', permission_key: 'travel_expenses:update', description: 'Update travel expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 132, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789033', resource: 'travel_expenses', action: 'delete', permission_key: 'travel_expenses:delete', description: 'Delete travel expenses', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },

    // ── Reports Module ──
    { id: 133, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789034', resource: 'reports', action: 'view', permission_key: 'reports:view', description: 'View reports', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
    { id: 134, uuid: 'f1a2b3c4-d5e6-7890-fabc-123456789035', resource: 'reports', action: 'export', permission_key: 'reports:export', description: 'Export reports', status: 'ACTIVE', created_at: new Date(), updated_at: new Date() },
  ]);
}

export async function down({ context }) {
  return context.bulkDelete('permissions', {
    id: Array.from({ length: 35 }, (_, i) => 100 + i),
  }, {});
}
