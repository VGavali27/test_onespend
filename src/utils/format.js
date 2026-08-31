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

// ₹ amount formatting (Indian locale) — always show 2 decimal places
export const formatCurrency = (amount) =>
  amount == null ? '—' : `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Plain number formatting (no currency symbol — e.g. foreign amounts / exchange rates)
export const formatNumber = (n) =>
  n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// Relative time (e.g. "10 min ago", "2 hrs ago", "3 days ago")
export const formatRelativeTime = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(iso);
};