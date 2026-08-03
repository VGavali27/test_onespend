const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  INACTIVE: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

// Reusable status pill for list/table columns. Pass `styles` to override the
// default ACTIVE/INACTIVE/BLOCKED map (e.g. employment statuses).
export default function StatusBadge({ status, styles }) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset';
  const style = (styles ?? STATUS_STYLES)[status] ?? 'bg-slate-50 text-slate-600 ring-slate-600/20 dark:bg-gray-800 dark:text-slate-300 dark:ring-slate-400/20';
  return (
    <span className={`${base} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {(status || '—').charAt(0) + (status || '').slice(1).toLowerCase()}
    </span>
  );
}