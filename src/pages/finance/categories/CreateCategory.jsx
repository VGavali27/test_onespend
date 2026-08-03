import { useNavigate } from 'react-router-dom';
import { Tags } from 'lucide-react';
import { categoryApi } from '@/services/financeService';
import CategoryForm from '@/pages/finance/categories/CategoryForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreateCategory() {
  const navigate = useNavigate();
  const goBack = () => navigate('/master/categories');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Category" subtitle="Create a new expense category" icon={Tags} onBack={goBack} />
      <CategoryForm
        onSubmit={async (payload) => {
          await categoryApi.create(payload);
          navigate('/master/categories');
        }}
        onCancel={goBack}
      />
    </div>
  );
}