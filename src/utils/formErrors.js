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