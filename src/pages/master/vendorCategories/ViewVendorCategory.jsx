import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/format';
import { useNavigate, useParams } from 'react-router-dom';
import { Tag, Clock } from 'lucide-react';
import { vendorCategoryApi } from '@/services/vendorService';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';

export default function ViewVendorCategory() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await vendorCategoryApi.get(uuid);
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
      <DetailHeader icon={Tag} title={category?.name || 'Category'} onBack={() => navigate('/master/vendor-categories')} editTo={`/master/vendor-categories/${uuid}/edit`} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : category ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard icon={Tag} title="Category">
            <InfoRow label="Name" value={category.name || '—'} />
            <InfoRow label="Code" value={category.code || '—'} />
            <InfoRow label="Status" value={<StatusBadge status={category.status} />} />
            <InfoRow label="Description" value={category.description || '—'} />
          </InfoCard>
          <InfoCard icon={Clock} title="Meta">
            <InfoRow label="Created" value={formatDate(category.createdAt ?? category.created_at)} />
          </InfoCard>
        </div>
      ) : null}
    </div>
  );
}
