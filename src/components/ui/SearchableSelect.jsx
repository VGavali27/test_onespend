import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';

/**
 * Searchable combobox (Select2-style) for picking one option from a list.
 *
 * Usage (inside React Hook Form, wrap with <Controller>):
 *   <Controller
 *     control={control}
 *     name="vendor_uuid"
 *     render={({ field }) => (
 *       <SearchableSelect
 *         value={field.value}
 *         onChange={field.onChange}
 *         options={vendors.map((v) => ({ value: v.uuid, label: v.name }))}
 *         placeholder="Select vendor..."
 *         error={!!errors.vendor_uuid}
 *       />
 *     )}
 *   />
 *
 * Props: value (string), onChange(value), options ({value,label}[]), placeholder,
 * disabled, error, loading (show spinner while options load), emptyText.
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  error = false,
  loading = false,
  emptyText = 'No options',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options;

  // Close on outside click
  useEffect(() => {
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Keep the highlighted option visible while scrolling the list
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const pick = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openList();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) pick(filtered[highlight]);
      else setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const triggerClasses = `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] text-left transition-colors border ${
    error
      ? 'border-red-400 dark:border-red-500 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200'
      : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-gray-600'
  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`;

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button type="button" onClick={openList} disabled={disabled} className={triggerClasses}>
        <span className={selected ? 'truncate' : 'truncate text-slate-400 dark:text-slate-500'}>
          {selected?.label ?? placeholder}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 text-slate-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
            <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search..."
              className="w-full bg-transparent text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Options */}
          <ul ref={listRef} className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-slate-400">{emptyText}</li>
            ) : (
              filtered.map((opt, i) => {
                const active = i === highlight;
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      data-active={active}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(opt)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors ${
                        active
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex-1 truncate">{opt.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
