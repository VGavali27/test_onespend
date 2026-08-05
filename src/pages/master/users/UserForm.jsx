import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRound, KeyRound, Briefcase, Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { getCompanyOptions, getDepartmentOptions } from '@/services/masterService';
import { getRoleOptions } from '@/services/accessService';
import ImageUpload from '@/components/ui/ImageUpload';
import { inputClassFor } from '@/components/ui/form';
import { nullIfEmpty } from '@/utils/format';
import { applyServerErrorsDetailed } from '@/utils/formErrors';
import { useToast } from '@/components/ui/Toast';
import { buildUserFormSchema, EMPLOYMENT_TYPES } from '@/validations/userFormSchema';

const emptyForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile: '',
  password: '',
  profile_image: '',
  status: 'ACTIVE',
  role_uuid: '',
  department_uuid: '',
};

const emptyEmployment = {
  company_uuid: '',
  employee_code: '',
  email: '',
  designation: '',
  employment_type: 'PERMANENT',
  joining_date: '',
};

/**
 * Shared user form used by Create User and Edit User.
 * Form state + validation via React Hook Form + Zod (schema in src/validations/).
 *
 * Props:
 *  - initialValues / initialEmployments: prefill (edit) or empty (create)
 *  - isEdit: true on edit — password becomes optional ("leave blank to keep")
 *  - onSubmit(payload): parent performs the API call + navigation
 *  - onCancel: parent navigates back
 */
export default function UserForm({
  initialValues = emptyForm,
  initialEmployments = [],
  isEdit = false,
  onSubmit,
  onCancel,
  submitLabel = isEdit ? 'Save Changes' : 'Create User',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [submitError, setSubmitError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const toast = useToast();

  const schema = useMemo(() => buildUserFormSchema({ isEdit }), [isEdit]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ...initialValues, employments: initialEmployments },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'employments' });

  const password = watch('password');
  const profileImage = watch('profile_image');

  // Load lightweight dropdown options on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [r, d, c] = await Promise.all([getRoleOptions(), getDepartmentOptions(), getCompanyOptions()]);
        setRoles(r.data?.data ?? []);
        setDepartments(d.data?.data ?? []);
        setCompanies(c.data?.data ?? []);
      } catch {
        // dropdown load failure is non-fatal — user can still fill the form
      }
    };
    load();
  }, []);

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      first_name: values.first_name.trim(),
      middle_name: nullIfEmpty(values.middle_name),
      last_name: nullIfEmpty(values.last_name),
      email: nullIfEmpty(values.email),
      mobile: nullIfEmpty(values.mobile),
      profile_image: nullIfEmpty(values.profile_image),
      status: values.status,
      role_uuid: values.role_uuid,
      department_uuid: values.department_uuid || null,
      ...(values.password ? { password: values.password } : {}),
      employments: values.employments.length
        ? values.employments.map((emp) => ({
            company_uuid: emp.company_uuid,
            employee_code: emp.employee_code,
            email: nullIfEmpty(emp.email),
            designation: nullIfEmpty(emp.designation),
            employment_type: emp.employment_type,
            joining_date: nullIfEmpty(emp.joining_date),
          }))
        : null,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      const { mapped, summary } = applyServerErrorsDetailed(err, setError);
      const baseMessage = err?.response?.data?.message || 'Failed to save user. Please try again.';
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

      {/* Form — full width */}
      <form id="user-form" noValidate onSubmit={handleFormSubmit} className="space-y-6">
        {/* Personal Information */}
        <SectionCard icon={UserRound} title="Personal Information" subtitle="Basic identity and contact details">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 sm:w-36 flex justify-center sm:block">
              <ImageUpload
                value={profileImage}
                onChange={(v) => setValue('profile_image', v, { shouldValidate: true, shouldDirty: true })}
                onRemove={() => setValue('profile_image', '', { shouldValidate: true })}
                label="Profile photo"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name" required error={errors.first_name?.message}>
                <input className={inputClassFor(!!errors.first_name)} {...register('first_name')} placeholder="e.g. Rajesh" />
              </Field>
              <Field label="Middle name" error={errors.middle_name?.message}>
                <input className={inputClassFor(!!errors.middle_name)} {...register('middle_name')} />
              </Field>
              <Field label="Last name" required error={errors.last_name?.message}>
                <input className={inputClassFor(!!errors.last_name)} {...register('last_name')} />
              </Field>
              <Field label="Email address" error={errors.email?.message}>
                <input type="email" className={inputClassFor(!!errors.email)} {...register('email')} placeholder="name@company.com" />
              </Field>
              <Field label="Mobile number" error={errors.mobile?.message}>
                <input className={inputClassFor(!!errors.mobile)} {...register('mobile')} placeholder="+91 90000 00000" />
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <select className={inputClassFor(!!errors.status)} {...field}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  )}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* Account & Access */}
        <SectionCard icon={KeyRound} title="Account & Access" subtitle="Credentials and organizational placement">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Password" required={!isEdit} error={errors.password?.message}>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`${inputClassFor(!!errors.password)} pr-11`}
                  {...register('password')}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  title={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <p className={`text-[12px] mt-1 ${password.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {password.length >= 6 ? '✓ Meets minimum length' : 'Password must be at least 6 characters'}
                </p>
              )}
            </Field>
            <Field label="Role" required error={errors.role_uuid?.message}>
              <Controller
                control={control}
                name="role_uuid"
                render={({ field }) => (
                  <select className={inputClassFor(!!errors.role_uuid)} {...field}>
                    <option value="">Select role...</option>
                    {roles.map((r) => (
                      <option key={r.uuid} value={r.uuid}>{r.name}</option>
                    ))}
                  </select>
                )}
              />
            </Field>
            <Field label="Department" required error={errors.department_uuid?.message}>
              <Controller
                control={control}
                name="department_uuid"
                render={({ field }) => (
                  <select className={inputClassFor(!!errors.department_uuid)} {...field}>
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d.uuid} value={d.uuid}>{d.name}</option>
                    ))}
                  </select>
                )}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Employments */}
        <SectionCard icon={Briefcase} title="Employments" subtitle="Optional — one row per company the user belongs to">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] text-slate-400">
              {fields.length === 0 ? 'No employments added yet.' : `${fields.length} employment${fields.length === 1 ? '' : 's'} added.`}
            </p>
            <button
              type="button"
              onClick={() => append({ ...emptyEmployment })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add employment
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="flex items-center gap-2.5 p-4 rounded-lg border border-dashed border-slate-200 dark:border-gray-700 text-[13px] text-slate-400">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              Add a company link to assign employee code, employment email and designation.
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      Employment
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove employment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    <Field label="Company" required error={errors.employments?.[i]?.company_uuid?.message}>
                      <Controller
                        control={control}
                        name={`employments.${i}.company_uuid`}
                        render={({ field }) => (
                          <select className={inputClassFor(!!errors.employments?.[i]?.company_uuid)} {...field}>
                            <option value="">Select company...</option>
                            {companies.map((c) => (
                              <option key={c.uuid} value={c.uuid}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      />
                    </Field>
                    <Field label="Employee code" error={errors.employments?.[i]?.employee_code?.message}>
                      <input
                        className={inputClassFor(!!errors.employments?.[i]?.employee_code)}
                        {...register(`employments.${i}.employee_code`)}
                        placeholder="e.g. EMP-001"
                      />
                    </Field>
                    <Field label="Employment email" error={errors.employments?.[i]?.email?.message}>
                      <input
                        type="email"
                        className={inputClassFor(!!errors.employments?.[i]?.email)}
                        {...register(`employments.${i}.email`)}
                        placeholder="name@company.com"
                      />
                    </Field>
                    <Field label="Employment type" required error={errors.employments?.[i]?.employment_type?.message}>
                      <select className={inputClassFor(!!errors.employments?.[i]?.employment_type)} {...register(`employments.${i}.employment_type`)}>
                        {EMPLOYMENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Designation" error={errors.employments?.[i]?.designation?.message}>
                      <input
                        className={inputClassFor(!!errors.employments?.[i]?.designation)}
                        {...register(`employments.${i}.designation`)}
                        placeholder="e.g. Senior Analyst"
                      />
                    </Field>
                    <Field label="Joining date" error={errors.employments?.[i]?.joining_date?.message}>
                      <input
                        type="date"
                        className={inputClassFor(!!errors.employments?.[i]?.joining_date)}
                        {...register(`employments.${i}.joining_date`)}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </form>

      {/* Form actions */}
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
          form="user-form"
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

// ── Presentational helpers ──

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          {subtitle && <p className="text-[12px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="px-4 sm:px-6 py-5">{children}</div>
    </section>
  );
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {error && <p className="text-[12px] text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </label>
  );
}
