import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Mail, MapPin, FileText, Loader2 } from 'lucide-react';
import { getGroupOptions } from '@/services/masterService';
import { companyFormSchema } from '@/validations/companySchema';
import { inputClassFor, FormSection, FormField } from '@/components/ui/form';
import ImageUpload from '@/components/ui/ImageUpload';

const emptyForm = {
  name: '',
  code: '',
  group_uuid: '',
  status: 'ACTIVE',
  logo_img: '',
  email: '',
  phone: '',
  website: '',
  gst_number: '',
  pan_number: '',
  cin_number: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
};

/**
 * Shared Company form (Add + Edit). React Hook Form + Zod.
 * Fields mirror backend src/modules/company/company.validation.js.
 */
export default function CompanyForm({
  initialValues = emptyForm,
  isEdit = false,
  onSubmit,
  onCancel,
  submitLabel = isEdit ? 'Save Changes' : 'Create Company',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  const [groups, setGroups] = useState([]);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companyFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const logoImage = watch('logo_img');

  // Load groups for the dropdown (async → Company field uses Controller so the prefill sticks)
  useEffect(() => {
    const load = async () => {
      try {
        const g = await getGroupOptions();
        setGroups(g.data?.data ?? []);
      } catch {
        // non-fatal
      }
    };
    load();
  }, []);

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
      group_uuid: values.group_uuid,
      status: values.status,
      logo_img: values.logo_img.trim() || null,
      email: values.email.trim() || null,
      phone: values.phone.trim() || null,
      website: values.website.trim() || null,
      gst_number: values.gst_number.trim() || null,
      pan_number: values.pan_number.trim() || null,
      cin_number: values.cin_number.trim() || null,
      address_line_1: values.address_line_1.trim() || null,
      address_line_2: values.address_line_2.trim() || null,
      city: values.city.trim() || null,
      state: values.state.trim() || null,
      country: values.country.trim() || null,
      pincode: values.pincode.trim() || null,
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
        setSubmitError(err?.response?.data?.message || 'Failed to save company. Please try again.');
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

      <form id="company-form" noValidate onSubmit={handleFormSubmit} className="space-y-6">
        <FormSection icon={Building2} title="Identity" subtitle="Basic company identification">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 sm:w-36 flex justify-center sm:block">
              <ImageUpload
                shape="square"
                icon={Building2}
                value={logoImage}
                onChange={(v) => setValue('logo_img', v, { shouldValidate: true })}
                onRemove={() => setValue('logo_img', '', { shouldValidate: true })}
                label="Company logo"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Company name" required error={errors.name?.message}>
              <input className={inputClassFor(!!errors.name)} {...register('name')} placeholder="e.g. Acme Corp" />
            </FormField>
            <FormField label="Code" required error={errors.code?.message}>
              <input className={inputClassFor(!!errors.code)} {...register('code')} placeholder="e.g. ACME" />
            </FormField>
            <FormField label="Group" required error={errors.group_uuid?.message}>
              <Controller
                control={control}
                name="group_uuid"
                render={({ field }) => (
                  <select className={inputClassFor(!!errors.group_uuid)} {...field}>
                    <option value="">Select group...</option>
                    {groups.map((g) => (
                      <option key={g.uuid} value={g.uuid}>{g.name}</option>
                    ))}
                  </select>
                )}
              />
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
            </div>
          </div>
        </FormSection>

        <FormSection icon={Mail} title="Contact" subtitle="Public contact details">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField label="Email" error={errors.email?.message}>
              <input type="email" className={inputClassFor(!!errors.email)} {...register('email')} placeholder="contact@company.com" />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <input className={inputClassFor(!!errors.phone)} {...register('phone')} placeholder="+91 90000 00000" />
            </FormField>
            <FormField label="Website" error={errors.website?.message}>
              <input className={inputClassFor(!!errors.website)} {...register('website')} placeholder="https://company.com" />
            </FormField>
          </div>
        </FormSection>

        <FormSection icon={MapPin} title="Address" subtitle="Registered / head office address">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Address line 1" error={errors.address_line_1?.message}>
              <input className={inputClassFor(!!errors.address_line_1)} {...register('address_line_1')} placeholder="Street, building" />
            </FormField>
            <FormField label="Address line 2" error={errors.address_line_2?.message}>
              <input className={inputClassFor(!!errors.address_line_2)} {...register('address_line_2')} placeholder="Area, locality" />
            </FormField>
            <FormField label="City" error={errors.city?.message}>
              <input className={inputClassFor(!!errors.city)} {...register('city')} placeholder="City" />
            </FormField>
            <FormField label="State" error={errors.state?.message}>
              <input className={inputClassFor(!!errors.state)} {...register('state')} placeholder="State" />
            </FormField>
            <FormField label="Country" error={errors.country?.message}>
              <input className={inputClassFor(!!errors.country)} {...register('country')} placeholder="Country" />
            </FormField>
            <FormField label="Pincode" error={errors.pincode?.message}>
              <input className={inputClassFor(!!errors.pincode)} {...register('pincode')} placeholder="e.g. 400001" />
            </FormField>
          </div>
        </FormSection>

        <FormSection icon={FileText} title="Tax & Registration" subtitle="Tax / registration identifiers">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField label="GST number" error={errors.gst_number?.message}>
              <input className={inputClassFor(!!errors.gst_number)} {...register('gst_number')} placeholder="GSTIN" />
            </FormField>
            <FormField label="PAN number" error={errors.pan_number?.message}>
              <input className={inputClassFor(!!errors.pan_number)} {...register('pan_number')} placeholder="PAN" />
            </FormField>
            <FormField label="CIN number" error={errors.cin_number?.message}>
              <input className={inputClassFor(!!errors.cin_number)} {...register('cin_number')} placeholder="CIN" />
            </FormField>
          </div>
        </FormSection>
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
          form="company-form"
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