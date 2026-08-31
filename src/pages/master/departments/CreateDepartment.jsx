import { useNavigate } from 'react-router-dom';
import { Tags } from 'lucide-react';
import { departmentApi } from '@/services/masterService';
import DepartmentForm from '@/pages/master/departments/DepartmentForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreateDepartment() {
  const navigate = useNavigate();
  const goBack = () => navigate('/master/departments');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Department" subtitle="Create a new department" icon={Tags} onBack={goBack} />
      <DepartmentForm
        onSubmit={async (payload) => {
          await departmentApi.create(payload);
          navigate('/master/departments');
        }}
        onCancel={goBack}
      />
    </div>
  );
}