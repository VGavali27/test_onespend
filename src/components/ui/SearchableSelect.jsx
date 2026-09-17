import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
 *
 * The dropdown panel is rendered through a portal pinned under the trigger (fixed
 * coordinates) and flips upward near the viewport bottom, so it is never clipped
 * by an ancestor card with `overflow-hidden` (e.g. FormSection) or a modal scroll
 * container.
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
  name,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const [pos, setPos] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => String(o.label).toLowerCase().includes(q)) : options;

  // Close on outside click (the portal panel lives outside rootRef, so check it too)
  useEffect(() => {
    const onPointerDown = (e) => {
      if (rootRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Pin the panel under the trigger. Measured while invisible, then flipped up if it
  // would spill past the viewport bottom.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelH = panelRef.current.offsetHeight;
    setPos({
      left: rect.left,
      width: rect.width,
      top: rect.bottom + panelH + 8 > window.innerHeight ? rect.top - panelH - 6 : rect.bottom + 4,
    });
  }, [open, filtered.length]);

  // A fixed panel tracks stale coordinates once the page scrolls/resizes — close it.
  // Ignore scrolls that start inside the panel root (its own scrollable option list)
  // or the trigger, so mouse-wheel scrolling the dropdown doesn't dismiss it.
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

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

  const panel = (
    <div
      ref={panelRef}
      className="z-[60] overflow-hidden rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
      style={{
        position: 'fixed',
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: pos?.width ?? '100%',
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
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
                  <span className="flex-1 break-words">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button ref={triggerRef} type="button" name={name} onClick={openList} disabled={disabled} className={triggerClasses}>
        <span className={selected ? 'truncate' : 'truncate text-slate-400 dark:text-slate-500'}>
          {selected?.label ?? placeholder}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 text-slate-400 animate-spin flex-shrink-0" />
        ) : (
          <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown — portal to body so no ancestor can clip it */}
      {open && createPortal(panel, document.body)}
    </div>
  );
}