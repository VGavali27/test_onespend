import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Loader2 } from 'lucide-react';
import { roleFormSchema } from '@/validations/roleSchema';
import { inputClassFor, FormSection, FormField } from '@/components/ui/form';
import { nullIfEmpty } from '@/utils/format';
import { applyServerErrorsDetailed } from '@/utils/formErrors';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { name: '', code: '', description: '', status: 'ACTIVE' };

export default function RoleForm({
  initialValues = emptyForm,
  isEdit = false,
  onSubmit,
  onCancel,
  submitLabel = isEdit ? 'Save Changes' : 'Create Role',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  const [submitError, setSubmitError] = useState(null);
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(roleFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
      status: values.status,
      description: nullIfEmpty(values.description),
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      const { mapped, summary } = applyServerErrorsDetailed(err, setError);
      const baseMessage = err?.response?.data?.message || 'Failed to save role. Please try again.';
      if (mapped) {
        setSubmitError('Please fix the highlighted fields and try again.');
      } else if (summary.length > 0) {
        setSubmitError(summary.join('\n'));
      } else {
        setSubmitError(baseMessage);
      }
      toast.error(summary[0] || baseMessage);
    }
  });

  return (
    <>
      {submitError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400 whitespace-pre-line">
          {submitError}
        </div>
      )}

      <form id="role-form" noValidate onSubmit={handleFormSubmit} className="space-y-6">
        <FormSection icon={Shield} title="Role" subtitle="Basic role details">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField label="Role name" required error={errors.name?.message}>
              <input className={inputClassFor(!!errors.name)} {...register('name')} placeholder="e.g. Finance Manager" />
            </FormField>
            <FormField label="Code" required error={errors.code?.message}>
              <input className={inputClassFor(!!errors.code)} {...register('code')} placeholder="e.g. FIN_MGR" />
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
          form="role-form"
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