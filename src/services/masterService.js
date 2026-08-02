import api from '@/services/api';
import { crud } from '@/services/api';

// ── Master Data (standard CRUD) ──
export const companyApi = crud('/companies');
export const departmentApi = crud('/departments');
export const userApi = crud('/users');
export const employmentApi = crud('/user-employments');

// Fetch users with server-side pagination/search/filter/sort.
// Params: page, limit, search, status, sortBy, sortOrder. `config` can pass axios options (e.g. signal).
export const getUsers = (params, config) => api.get('/users', { params, ...config });

// ── Employments by user (company switcher) ──
export const getEmploymentsByUser = (userUuid) => api.get(`/user-employments/by-user/${userUuid}`);

// ── Dropdown options (lightweight: uuid + name) ──
export const getCompanyOptions = () => api.get('/companies/options');
export const getDepartmentOptions = () => api.get('/departments/options');
