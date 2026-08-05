import { ChevronDown } from 'lucide-react';

// Shared form primitives used across Add/Edit pages (see pages/master/UserForm for the original pattern).
export const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-sm';

// Add a red border on invalid fields (drives off the RHF `errors` state)
export const inputClassFor = (hasError) =>
  `${inputClass} ${hasError ? 'border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`;

// Select inputs: hide the native chevron (appearance-none) and reserve right
// padding so the custom arrow in <SelectInput> doesn't sit flush with the field edge.
export const selectClass = `${inputClass} appearance-none pr-9`;
export const selectClassFor = (hasError) =>
  `${selectClass} ${hasError ? 'border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`;

// Dropdown input with a right-aligned chevron (accepts RHF `field`/register props).
export function SelectInput({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select className={`${selectClassFor(error)} ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  );
}

// Section card for grouping form fields (icon + title header, body below)
export function FormSection({ icon: Icon, title, subtitle, children }) {
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

// Labeled field with inline validation error
export function FormField({ label, required, error, children }) {
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