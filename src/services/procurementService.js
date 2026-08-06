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

// ── Attachments (quotation / invoice / delivery) ──
export const procurementDocumentApi = {
  add: (procurementUuid, payload) => api.post(`/procurement/${procurementUuid}/documents`, { ...payload, procurement_uuid: procurementUuid }),
  remove: (uuid) => api.delete(`/procurement/documents/${uuid}`),
};
