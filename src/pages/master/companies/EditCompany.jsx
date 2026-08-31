import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { companyApi } from '@/services/masterService';
import CompanyForm from '@/pages/master/companies/CompanyForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (c) => ({
  name: c?.name || '',
  code: c?.code || '',
  group_uuid: c?.group?.uuid || '',
  status: c?.status || 'ACTIVE',
  logo_img: c?.logo_img || '',
  email: c?.email || '',
  phone: c?.phone || '',
  website: c?.website || '',
  gst_number: c?.gst_number || '',
  pan_number: c?.pan_number || '',
  cin_number: c?.cin_number || '',
  address_line_1: c?.address_line_1 || '',
  address_line_2: c?.address_line_2 || '',
  city: c?.city || '',
  state: c?.state || '',
  country: c?.country || '',
  pincode: c?.pincode || '',
});

export default function EditCompany() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  const goBack = () => navigate('/master/companies');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await companyApi.get(uuid);
      setInitialValues(toFormValues(data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load company.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Company" subtitle="Update company details" icon={Building2} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <CompanyForm
          initialValues={initialValues}
          isEdit
          onSubmit={async (payload) => {
            await companyApi.update(uuid, payload);
            navigate('/master/companies');
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}