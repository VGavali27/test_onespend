import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { permissionApi } from '@/services/accessService';
import PermissionForm from '@/pages/access/permissions/PermissionForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (p) => ({
  resource: p?.resource || '',
  action: p?.action || '',
  permission_key: p?.permission_key || '',
  description: p?.description || '',
  status: p?.status || 'ACTIVE',
});

export default function EditPermission() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const goBack = () => navigate('/access/permissions');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await permissionApi.get(uuid);
      setInitialValues(toFormValues(data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load permission.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Permission" subtitle="Update permission details" icon={KeyRound} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <PermissionForm
          initialValues={initialValues}
          isEdit
          onSubmit={async (payload) => {
            await permissionApi.update(uuid, payload);
            navigate('/access/permissions');
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}