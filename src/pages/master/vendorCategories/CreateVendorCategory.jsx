import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { vendorCategoryApi } from '@/services/vendorService';
import VendorCategoryForm from '@/pages/master/vendorCategories/VendorCategoryForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreateVendorCategory() {
  const navigate = useNavigate();
  const goBack = () => navigate('/master/vendor-categories');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Category" subtitle="Create a new vendor category" icon={Tag} onBack={goBack} />
      <VendorCategoryForm
        onSubmit={async (payload) => {
          await vendorCategoryApi.create(payload);
          navigate('/master/vendor-categories');
        }}
        onCancel={goBack}
      />
    </div>
  );
}
