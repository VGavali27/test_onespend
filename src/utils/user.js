// Shared user display helpers.

export const getFullName = (u) => [u?.first_name, u?.middle_name, u?.last_name].filter(Boolean).join(' ') || '—';

export const getInitials = (u) =>
  ((u?.first_name?.[0] ?? '') + (u?.last_name?.[0] ?? '')).toUpperCase() || '?';