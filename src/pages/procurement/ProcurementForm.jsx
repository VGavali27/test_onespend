import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart, Truck, Plus, Trash2, Loader2 } from 'lucide-react';
import { inputClassFor, FormSection, FormField } from '@/components/ui/form';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { nullIfEmpty, formatCurrency } from '@/utils/format';
import { applyServerErrorsDetailed } from '@/utils/formErrors';
import { useToast } from '@/components/ui/Toast';
import { procurementFormSchema } from '@/validations/procurementSchema';
import { getMyProfile } from '@/services/masterService';

const emptyForm = {
  title: '', company_uuid: '',
  expected_delivery_date: '', notes: '', items: [],
};
const emptyItem = { item_name: '', description: '', category: '', quantity: 1, unit_price: 0 };

/**
 * Shared PI form (Add + Edit). React Hook Form + Zod with a dynamic line-items
 * array. Totals are computed live for display; the backend recomputes + encrypts.
 */
export default function ProcurementForm({
  initialValues = emptyForm,
  isEdit = false,
  onSubmit,
  onCancel,
  submitLabel = isEdit ? 'Save Changes' : 'Create PI',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  const [companies, setCompanies] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(procurementFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const items = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items') || [];

  // Tax is handled at the quotation stage, not on the PI — show the plain total here
  const totals = (watchedItems || []).reduce(
    (acc, it) => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unit_price) || 0;
      acc.total += qty * price;
      return acc;
    },
    { total: 0 },
  );

  useEffect(() => {
    const load = async () => {
      try {
        const prof = await getMyProfile();
        // Company dropdown is scoped to the user's ACTIVE employments (like the expense form)
        const seen = new Set();
        const userCompanies = [];
        for (const e of prof?.data?.data?.employments ?? []) {
          if (e.status === 'ACTIVE' && e.company?.uuid && !seen.has(e.company.uuid)) {
            seen.add(e.company.uuid);
            userCompanies.push({ uuid: e.company.uuid, name: e.company.name });
          }
        }
        setCompanies(userCompanies);
      } catch (e) {
        setOptionsError(e?.response?.data?.message || 'Failed to load options.');
      } finally {
        setOptionsLoading(false);
      }
    };
    load();
  }, []);

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      title: values.title.trim(),
      company_uuid: values.company_uuid,
      expected_delivery_date: nullIfEmpty(values.expected_delivery_date),
      notes: nullIfEmpty(values.notes),
      items: (values.items || []).map((it) => ({
        item_name: it.item_name.trim(),
        description: nullIfEmpty(it.description),
        category: nullIfEmpty(it.category),
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
      })),
    };
    try {
      await onSubmit(payload);
      toast.success(isEdit ? 'Procurement request updated successfully' : 'Procurement request created successfully');
    } catch (err) {
      const { mapped, summary } = applyServerErrorsDetailed(err, setError);
      const baseMessage = err?.response?.data?.message || 'Failed to save. Please try again.';
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
      {optionsError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400">
          {optionsError}
        </div>
      )}

      <form id="procurement-form" noValidate onSubmit={handleFormSubmit} className="space-y-6">
        <FormSection icon={ShoppingCart} title="Purchase Intention" subtitle="Details — vendor is selected later via quotations">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField label="Title" required error={errors.title?.message}>
              <input className={inputClassFor(!!errors.title)} {...register('title')} placeholder="e.g. Office laptops for design team" />
            </FormField>
            <FormField label="Company" required error={errors.company_uuid?.message}>
              <Controller
                control={control}
                name="company_uuid"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={companies.map((c) => ({ value: c.uuid, label: c.name }))}
                    placeholder="Select company..."
                    loading={optionsLoading}
                    error={!!errors.company_uuid}
                  />
                )}
              />
            </FormField>
            <FormField label="Expected delivery" error={errors.expected_delivery_date?.message}>
              <input type="date" className={inputClassFor(!!errors.expected_delivery_date)} {...register('expected_delivery_date')} />
            </FormField>
          </div>
        </FormSection>

        <FormSection icon={Truck} title="Line Items" subtitle="Goods / services requested — totals are computed on save">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] text-slate-400">{items.fields.length} item{items.fields.length === 1 ? '' : 's'}</p>
            <button
              type="button"
              onClick={() => items.append({ ...emptyItem })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add item
            </button>
          </div>

          {items.fields.length === 0 ? (
            <p className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-slate-200 dark:border-gray-700 text-[13px] text-slate-400">
              No items yet — add one to start.
            </p>
          ) : (
            <div className="space-y-3">
              {items.fields.map((f, i) => (
                <div key={f.id} className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Item {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => items.remove(i)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                    <div className="xl:col-span-2">
                      <FormField label="Item name" required error={errors.items?.[i]?.item_name?.message}>
                        <input className={inputClassFor(!!errors.items?.[i]?.item_name)} {...register(`items.${i}.item_name`)} placeholder="Item name" />
                      </FormField>
                    </div>
                    <FormField label="Category" error={errors.items?.[i]?.category?.message}>
                      <input className={inputClassFor(!!errors.items?.[i]?.category)} {...register(`items.${i}.category`)} placeholder="e.g. Hardware" />
                    </FormField>
                    <FormField label="Quantity" error={errors.items?.[i]?.quantity?.message}>
                      <input type="number" min={0} className={inputClassFor(!!errors.items?.[i]?.quantity)} {...register(`items.${i}.quantity`)} />
                    </FormField>
                    <FormField label="Unit price" error={errors.items?.[i]?.unit_price?.message}>
                      <input type="number" min={0} className={inputClassFor(!!errors.items?.[i]?.unit_price)} {...register(`items.${i}.unit_price`)} placeholder="0" />
                    </FormField>
                    <div className="xl:col-span-5">
                      <FormField label="Description" error={errors.items?.[i]?.description?.message}>
                        <input className={inputClassFor(!!errors.items?.[i]?.description)} {...register(`items.${i}.description`)} placeholder="Optional description" />
                      </FormField>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 justify-end border-t border-slate-200 dark:border-gray-700 pt-4">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Total <span>{formatCurrency(totals.total)}</span></p>
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
          form="procurement-form"
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
