import api from '@/services/api';
import { crud } from '@/services/api';

// ── Procurement (PI → PR → PO → Received → Finance → CFO → Payment) ──
export const procurementApi = crud('/procurement');

// ── Workflow actions ──
export const submitProcurement = (uuid, remarks) => api.post(`/procurement/${uuid}/submit`, { remarks });
export const approveProcurement = (uuid, remarks) => api.post(`/procurement/${uuid}/approve`, { remarks });
export const rejectProcurement = (uuid, remarks) => api.post(`/procurement/${uuid}/reject`, { remarks });
export const createPurchaseRequest = (uuid) => api.post(`/procurement/${uuid}/create-pr`);
export const createPurchaseOrder = (uuid) => api.post(`/procurement/${uuid}/create-po`);
export const markReceived = (uuid) => api.post(`/procurement/${uuid}/received`);
export const markPaid = (uuid, remarks) => api.post(`/procurement/${uuid}/pay`, { remarks });

// ── Admin edits a PR's line items (qty / unit price) while quotations are gathered ──
export const updateProcurementItems = (uuid, items) => api.put(`/procurement/${uuid}/items`, { items });

// ── Quotations (admin fills them on a PR; requester picks one blind) ──
export const procurementQuotationApi = {
  add: (prUuid, payload) => api.post(`/procurement/${prUuid}/quotations`, payload),
  update: (prUuid, quotationUuid, payload) => api.put(`/procurement/${prUuid}/quotations/${quotationUuid}`, payload),
  remove: (prUuid, quotationUuid) => api.delete(`/procurement/${prUuid}/quotations/${quotationUuid}`),
};
export const submitQuotations = (uuid) => api.post(`/procurement/${uuid}/submit-quotations`);
export const selectQuotation = (uuid, quotationUuid) => api.post(`/procurement/${uuid}/select-quotation`, { quotation_uuid: quotationUuid });

// ── Attachments (quotation / invoice / delivery) ──
// payload may include quotation_uuid to link a document to a specific quotation.
export const procurementDocumentApi = {
  add: (procurementUuid, payload) => api.post(`/procurement/${procurementUuid}/documents`, { ...payload, procurement_uuid: procurementUuid }),
  remove: (uuid) => api.delete(`/procurement/documents/${uuid}`),
};
