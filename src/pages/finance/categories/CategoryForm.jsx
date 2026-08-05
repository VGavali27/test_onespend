import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tags, Loader2 } from 'lucide-react';
import { expenseCategoryFormSchema } from '@/validations/expenseCategorySchema';
import { inputClassFor, FormSection, FormField } from '@/components/ui/form';
import { getRoleOptions } from '@/services/accessService';
import { nullIfEmpty } from '@/utils/format';
import { applyServerErrorsDetailed } from '@/utils/formErrors';
import { useToast } from '@/components/ui/Toast';

const emptyForm = { code: '', name: '', module: '', first_receiver_role_uuid: '', final_approver_role_uuid: '', description: '' };

export default function CategoryForm({
  initialValues = emptyForm,
  isEdit = false,
  onSubmit,
  onCancel,
  submitLabel = isEdit ? 'Save Changes' : 'Create Category',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  const [roles, setRoles] = useState([]);
  const [optionsError, setOptionsError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  // Load role options once for the receiver / approver dropdowns
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getRoleOptions();
        setRoles(data?.data ?? []);
      } catch (e) {
        setOptionsError(e?.response?.data?.message || 'Failed to load roles.');
      }
    };
    load();
  }, []);

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      module: values.module.trim(),
      first_receiver_role_uuid: values.first_receiver_role_uuid,
      final_approver_role_uuid: values.final_approver_role_uuid,
      description: nullIfEmpty(values.description),
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      const { mapped, summary } = applyServerErrorsDetailed(err, setError);
      const baseMessage = err?.response?.data?.message || 'Failed to save category. Please try again.';
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
      {optionsError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400">
          {optionsError}
        </div>
      )}

      <form id="category-form" noValidate onSubmit={handleFormSubmit} className="space-y-6">
        <FormSection icon={Tags} title="Category" subtitle="Basic details">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField label="Code" required error={errors.code?.message}>
              <input className={inputClassFor(!!errors.code)} {...register('code')} placeholder="e.g. TRAVEL" />
            </FormField>
            <FormField label="Name" required error={errors.name?.message}>
              <input className={inputClassFor(!!errors.name)} {...register('name')} placeholder="e.g. Travel" />
            </FormField>
            <FormField label="Module" required error={errors.module?.message}>
              <input className={inputClassFor(!!errors.module)} {...register('module')} placeholder="e.g. travel" />
            </FormField>
          </div>
        </FormSection>

        <FormSection icon={Tags} title="Approval Chain" subtitle="Entry and exit roles for this category's expenses">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First receiver role" required error={errors.first_receiver_role_uuid?.message}>
              <Controller
                control={control}
                name="first_receiver_role_uuid"
                render={({ field }) => (
                  <select className={inputClassFor(!!errors.first_receiver_role_uuid)} {...field}>
                    <option value="">Select first receiver...</option>
                    {roles.map((r) => (
                      <option key={r.uuid} value={r.uuid}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </FormField>
            <FormField label="Final approver role" required error={errors.final_approver_role_uuid?.message}>
              <Controller
                control={control}
                name="final_approver_role_uuid"
                render={({ field }) => (
                  <select className={inputClassFor(!!errors.final_approver_role_uuid)} {...field}>
                    <option value="">Select final approver...</option>
                    {roles.map((r) => (
                      <option key={r.uuid} value={r.uuid}>
                        {r.name}
                      </option>
                    ))}
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
          form="category-form"
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