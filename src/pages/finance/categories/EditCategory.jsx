import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tags } from 'lucide-react';
import { categoryApi } from '@/services/financeService';
import CategoryForm from '@/pages/finance/categories/CategoryForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (c) => ({
  code: c?.code || '',
  name: c?.name || '',
  module: c?.module || '',
  first_receiver_role_uuid: c?.firstReceiverRole?.uuid || '',
  final_approver_role_uuid: c?.finalApproverRole?.uuid || '',
  description: c?.description || '',
});

export default function EditCategory() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const goBack = () => navigate('/master/categories');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await categoryApi.get(uuid);
      setInitialValues(toFormValues(data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load category.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Category" subtitle="Update expense category details" icon={Tags} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <CategoryForm
          initialValues={initialValues}
          isEdit
          onSubmit={async (payload) => {
            await categoryApi.update(uuid, payload);
            navigate('/master/categories');
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}