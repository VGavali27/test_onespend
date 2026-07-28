import { Router } from 'express';
import userRoutes from '../modules/user/user.routes.js';
import companyRoutes from '../modules/company/company.routes.js';
import departmentRoutes from '../modules/department/department.routes.js';
import roleRoutes from '../modules/role/role.routes.js';
import userEmploymentRoutes from '../modules/user_employment/user_employment.routes.js';
import permissionRoutes from '../modules/permission/permission.routes.js';
import rolePermissionRoutes from '../modules/role_permission/role_permission.routes.js';
import expenseCategoryRoutes from '../modules/expense_category/expense_category.routes.js';
import expenseRoutes from '../modules/expense/expense.routes.js';
import travelExpenseRoutes from '../modules/travel_expense/travel_expense.routes.js';

const router = Router();

router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/departments', departmentRoutes);
router.use('/roles', roleRoutes);
router.use('/user-employments', userEmploymentRoutes);
router.use('/permissions', permissionRoutes);
router.use('/role-permissions', rolePermissionRoutes);
router.use('/expense-categories', expenseCategoryRoutes);
router.use('/expenses', expenseRoutes);
router.use('/travel-expenses', travelExpenseRoutes);

export default router;
