import MyExpenses from '@/pages/expenses/MyExpenses';
import { getAssignedExpenses } from '@/services/expenseService';

// "Assigned Expenses" — expenses where the logged-in user's role is the current handler
// (current_role_id matches their role) and scoped to the companies they're employed in.
// SUPER_ADMIN/CFO see all assigned expenses regardless of company.
export default function AssignedExpenses() {
  return <MyExpenses title="Assigned Expenses" fetchList={getAssignedExpenses} actionMode="assigned" />;
}