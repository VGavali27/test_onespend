import api from '@/services/api';
import { crud } from '@/services/api';
import { uploadImage } from '@/services/uploadService';

// ── Vendors (Master Data) ──
export const vendorApi = crud('/vendors');
export const getVendorOptions = () => api.get('/vendors/options');

// ── Vendor documents (uploaded file metadata) ──
export const vendorDocumentApi = {
  add: (payload) => api.post('/vendor-documents', payload),
  remove: (uuid) => api.delete(`/vendor-documents/${uuid}`),
};

// After a vendor is saved: delete removed existing documents, then upload new File
// documents into uploads/vendor and attach them. `documents` = Files (new) + { uuid, name, url } (kept).
export const syncVendorDocuments = async (vendorUuid, documents = [], initialDocuments = []) => {
  const keptUuids = new Set(documents.filter((d) => d.uuid).map((d) => d.uuid));
  for (const doc of initialDocuments || []) {
    if (doc.uuid && !keptUuids.has(doc.uuid)) await vendorDocumentApi.remove(doc.uuid);
  }
  for (const doc of documents) {
    if (doc instanceof File) {
      const { data } = await uploadImage(doc, 'vendor');
      const url = data?.data?.url;
      await vendorDocumentApi.add({
        vendor_uuid: vendorUuid,
        original_file_name: doc.name,
        stored_file_name: url.split('/').pop(),
        file_path: url,
        mime_type: doc.type,
        file_size: doc.size,
      });
    }
  }
};
