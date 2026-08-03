import api from '@/services/api';
import { crud } from '@/services/api';

// ── Access Control (standard CRUD) ──
export const roleApi = crud('/roles');
export const permissionApi = crud('/permissions');
export const roleHandoverRuleApi = crud('/role-handover-rules');

// ── Role handover rules (custom endpoints) ──
// Replaces all of a from-role's rules within a module with the given to-role set
export const syncRoleHandoverRules = (payload) => api.put('/role-handover-rules/sync', payload);

// ── Dropdown options (lightweight: uuid + name) ──
export const getRoleOptions = () => api.get('/roles/options');

// ── Role permissions (custom endpoints) ──
export const getPermissionsByRole = (roleUuid) => api.get(`/role-permissions/by-role/${roleUuid}`);
// The backend sync endpoint expects the permission UUIDs as the raw body (an array).
export const syncRolePermissions = (roleUuid, permissionUuids) =>
  api.put(`/role-permissions/${roleUuid}/sync`, permissionUuids);
