import { RotateCw, AlertTriangle } from 'lucide-react';

// Full-card error state with retry (used by Edit pages when the record fails to load)
export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Couldn't load this record</p>
      <p className="text-[13px] text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}