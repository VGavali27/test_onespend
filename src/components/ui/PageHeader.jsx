import { ArrowLeft } from 'lucide-react';

// Standard page header with optional back button (used by Create/Edit pages)
export default function PageHeader({ title, subtitle, icon: Icon, onBack }) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}