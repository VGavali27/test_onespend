import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tags, Clock } from 'lucide-react';
import { departmentApi } from '@/services/masterService';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ViewDepartment() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [dept, setDept] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await departmentApi.get(uuid);
      setDept(data?.data);
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
      <DetailHeader
        icon={Tags}
        title={dept?.name || 'Department'}
        onBack={() => navigate('/master/departments')}
        editTo={`/master/departments/${uuid}/edit`}
      />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : dept ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard icon={Tags} title="Department">
            <InfoRow label="Name" value={dept.name || '—'} />
            <InfoRow label="Code" value={dept.code || '—'} />
            <InfoRow label="Status" value={<StatusBadge status={dept.status} />} />
            <InfoRow label="Description" value={dept.description || '—'} />
          </InfoCard>
          <InfoCard icon={Clock} title="Meta">
            <InfoRow label="Created" value={formatDate(dept.createdAt ?? dept.created_at)} />
          </InfoCard>
        </div>
      ) : null}
    </div>
  );
}