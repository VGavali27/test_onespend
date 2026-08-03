import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/format';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyRound, Clock } from 'lucide-react';
import { permissionApi } from '@/services/accessService';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';


export default function ViewPermission() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [perm, setPerm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await permissionApi.get(uuid);
      setPerm(data?.data);
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
      <DetailHeader icon={KeyRound} title={perm?.permission_key || 'Permission'} onBack={() => navigate('/access/permissions')} editTo={`/access/permissions/${uuid}/edit`} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : perm ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard icon={KeyRound} title="Permission">
            <InfoRow label="Resource" value={perm.resource || '—'} />
            <InfoRow label="Action" value={perm.action || '—'} />
            <InfoRow label="Permission key" value={perm.permission_key || '—'} />
            <InfoRow label="Status" value={<StatusBadge status={perm.status} />} />
          </InfoCard>
          <InfoCard icon={Clock} title="Details">
            <InfoRow label="Description" value={perm.description || '—'} />
            <InfoRow label="Created" value={formatDate(perm.createdAt ?? perm.created_at)} />
          </InfoCard>
        </div>
      ) : null}
    </div>
  );
}