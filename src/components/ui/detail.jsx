import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';

// Shared read-only detail primitives for "View" pages (extracted from the Profile page pattern).

// Card with icon + title header, used to group a record's fields.
export function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-4 sm:px-6 py-4 space-y-3">{children}</div>
    </div>
  );
}

// A label → value row inside an InfoCard.
export function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-slate-400">{label}</span>
      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 text-right">{value}</span>
    </div>
  );
}

// A compact label/value pair for grids (e.g. employment details).
export function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate">{value}</p>
    </div>
  );
}

// Shared record detail header with a back button + an Edit button.
export function DetailHeader({ icon: Icon, title, onBack, editTo, editLabel = 'Edit' }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{title}</h1>
        </div>
      </div>
      {editTo && (
        <Link
          to={editTo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          {editLabel}
        </Link>
      )}
    </div>
  );
}