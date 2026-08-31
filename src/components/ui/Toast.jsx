import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

// Global toast helper — `useToast().success(msg)` / `.error(msg)`.
// Mount <ToastProvider> once at the app root; toasts render in a fixed stack.
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list, { id, type, message }]);
      // Success toasts auto-dismiss; errors stay until the user dismisses them
      // (people need time to read and act on an error).
      if (type === 'success') setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Fixed toast stack (top-right). Lives at the app root so it survives navigation. */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const isError = toast.type === 'error';
  const Icon = isError ? AlertTriangle : CheckCircle2;
  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white dark:bg-gray-900 animate-fade-in ${
        isError ? 'border-red-200 dark:border-red-800/40' : 'border-emerald-200 dark:border-emerald-800/40'
      }`}
    >
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isError ? 'text-red-500' : 'text-emerald-500'}`} />
      <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-snug flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        title="Dismiss"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
