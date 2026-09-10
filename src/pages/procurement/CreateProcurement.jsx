import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { procurementApi } from '@/services/procurementService';
import ProcurementForm from '@/pages/procurement/ProcurementForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreateProcurement() {
  const navigate = useNavigate();
  const goBack = () => navigate('/procurement');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="New Purchase Intention" subtitle="Create a procurement request (PI)" icon={ShoppingCart} onBack={goBack} />
      <ProcurementForm
        onSubmit={async (payload) => {
          await procurementApi.create(payload);
          navigate('/procurement');
        }}
        onCancel={goBack}
      />
    </div>
  );
}
