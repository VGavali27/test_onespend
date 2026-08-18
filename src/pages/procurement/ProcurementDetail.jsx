import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, Truck, Users, Plus, Trash2, Loader2, Wallet,
  Paperclip, Clock, ArrowRight, CheckCircle2, XCircle, History, Quote, Pencil, Eye, X, ChevronDown,
} from 'lucide-react';
import { procurementApi, submitProcurement, approveProcurement, rejectProcurement, createPurchaseRequest, createPurchaseOrder, markReceived, markPaid, procurementDocumentApi, procurementQuotationApi, submitQuotations, selectQuotation, updateProcurementItems } from '@/services/procurementService';
import { getVendorOptions } from '@/services/vendorService';
import { uploadImage } from '@/services/uploadService';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import SearchableSelect from '@/components/ui/SearchableSelect';
import DatePicker from '@/components/ui/DatePicker';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';

// Workflow status colors (dark-mode aware). Mirrors the list page's map so the
// detail status pill matches the same palette.
const PROCUREMENT_STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20',
  CREATED: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20',
  SUBMITTED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/20',
  PR_CREATED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  QUOTATION_SELECTION: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  QUOTATION_APPROVED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  RECEIVED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  FINANCE_APPROVED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  APPROVED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-400 dark:ring-indigo-400/20',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  SELECTED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  REJECTED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

// Statuses where the current handler can approve/reject.
// NOTE: PR_CREATED is NOT here — after PR creation the admin fills quotations
// and runs submit-quotations (there is no plain "approve" step at PR_CREATED).
// QUOTATION_APPROVED is also NOT approvable — at this stage the PR has a
// selected quotation and the next action is "Create PO" (not approve).
const APPROVABLE_STATUSES = ['SUBMITTED', 'RECEIVED', 'FINANCE_APPROVED'];

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

  // Quotation builder state (admin fills quotations on a PR)
  const [vendorOptions, setVendorOptions] = useState([]);
  const [qForm, setQForm] = useState({ vendor_uuid: '', valid_until: '', notes: '', items: [] });
  const [qEditingId, setQEditingId] = useState(null); // quotation uuid being edited (null = adding new)
  const [qFormFile, setQFormFile] = useState(null); // optional vendor quotation document attached with the form
  const qFormFileRef = useRef(null);
  const [savingQuote, setSavingQuote] = useState(false);
  const [submittingQuotes, setSubmittingQuotes] = useState(false);
  const [selectingQuote, setSelectingQuote] = useState(null); // quotation uuid being selected

  // PR line-item editing state (admin adjusts qty / unit price while quotations are gathered)
  const [editingItems, setEditingItems] = useState(false);
  const [itemsDraft, setItemsDraft] = useState([]);
  const [savingItems, setSavingItems] = useState(false);

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

  // Load vendor options once for the quotation builder (admin-only)
  useEffect(() => {
    getVendorOptions()
      .then((res) => setVendorOptions(res?.data?.data ?? []))
      .catch(() => setVendorOptions([]));
  }, []);

  // Pre-fill the "Add a quotation" line items from the PR's items (admin building
  // a quotation at PR_CREATED) — the vendor prices these items per-quotation.
  useEffect(() => {
    const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN_MGR';
    const addMode = isAdmin && doc?.request_type === 'PR' && doc?.status === 'PR_CREATED' && !qEditingId;
    // Pre-fill from the PR items whenever we're in ADD mode — the PR items are the
    // source of truth (so an admin who edited PR line items sees the latest values),
    // not what was previously typed into the builder form.
    if (addMode && doc?.items?.length) {
      setQForm((f) => ({
        ...f,
        items: doc.items.map((it) => ({
          item_name: it.item_name || '',
          description: it.description || '',
          category: it.category || '',
          quantity: it.quantity ?? 1,
          unit_price: it.unit_price ?? 0,
          tax_rate: 0,
        })),
      }));
    }
  }, [doc, role, qEditingId]);

  const startEditQuotation = (q) => {
    setQEditingId(q.uuid);
    setQFormFile(null);
    setQForm({
      vendor_uuid: q.vendor?.uuid || '',
      valid_until: q.valid_until || '',
      notes: q.notes || '',
      items: (q.items || []).map((it) => ({
        item_name: it.item_name || '',
        description: it.description || '',
        category: it.category || '',
        quantity: it.quantity ?? 1,
        unit_price: it.unit_price ?? 0,
        tax_rate: it.tax_rate ?? 0,
      })),
    });
  };

  const resetQuoteForm = () => {
    setQEditingId(null);
    setQFormFile(null);
    if (qFormFileRef.current) qFormFileRef.current.value = '';
    setQForm({ vendor_uuid: '', valid_until: '', notes: '', items: [] });
  };

  const saveQuotation = async () => {
    if (!qForm.vendor_uuid) { toast.error('Select a vendor for the quotation.'); return; }
    if (!qForm.items?.length) { toast.error('Add at least one line item.'); return; }
    setSavingQuote(true);
    try {
      const payload = {
        vendor_uuid: qForm.vendor_uuid,
        valid_until: qForm.valid_until || null,
        notes: qForm.notes || null,
        items: qForm.items.map((it) => ({
          item_name: it.item_name.trim(),
          description: it.description || null,
          category: it.category || null,
          quantity: Number(it.quantity) || 0,
          unit_price: Number(it.unit_price) || 0,
          tax_rate: Number(it.tax_rate) || 0,
        })),
      };
      let quotationUuid = qEditingId;
      if (qEditingId) await procurementQuotationApi.update(uuid, qEditingId, payload);
      else {
        const { data } = await procurementQuotationApi.add(uuid, payload);
        quotationUuid = data?.data?.uuid;
      }
      // Attach the vendor's quotation document (uploaded from the builder form)
      if (qFormFile && quotationUuid) {
        const { data } = await uploadImage(qFormFile, 'procurement');
        const url = data?.data?.url;
        await procurementDocumentApi.add(uuid, {
          quotation_uuid: quotationUuid,
          document_type: 'QUOTATION',
          original_file_name: qFormFile.name,
          stored_file_name: url.split('/').pop(),
          file_path: url,
          mime_type: qFormFile.type,
          file_size: qFormFile.size,
        });
      }
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
    if (key === 'edit-items') {
      setItemsDraft((doc.items || []).map((it) => ({
        uuid: it.uuid,
        item_name: it.item_name || '',
        description: it.description || '',
        category: it.category || '',
        quantity: it.quantity ?? 1,
        unit_price: it.unit_price ?? 0,
      })));
      setEditingItems(true);
      return;
    }
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
      // A newly created PR is best reviewed from the all-requests list
      if (key === 'create-pr') { navigate('/procurement'); return; }
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Action failed.');
    } finally {
      setActing(false);
    }
  };

  const saveItems = async () => {
    if (itemsDraft.length === 0) { toast.error('Add at least one line item.'); return; }
    setSavingItems(true);
    try {
      await updateProcurementItems(uuid, itemsDraft.map((it) => ({
        item_name: it.item_name.trim(),
        description: it.description || null,
        category: it.category || null,
        quantity: Number(it.quantity) || 0,
        unit_price: Number(it.unit_price) || 0,
      })));
      toast.success('Line items updated');
      setEditingItems(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update line items.');
    } finally {
      setSavingItems(false);
    }
  };

  const patchItem = (i, patch) => setItemsDraft((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

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
    // Admin may adjust PR line items (qty / unit price) while quotations are gathered —
    // once quotations are submitted to the requester (QUOTATION_SELECTION) the items lock.
    const PR_ITEM_EDITABLE = ['SUBMITTED', 'PR_CREATED'];
    if (doc.request_type === 'PR' && PR_ITEM_EDITABLE.includes(doc.status) && (role === 'SUPER_ADMIN' || role === 'ADMIN_MGR')) {
      availableActions.push({ key: 'edit-items', label: 'Edit Line Items' });
    }
    if (doc.request_type === 'PR' && doc.status === 'QUOTATION_APPROVED' && (role === 'SUPER_ADMIN' || role === 'ADMIN_MGR') && !doc.price_history?.po) {
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
                  <StatusBadge status={doc.status} styles={PROCUREMENT_STATUS_STYLES} />
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {doc.request_type} · {doc.company?.name || '—'} · {doc.vendor?.name || '—'}
                </p>
              </div>
              <div className="text-left sm:text-right">
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
                    {a.key === 'reject' ? <XCircle className="h-4 w-4" /> : a.key === 'convert-expense' ? <Wallet className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
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

          {/* Linked expense — PO-created expense follows the expense approval chain */}
          {doc.expense && (
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <Link key={doc.expense.uuid} to={`/expenses/${doc.expense.uuid}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                <Wallet className="h-3.5 w-3.5" /> Expense {doc.expense.expense_number}
              </Link>
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
              <>
                {/* Desktop table */}
                <div className="hidden md:block w-full">
                  <table className="w-full text-[13px] table-fixed">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                        <th className="px-4 sm:px-6 py-2.5 font-semibold w-[38%]">Item</th>
                        <th className="px-4 py-2.5 font-semibold w-[24%]">Category</th>
                        <th className="px-4 py-2.5 font-semibold text-right w-[12%]">Qty</th>
                        <th className="px-4 py-2.5 font-semibold text-right w-[13%]">Unit price</th>
                        <th className="px-4 sm:px-6 py-2.5 font-semibold text-right w-[13%]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.items.map((it, i) => (
                        <tr key={it.uuid ?? i} className="border-b border-slate-100 dark:border-gray-800 last:border-0">
                          <td className="px-4 sm:px-6 py-3">
                            <p className="font-medium text-slate-800 dark:text-slate-200 break-words">{it.item_name}</p>
                            {it.description && <p className="text-[12px] text-slate-400 break-words">{it.description}</p>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 break-words">{it.category || '—'}</td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{it.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(it.unit_price)}</td>
                          <td className="px-4 sm:px-6 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{formatCurrency(it.total_with_tax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-gray-800">
                  {doc.items.map((it, i) => (
                    <div key={it.uuid ?? i} className="px-4 py-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200 break-words">{it.item_name}</p>
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white flex-shrink-0">{formatCurrency(it.total_with_tax)}</p>
                      </div>
                      {it.description && <p className="text-[12px] text-slate-400 break-words">{it.description}</p>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-500 dark:text-slate-400">
                        {it.category && <span>Category: <span className="text-slate-700 dark:text-slate-200">{it.category}</span></span>}
                        <span>Qty: <span className="text-slate-700 dark:text-slate-200">{it.quantity}</span></span>
                        <span>Unit: <span className="text-slate-700 dark:text-slate-200">{formatCurrency(it.unit_price)}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quotations — the list is always visible; the "Add a quotation" form
              is hidden until the admin clicks the button */}
          {doc.quotations && (
            <QuotationsSection
              doc={doc}
              role={role}
              vendorOptions={vendorOptions}
              qForm={qForm}
              setQForm={setQForm}
              qEditingId={qEditingId}
              qFormFile={qFormFile}
              setQFormFile={setQFormFile}
              qFormFileRef={qFormFileRef}
              savingQuote={savingQuote}
              submittingQuotes={submittingQuotes}
              selectingQuote={selectingQuote}
              startEditQuotation={startEditQuotation}
              resetQuoteForm={resetQuoteForm}
              saveQuotation={saveQuotation}
              removeQuotation={removeQuotation}
              runSubmitQuotations={runSubmitQuotations}
              runSelectQuotation={runSelectQuotation}
              reload={load}
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

      {/* Admin edits PR line items (qty / unit price) while quotations are gathered */}
      <Modal
        open={editingItems}
        onClose={() => setEditingItems(false)}
        title="Edit Line Items"
        subtitle="Adjust quantities / unit prices on the PR before the requester selects a quotation"
        icon={Truck}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingItems(false)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingItems}
              onClick={saveItems}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {savingItems && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingItems ? 'Saving...' : 'Save items'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {itemsDraft.map((it, i) => (
            <div key={it.uuid ?? i} className="p-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200">{it.item_name}</p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => patchItem(i, { quantity: Number(it.quantity || 0) - 1 })} className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">−</button>
                  <button type="button" onClick={() => patchItem(i, { quantity: Number(it.quantity || 0) + 1 })} className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">+</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={it.quantity}
                    onChange={(e) => patchItem(i, { quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Unit price</label>
                  <input
                    type="number"
                    min={0}
                    value={it.unit_price}
                    onChange={(e) => patchItem(i, { unit_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                  />
                </div>
              </div>
              <p className="text-[12px] text-slate-400 text-right">
                Line total {formatCurrency((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}
              </p>
            </div>
          ))}
          {itemsDraft.length === 0 && <p className="text-[13px] text-slate-400">No line items on this PR.</p>}
        </div>
      </Modal>
    </div>
  );
}

// ── Quotations section ──
// Admin at PR_CREATED fills quotations (vendor visible to them). The requester
// at QUOTATION_SELECTION picks one blind — vendor + files are masked by the API.
// Everyone else sees a read-only list (vendor shown to admin/finance roles only).
function QuotationsSection({
  doc, role, vendorOptions,
  qForm, setQForm, qEditingId, qFormFile, setQFormFile, qFormFileRef,
  savingQuote, submittingQuotes, selectingQuote,
  startEditQuotation, resetQuoteForm, saveQuotation, removeQuotation,
  runSubmitQuotations, runSelectQuotation, reload,
}) {
  const toast = useToast();
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN_MGR';
  const isPR = doc.request_type === 'PR';
  const fillMode = isAdmin && isPR && doc.status === 'PR_CREATED';
  const selectMode = doc.is_requester && isPR && doc.status === 'QUOTATION_SELECTION';
  const quotations = doc.quotations || [];
  // The "Add a quotation" form stays hidden until the admin clicks the button.
  const [showBuilder, setShowBuilder] = useState(false);
  // When a quotation is SELECTED, the others are collapsed behind a "Show" toggle.
  const [showOtherQuotations, setShowOtherQuotations] = useState(false);
  const builderRef = useRef(null); // scroll target when editing a quotation
  const editingQuotation = quotations.find((q) => q.uuid === qEditingId) || null;
  const selectedQuotation = quotations.find((q) => q.status === 'SELECTED') || null;
  const otherQuotations = quotations.filter((q) => q !== selectedQuotation);

  // When editing starts, bring the builder form into view.
  useEffect(() => {
    if (qEditingId && builderRef.current) {
      builderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [qEditingId]);

  // Per-quotation document upload state: { [quotationUuid]: { file, uploading } }
  const [qDoc, setQDoc] = useState({});
  const qDocRef = useRef(null);

  const attachQuotationDoc = async (quotationUuid) => {
    const entry = qDoc[quotationUuid];
    if (!entry?.file) { toast.error('Choose a file first.'); return; }
    setQDoc((prev) => ({ ...prev, [quotationUuid]: { ...entry, uploading: true } }));
    try {
      const { data } = await uploadImage(entry.file, 'procurement');
      const url = data?.data?.url;
      await procurementDocumentApi.add(doc.uuid, {
        quotation_uuid: quotationUuid,
        document_type: 'QUOTATION',
        original_file_name: entry.file.name,
        stored_file_name: url.split('/').pop(),
        file_path: url,
        mime_type: entry.file.type,
        file_size: entry.file.size,
      });
      toast.success('Quotation document attached');
      setQDoc((prev) => ({ ...prev, [quotationUuid]: { file: null, uploading: false } }));
      if (qDocRef.current) qDocRef.current.value = '';
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to attach document.');
      setQDoc((prev) => ({ ...prev, [quotationUuid]: { ...prev[quotationUuid], uploading: false } }));
    }
  };

  const deleteQuotationDoc = async (docUuid) => {
    try {
      await procurementDocumentApi.remove(docUuid);
      toast.success('Document removed');
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to remove document.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Quote className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Vendor Quotations</h3>
        {selectMode && (
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
            Select one — vendor hidden
          </span>
        )}
        {fillMode && (
          <button
            type="button"
            onClick={() => {
              if (showBuilder || qEditingId) {
                setShowBuilder(false);
                resetQuoteForm();
              } else {
                setShowBuilder(true);
                // Reset form with fresh PR items (in case admin edited PR items after a previous open)
                resetQuoteForm();
                setQForm((f) => ({
                  ...f,
                  items: (doc?.items || []).map((it) => ({
                    item_name: it.item_name || '',
                    description: it.description || '',
                    category: it.category || '',
                    quantity: it.quantity ?? 1,
                    unit_price: it.unit_price ?? 0,
                    tax_rate: it.tax_rate ?? 0,
                  })),
                }));
              }
            }}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            {showBuilder || qEditingId ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showBuilder || qEditingId ? 'Cancel' : 'Add quotation'}
          </button>
        )}
      </div>

      {quotations.length === 0 && !(fillMode && (showBuilder || qEditingId)) ? (
        <p className="px-6 py-4 text-[13px] text-slate-400">
          {fillMode ? 'No quotations yet — click "Add quotation" to create one.' : 'No quotations yet.'}
        </p>
      ) : (
        <div className="px-4 sm:px-6 py-4 space-y-3">
          {/* Admin builder form — hidden until "Add quotation" is clicked */}
          {fillMode && (showBuilder || qEditingId) && (
            <div ref={builderRef} className="rounded-xl border border-dashed border-slate-300 dark:border-gray-600 p-4 space-y-3">
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
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Valid until</label>
                  <DatePicker
                    value={qForm.valid_until}
                    onChange={(v) => setQForm((f) => ({ ...f, valid_until: v }))}
                    placeholder="Select date"
                  />
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Comments</label>
                <textarea
                  value={qForm.notes || ''}
                  onChange={(e) => setQForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. NET30, delivery included..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                />
              </div>

              {/* Line items — pre-filled from the PR, priced per vendor */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Line items
                </label>
                {/* Desktop editable table */}
                <div className="hidden md:block mt-1 w-full rounded-lg border border-slate-200 dark:border-gray-700">
                  <table className="w-full text-[13px] table-fixed">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                        <th className="px-3 py-2 font-semibold w-[38%]">Item</th>
                        <th className="px-3 py-2 font-semibold text-right w-[13%]">Qty</th>
                        <th className="px-3 py-2 font-semibold text-right w-[16%]">Unit price</th>
                        <th className="px-3 py-2 font-semibold text-right w-[12%]">Tax %</th>
                        <th className="px-3 py-2 font-semibold text-right w-[16%]">Total</th>
                        <th className="px-2 py-2 w-[5%]" />
                      </tr>
                    </thead>
                    <tbody>
                      {(qForm.items || []).map((it, idx) => {
                        const qty = Number(it.quantity) || 0;
                        const price = Number(it.unit_price) || 0;
                        const rate = Number(it.tax_rate) || 0;
                        const lineTotal = qty * price * (1 + rate / 100);
                        return (
                          <tr key={idx} className="border-b border-slate-100 dark:border-gray-800 last:border-0">
                            <td className="px-3 py-2">
                              <input
                                value={it.item_name}
                                onChange={(e) => {
                                  const items = [...(qForm.items || [])];
                                  items[idx] = { ...items[idx], item_name: e.target.value };
                                  setQForm((f) => ({ ...f, items }));
                                }}
                                className="w-full px-2 py-1.5 rounded-md text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step="1"
                                value={Number(it.quantity) || 0}
                                onChange={(e) => {
                                  const items = [...(qForm.items || [])];
                                  items[idx] = { ...items[idx], quantity: Number(e.target.value) || 0 };
                                  setQForm((f) => ({ ...f, items }));
                                }}
                                className="w-full px-2 py-1.5 rounded-md text-right text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={it.unit_price}
                                onChange={(e) => {
                                  const items = [...(qForm.items || [])];
                                  items[idx] = { ...items[idx], unit_price: e.target.value };
                                  setQForm((f) => ({ ...f, items }));
                                }}
                                className="w-full px-2 py-1.5 rounded-md text-right text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={it.tax_rate}
                                onChange={(e) => {
                                  const items = [...(qForm.items || [])];
                                  items[idx] = { ...items[idx], tax_rate: e.target.value };
                                  setQForm((f) => ({ ...f, items }));
                                }}
                                className="w-full px-2 py-1.5 rounded-md text-right text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-800 dark:text-slate-200">
                              {formatCurrency(lineTotal)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => setQForm((f) => ({ ...f, items: (f.items || []).filter((_, j) => j !== idx) }))}
                                title="Remove item"
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(qForm.items || []).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-[12px] text-slate-400">
                            No line items. The PR's items are pre-filled here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile editable cards */}
                <div className="md:hidden mt-1 space-y-2">
                  {(qForm.items || []).map((it, idx) => {
                    const qty = Number(it.quantity) || 0;
                    const price = Number(it.unit_price) || 0;
                    const rate = Number(it.tax_rate) || 0;
                    const lineTotal = qty * price * (1 + rate / 100);
                    const patchItem = (patch) => {
                      const items = [...(qForm.items || [])];
                      items[idx] = { ...items[idx], ...patch };
                      setQForm((f) => ({ ...f, items }));
                    };
                    return (
                      <div key={idx} className="rounded-lg border border-slate-200 dark:border-gray-700 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <input
                            value={it.item_name}
                            onChange={(e) => patchItem({ item_name: e.target.value })}
                            placeholder="Item name"
                            className="flex-1 min-w-0 px-2 py-1.5 rounded-md text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => setQForm((f) => ({ ...f, items: (f.items || []).filter((_, j) => j !== idx) }))}
                            title="Remove item"
                            className="p-1.5 text-slate-400 hover:text-red-600 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">Qty</label>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={Number(it.quantity) || 0}
                              onChange={(e) => patchItem({ quantity: Number(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 rounded-md text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">Unit price</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={Number(it.unit_price) || 0}
                              onChange={(e) => patchItem({ unit_price: Number(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 rounded-md text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400">Tax %</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={it.tax_rate}
                              onChange={(e) => patchItem({ tax_rate: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-md text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                            />
                          </div>
                        </div>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 text-right">
                          Line total: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(lineTotal)}</span>
                        </p>
                      </div>
                    );
                  })}
                  {(qForm.items || []).length === 0 && (
                    <p className="text-center text-[12px] text-slate-400 py-3">
                      No line items. The PR's items are pre-filled here.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setQForm((f) => ({ ...f, items: [...(f.items || []), { item_name: '', description: null, category: null, quantity: 1, unit_price: 0, tax_rate: 0 }] }))}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add item
                  </button>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 mr-2">Grand total</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency((qForm.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) * (1 + (Number(it.tax_rate) || 0) / 100), 0))}
                    </span>
                  </div>
                </div>
              </div>
              {/* Vendor quotation document — uploaded with the quotation and attached to it */}
              <div className="sm:col-span-2 xl:col-span-3">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Quotation document (optional)
                </label>
                <input
                  ref={qFormFileRef}
                  type="file"
                  onChange={(e) => setQFormFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-[12px] file:font-semibold file:text-indigo-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Attach the quotation document received from the vendor.</p>

                {/* Existing documents on this quotation — shown while editing, with delete */}
                {(editingQuotation?.documents || []).length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attached documents</p>
                    {editingQuotation.documents.map((d) => (
                      <div key={d.uuid} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2">
                        <a href={d.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline min-w-0">
                          <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{d.original_file_name || d.file_path}</span>
                        </a>
                        <button type="button" onClick={() => deleteQuotationDoc(d.uuid)} title="Remove document" className="p-1 text-slate-400 hover:text-red-600 flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

          {/* Quotation list — selected is highlighted and shown first; the rest are
              collapsed behind a "Show" toggle once one is selected */}
          {(() => {
            const list = selectedQuotation
              ? [selectedQuotation, ...(showOtherQuotations ? otherQuotations : [])]
              : quotations;
            return list.map((q) => {
              const idx = quotations.indexOf(q);
              const isSelected = q.status === 'SELECTED';
              return (
            <div key={q.uuid} className={`rounded-xl border p-4 transition-colors ${
              isSelected
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 ring-1 ring-emerald-200 dark:ring-emerald-800'
                : 'border-slate-200 dark:border-gray-700'
            }`}>
              {/* Header: title + actions */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Quotation {idx + 1}</p>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="h-3 w-3" />
                      Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Admin: edit/delete */}
                  {fillMode && (
                    <>
                      <button type="button" onClick={() => startEditQuotation(q)} title="Edit quotation" className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeQuotation(q.uuid)} title="Remove quotation" className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
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

              {/* Vendor + meta */}
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 break-words">
                {q.vendor ? q.vendor.name : '—'}
                {q.valid_until && <span> · valid until {formatDate(q.valid_until)}</span>}
              </p>
              {q.notes && <p className="text-[12px] text-slate-400 mt-1 break-words">Comments: {q.notes}</p>}

              {/* Amount — grand total + amount/tax breakdown, stacked on mobile */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(q.grand_total)}</p>
                  {q.total_amount != null && q.tax_amount != null && (
                    <p className="text-[11px] text-slate-400">
                      {formatCurrency(q.total_amount)} + {formatCurrency(q.tax_amount)} tax
                    </p>
                  )}
                </div>
                {q.status === 'SELECTED' && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Selected</span>
                )}
              </div>

              {/* Quotation line items (read-only) — table on desktop, cards on mobile */}
              {(q.items || []).length > 0 && (
                <>
                  <div className="hidden md:block mt-3 w-full rounded-lg border border-slate-200 dark:border-gray-700">
                    <table className="w-full text-[13px] table-fixed">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                          <th className="px-3 py-2 font-semibold w-[38%]">Item</th>
                          <th className="px-3 py-2 font-semibold text-right w-[13%]">Qty</th>
                          <th className="px-3 py-2 font-semibold text-right w-[16%]">Unit price</th>
                          <th className="px-3 py-2 font-semibold text-right w-[13%]">Tax %</th>
                          <th className="px-3 py-2 font-semibold text-right w-[16%]">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(q.items || []).map((it, idx) => (
                          <tr key={it.uuid ?? idx} className="border-b border-slate-100 dark:border-gray-800 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 break-words">{it.item_name}</td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{it.quantity}</td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{formatCurrency(it.unit_price)}</td>
                            <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{it.tax_rate != null ? `${it.tax_rate}%` : '—'}</td>
                            <td className="px-3 py-2 text-right font-medium text-slate-800 dark:text-slate-200">{formatCurrency(it.total_with_tax)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden mt-3 space-y-1.5">
                    {(q.items || []).map((it, idx) => (
                      <div key={it.uuid ?? idx} className="rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-slate-800 dark:text-slate-200 break-words">{it.item_name}</p>
                          <p className="text-[13px] font-semibold text-slate-900 dark:text-white flex-shrink-0">{formatCurrency(it.total_with_tax)}</p>
                        </div>
                        <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                          Qty {it.quantity} · Unit {formatCurrency(it.unit_price)}
                          {it.tax_rate != null ? ` · Tax ${it.tax_rate}%` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Quotation documents — shown read-only in view; attach/delete only in edit mode */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-gray-800 space-y-2">
                {(q.documents || []).length === 0 ? (
                  <p className="text-[12px] text-slate-400">No documents on this quotation.</p>
                ) : (
                  q.documents.map((d) => (
                    <div key={d.uuid} className="flex items-center justify-between gap-2">
                      <a href={d.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline min-w-0">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{d.original_file_name || d.file_path}</span>
                      </a>
                      {isAdmin && qEditingId === q.uuid && (
                        <button type="button" onClick={() => deleteQuotationDoc(d.uuid)} title="Remove document" className="p-1 text-slate-400 hover:text-red-600 flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}

                {isAdmin && qEditingId === q.uuid && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      ref={qDocRef}
                      type="file"
                      onChange={(e) => setQDoc((prev) => ({ ...prev, [q.uuid]: { file: e.target.files?.[0] || null, uploading: false } }))}
                      className="text-[12px] text-slate-600 dark:text-slate-300 file:mr-2 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-[12px] file:font-semibold file:text-indigo-600"
                    />
                    <button
                      type="button"
                      disabled={Boolean(qDoc[q.uuid]?.uploading)}
                      onClick={() => attachQuotationDoc(q.uuid)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-60 transition-colors"
                    >
                      {qDoc[q.uuid]?.uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Attach document
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
            });
          })()}

          {/* Toggle to reveal the remaining quotations after one is selected */}
          {selectedQuotation && otherQuotations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOtherQuotations((v) => !v)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showOtherQuotations ? 'rotate-180' : ''}`} />
              {showOtherQuotations
                ? 'Hide other quotations'
                : `Show ${otherQuotations.length} other quotation${otherQuotations.length > 1 ? 's' : ''}`}
            </button>
          )}

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
    { label: 'Purchase Intention', num: pi?.document_number, total: pi?.grand_total, uuid: pi?.uuid },
    { label: 'Purchase Request', num: pr?.document_number, total: pr?.grand_total, uuid: pr?.uuid },
    ...quotations.map((q, i) => ({
      label: `Quotation ${i + 1}`,
      num: q.vendor?.name || '—', // quotations no longer carry a title — show vendor
      total: q.grand_total,
      uuid: null, // quotations live on the PR's detail page, no standalone route
    })),
    { label: 'Purchase Order', num: po?.document_number, total: po?.grand_total, uuid: po?.uuid },
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
      {/* Desktop table */}
      <div className="hidden md:block w-full">
        <table className="w-full text-[13px] table-fixed">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
              <th className="px-4 sm:px-6 py-2.5 font-semibold w-[34%]">Stage</th>
              <th className="px-4 py-2.5 font-semibold w-[38%]">Document</th>
              <th className="px-4 sm:px-6 py-2.5 font-semibold text-right w-[17%]">Grand total</th>
              <th className="px-4 sm:px-6 py-2.5 font-semibold text-right w-[11%]">View</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-gray-800 last:border-0">
                <td className="px-4 sm:px-6 py-3 font-medium text-slate-800 dark:text-slate-200 break-words">{s.label}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 break-words">{s.num || '—'}</td>
                <td className="px-4 sm:px-6 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{formatCurrency(s.total)}</td>
                <td className="px-4 sm:px-6 py-3 text-right">
                  {s.uuid ? (
                    <Link to={`/procurement/${s.uuid}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                  ) : (
                    <span className="text-slate-300 dark:text-gray-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-gray-800">
        {stages.map((s, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 break-words">{s.label}</p>
              <p className="text-[12px] text-slate-400 truncate">{s.num || '—'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{formatCurrency(s.total)}</p>
              {s.uuid && (
                <Link to={`/procurement/${s.uuid}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  <Eye className="h-3 w-3" />
                  View
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
