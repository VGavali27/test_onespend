// Shared formatting helpers (replaces the local copies that used to live in each page).

export const formatDate = (iso, locale = 'en-IN') =>
  iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Trim a string to null when blank (used when building API payloads).
export const nullIfEmpty = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

// "PERMANENT" -> "Permanent"
export const formatType = (t) => (t ? t.charAt(0) + t.slice(1).toLowerCase() : '—');

// ₹ amount formatting (Indian locale)
export const formatCurrency = (amount) =>
  amount == null ? '—' : `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;