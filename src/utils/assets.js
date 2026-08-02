// Resolve a backend asset path (e.g. '/uploads/x.jpg') to an absolute URL.
// Leaves already-absolute URLs (http/https) untouched.
export const resolveAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const origin = base.replace(/\/api(\/v\d+)?\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};
