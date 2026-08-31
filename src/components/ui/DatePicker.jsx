import { Controller } from 'react-hook-form';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { inputClassFor, FormField } from '@/components/ui/form';

// Parse a 'YYYY-MM-DD' (or ISO) string into a local Date — avoids the UTC
// off-by-one that `new Date('YYYY-MM-DD')` causes.
const parseDateValue = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/);
    if (m) {
      if (m[4]) return new Date(v); // has a time component → parse the full datetime
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

// Format a Date back to 'YYYY-MM-DD' (or 'YYYY-MM-DDTHH:mm' when withTime)
const formatDateValue = (d, withTime) => {
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (!withTime) return date;
  return `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Themed date / date-time picker. Works with string values ('YYYY-MM-DD' or
 * 'YYYY-MM-DDTHH:mm') so it drops straight into RHF fields.
 */
export default function DatePicker({ value, onChange, error, showTimeSelect = false, placeholder, ...props }) {
  return (
    <div className="relative">
      <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <ReactDatePicker
        selected={parseDateValue(value)}
        onChange={(d) => onChange(formatDateValue(d, showTimeSelect))}
        showTimeSelect={showTimeSelect}
        timeIntervals={30}
        dateFormat={showTimeSelect ? 'dd MMM yyyy h:mm aa' : 'dd MMM yyyy'}
        placeholderText={placeholder || (showTimeSelect ? 'Select date & time' : 'Select date')}
        isClearable
        portalId="datepicker-portal"
        className={`${inputClassFor(!!error)} pl-4 pr-9`}
        wrapperClassName="w-full"
        {...props}
      />
    </div>
  );
}

/**
 * RHF helper — a labelled DatePicker bound via Controller to `control[name]`.
 * value is stored as a string ('YYYY-MM-DD[THH:mm]').
 */
export function DateField({ control, name, label, required, error, ...pickerProps }) {
  return (
    <FormField label={label} required={required} error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePicker value={field.value} onChange={field.onChange} error={error} {...pickerProps} />
        )}
      />
    </FormField>
  );
}
