import MyExpenses from '@/pages/expenses/MyExpenses';
import { getExpenses } from '@/services/expenseService';

// "All Expenses" — the scoped list (GET /expenses, server-side pagination) with
// approver-style actions (approve/reject/handover/payment placeholders).
// SUPER_ADMIN/CFO see everything; other expense-manager roles see only the companies
// they're employed in.
export default function AllExpenses() {
  return <MyExpenses title="All Expenses" fetchList={getExpenses} actionMode="all" />;
}
