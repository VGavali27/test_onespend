// Shared client-side sorting for tables whose backend returns all rows (used inside DataTable fetchFn).

export const sortRows = (rows, sortBy, sortOrder) => {
  if (!sortBy) return rows;
  const dir = sortOrder === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1 * dir;
    if (bv == null) return -1 * dir;
    if (typeof av === 'string') return av.localeCompare(String(bv)) * dir;
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });
};