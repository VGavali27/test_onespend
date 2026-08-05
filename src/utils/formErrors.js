// Map server-side 422 field errors back onto React Hook Form fields.
// Returns true if any were mapped (the caller can skip its generic error banner then).

export const applyServerErrors = (err, setError) => {
  const serverErrors = err?.response?.data?.errors;
  if (!Array.isArray(serverErrors) || serverErrors.length === 0) return false;
  for (const e of serverErrors) {
    try {
      setError(e.field, { type: 'server', message: e.message });
    } catch {
      // field not present in the form — skip
    }
  }
  return true;
};

// ── Shared server-error helpers (forms where backend field paths differ from the
//    RHF paths, or where you want a readable summary + field highlight) ──

// Joi messages look like `"forex[0].currency_code" length must be …` — drop the
// quoted field prefix so the message reads naturally.
export const cleanServerMessage = (msg) => {
  if (typeof msg !== 'string') return msg;
  const cleaned = msg.replace(/^"[^"]+"\s+/, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

// Human-readable label for a backend field path, e.g. 'forex.0.currency_code' → 'Forex 1 — Currency code',
// 'title' → 'Title', 'advance_date' → 'Advance date'
export const fieldErrorLabel = (field) => {
  const [section, idx, name] = String(field).split('.');
  const titleCase = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (idx === undefined) return titleCase(section); // top-level field
  const sectionLabels = { segments: 'Segment', accommodations: 'Accommodation', forex: 'Forex', local_transports: 'Local transport', misc_expenses: 'Misc', items: 'Item' };
  const sec = sectionLabels[section] || titleCase(section);
  const readable = titleCase(name);
  if (/^\d+$/.test(idx)) return `${sec} ${Number(idx) + 1} — ${readable}`;
  return `${sec} — ${readable}`;
};

/**
 * Map server 422 errors onto RHF fields (via `setError`) and build a readable summary.
 * `translate` (optional) converts a backend field path into the RHF field name.
 * Returns `{ mapped, summary }` — `mapped` = at least one error landed on a form
 * field (show "fix the highlighted fields"); `summary` = `• label: message` lines
 * for anything that couldn't be mapped.
 */
export const applyServerErrorsDetailed = (err, setError, translate) => {
  const serverErrors = err?.response?.data?.errors;
  if (!Array.isArray(serverErrors) || serverErrors.length === 0) return { mapped: false, summary: [] };

  let mapped = false;
  const summary = [];
  for (const e of serverErrors) {
    const formField = translate ? translate(e.field) : e.field;
    let applied = false;
    if (formField) {
      try {
        setError(formField, { type: 'server', message: cleanServerMessage(e.message) });
        applied = true;
      } catch {
        /* field not registered — keep it in the summary */
      }
    }
    if (applied) mapped = true;
    summary.push(`• ${fieldErrorLabel(e.field)}: ${cleanServerMessage(e.message)}`);
  }
  return { mapped, summary };
};