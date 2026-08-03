import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { permissionApi } from '@/services/accessService';
import PermissionForm from '@/pages/access/permissions/PermissionForm';
import PageHeader from '@/components/ui/PageHeader';

export default function CreatePermission() {
  const navigate = useNavigate();
  const goBack = () => navigate('/access/permissions');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Permission" subtitle="Create a new permission" icon={KeyRound} onBack={goBack} />
      <PermissionForm
        onSubmit={async (payload) => {
          await permissionApi.create(payload);
          navigate('/access/permissions');
        }}
        onCancel={goBack}
      />
    </div>
  );
}