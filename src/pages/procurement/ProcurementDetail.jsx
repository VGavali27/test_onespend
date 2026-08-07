import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, Truck, Users, FileText, Plus, Trash2, Loader2,
  Paperclip, Clock, ArrowRight, CheckCircle2, XCircle, History, Quote, Pencil,
} from 'lucide-react';
import { procurementApi, submitProcurement, approveProcurement, rejectProcurement, createPurchaseRequest, createPurchaseOrder, markReceived, markPaid, procurementDocumentApi, procurementQuotationApi, submitQuotations, selectQuotation } from '@/services/procurementService';
import { getVendorOptions } from '@/services/vendorService';
import { uploadImage } from '@/services/uploadService';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

const DOC_TYPES = ['QUOTATION', 'INVOICE', 'DELIVERY', 'OTHER'];

// Statuses where the current handler can approve/reject.
// NOTE: HOD_APPROVED is NOT here — after HOD approval the admin fills quotations
// and runs submit-quotations (there is no plain "approve" step at HOD_APPROVED).
const APPROVABLE_STATUSES = ['SUBMITTED', 'QUOTATION_APPROVED', 'RECEIVED', 'FINANCE_APPROVED'];

export default function ProcurementDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const role = user?.role;

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { key, label }
  const [remarks, setRemarks] = useState('');

  // Document upload state
  const [docType, setDocType] = useState('QUOTATION');
  const [docFile, setDocFile] = useState(null);
  const [addingDoc, setAddingDoc] = useState(false);
  const fileRef = useRef(null);

  // Quotation builder state (admin fills quotations on a PR)
  const [vendorOptions, setVendorOptions] = useState([]);
  const [qForm, setQForm] = useState({ vendor_uuid: '', title: '', total_amount: '', tax_amount: '', valid_until: '', terms: '' });
  const [qEditingId, setQEditingId] = useState(null); // quotation uuid being edited (null = adding new)
  const [savingQuote, setSavingQuote] = useState(false);
  const [submittingQuotes, setSubmittingQuotes] = useState(false);
  const [selectingQuote, setSelectingQuote] = useState(null); // quotation uuid being selected

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await procurementApi.get(uuid);
      setDoc(data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load procurement document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  const addDocument = async () => {
    if (!docFile) { toast.error('Choose a file first.'); return; }
    setAddingDoc(true);
    try {
      const { data } = await uploadImage(docFile, 'procurement');
      const url = data?.data?.url;
      await procurementDocumentApi.add(uuid, {
        document_type: docType,
        original_file_name: docFile.name,
        stored_file_name: url.split('/').pop(),
        file_path: url,
        mime_type: docFile.type,
        file_size: docFile.size,
      });
      toast.success('Document attached');
      setDocFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to attach document.');
    } finally {
      setAddingDoc(false);
    }
  };

  const deleteDocument = async (docUuid) => {
    try {
      await procurementDocumentApi.remove(docUuid);
      toast.success('Document removed');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to remove document.');
    }
  };

  // Load vendor options once for the quotation builder (admin-only)
  useEffect(() => {
    getVendorOptions()
      .then((res) => setVendorOptions(res?.data?.data ?? []))
      .catch(() => setVendorOptions([]));
  }, []);

  const startEditQuotation = (q) => {
    setQEditingId(q.uuid);
    setQForm({
      vendor_uuid: q.vendor?.uuid || '',
      title: q.title || '',
      total_amount: q.total_amount != null ? String(q.total_amount) : '',
      tax_amount: q.tax_amount != null ? String(q.tax_amount) : '',
      valid_until: q.valid_until || '',
      terms: q.terms || '',
    });
  };

  const resetQuoteForm = () => {
    setQEditingId(null);
    setQForm({ vendor_uuid: '', title: '', total_amount: '', tax_amount: '', valid_until: '', terms: '' });
  };

  const saveQuotation = async () => {
    if (!qForm.vendor_uuid) { toast.error('Select a vendor for the quotation.'); return; }
    setSavingQuote(true);
    try {
      const payload = {
        vendor_uuid: qForm.vendor_uuid,
        title: qForm.title || null,
        total_amount: qForm.total_amount === '' ? null : Number(qForm.total_amount),
        tax_amount: qForm.tax_amount === '' ? null : Number(qForm.tax_amount),
        valid_until: qForm.valid_until || null,
        terms: qForm.terms || null,
      };
      if (qEditingId) await procurementQuotationApi.update(uuid, qEditingId, payload);
      else await procurementQuotationApi.add(uuid, payload);
      toast.success(qEditingId ? 'Quotation updated' : 'Quotation added');
      resetQuoteForm();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save quotation.');
    } finally {
      setSavingQuote(false);
    }
  };

  const removeQuotation = async (qUuid) => {
    try {
      await procurementQuotationApi.remove(uuid, qUuid);
      toast.success('Quotation removed');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to remove quotation.');
    }
  };

  const runSubmitQuotations = async () => {
    setSubmittingQuotes(true);
    try {
      await submitQuotations(uuid);
      toast.success('Quotations submitted for requester selection');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to submit quotations.');
    } finally {
      setSubmittingQuotes(false);
    }
  };

  const runSelectQuotation = async (qUuid) => {
    setSelectingQuote(qUuid);
    try {
      await selectQuotation(uuid, qUuid);
      toast.success('Quotation selected');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to select quotation.');
    } finally {
      setSelectingQuote(null);
    }
  };

  const runAction = async (key, actionRemarks) => {
    setActing(true);
    try {
      if (key === 'submit') await submitProcurement(uuid, actionRemarks);
      else if (key === 'approve') await approveProcurement(uuid, actionRemarks);
      else if (key === 'reject') await rejectProcurement(uuid, actionRemarks);
      else if (key === 'create-pr') await createPurchaseRequest(uuid);
      else if (key === 'create-po') await createPurchaseOrder(uuid);
      else if (key === 'received') await markReceived(uuid);
      else if (key === 'pay') await markPaid(uuid, actionRemarks);
      toast.success('Action completed');
      setConfirmAction(null);
      setRemarks('');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Action failed.');
    } finally {
      setActing(false);
    }
  };

  // ── Actions available to the current user for this document ──
  const availableActions = [];
  if (doc) {
    if (doc.request_type === 'PI' && doc.status === 'DRAFT') {
      availableActions.push({ key: 'submit', label: 'Submit' });
    }
    const isHandler = role === 'SUPER_ADMIN' || role === doc.currentRole?.code;
    if (isHandler && APPROVABLE_STATUSES.includes(doc.status)) {
      availableActions.push({ key: 'approve', label: 'Approve' });
      availableActions.push({ key: 'reject', label: 'Reject', danger: true });
    }
    if (doc.request_type === 'PI' && doc.status === 'APPROVED' && (role === 'SUPER_ADMIN' || role === 'ADMIN_MGR') && !doc.price_history?.pr) {
      availableActions.push({ key: 'create-pr', label: 'Create PR' });
    }
    if (doc.request_type === 'PR' && doc.status === 'APPROVED' && (role === 'SUPER_ADMIN' || role === 'ADMIN_MGR') && !doc.price_history?.po) {
      availableActions.push({ key: 'create-po', label: 'Create PO' });
    }
    if (doc.request_type === 'PO' && doc.status === 'CREATED' && (role === 'SUPER_ADMIN' || role === 'ADMIN_MGR')) {
      availableActions.push({ key: 'received', label: 'Mark Received' });
    }
    if (doc.request_type === 'PO' && doc.status === 'APPROVED' && (role === 'SUPER_ADMIN' || role === 'CFO' || role === 'PAYMENT_MGR')) {
      availableActions.push({ key: 'pay', label: 'Process Payment' });
    }
  }

  const needsRemarks = (key) => key === 'approve' || key === 'reject' || key === 'pay';

  const canEdit = doc?.request_type === 'PI' && doc?.status === 'DRAFT';

  return (
    <div className="space-y-6 animate-fade-in">
      <DetailHeader
        icon={ShoppingCart}
        title={doc?.document_number || 'Procurement'}
        onBack={() => navigate('/procurement')}
        editTo={canEdit ? `/procurement/${uuid}/edit` : null}
      />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : doc ? (
        <>
          {/* Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{doc.title}</h2>
                  <StatusBadge status={doc.status} />
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {doc.request_type} · {doc.company?.name || '—'} · {doc.vendor?.name || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-slate-400">Grand total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(doc.grand_total)}</p>
                <p className="text-[12px] text-slate-400">
                  {formatCurrency(doc.total_amount)} + {formatCurrency(doc.tax_amount)} tax
                </p>
              </div>
            </div>

            {/* Action bar */}
            {availableActions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-200 dark:border-gray-700">
                {availableActions.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    disabled={acting}
                    onClick={() => (needsRemarks(a.key) ? setConfirmAction(a) : runAction(a.key, null))}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                      a.danger
                        ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20'
                    }`}
                  >
                    {a.key === 'reject' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price history — stage-by-stage comparison across PI → PR → Quotations → PO */}
          {doc.price_history && (
            <PriceHistoryCard history={doc.price_history} />
          )}

          {/* Chain links */}
          {(doc.parent || (doc.children || []).length > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              {doc.parent && (
                <Link to={`/procurement/${doc.parent.uuid}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" /> From {doc.parent.document_number}
                </Link>
              )}
              {(doc.children || []).map((c) => (
                <Link key={c.uuid} to={`/procurement/${c.uuid}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                  <ArrowRight className="h-3.5 w-3.5" /> {c.document_number}
                </Link>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard icon={Truck} title="Details">
              <InfoRow label="Document" value={doc.document_number} />
              <InfoRow label="Company" value={doc.company?.name || '—'} />
              <InfoRow label="Vendor" value={doc.vendor?.name || '—'} />
              <InfoRow label="Vendor contact" value={doc.vendor_contact || '—'} />
              <InfoRow label="Expected delivery" value={formatDate(doc.expected_delivery_date)} />
              <InfoRow label="Notes" value={doc.notes || '—'} />
            </InfoCard>

            <InfoCard icon={Users} title="Tracking">
              <InfoRow label="Current handler" value={doc.currentRole?.name || '—'} />
              <InfoRow label="Requested by" value={doc.requestedByEmployment ? `${doc.requestedByEmployment.user?.first_name} ${doc.requestedByEmployment.user?.last_name || ''}`.trim() : '—'} />
              <InfoRow label="Received date" value={formatDate(doc.received_date)} />
              <InfoRow label="Created" value={formatDateTime(doc.createdAt ?? doc.created_at)} />
              <InfoRow label="Last updated" value={formatDateTime(doc.updatedAt ?? doc.updated_at)} />
            </InfoCard>
          </div>

          {/* Line items */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Line Items</h3>
            </div>
            {doc.items.length === 0 ? (
              <p className="px-6 py-4 text-[13px] text-slate-400">No items.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                      <th className="px-4 sm:px-6 py-2.5 font-semibold">Item</th>
                      <th className="px-4 py-2.5 font-semibold">Category</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Qty</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Unit price</th>
                      <th className="px-4 sm:px-6 py-2.5 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.items.map((it, i) => (
                      <tr key={it.uuid ?? i} className="border-b border-slate-100 dark:border-gray-800 last:border-0">
                        <td className="px-4 sm:px-6 py-3">
                          <p className="font-medium text-slate-800 dark:text-slate-200">{it.item_name}</p>
                          {it.description && <p className="text-[12px] text-slate-400">{it.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{it.category || '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{it.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(it.unit_price)}</td>
                        <td className="px-4 sm:px-6 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{formatCurrency(it.total_with_tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quotations */}
          {doc.quotations && (
            <QuotationsSection
              doc={doc}
              role={role}
              vendorOptions={vendorOptions}
              qForm={qForm}
              setQForm={setQForm}
              qEditingId={qEditingId}
              savingQuote={savingQuote}
              submittingQuotes={submittingQuotes}
              selectingQuote={selectingQuote}
              startEditQuotation={startEditQuotation}
              resetQuoteForm={resetQuoteForm}
              saveQuotation={saveQuotation}
              removeQuotation={removeQuotation}
              runSubmitQuotations={runSubmitQuotations}
              runSelectQuotation={runSelectQuotation}
            />
          )}

          {/* Handover timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <History className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Approval Timeline</h3>
            </div>
            {doc.handovers.length === 0 ? (
              <p className="px-6 py-4 text-[13px] text-slate-400">No actions yet.</p>
            ) : (
              <ol className="px-4 sm:px-6 py-4 space-y-3">
                {doc.handovers.map((h) => (
                  <li key={h.uuid} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                      <span className="w-px flex-1 bg-slate-200 dark:bg-gray-700 my-1" />
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 capitalize">
                        {h.action_type.replace(/_/g, ' ').toLowerCase()}
                        <span className="text-slate-400 font-normal">
                          {' '}· {h.fromRole?.name || '—'} → {h.toRole?.name || '—'} · {formatCurrency(h.amount_at_step)}
                        </span>
                      </p>
                      <p className="text-[12px] text-slate-400">
                        by {h.actionBy?.user ? `${h.actionBy.user.first_name} ${h.actionBy.user.last_name || ''}`.trim() : '—'} · {formatDateTime(h.createdAt ?? h.created_at)}
                        {h.remarks && <span className="italic"> · “{h.remarks}”</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Documents</h3>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-2">
              {(doc.documents || []).length === 0 ? (
                <p className="text-[13px] text-slate-400">No documents attached.</p>
              ) : (
                doc.documents.map((d) => (
                  <div key={d.uuid} className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0">
                    <a href={d.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline min-w-0">
                      <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{d.original_file_name || d.file_path}</span>
                    </a>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {d.document_type && <span className="text-[11px] text-slate-400">{d.document_type}</span>}
                      <button type="button" onClick={() => deleteDocument(d.uuid)} title="Remove document" className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-gray-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select value={docType} onChange={(e) => setDocType(e.target.value)} className="px-3 py-2 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700">
                    {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                  <input ref={fileRef} type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="px-3 py-2 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-[12px] file:font-semibold file:text-indigo-600" />
                  <button
                    type="button"
                    onClick={addDocument}
                    disabled={addingDoc}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-60 transition-colors"
                  >
                    {addingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Attach document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Confirm action with remarks */}
      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.label || 'Confirm'}
        subtitle="Optional remark recorded on the handover timeline"
        icon={confirmAction?.danger ? XCircle : CheckCircle2}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => confirmAction && runAction(confirmAction.key, remarks)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 transition-colors ${
                confirmAction?.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {acting && <Loader2 className="h-4 w-4 animate-spin" />}
              {acting ? 'Working...' : confirmAction?.label}
            </button>
          </>
        }
      >
        <input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Remarks (optional)"
          className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
        />
      </Modal>
    </div>
  );
}

// ── Quotations section ──
// Admin at HOD_APPROVED fills quotations (vendor visible to them). The requester
// at QUOTATION_SELECTION picks one blind — vendor + files are masked by the API.
// Everyone else sees a read-only list (vendor shown to admin/finance roles only).
function QuotationsSection({
  doc, role, vendorOptions,
  qForm, setQForm, qEditingId, savingQuote, submittingQuotes, selectingQuote,
  startEditQuotation, resetQuoteForm, saveQuotation, removeQuotation,
  runSubmitQuotations, runSelectQuotation,
}) {
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN_MGR';
  const isPR = doc.request_type === 'PR';
  const fillMode = isAdmin && isPR && doc.status === 'HOD_APPROVED';
  const selectMode = doc.is_requester && isPR && doc.status === 'QUOTATION_SELECTION';
  const quotations = doc.quotations || [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Quote className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Vendor Quotations</h3>
        {selectMode && (
          <span className="ml-auto text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
            Select one — vendor hidden
          </span>
        )}
      </div>

      {quotations.length === 0 && !fillMode ? (
        <p className="px-6 py-4 text-[13px] text-slate-400">No quotations yet.</p>
      ) : (
        <div className="px-4 sm:px-6 py-4 space-y-3">
          {/* Admin builder form */}
          {fillMode && (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-gray-600 p-4 space-y-3">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                {qEditingId ? 'Edit quotation' : 'Add a quotation'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Vendor</label>
                  <SearchableSelect
                    value={qForm.vendor_uuid}
                    onChange={(v) => setQForm((f) => ({ ...f, vendor_uuid: v }))}
                    options={vendorOptions.map((v) => ({ value: v.uuid, label: v.name }))}
                    placeholder="Select vendor..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Title</label>
                  <input
                    value={qForm.title}
                    onChange={(e) => setQForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Quotation A"
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total amount</label>
                  <input
                    type="number"
                    min={0}
                    value={qForm.total_amount}
                    onChange={(e) => setQForm((f) => ({ ...f, total_amount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tax amount</label>
                  <input
                    type="number"
                    min={0}
                    value={qForm.tax_amount}
                    onChange={(e) => setQForm((f) => ({ ...f, tax_amount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Valid until</label>
                  <input
                    type="date"
                    value={qForm.valid_until}
                    onChange={(e) => setQForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                  />
                </div>
                <div className="sm:col-span-2 xl:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Terms</label>
                  <input
                    value={qForm.terms}
                    onChange={(e) => setQForm((f) => ({ ...f, terms: e.target.value }))}
                    placeholder="e.g. NET30"
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={saveQuotation}
                  disabled={savingQuote}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {savingQuote && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {qEditingId ? 'Save changes' : 'Add quotation'}
                </button>
                {qEditingId && (
                  <button
                    type="button"
                    onClick={resetQuoteForm}
                    className="px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quotation list */}
          {quotations.map((q, i) => (
            <div key={q.uuid} className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    Quotation {i + 1}
                    {q.title && <span className="text-slate-400 font-normal"> · {q.title}</span>}
                  </p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {q.vendor ? q.vendor.name : '—'}
                    {q.valid_until && <span> · valid until {formatDate(q.valid_until)}</span>}
                    {q.terms && <span> · {q.terms}</span>}
                  </p>
                  {q.notes && <p className="text-[12px] text-slate-400 mt-1">{q.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(q.grand_total)}</p>
                    {q.total_amount != null && q.tax_amount != null && (
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(q.total_amount)} + {formatCurrency(q.tax_amount)} tax
                      </p>
                    )}
                    {q.status === 'SELECTED' && (
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Selected</p>
                    )}
                  </div>

                  {/* Admin: edit/delete */}
                  {fillMode && (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => startEditQuotation(q)} title="Edit quotation" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeQuotation(q.uuid)} title="Remove quotation" className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Requester: blind select */}
                  {selectMode && q.status === 'ACTIVE' && (
                    <button
                      type="button"
                      disabled={Boolean(selectingQuote)}
                      onClick={() => runSelectQuotation(q.uuid)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                    >
                      {selectingQuote === q.uuid && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Select this quotation
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Admin: submit quotations for requester selection */}
          {fillMode && quotations.length > 0 && (
            <div className="flex justify-end pt-1 border-t border-slate-100 dark:border-gray-800">
              <button
                type="button"
                onClick={runSubmitQuotations}
                disabled={submittingQuotes}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {submittingQuotes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit quotations for requester selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Price history card ──
// Stage-by-stage comparison: PI → PR → each quotation → PO, each with its own
// document number + grand total. Vendors stay masked for the requester (the API
// already nulls them out on the chain).
function PriceHistoryCard({ history }) {
  const { pi, pr, quotations = [], po } = history || {};

  const stages = [
    { label: 'Purchase Intention', num: pi?.document_number, total: pi?.grand_total },
    { label: 'Purchase Request', num: pr?.document_number, total: pr?.grand_total },
    ...quotations.map((q, i) => ({
      label: `Quotation ${i + 1}`,
      num: q.title || '—',
      total: q.grand_total,
    })),
    { label: 'Purchase Order', num: po?.document_number, total: po?.grand_total },
  ].filter((s) => s.total != null);

  if (stages.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <ArrowRight className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Price history</h3>
        <span className="ml-auto text-[11px] text-slate-400">PI → PR → Quotation → PO</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
              <th className="px-4 sm:px-6 py-2.5 font-semibold">Stage</th>
              <th className="px-4 py-2.5 font-semibold">Document</th>
              <th className="px-4 sm:px-6 py-2.5 font-semibold text-right">Grand total</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-gray-800 last:border-0">
                <td className="px-4 sm:px-6 py-3 font-medium text-slate-800 dark:text-slate-200">{s.label}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.num || '—'}</td>
                <td className="px-4 sm:px-6 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{formatCurrency(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
