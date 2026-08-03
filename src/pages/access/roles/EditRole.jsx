import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { roleApi } from '@/services/accessService';
import RoleForm from '@/pages/access/roles/RoleForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (r) => ({
  name: r?.name || '',
  code: r?.code || '',
  description: r?.description || '',
  status: r?.status || 'ACTIVE',
});

export default function EditRole() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const goBack = () => navigate('/access/roles');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await roleApi.get(uuid);
      setInitialValues(toFormValues(data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load role.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Role" subtitle="Update role details" icon={Shield} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <RoleForm
          initialValues={initialValues}
          isEdit
          onSubmit={async (payload) => {
            await roleApi.update(uuid, payload);
            navigate('/access/roles');
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}