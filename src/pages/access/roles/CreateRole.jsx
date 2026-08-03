import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { roleApi } from '@/services/accessService';
import RoleForm from '@/pages/access/roles/RoleForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreateRole() {
  const navigate = useNavigate();
  const goBack = () => navigate('/access/roles');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Role" subtitle="Create a new role" icon={Shield} onBack={goBack} />
      <RoleForm
        onSubmit={async (payload) => {
          await roleApi.create(payload);
          navigate('/access/roles');
        }}
        onCancel={goBack}
      />
    </div>
  );
}