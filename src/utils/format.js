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

// ── Amount in words (Indian numbering: lakh/crore) ──
// "1234.56" → "One Thousand Two Hundred Thirty-Four Rupees and Fifty-Six Paise"
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(' ');
};

// Groups an integer into Indian-style segments: e.g. 123456789 → [789, 456, 123, 1]
const inWordsInt = (num) => {
  if (num === 0) return 'Zero';
  const segments = [];
  segments.push(num % 1000);
  num = Math.floor(num / 1000);
  segments.push(num % 100);
  num = Math.floor(num / 100);
  while (num > 0) {
    segments.push(num % 100);
    num = Math.floor(num / 100);
  }
  const units = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab'];
  const words = [];
  segments.forEach((seg, i) => {
    if (seg === 0) return;
    let part = '';
    const hundreds = Math.floor(seg / 100);
    const rest = seg % 100;
    if (hundreds > 0) part += `${ONES[hundreds]} Hundred `;
    part += twoDigits(rest);
    if (units[i]) part += ` ${units[i]}`;
    words.unshift(part.trim());
  });
  return words.join(' ').trim();
};

// Round to 2 decimals, split rupees/paise, convert each part.
export const formatAmountInWords = (amount) => {
  const value = Number(amount);
  if (Number.isNaN(value) || value < 0) return '—';
  const rounded = Math.round(value * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);
  let out = `${inWordsInt(rupees)} Rupee${rupees === 1 ? '' : 's'}`;
  if (paise > 0) {
    out += ` and ${inWordsInt(paise)} Paise`;
  }
  return out;
};

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