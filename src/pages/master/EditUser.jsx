import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, RotateCw, UserX } from 'lucide-react';
import { userApi } from '@/services/masterService';
import UserForm from '@/pages/master/UserForm';

const toFormValues = (user) => ({
  first_name: user.first_name || '',
  middle_name: user.middle_name || '',
  last_name: user.last_name || '',
  email: user.email || '',
  mobile: user.mobile || '',
  password: '',
  profile_image: user.profile_image || '',
  role_uuid: user.role?.uuid || '',
  department_uuid: user.department?.uuid || '',
});

const toEmploymentValues = (employments = []) =>
  employments.map((e) => ({
    company_uuid: e.company?.uuid || '',
    employee_code: e.employee_code || '',
    email: e.email || '',
    designation: e.designation || '',
    employment_type: e.employment_type || 'PERMANENT',
    joining_date: e.joining_date || '',
  }));

export default function EditUser() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [initialEmployments, setInitialEmployments] = useState([]);

  const goBack = () => navigate('/master/users');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.get(uuid);
      const user = data?.data;
      setInitialValues(toFormValues(user));
      setInitialEmployments(toEmploymentValues(user?.employments));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit User</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Update the user's details and employments</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : initialValues ? (
        <UserForm
          initialValues={initialValues}
          initialEmployments={initialEmployments}
          isEdit
          onSubmit={async (payload) => {
            await userApi.update(uuid, payload);
            navigate('/master/users');
          }}
          onCancel={goBack}
        />
      ) : null}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center mb-4">
        <UserX className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Couldn't load this user</p>
      <p className="text-[13px] text-slate-400 mt-1 max-w-sm">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
      >
        <RotateCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
