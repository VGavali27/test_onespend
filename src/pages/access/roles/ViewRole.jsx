import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Clock } from 'lucide-react';
import { roleApi } from '@/services/accessService';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ViewRole() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await roleApi.get(uuid);
      setRole(data?.data);
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
      <DetailHeader icon={Shield} title={role?.name || 'Role'} onBack={() => navigate('/access/roles')} editTo={`/access/roles/${uuid}/edit`} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : role ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard icon={Shield} title="Role">
            <InfoRow label="Name" value={role.name || '—'} />
            <InfoRow label="Code" value={role.code || '—'} />
            <InfoRow label="Status" value={<StatusBadge status={role.status} />} />
            <InfoRow label="Description" value={role.description || '—'} />
          </InfoCard>
          <InfoCard icon={Clock} title="Meta">
            <InfoRow label="Created" value={formatDate(role.createdAt ?? role.created_at)} />
          </InfoCard>
        </div>
      ) : null}
    </div>
  );
}