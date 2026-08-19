import MyExpenses from '@/pages/expenses/MyExpenses';
import { getExpenses } from '@/services/expenseService';

// "All Expenses" — the scoped list (GET /expenses, server-side pagination).
// SUPER_ADMIN/CFO see everything; other expense-manager roles see only the companies
// they're employed in. This is a read-only overview; for actions (approve/reject),
// use the "Approvals" page (/expenses/assigned) which filters to expenses pending
// the logged-in user's role.
export default function AllExpenses() {
  return <MyExpenses title="All Expenses" fetchList={getExpenses} actionMode="all" />;
}
