import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { permissionFormSchema } from '@/validations/permissionSchema';
import { inputClassFor, FormSection, FormField } from '@/components/ui/form';

const emptyForm = { resource: '', action: '', permission_key: '', description: '', status: 'ACTIVE' };

export default function PermissionForm({
  initialValues = emptyForm,
  isEdit = false,
  onSubmit,
  onCancel,
  submitLabel = isEdit ? 'Save Changes' : 'Create Permission',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      resource: values.resource.trim(),
      action: values.action.trim(),
      permission_key: values.permission_key.trim(),
      status: values.status,
      description: values.description.trim() || null,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      const serverErrors = err?.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        for (const e of serverErrors) {
          try {
            setError(e.field, { type: 'server', message: e.message });
          } catch {
            // field not in the form — skip
          }
        }
      } else {
        setSubmitError(err?.response?.data?.message || 'Failed to save permission. Please try again.');
      }
    }
  });

  return (
    <>
      {submitError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400">
          {submitError}
        </div>
      )}

      <form id="permission-form" noValidate onSubmit={handleFormSubmit} className="space-y-6">
        <FormSection icon={KeyRound} title="Permission" subtitle="Resource / action pairing">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField label="Resource" required error={errors.resource?.message}>
              <input className={inputClassFor(!!errors.resource)} {...register('resource')} placeholder="e.g. users" />
            </FormField>
            <FormField label="Action" required error={errors.action?.message}>
              <input className={inputClassFor(!!errors.action)} {...register('action')} placeholder="e.g. create" />
            </FormField>
            <FormField label="Permission key" required error={errors.permission_key?.message}>
              <input className={inputClassFor(!!errors.permission_key)} {...register('permission_key')} placeholder="e.g. users.create" />
            </FormField>
            <FormField label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <select className={inputClassFor(!!errors.status)} {...field}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                )}
              />
            </FormField>
            <FormField label="Description" error={errors.description?.message}>
              <textarea
                rows={3}
                className={inputClassFor(!!errors.description)}
                {...register('description')}
                placeholder="Optional description"
              />
            </FormField>
          </div>
        </FormSection>
      </form>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="permission-form"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/20 transition-colors"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? savingLabel : submitLabel}
        </button>
      </div>
    </>
  );
}