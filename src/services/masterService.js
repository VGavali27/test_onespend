import api from '@/services/api';
import { crud } from '@/services/api';

// ── Master Data (standard CRUD) ──
export const companyApi = crud('/companies');
export const departmentApi = crud('/departments');
export const userApi = crud('/users');
export const employmentApi = crud('/user-employments');

// ── Employments by user (company switcher) ──
export const getEmploymentsByUser = (userUuid) => api.get(`/user-employments/by-user/${userUuid}`);
