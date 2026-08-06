import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { vendorCategoryApi } from '@/services/vendorService';
import VendorCategoryForm from '@/pages/master/vendorCategories/VendorCategoryForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (c) => ({
  name: c?.name || '',
  code: c?.code || '',
  description: c?.description || '',
  status: c?.status || 'ACTIVE',
});

export default function EditVendorCategory() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const goBack = () => navigate('/master/vendor-categories');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await vendorCategoryApi.get(uuid);
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
      <PageHeader title="Edit Category" subtitle="Update vendor category details" icon={Tag} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <VendorCategoryForm
          initialValues={initialValues}
          isEdit
          onSubmit={async (payload) => {
            await vendorCategoryApi.update(uuid, payload);
            navigate('/master/vendor-categories');
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}
