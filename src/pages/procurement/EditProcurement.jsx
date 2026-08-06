import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { procurementApi } from '@/services/procurementService';
import ProcurementForm from '@/pages/procurement/ProcurementForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (d) => ({
  title: d?.title || '',
  company_uuid: d?.company?.uuid || '',
  vendor_uuid: d?.vendor?.uuid || '',
  vendor_contact: d?.vendor_contact || '',
  delivery_address: d?.delivery_address || '',
  expected_delivery_date: d?.expected_delivery_date || '',
  payment_terms: d?.payment_terms || '',
  notes: d?.notes || '',
  items: (d?.items || []).map((it) => ({
    item_name: it.item_name || '',
    description: it.description || '',
    category: it.category || '',
    quantity: it.quantity ?? 1,
    unit: it.unit || '',
    unit_price: it.unit_price ?? 0,
    tax_rate: it.tax_rate ?? 0,
  })),
});

export default function EditProcurement() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const goBack = () => navigate('/procurement');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await procurementApi.get(uuid);
      setInitialValues(toFormValues(data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load procurement request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit PI" subtitle="Update the draft purchase intention" icon={ShoppingCart} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <ProcurementForm
          initialValues={initialValues}
          isEdit
          onSubmit={async (payload) => {
            await procurementApi.update(uuid, payload);
            navigate(`/procurement/${uuid}`);
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}
