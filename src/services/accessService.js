import api from '@/services/api';
import { crud } from '@/services/api';

// ── Access Control (standard CRUD) ──
export const roleApi = crud('/roles');
export const permissionApi = crud('/permissions');

// ── Dropdown options (lightweight: uuid + name) ──
export const getRoleOptions = () => api.get('/roles/options');

// ── Role permissions (custom endpoints) ──
export const getPermissionsByRole = (roleUuid) => api.get(`/role-permissions/by-role/${roleUuid}`);
export const syncRolePermissions = (roleUuid, permissionUuids) =>
  api.put(`/role-permissions/${roleUuid}/sync`, { permissionUuids });
