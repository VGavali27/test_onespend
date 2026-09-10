import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { vendorApi, syncVendorDocuments } from '@/services/vendorService';
import VendorForm from '@/pages/master/vendors/VendorForm';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';

const toFormValues = (v) => ({
  name: v?.name || '',
  code: v?.code || '',
  vendor_type: v?.vendor_type || 'VENDOR',
  logo_img: v?.logo_img || '',
  website: v?.website || '',
  gst_number: v?.gst_number || '',
  pan_number: v?.pan_number || '',
  cin_number: v?.cin_number || '',
  payment_terms: v?.payment_terms || '',
  rating: v?.rating != null ? String(v.rating) : '',
  status: v?.status || 'ACTIVE',
  notes: v?.notes || '',
  contacts: (v?.contacts || []).map((c) => ({
    contact_type: c.contact_type || 'PRIMARY', salutation: c.salutation || '', first_name: c.first_name || '',
    last_name: c.last_name || '', designation: c.designation || '', email: c.email || '',
    phone: c.phone || '', mobile: c.mobile || '', is_primary: !!c.is_primary,
  })),
  addresses: (v?.addresses || []).map((a) => ({
    address_type: a.address_type || 'REGISTERED', address_line_1: a.address_line_1 || '', address_line_2: a.address_line_2 || '',
    city: a.city || '', state: a.state || '', country: a.country || '', pincode: a.pincode || '', is_primary: !!a.is_primary,
  })),
  bank_accounts: (v?.bankAccounts || []).map((b) => ({
    account_type: b.account_type || 'PRIMARY', account_holder_name: b.account_holder_name || '', bank_name: b.bank_name || '',
    bank_branch: b.bank_branch || '', account_number: b.account_number || '', ifsc: b.ifsc || '',
    swift_code: b.swift_code || '', currency_code: b.currency_code || 'INR', is_primary: !!b.is_primary,
  })),
  category_uuids: (v?.categories || []).map((c) => c.uuid),
  documents: (v?.documents || []).map((d) => ({ uuid: d.uuid, name: d.original_file_name, url: d.file_path })),
});

const toInitialDocuments = (v) => (v?.documents || []).map((d) => ({ uuid: d.uuid, name: d.original_file_name, url: d.file_path }));

export default function EditVendor() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [initialDocuments, setInitialDocuments] = useState([]);

  const goBack = () => navigate('/master/vendors');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await vendorApi.get(uuid);
      setInitialValues(toFormValues(data?.data));
      setInitialDocuments(toInitialDocuments(data?.data));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load vendor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Edit Vendor" subtitle="Update vendor details" icon={Truck} onBack={goBack} />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <VendorForm
          initialValues={initialValues}
          isEdit
          onSubmit={async ({ payload, documents }) => {
            await vendorApi.update(uuid, payload);
            await syncVendorDocuments(uuid, documents, initialDocuments);
            navigate(`/master/vendors/${uuid}`);
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}
