import api from '@/services/api';
import { crud } from '@/services/api';

// ── Vendors (Master Data) ──
export const vendorApi = crud('/vendors');
export const getVendorOptions = () => api.get('/vendors/options');

// ── Vendor documents (uploaded file metadata) ──
export const vendorDocumentApi = {
  add: (payload) => api.post('/vendor-documents', payload),
  remove: (uuid) => api.delete(`/vendor-documents/${uuid}`),
};
