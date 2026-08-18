import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Wallet, Plane, MapPin, BedDouble, Coins, Bus, MoreHorizontal,
  ReceiptText, Paperclip, Plus, Trash2, Loader2,
} from 'lucide-react';
import { expenseFormSchema } from '@/validations/expenseSchema';
import { inputClassFor, FormSection, FormField, SelectInput } from '@/components/ui/form';
import { DateField } from '@/components/ui/DatePicker';
import { nullIfEmpty } from '@/utils/format';
import { applyServerErrorsDetailed } from '@/utils/formErrors';
import { useToast } from '@/components/ui/Toast';
import { categoryApi } from '@/services/financeService';
import { getMyProfile } from '@/services/masterService';
import { uploadImage } from '@/services/uploadService';

const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'NETBANKING', 'OTHER'];

const emptyForm = {
  module: '', // set from the selected category (travel | reimbursement | '')
  category: '',
  title: '',
  company: '',
  remarks: '',
  travel: {
    travel_type: 'DOMESTIC',
    purpose: '',
    travel_start_date: '',
    travel_end_date: '',
    total_travellers: 1,
    notes: '',
    segments: [],
    accommodations: [],
    forex: [],
    localTransports: [],
    miscExpenses: [],
  },
  reimbursement: {
    advance_amount: '',
    advance_date: '',
    payment_method: 'CASH',
    remarks: '',
    items: [],
  },
};

// Empty rows match the backend child schemas (expense.validation.js)
const emptySegment = { travel_mode: 'FLIGHT', from_location: '', to_location: '', departure_datetime: '', arrival_datetime: '', estimated_amount: '', attachments: [] };
const emptyAccommodation = { accommodation_type: 'HOTEL', city: '', property_name: '', check_in: '', check_out: '', estimated_amount: '', attachments: [] };
const emptyForex = { currency_code: 'USD', exchange_rate: '', estimated_foreign_amount: '', estimated_amount: '', attachments: [] };
const emptyLocalTransport = { transport_type: 'TAXI', from_location: '', to_location: '', travel_datetime: '', estimated_amount: '', attachments: [] };
const emptyMisc = { expense_type: '', expense_date: '', vendor_name: '', estimated_amount: '', attachments: [] };
const emptyReimbursementItem = { expense_date: '', description: '', bill_number: '', expense_type: '', total_amount: '', attachments: [] };

// Upload newly-picked File attachments; keep already-uploaded { name, url } as-is.
const prepareAttachments = async (attachments = []) => {
  const out = [];
  for (const a of attachments) {
    if (a instanceof File) {
      const { data } = await uploadImage(a);
      out.push({
        url: data?.data?.url,
        original_file_name: a.name,
        file_size: a.size,
        mime_type: a.type,
        file_extension: (a.name.split('.').pop() || '').toLowerCase() || null,
      });
    } else if (a?.url) {
      out.push({ url: a.url, original_file_name: a.name });
    }
  }
  return out;
};

// Translate a backend error field path (e.g. 'forex.0.currency_code') into the RHF
// form path (e.g. 'travel.forex.0.currency_code') so errors can be shown on the field.
const translateErrorField = (field) => {
  if (!field) return null;
  if (/^(segments|accommodations|forex|local_transports|misc_expenses)\./.test(field)) return `travel.${field}`;
  if (field === 'advance_amount' || field === 'advance_date' || field === 'payment_method' || field.startsWith('items.')) return `reimbursement.${field}`;
  if (field === 'category_uuid') return 'category';
  if (field === 'company_uuid') return 'company';
  return field; // title, remarks, ...
};


/**
 * Create Expense form wired to the real API (POST /expenses). Category and
 * Company come from /expense-categories and /companies/options. Amounts on the
 * expense itself are not sent — the backend computes them.
 */
export default function ExpenseForm({
  requestedByUserUuid,
  onSubmit,
  onCancel,
  initialValues,
  isEdit = false,
  submitLabel = isEdit ? 'Save Changes' : 'Create Expense',
  savingLabel = isEdit ? 'Saving...' : 'Creating...',
}) {
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [optionsError, setOptionsError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: initialValues || emptyForm,
    mode: 'onBlur',
  });

  const category = watch('category');
  const selectedCategory = categories.find((c) => c.uuid === category);
  const isTravel = selectedCategory?.module === 'travel';
  const isReimbursement = selectedCategory?.module === 'reimbursement';

  // Drive the hidden `module` field so the shared zod schema validates only the
  // fields relevant to the selected category (travel XOR reimbursement).
  useEffect(() => {
    setValue('module', selectedCategory?.module || '');
  }, [selectedCategory?.module, setValue]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, prof] = await Promise.all([categoryApi.list(), getMyProfile()]);
        // Filter out procurement module categories from the dropdown
        const allCategories = cats.data?.data ?? [];
        setCategories(allCategories.filter((c) => c.module !== 'procurement'));
        // Company dropdown is scoped to the companies the logged-in user is employed in
        const seen = new Set();
        const companies = [];
        for (const e of prof.data?.data?.employments ?? []) {
          if (e.company?.uuid && !seen.has(e.company.uuid)) {
            seen.add(e.company.uuid);
            companies.push({ uuid: e.company.uuid, name: e.company.name });
          }
        }
        setCompanies(companies);
      } catch (e) {
        setOptionsError(e?.response?.data?.message || 'Failed to load options.');
      }
    };
    load();
  }, []);

  const segments = useFieldArray({ control, name: 'travel.segments' });
  const accommodations = useFieldArray({ control, name: 'travel.accommodations' });
  const forex = useFieldArray({ control, name: 'travel.forex' });
  const localTransports = useFieldArray({ control, name: 'travel.localTransports' });
  const misc = useFieldArray({ control, name: 'travel.miscExpenses' });
  const reimbItems = useFieldArray({ control, name: 'reimbursement.items' });

  // Mouse-wheel over a focused number input changes its value (browser default) —
  // blur it instead so scrolling the page never edits an amount by accident.
  const preventNumberScroll = (e) => {
    if (e.target instanceof HTMLInputElement && e.target.type === 'number') e.target.blur();
  };

  // Forex: estimated_amount = exchange_rate × foreign amount (auto-filled).
  const forexCalcOnChange = (index, changedField) => (e) => {
    const changed = Number(e.target.value) || 0;
    const otherField = changedField === 'exchange_rate' ? 'estimated_foreign_amount' : 'exchange_rate';
    const other = Number(getValues(`travel.forex.${index}.${otherField}`)) || 0;
    setValue(
      `travel.forex.${index}.estimated_amount`,
      changed && other ? String(changed * other) : '',
      { shouldValidate: false }
    );
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (!isEdit && !requestedByUserUuid) {
      setSubmitError('You must be signed in to create an expense.');
      return;
    }
    const base = {
      category_uuid: values.category,
      company_uuid: values.company,
      // The creator is fixed at creation time — never changed on edit
      ...(isEdit ? {} : { requested_by_user_uuid: requestedByUserUuid }),
      title: values.title.trim(),
      remarks: nullIfEmpty(values.remarks),
    };
    const payload = isTravel
      ? {
          ...base,
          travel_type: values.travel.travel_type,
          purpose: values.travel.purpose.trim(),
          travel_start_date: values.travel.travel_start_date,
          travel_end_date: values.travel.travel_end_date,
          total_travellers: values.travel.total_travellers,
          notes: nullIfEmpty(values.travel.notes),
          segments: await Promise.all(values.travel.segments.map(async (s) => ({ ...s, attachments: await prepareAttachments(s.attachments) }))),
          accommodations: await Promise.all(values.travel.accommodations.map(async (a) => ({ ...a, attachments: await prepareAttachments(a.attachments) }))),
          local_transports: await Promise.all(values.travel.localTransports.map(async (lt) => ({ ...lt, attachments: await prepareAttachments(lt.attachments) }))),
          forex: await Promise.all(values.travel.forex.map(async (f) => ({ ...f, attachments: await prepareAttachments(f.attachments) }))),
          misc_expenses: await Promise.all(values.travel.miscExpenses.map(async (m) => ({ ...m, attachments: await prepareAttachments(m.attachments) }))),
        }
      : isReimbursement
        ? {
            ...base,
            advance_amount: values.reimbursement.advance_amount || null,
            advance_date: values.reimbursement.advance_date || null,
            payment_method: values.reimbursement.payment_method,
            items: await Promise.all(values.reimbursement.items.map(async (it) => ({
              expense_date: it.expense_date || null,
              description: it.description.trim(),
              bill_number: nullIfEmpty(it.bill_number),
              expense_type: nullIfEmpty(it.expense_type),
              total_amount: it.total_amount,
              attachments: await prepareAttachments(it.attachments),
            }))),
          }
        : base;

    try {
      await onSubmit(payload);
    } catch (err) {
      const { mapped, summary } = applyServerErrorsDetailed(err, setError, translateErrorField);
      const baseMessage = err?.response?.data?.message || 'Failed to create expense. Please try again.';
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
      {optionsError && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 text-[13px] text-amber-700 dark:text-amber-400">
          {optionsError} — try refreshing.
        </div>
      )}
      {submitError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400 whitespace-pre-line">
          {submitError}
        </div>
      )}

      <form id="expense-form" noValidate onSubmit={handleFormSubmit} className="space-y-6" onWheel={preventNumberScroll}>
        <input type="hidden" {...register('module')} />
        {/* Basic */}
        <FormSection icon={Wallet} title="Expense Details" subtitle="Basic expense information">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <FormField label="Category" required error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <SelectInput error={!!errors.category} {...field}>
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.uuid} value={c.uuid}>{c.name}</option>
                    ))}
                  </SelectInput>
                )}
              />
            </FormField>
            <FormField label="Title" required error={errors.title?.message}>
              <input className={inputClassFor(!!errors.title)} {...register('title')} placeholder="e.g. Business trip to Mumbai" />
            </FormField>
            <FormField label="Company" required error={errors.company?.message}>
              <Controller
                control={control}
                name="company"
                render={({ field }) => (
                  <SelectInput error={!!errors.company} {...field}>
                    <option value="">Select company...</option>
                    {companies.map((c) => (
                      <option key={c.uuid} value={c.uuid}>{c.name}</option>
                    ))}
                  </SelectInput>
                )}
              />
            </FormField>
            <div className="sm:col-span-2 xl:col-span-3">
              <FormField label="Remarks" error={errors.remarks?.message}>
                <textarea rows={2} className={inputClassFor(!!errors.remarks)} {...register('remarks')} placeholder="Optional remarks" />
              </FormField>
            </div>
          </div>
        </FormSection>

        {/* Travel breakdown */}
        {isTravel && (
          <>
            <FormSection icon={Plane} title="Travel Details" subtitle="Trip overview">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <FormField label="Travel type" error={errors.travel?.travel_type?.message}>
                  <Controller
                    control={control}
                    name="travel.travel_type"
                    render={({ field }) => (
                      <SelectInput error={!!errors.travel?.travel_type} {...field}>
                        <option value="DOMESTIC">Domestic</option>
                        <option value="INTERNATIONAL">International</option>
                      </SelectInput>
                    )}
                  />
                </FormField>
                <FormField label="Purpose" required error={errors.travel?.purpose?.message}>
                  <input className={inputClassFor(!!errors.travel?.purpose)} {...register('travel.purpose')} placeholder="e.g. Client meeting" />
                </FormField>
                <DateField control={control} name="travel.travel_start_date" label="Start date" required error={errors.travel?.travel_start_date?.message} />
                <DateField control={control} name="travel.travel_end_date" label="End date" required error={errors.travel?.travel_end_date?.message} />
                <FormField label="Total travellers" error={errors.travel?.total_travellers?.message}>
                  <input type="number" min={1} className={inputClassFor(!!errors.travel?.total_travellers)} {...register('travel.total_travellers')} />
                </FormField>
                <div className="sm:col-span-2 xl:col-span-3">
                  <FormField label="Notes" error={errors.travel?.notes?.message}>
                    <textarea rows={2} className={inputClassFor(!!errors.travel?.notes)} {...register('travel.notes')} placeholder="Optional notes" />
                  </FormField>
                </div>
              </div>
            </FormSection>

            <ArraySection icon={Plane} title="Segments" addLabel="Add segment" onAdd={() => segments.append({ ...emptySegment })}>
              {segments.fields.map((f, i) => (
                <ArrayRow key={f.id} title={`Segment ${i + 1}`} onRemove={() => segments.remove(i)}
                  footer={<RowAttachments path={`travel.segments.${i}.attachments`} control={control} setValue={setValue} />}>
                  <FieldIn label="Mode" required error={errors.travel?.segments?.[i]?.travel_mode?.message}>
                    <SelectInput error={!!errors.travel?.segments?.[i]?.travel_mode} {...register(`travel.segments.${i}.travel_mode`)}>
                      <option value="FLIGHT">Flight</option><option value="TRAIN">Train</option><option value="BUS">Bus</option><option value="TAXI">Taxi</option></SelectInput>
                  </FieldIn>
                  <FieldIn label="From" required error={errors.travel?.segments?.[i]?.from_location?.message}>
                    <input className={inputClassFor(!!errors.travel?.segments?.[i]?.from_location)} {...register(`travel.segments.${i}.from_location`)} placeholder="Origin" />
                  </FieldIn>
                  <FieldIn label="To" required error={errors.travel?.segments?.[i]?.to_location?.message}>
                    <input className={inputClassFor(!!errors.travel?.segments?.[i]?.to_location)} {...register(`travel.segments.${i}.to_location`)} placeholder="Destination" />
                  </FieldIn>
                  <DateField control={control} name={`travel.segments.${i}.departure_datetime`} label="Departure" showTimeSelect required error={errors.travel?.segments?.[i]?.departure_datetime?.message} />
                  <DateField control={control} name={`travel.segments.${i}.arrival_datetime`} label="Arrival" showTimeSelect required error={errors.travel?.segments?.[i]?.arrival_datetime?.message} />
                  <FieldIn label="Estimated (₹)" required error={errors.travel?.segments?.[i]?.estimated_amount?.message}>
                    <input type="number" className={inputClassFor(!!errors.travel?.segments?.[i]?.estimated_amount)} {...register(`travel.segments.${i}.estimated_amount`)} placeholder="0" />
                  </FieldIn>
                </ArrayRow>
              ))}
            </ArraySection>

            <ArraySection icon={BedDouble} title="Accommodations" addLabel="Add accommodation" onAdd={() => accommodations.append({ ...emptyAccommodation })}>
              {accommodations.fields.map((f, i) => (
                <ArrayRow key={f.id} title={`Stay ${i + 1}`} onRemove={() => accommodations.remove(i)}
                  footer={<RowAttachments path={`travel.accommodations.${i}.attachments`} control={control} setValue={setValue} />}>
                  <FieldIn label="Type" required error={errors.travel?.accommodations?.[i]?.accommodation_type?.message}>
                    <SelectInput error={!!errors.travel?.accommodations?.[i]?.accommodation_type} {...register(`travel.accommodations.${i}.accommodation_type`)}>
                      <option value="HOTEL">Hotel</option><option value="APARTMENT">Apartment</option><option value="GUESTHOUSE">Guesthouse</option><option value="OTHER">Other</option></SelectInput>
                  </FieldIn>
                  <FieldIn label="City" required error={errors.travel?.accommodations?.[i]?.city?.message}>
                    <input className={inputClassFor(!!errors.travel?.accommodations?.[i]?.city)} {...register(`travel.accommodations.${i}.city`)} placeholder="City" />
                  </FieldIn>
                  <FieldIn label="Property"><input className={inputClassFor(false)} {...register(`travel.accommodations.${i}.property_name`)} placeholder="Property name" /></FieldIn>
                  <DateField control={control} name={`travel.accommodations.${i}.check_in`} label="Check-in" required error={errors.travel?.accommodations?.[i]?.check_in?.message} />
                  <DateField control={control} name={`travel.accommodations.${i}.check_out`} label="Check-out" required error={errors.travel?.accommodations?.[i]?.check_out?.message} />
                  <FieldIn label="Estimated (₹)" required error={errors.travel?.accommodations?.[i]?.estimated_amount?.message}>
                    <input type="number" className={inputClassFor(!!errors.travel?.accommodations?.[i]?.estimated_amount)} {...register(`travel.accommodations.${i}.estimated_amount`)} placeholder="0" />
                  </FieldIn>
                </ArrayRow>
              ))}
            </ArraySection>

            <ArraySection icon={Coins} title="Forex" addLabel="Add forex" onAdd={() => forex.append({ ...emptyForex })}>
              {forex.fields.map((f, i) => (
                <ArrayRow key={f.id} title={`Forex ${i + 1}`} onRemove={() => forex.remove(i)} cols="sm:grid-cols-2 xl:grid-cols-4"
                  footer={<RowAttachments path={`travel.forex.${i}.attachments`} control={control} setValue={setValue} />}>
                  <FieldIn label="Currency" required error={errors.travel?.forex?.[i]?.currency_code?.message}>
                    <input className={inputClassFor(!!errors.travel?.forex?.[i]?.currency_code)} {...register(`travel.forex.${i}.currency_code`)} placeholder="USD" />
                  </FieldIn>
                  <FieldIn label="Foreign amount" required error={errors.travel?.forex?.[i]?.estimated_foreign_amount?.message}>
                    <input type="number" className={inputClassFor(!!errors.travel?.forex?.[i]?.estimated_foreign_amount)} {...register(`travel.forex.${i}.estimated_foreign_amount`, { onChange: forexCalcOnChange(i, 'estimated_foreign_amount') })} placeholder="0" />
                  </FieldIn>
                  <FieldIn label="Exchange rate" required error={errors.travel?.forex?.[i]?.exchange_rate?.message}>
                    <input type="number" className={inputClassFor(!!errors.travel?.forex?.[i]?.exchange_rate)} {...register(`travel.forex.${i}.exchange_rate`, { onChange: forexCalcOnChange(i, 'exchange_rate') })} placeholder="0" />
                  </FieldIn>
                  <FieldIn label="Estimated (₹)" error={errors.travel?.forex?.[i]?.estimated_amount?.message}>
                    <input type="number" readOnly className={inputClassFor(!!errors.travel?.forex?.[i]?.estimated_amount)} {...register(`travel.forex.${i}.estimated_amount`)} placeholder="Auto" />
                  </FieldIn>
                </ArrayRow>
              ))}
            </ArraySection>

            <ArraySection icon={Bus} title="Local Transport" addLabel="Add transport" onAdd={() => localTransports.append({ ...emptyLocalTransport })}>
              {localTransports.fields.map((f, i) => (
                <ArrayRow key={f.id} title={`Transport ${i + 1}`} onRemove={() => localTransports.remove(i)}
                  footer={<RowAttachments path={`travel.localTransports.${i}.attachments`} control={control} setValue={setValue} />}>
                  <FieldIn label="Type" required error={errors.travel?.localTransports?.[i]?.transport_type?.message}>
                    <SelectInput error={!!errors.travel?.localTransports?.[i]?.transport_type} {...register(`travel.localTransports.${i}.transport_type`)}>
                      <option value="TAXI">Taxi</option><option value="BUS">Bus</option><option value="TRAIN">Train</option><option value="METRO">Metro</option></SelectInput>
                  </FieldIn>
                  <FieldIn label="From" required error={errors.travel?.localTransports?.[i]?.from_location?.message}>
                    <input className={inputClassFor(!!errors.travel?.localTransports?.[i]?.from_location)} {...register(`travel.localTransports.${i}.from_location`)} placeholder="Origin" />
                  </FieldIn>
                  <FieldIn label="To" required error={errors.travel?.localTransports?.[i]?.to_location?.message}>
                    <input className={inputClassFor(!!errors.travel?.localTransports?.[i]?.to_location)} {...register(`travel.localTransports.${i}.to_location`)} placeholder="Destination" />
                  </FieldIn>
                  <DateField control={control} name={`travel.localTransports.${i}.travel_datetime`} label="Travel time" showTimeSelect required error={errors.travel?.localTransports?.[i]?.travel_datetime?.message} />
                  <FieldIn label="Estimated (₹)" required error={errors.travel?.localTransports?.[i]?.estimated_amount?.message}>
                    <input type="number" className={inputClassFor(!!errors.travel?.localTransports?.[i]?.estimated_amount)} {...register(`travel.localTransports.${i}.estimated_amount`)} placeholder="0" />
                  </FieldIn>
                </ArrayRow>
              ))}
            </ArraySection>

            <ArraySection icon={MoreHorizontal} title="Miscellaneous" addLabel="Add item" onAdd={() => misc.append({ ...emptyMisc })}>
              {misc.fields.map((f, i) => (
                <ArrayRow key={f.id} title={`Item ${i + 1}`} onRemove={() => misc.remove(i)}
                  footer={<RowAttachments path={`travel.miscExpenses.${i}.attachments`} control={control} setValue={setValue} />}>
                  <FieldIn label="Type" required error={errors.travel?.miscExpenses?.[i]?.expense_type?.message}>
                    <input className={inputClassFor(!!errors.travel?.miscExpenses?.[i]?.expense_type)} {...register(`travel.miscExpenses.${i}.expense_type`)} placeholder="e.g. Meals" />
                  </FieldIn>
                  <DateField control={control} name={`travel.miscExpenses.${i}.expense_date`} label="Date" required error={errors.travel?.miscExpenses?.[i]?.expense_date?.message} />
                  <FieldIn label="Vendor"><input className={inputClassFor(false)} {...register(`travel.miscExpenses.${i}.vendor_name`)} placeholder="Vendor" /></FieldIn>
                  <FieldIn label="Estimated (₹)" required error={errors.travel?.miscExpenses?.[i]?.estimated_amount?.message}>
                    <input type="number" className={inputClassFor(!!errors.travel?.miscExpenses?.[i]?.estimated_amount)} {...register(`travel.miscExpenses.${i}.estimated_amount`)} placeholder="0" />
                  </FieldIn>
                </ArrayRow>
              ))}
            </ArraySection>
          </>
        )}

        {/* Reimbursement breakdown */}
        {isReimbursement && (
          <>
            <FormSection icon={ReceiptText} title="Reimbursement" subtitle="Out-of-pocket expenses the employee is claiming back">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <FormField label="Advance received (₹)" error={errors.reimbursement?.advance_amount?.message}>
                  <input type="number" className={inputClassFor(!!errors.reimbursement?.advance_amount)} {...register('reimbursement.advance_amount')} placeholder="0" />
                </FormField>
                <DateField control={control} name="reimbursement.advance_date" label="Advance date" required error={errors.reimbursement?.advance_date?.message} />
                <FormField label="Payment method" error={errors.reimbursement?.payment_method?.message}>
                  <Controller
                    control={control}
                    name="reimbursement.payment_method"
                    render={({ field }) => (
                      <SelectInput error={!!errors.reimbursement?.payment_method} {...field}>
                        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
                      </SelectInput>
                    )}
                  />
                </FormField>
                <FieldIn label="Remarks">
                  <input className={inputClassFor(false)} {...register('reimbursement.remarks')} placeholder="Optional remarks" />
                </FieldIn>
              </div>
            </FormSection>

            <ArraySection icon={ReceiptText} title="Reimbursement Items" addLabel="Add item" onAdd={() => reimbItems.append({ ...emptyReimbursementItem })}>
              {reimbItems.fields.map((f, i) => (
                <ArrayRow key={f.id} title={`Item ${i + 1}`} onRemove={() => reimbItems.remove(i)}
                  footer={<RowAttachments path={`reimbursement.items.${i}.attachments`} control={control} setValue={setValue} />}>
                  <DateField control={control} name={`reimbursement.items.${i}.expense_date`} label="Date" required error={errors.reimbursement?.items?.[i]?.expense_date?.message} />
                  <FieldIn label="Description" required error={errors.reimbursement?.items?.[i]?.description?.message}>
                    <input className={inputClassFor(!!errors.reimbursement?.items?.[i]?.description)} {...register(`reimbursement.items.${i}.description`)} placeholder="e.g. Software license" />
                  </FieldIn>
                  <FieldIn label="Bill no."><input className={inputClassFor(false)} {...register(`reimbursement.items.${i}.bill_number`)} placeholder="e.g. INV-101" /></FieldIn>
                  <FieldIn label="Exps. type"><input className={inputClassFor(false)} {...register(`reimbursement.items.${i}.expense_type`)} placeholder="e.g. Software" /></FieldIn>
                  <FieldIn label="Total (₹)" required error={errors.reimbursement?.items?.[i]?.total_amount?.message}>
                    <input type="number" className={inputClassFor(!!errors.reimbursement?.items?.[i]?.total_amount)} {...register(`reimbursement.items.${i}.total_amount`)} placeholder="0" />
                  </FieldIn>
                </ArrayRow>
              ))}
            </ArraySection>
          </>
        )}
      </form>

      {/* Actions */}
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
          form="expense-form"
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

// ── Sub-section helpers ──

function ArraySection({ icon: Icon, title, addLabel, onAdd, children }) {
  return (
    <FormSection icon={Icon} title={title}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-slate-400">Add one or more rows</p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
      {children.length === 0 ? (
        <p className="flex items-center gap-2.5 p-4 rounded-lg border border-dashed border-slate-200 dark:border-gray-700 text-[13px] text-slate-400">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          No rows yet — add one to start.
        </p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </FormSection>
  );
}

function ArrayRow({ title, onRemove, footer, cols = 'sm:grid-cols-2 xl:grid-cols-3', children }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <button type="button" onClick={onRemove} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className={`grid grid-cols-1 ${cols} gap-3`}>{children}</div>
      {footer && <div className="border-t border-slate-200 dark:border-gray-700 pt-2">{footer}</div>}
    </div>
  );
}

function FieldIn({ label, required, error, children }) {
  return <FormField label={label} required={required} error={error}>{children}</FormField>;
}

// Attachments editor — lets the user pick real files (shown as file names).
// UI-only for now; wired to the upload service + expense_documents when integrated.
function RowAttachments({ path, control, setValue }) {
  const attachments = useWatch({ control, name: path }) || [];
  const fileRef = useRef(null);

  const addFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Store the actual File objects — they're uploaded via POST /uploads on submit.
    // Existing { name, url } entries (from editing) are kept as-is.
    setValue(path, [...attachments, ...files], { shouldDirty: true });
    e.target.value = '';
  };
  const remove = (i) => setValue(path, attachments.filter((_, idx) => idx !== i), { shouldDirty: true });

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-400">
          <Paperclip className="h-3 w-3" /> Attachments
        </span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          + Upload file
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={addFiles} />
      </div>
      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {attachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-[11px] text-slate-600 dark:text-slate-300">
              <Paperclip className="h-3 w-3 text-slate-400" />
              {a.name}
              <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500" title="Remove">×</button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 mt-1">No attachments</p>
      )}
    </div>
  );
}