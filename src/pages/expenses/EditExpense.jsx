import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wallet, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import ExpenseForm from '@/pages/expenses/ExpenseForm';
import { getExpenseById, updateExpense, expenseToFormValues } from '@/services/expenseService';
import { useToast } from '@/components/ui/Toast';

export default function EditExpense() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getExpenseById(uuid);
      setInitialValues(expenseToFormValues(data?.data));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load this expense.');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Edit Expense" subtitle="Loading draft..." icon={Wallet} onBack={() => navigate(-1)} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !initialValues) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Edit Expense" subtitle="Couldn't load the expense" icon={Wallet} onBack={() => navigate(-1)} />
        <ErrorState message={error || 'Expense not found.'} onRetry={load} />
      </div>
    );
  }

  const handleSubmit = async (payload) => {
    await updateExpense(uuid, payload);
    toast.success('Expense updated successfully');
    navigate(`/expenses/${uuid}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Expense" subtitle="You can edit this draft until it's submitted" icon={Wallet} onBack={() => navigate(-1)} />
      <ExpenseForm initialValues={initialValues} isEdit onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}
