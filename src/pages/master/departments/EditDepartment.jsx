import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tags } from 'lucide-react';
import { departmentApi } from '@/services/masterService';
import DepartmentForm from '@/pages/master/departments/DepartmentForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (d) => ({
  name: d?.name || '',
  code: d?.code || '',
  status: d?.status || 'ACTIVE',
  description: d?.description || '',
});

export default function EditDepartment() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const goBack = () => navigate('/master/departments');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await departmentApi.get(uuid);
      setInitialValues(toFormValues(data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load department.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Department" subtitle="Update department details" icon={Tags} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <DepartmentForm
          initialValues={initialValues}
          isEdit
          onSubmit={async (payload) => {
            await departmentApi.update(uuid, payload);
            navigate('/master/departments');
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}