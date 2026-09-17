/**
 * Focus helpers for React Hook Form.
 *
 * RHF's built-in `shouldFocusError` only focuses fields that expose a ref to it
 * (registered inputs). Controller-only fields (selects, dates, comboboxes) are
 * skipped, so after a failed submit the cursor stays on the submit button.
 *
 * `withErrorFocus(handleSubmit)` wraps RHF's submit so that an invalid submit
 * focuses (and scrolls to) the first field that failed validation.
 */

// Walk an RHF `errors` object to the first leaf that carries a message/type,
// returning its field path in RHF dot notation (e.g. `segments.0.departure_city`).
export const getFirstFieldErrorPath = (errors) => {
  if (!errors || typeof errors !== 'object') return null;
  let first = null;
  const walk = (obj, prefix = '') => {
    if (first) return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (key === 'message' || key === 'type' || key === 'ref' || key === 'types') continue;
      if (!val || typeof val !== 'object') continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (val.message || val.type || val.ref) {
        first = path;
        return;
      }
      walk(val, path);
    }
  };
  walk(errors);
  return first;
};

// Focus the element for the given field path. Falls back to the first visible
// inline error message so control-less fields still get scrolled into view.
export const focusFirstFieldError = (errors) => {
  const path = getFirstFieldErrorPath(errors);
  if (!path) return false;
  const escaped = path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const el =
    document.querySelector(`[name="${escaped}"]`) ||
    document.querySelector(`[data-field="${escaped}"]`);
  if (el instanceof HTMLElement) {
    const target = el.matches('input,select,textarea,button') ? el : el.querySelector('input,select,textarea,button');
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
  }
  // Last resort — bring the error text itself into view.
  const msg = document.querySelector('[class*="text-red-600"]');
  if (msg instanceof HTMLElement) {
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }
  return false;
};

// `handleSubmit(onValid, onInvalid)` — bind the invalid branch to the focus helper.
export const withErrorFocus = (handleSubmit) => (onValid, onInvalid) =>
  handleSubmit(onValid, onInvalid || ((errors) => focusFirstFieldError(errors)));