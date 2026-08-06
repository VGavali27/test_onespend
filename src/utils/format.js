// Shared formatting helpers (replaces the local copies that used to live in each page).

export const formatDate = (iso, locale = 'en-IN') =>
  iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Trim a string to null when blank (used when building API payloads).
export const nullIfEmpty = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

// Date + time (e.g. "11 Aug 2026, 08:30 am")
export const formatDateTime = (iso, locale = 'en-IN') =>
  iso
    ? new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

// "PERMANENT" -> "Permanent"
export const formatType = (t) => (t ? t.charAt(0) + t.slice(1).toLowerCase() : '—');

// ₹ amount formatting (Indian locale)
export const formatCurrency = (amount) =>
  amount == null ? '—' : `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Plain number formatting (no currency symbol — e.g. foreign amounts / exchange rates)
export const formatNumber = (n) =>
  n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });