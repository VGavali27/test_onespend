import { useRef, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck, Users, MapPin, Landmark, FileText, Paperclip, Plus, Trash2, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import { inputClassFor } from '@/components/ui/form';
import { applyServerErrorsDetailed } from '@/utils/formErrors';
import { useToast } from '@/components/ui/Toast';
import { nullIfEmpty } from '@/utils/format';
import { vendorFormSchema } from '@/validations/vendorSchema';

const VENDOR_TYPES = ['VENDOR', 'SUPPLIER', 'CONTRACTOR', 'SERVICE_PROVIDER'];
const CONTACT_TYPES = ['PRIMARY', 'SALES', 'ACCOUNTS', 'OPS'];
const ADDRESS_TYPES = ['REGISTERED', 'BILLING', 'SHIPPING', 'WAREHOUSE', 'OTHER'];
const ACCOUNT_TYPES = ['PRIMARY', 'OPERATING', 'INTERNATIONAL'];

const emptyForm = {
  name: '', code: '', vendor_type: 'VENDOR', logo_img: '', website: '', gst_number: '',
  pan_number: '', cin_number: '', payment_terms: '', rating: '', status: 'ACTIVE', notes: '',
  contacts: [], addresses: [], bank_accounts: [], documents: [],
};
const emptyContact = { contact_type: 'PRIMARY', salutation: '', first_name: '', last_name: '', designation: '', email: '', phone: '', mobile: '', is_primary: false };
const emptyAddress = { address_type: 'REGISTERED', address_line_1: '', address_line_2: '', city: '', state: '', country: '', pincode: '', is_primary: false };
const emptyBank = { account_type: 'PRIMARY', account_holder_name: '', bank_name: '', bank_branch: '', account_number: '', ifsc: '', swift_code: '', currency_code: 'INR', is_primary: false };

/**
 * Shared Vendor form (Add + Edit). React Hook Form + Zod with nested contacts,
 * addresses and bank accounts (mirrors the backend nested create/update).
 */
export default function VendorForm({
  initialValues = emptyForm,
  isEdit = false,
  onSubmit,
  onCancel,
  submitLabel = isEdit ? 'Save Changes' : 'Create Vendor',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  // onSubmit receives { payload, documents } — documents are Files (new) or { uuid, name, url } (existing)
  const [submitError, setSubmitError] = useState(null);
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const logo = watch('logo_img');
  const contacts = useFieldArray({ control, name: 'contacts' });
  const addresses = useFieldArray({ control, name: 'addresses' });
  const banks = useFieldArray({ control, name: 'bank_accounts' });

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
      vendor_type: values.vendor_type,
      logo_img: nullIfEmpty(values.logo_img),
      website: nullIfEmpty(values.website),
      gst_number: nullIfEmpty(values.gst_number),
      pan_number: nullIfEmpty(values.pan_number),
      cin_number: nullIfEmpty(values.cin_number),
      payment_terms: nullIfEmpty(values.payment_terms),
      rating: values.rating ? Number(values.rating) : null,
      status: values.status,
      notes: nullIfEmpty(values.notes),
      contacts: values.contacts,
      addresses: values.addresses,
      bank_accounts: values.bank_accounts,
    };
    try {
      await onSubmit({ payload, documents: values.documents });
      toast.success(isEdit ? 'Vendor updated successfully' : 'Vendor created successfully');
    } catch (err) {
      const { mapped, summary } = applyServerErrorsDetailed(err, setError);
      const baseMessage = err?.response?.data?.message || 'Failed to save vendor. Please try again.';
      if (mapped) setSubmitError('Please fix the highlighted fields and try again.');
      else if (summary.length > 0) setSubmitError(summary.join('\n'));
      else setSubmitError(baseMessage);
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

      <form id="vendor-form" noValidate onSubmit={handleFormSubmit} className="space-y-6">
        {/* Basic */}
        <SectionCard icon={Truck} title="Vendor Details" subtitle="Identity, logo, tax and payment info">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 sm:w-36 flex justify-center sm:block">
              <ImageUpload
                value={logo}
                onChange={(v) => setValue('logo_img', v)}
                onRemove={() => setValue('logo_img', '')}
                label="Logo"
                shape="square"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Vendor name" required error={errors.name?.message}>
                <input className={inputClassFor(!!errors.name)} {...register('name')} placeholder="e.g. TechMart Solutions" />
              </Field>
              <Field label="Vendor code" required error={errors.code?.message}>
                <input className={inputClassFor(!!errors.code)} {...register('code')} placeholder="e.g. VEN-0001" />
              </Field>
              <Field label="Type" error={errors.vendor_type?.message}>
                <select className={inputClassFor(!!errors.vendor_type)} {...register('vendor_type')}>
                  {VENDOR_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </Field>
              <Field label="Website" error={errors.website?.message}>
                <input className={inputClassFor(!!errors.website)} {...register('website')} placeholder="https://..." />
              </Field>
              <Field label="GST number" error={errors.gst_number?.message}>
                <input className={inputClassFor(!!errors.gst_number)} {...register('gst_number')} placeholder="GSTIN" />
              </Field>
              <Field label="PAN number" error={errors.pan_number?.message}>
                <input className={inputClassFor(!!errors.pan_number)} {...register('pan_number')} placeholder="PAN" />
              </Field>
              <Field label="CIN number" error={errors.cin_number?.message}>
                <input className={inputClassFor(!!errors.cin_number)} {...register('cin_number')} placeholder="CIN" />
              </Field>
              <Field label="Payment terms" error={errors.payment_terms?.message}>
                <input className={inputClassFor(!!errors.payment_terms)} {...register('payment_terms')} placeholder="e.g. NET30" />
              </Field>
              <Field label="Rating (0-5)" error={errors.rating?.message}>
                <input type="number" min={0} max={5} step={0.5} className={inputClassFor(!!errors.rating)} {...register('rating')} placeholder="0" />
              </Field>
              <Field label="Status" error={errors.status?.message}>
                <select className={inputClassFor(!!errors.status)} {...register('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </Field>
              <div className="sm:col-span-2 xl:col-span-3">
                <Field label="Notes" error={errors.notes?.message}>
                  <textarea rows={2} className={inputClassFor(!!errors.notes)} {...register('notes')} placeholder="Optional notes" />
                </Field>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Contacts */}
        <SectionCard icon={Users} title="Contacts" subtitle="Optional — one or more contact persons">
          <ChildRows label="Add contact" onAdd={() => contacts.append({ ...emptyContact })} count={contacts.fields.length}>
            {contacts.fields.map((f, i) => (
              <ChildRow key={f.id} title={`Contact ${i + 1}`} onRemove={() => contacts.remove(i)}>
                <Field label="Type">
                  <select className={inputClassFor(false)} {...register(`contacts.${i}.contact_type`)}>
                    {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </Field>
                <Field label="First name" required error={errors.contacts?.[i]?.first_name?.message}>
                  <input className={inputClassFor(!!errors.contacts?.[i]?.first_name)} {...register(`contacts.${i}.first_name`)} placeholder="First name" />
                </Field>
                <Field label="Last name"><input className={inputClassFor(false)} {...register(`contacts.${i}.last_name`)} /></Field>
                <Field label="Designation"><input className={inputClassFor(false)} {...register(`contacts.${i}.designation`)} /></Field>
                <Field label="Email" error={errors.contacts?.[i]?.email?.message}>
                  <input type="email" className={inputClassFor(!!errors.contacts?.[i]?.email)} {...register(`contacts.${i}.email`)} placeholder="name@vendor.com" />
                </Field>
                <Field label="Phone"><input className={inputClassFor(false)} {...register(`contacts.${i}.phone`)} /></Field>
                <Field label="Mobile"><input className={inputClassFor(false)} {...register(`contacts.${i}.mobile`)} /></Field>
                <CheckboxField label="Primary contact">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" {...register(`contacts.${i}.is_primary`)} />
                </CheckboxField>
              </ChildRow>
            ))}
          </ChildRows>
        </SectionCard>

        {/* Addresses */}
        <SectionCard icon={MapPin} title="Addresses" subtitle="Optional — registered, billing, shipping, etc.">
          <ChildRows label="Add address" onAdd={() => addresses.append({ ...emptyAddress })} count={addresses.fields.length}>
            {addresses.fields.map((f, i) => (
              <ChildRow key={f.id} title={`Address ${i + 1}`} onRemove={() => addresses.remove(i)}>
                <Field label="Type">
                  <select className={inputClassFor(false)} {...register(`addresses.${i}.address_type`)}>
                    {ADDRESS_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </Field>
                <Field label="Address line 1"><input className={inputClassFor(false)} {...register(`addresses.${i}.address_line_1`)} /></Field>
                <Field label="Address line 2"><input className={inputClassFor(false)} {...register(`addresses.${i}.address_line_2`)} /></Field>
                <Field label="City"><input className={inputClassFor(false)} {...register(`addresses.${i}.city`)} /></Field>
                <Field label="State"><input className={inputClassFor(false)} {...register(`addresses.${i}.state`)} /></Field>
                <Field label="Country"><input className={inputClassFor(false)} {...register(`addresses.${i}.country`)} /></Field>
                <Field label="Pincode"><input className={inputClassFor(false)} {...register(`addresses.${i}.pincode`)} /></Field>
                <CheckboxField label="Primary address">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" {...register(`addresses.${i}.is_primary`)} />
                </CheckboxField>
              </ChildRow>
            ))}
          </ChildRows>
        </SectionCard>

        {/* Bank accounts */}
        <SectionCard icon={Landmark} title="Bank Accounts" subtitle="Optional — one or more payment accounts">
          <ChildRows label="Add bank account" onAdd={() => banks.append({ ...emptyBank })} count={banks.fields.length}>
            {banks.fields.map((f, i) => (
              <ChildRow key={f.id} title={`Bank ${i + 1}`} onRemove={() => banks.remove(i)}>
                <Field label="Type">
                  <select className={inputClassFor(false)} {...register(`bank_accounts.${i}.account_type`)}>
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </select>
                </Field>
                <Field label="Account holder"><input className={inputClassFor(false)} {...register(`bank_accounts.${i}.account_holder_name`)} /></Field>
                <Field label="Bank name"><input className={inputClassFor(false)} {...register(`bank_accounts.${i}.bank_name`)} /></Field>
                <Field label="Branch"><input className={inputClassFor(false)} {...register(`bank_accounts.${i}.bank_branch`)} /></Field>
                <Field label="Account number"><input className={inputClassFor(false)} {...register(`bank_accounts.${i}.account_number`)} /></Field>
                <Field label="IFSC"><input className={inputClassFor(false)} {...register(`bank_accounts.${i}.ifsc`)} /></Field>
                <Field label="SWIFT code"><input className={inputClassFor(false)} {...register(`bank_accounts.${i}.swift_code`)} /></Field>
                <Field label="Currency"><input className={inputClassFor(false)} {...register(`bank_accounts.${i}.currency_code`)} placeholder="INR" /></Field>
                <CheckboxField label="Primary account">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" {...register(`bank_accounts.${i}.is_primary`)} />
                </CheckboxField>
              </ChildRow>
            ))}
          </ChildRows>
        </SectionCard>

        {/* Documents */}
        <SectionCard icon={FileText} title="Documents" subtitle="Optional — GST certificates, PAN, agreements, etc.">
          <DocUpload control={control} setValue={setValue} path="documents" />
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
          form="vendor-form"
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

// File picker for vendor documents — stores File objects (new picks) and keeps
// existing { uuid, name, url } entries (from editing) so uploads/deletes happen on save.
function DocUpload({ control, setValue, path }) {
  const docs = useWatch({ control, name: path }) || [];
  const fileRef = useRef(null);

  const addFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setValue(path, [...docs, ...files], { shouldDirty: true });
    e.target.value = '';
  };
  const remove = (i) => setValue(path, docs.filter((_, idx) => idx !== i), { shouldDirty: true });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-slate-400">{docs.length} file{docs.length === 1 ? '' : 's'} attached</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add file
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={addFiles} />
      </div>
      {docs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {docs.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[11px] text-slate-600 dark:text-slate-300">
              <Paperclip className="h-3 w-3 text-slate-400" />
              {a.name || a.url}
              <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500" title="Remove">×</button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 mt-1">No documents attached</p>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
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

function CheckboxField({ label, children }) {
  return (
    <label className="flex items-center gap-2 pt-6">
      {children}
      <span className="text-[13px] text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

function ChildRows({ label, onAdd, count, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-slate-400">
          {count === 0 ? 'No rows added yet.' : `${count} row${count === 1 ? '' : 's'} added.`}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {label}
        </button>
      </div>
      {count === 0 ? (
        <p className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-slate-200 dark:border-gray-700 text-[13px] text-slate-400">
          No rows yet — add one to start.
        </p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}

function ChildRow({ title, onRemove, children }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <button type="button" onClick={onRemove} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}
