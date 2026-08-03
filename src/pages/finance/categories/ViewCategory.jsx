import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/format';
import { useNavigate, useParams } from 'react-router-dom';
import { Tags, Clock, UserCheck, ShieldCheck } from 'lucide-react';
import { categoryApi } from '@/services/financeService';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';

export default function ViewCategory() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await categoryApi.get(uuid);
      setCategory(data?.data);
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
      <DetailHeader icon={Tags} title={category?.name || 'Category'} onBack={() => navigate('/master/categories')} editTo={`/master/categories/${uuid}/edit`} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : category ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard icon={Tags} title="Category">
            <InfoRow label="Code" value={category.code || '—'} />
            <InfoRow label="Name" value={category.name || '—'} />
            <InfoRow label="Module" value={category.module || '—'} />
            <InfoRow label="Status" value={<StatusBadge status={category.status} />} />
            <InfoRow label="Description" value={category.description || '—'} />
          </InfoCard>
          <div className="space-y-6">
            <InfoCard icon={UserCheck} title="First receiver role">
              <InfoRow label="Role" value={category.firstReceiverRole?.name || '—'} />
            </InfoCard>
            <InfoCard icon={ShieldCheck} title="Final approver role">
              <InfoRow label="Role" value={category.finalApproverRole?.name || '—'} />
            </InfoCard>
            <InfoCard icon={Clock} title="Meta">
              <InfoRow label="Created" value={formatDate(category.createdAt ?? category.created_at)} />
            </InfoCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}