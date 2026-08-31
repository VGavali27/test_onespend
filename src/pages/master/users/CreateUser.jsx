import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { userApi } from '@/services/masterService';
import UserForm from '@/pages/master/users/UserForm';

export default function CreateUser() {
  const navigate = useNavigate();
  const goBack = () => navigate('/master/users');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          title="Back to users"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Add User</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Create a new user account</p>
          </div>
        </div>
      </div>

      <UserForm
        onSubmit={async (payload) => {
          await userApi.create(payload);
          navigate('/master/users');
        }}
        onCancel={goBack}
      />
    </div>
  );
}
