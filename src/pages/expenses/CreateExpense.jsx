import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ExpenseForm from '@/pages/expenses/ExpenseForm';
import { createExpense } from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';

export default function CreateExpense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const goBack = () => navigate('/expenses/my');

  const handleSubmit = async (payload) => {
    await createExpense(payload);
    navigate('/expenses/my');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Create Expense" subtitle="Submit a new expense request" icon={Wallet} onBack={goBack} />
      <ExpenseForm requestedByUserUuid={user?.uuid} onSubmit={handleSubmit} onCancel={goBack} />
    </div>
  );
}