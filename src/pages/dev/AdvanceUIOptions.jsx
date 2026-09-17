import { useState } from 'react';
import { ChevronDown, Plus, Minus, Ban, CircleDollarSign } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { FormField, inputClassFor, SelectInput } from '@/components/ui/form';
import DatePicker from '@/components/ui/DatePicker';

function FieldIn({ label, required, error, children }) {
  return <FormField label={label} required={required} error={error}>{children}</FormField>;
}

const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'NETBANKING', 'OTHER'];

// The 4 reimbursement fields shown when an advance is received. Self-contained so
// every variant below renders the exact same field set for a fair comparison.
function AdvanceBlock() {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const hasAdvance = Number(amount || 0) > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-3">
      <FormField label="Advance received (₹)">
        <input type="number" className={inputClassFor(false)} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </FormField>
      <FormField label="Advance date" required={hasAdvance}>
        <DatePicker value={date} onChange={setDate} />
      </FormField>
      <FormField label="Payment method">
        <SelectInput value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
        </SelectInput>
      </FormField>
      <FieldIn label="Remarks">
        <input className={inputClassFor(false)} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" />
      </FieldIn>
    </div>
  );
}

function VariantCard({ n, name, children }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <span className="h-6 min-w-6 px-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">{n}</span>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{name}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export default function AdvanceUIOptions() {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [open4, setOpen4] = useState(false);
  const [open5, setOpen5] = useState(false);
  const [open6, setOpen6] = useState(false);
  const [open7, setOpen7] = useState(false);
  const [open8, setOpen8] = useState(false);

  const pillBase = 'px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors';
  const pillOn = 'bg-indigo-600 text-white shadow-sm';
  const pillOff = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Advance control UI options" subtitle="Dev showcase — compare all variants, then tell me the number to use in the real form" icon={CircleDollarSign} />

      <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 text-[13px] text-indigo-700 dark:text-indigo-400">
        Each card is fully interactive with the real field components. Toggle its control on ("Received advance") to reveal the same 4 reimbursement fields used in the real form.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1 — Checkbox */}
        <VariantCard n={1} name="Checkbox">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input type="checkbox" checked={open1} onChange={(e) => setOpen1(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            I received an advance
          </label>
          {open1 && <AdvanceBlock />}
        </VariantCard>

        {/* 2 — Pill / segmented (current) */}
        <VariantCard n={2} name="Pill / segmented (current)">
          <FormField label="Advance received" plain>
            <div className="inline-flex w-fit rounded-lg border border-slate-200 dark:border-gray-700 p-1 gap-2">
              <button type="button" onClick={() => setOpen2(false)} className={`${pillBase} ${!open2 ? pillOn : pillOff}`}>No advance</button>
              <button type="button" onClick={() => setOpen2(true)} className={`${pillBase} ${open2 ? pillOn : pillOff}`}>Received advance</button>
            </div>
          </FormField>
          {open2 && <AdvanceBlock />}
        </VariantCard>

        {/* 3 — Switch */}
        <VariantCard n={3} name="Toggle switch">
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <span>I received an advance</span>
            <button
              type="button"
              role="switch"
              aria-checked={open3}
              onClick={() => setOpen3(!open3)}
              className={`relative w-11 h-6 rounded-full transition-colors ${open3 ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${open3 ? 'translate-x-5' : ''}`} />
            </button>
          </label>
          {open3 && <AdvanceBlock />}
        </VariantCard>

        {/* 4 — Radio Yes/No */}
        <VariantCard n={4} name="Radio Yes / No">
          <FormField label="Advance received?" plain>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input type="radio" name="adv4" checked={!open4} onChange={() => setOpen4(false)} className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                No
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input type="radio" name="adv4" checked={open4} onChange={() => setOpen4(true)} className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Yes
              </label>
            </div>
          </FormField>
          {open4 && <AdvanceBlock />}
        </VariantCard>

        {/* 5 — Collapsible section */}
        <VariantCard n={5} name="Collapsible section (chevron)">
          <button
            type="button"
            onClick={() => setOpen5(!open5)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span>Advance received (optional)</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open5 ? '' : '-rotate-90'}`} />
          </button>
          {open5 && <AdvanceBlock />}
        </VariantCard>

        {/* 6 — Card buttons */}
        <VariantCard n={6} name="Selectable cards">
          <FormField label="Advance received" plain>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOpen6(false)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-sm font-medium text-left transition-colors ${!open6
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-gray-600'
                }`}
              >
                <Ban className="h-4 w-4" />
                No advance
              </button>
              <button
                type="button"
                onClick={() => setOpen6(true)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-sm font-medium text-left transition-colors ${open6
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-gray-600'
                }`}
              >
                <CircleDollarSign className="h-4 w-4" />
                Received advance
              </button>
            </div>
          </FormField>
          {open6 && <AdvanceBlock />}
        </VariantCard>

        {/* 7 — Dropdown select */}
        <VariantCard n={7} name="Dropdown select">
          <FormField label="Advance" plain>
            <SelectInput value={open7 ? 'RECEIVED' : 'NONE'} onChange={(e) => setOpen7(e.target.value === 'RECEIVED')}>
              <option value="NONE">No advance</option>
              <option value="RECEIVED">Received advance</option>
            </SelectInput>
          </FormField>
          {open7 && <AdvanceBlock />}
        </VariantCard>

        {/* 8 — Compact add/remove button */}
        <VariantCard n={8} name="Compact add / remove button">
          <button
            type="button"
            onClick={() => setOpen8(!open8)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-colors ${open8
              ? 'border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'
              : 'border-dashed border-slate-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
            }`}
          >
            {open8 ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {open8 ? 'Remove advance' : 'Add advance'}
          </button>
          {open8 && <AdvanceBlock />}
        </VariantCard>
      </div>
    </div>
  );
}