import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { companyApi } from '@/services/masterService';
import CompanyForm from '@/pages/master/companies/CompanyForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreateCompany() {
  const navigate = useNavigate();
  const goBack = () => navigate('/master/companies');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Company" subtitle="Create a new company record" icon={Building2} onBack={goBack} />
      <CompanyForm
        onSubmit={async (payload) => {
          await companyApi.create(payload);
          navigate('/master/companies');
        }}
        onCancel={goBack}
      />
    </div>
  );
}