import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { vendorApi, syncVendorDocuments } from '@/services/vendorService';
import VendorForm from '@/pages/master/vendors/VendorForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreateVendor() {
  const navigate = useNavigate();
  const goBack = () => navigate('/master/vendors');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Vendor" subtitle="Create a new vendor record" icon={Truck} onBack={goBack} />
      <VendorForm
        onSubmit={async ({ payload, documents }) => {
          const { data } = await vendorApi.create(payload);
          await syncVendorDocuments(data?.data?.uuid, documents);
          navigate('/master/vendors');
        }}
        onCancel={goBack}
      />
    </div>
  );
}
