import { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Wallet,
  Plane,
  BedDouble,
  Coins,
  Bus,
  MoreHorizontal,
  FileText,
  ReceiptText,
  Paperclip,
  CheckCircle2,
  XCircle,
  Send,
  Banknote,
  ArrowRightLeft,
  Inbox,
  Loader2,
  ShoppingCart,
  Eye,
  Edit,
  Upload,
  Info,
  Printer,
  Trash2,
  PackageCheck,
} from "lucide-react";
import {
  getExpenseById,
  normalizeExpense,
  approveExpense,
  rejectExpense,
  getExpenseProcurementChain,
  submitExpense,
  resubmitExpense,
  getHandoverRoles,
  getPayments,
  getPaymentSummary,
  recordPayment,
  handoverForPayment,
  getPaymentHandoverRoles,
  updateItemsReceived,
  addExpenseDocument,
  deleteExpenseDocument,
} from "@/services/expenseService";
import { uploadImage } from "@/services/uploadService";
import PurchaseOrderPdfOverlay from "@/components/ui/PurchaseOrderPdf";
import ErrorState from "@/components/ui/ErrorState";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { InfoCard, InfoRow, DetailHeader } from "@/components/ui/detail";
import UserDetailsModal from "@/components/ui/UserDetailsModal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  formatDate,
  formatCurrency,
  formatNumber,
  formatType,
} from "@/utils/format";

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canPay = hasPermission("expenses:pay");
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [acting, setActing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | 'submit'
  const [remarks, setRemarks] = useState("");
  const [handoverRoles, setHandoverRoles] = useState([]);
  const [selectedHandoverRoleId, setSelectedHandoverRoleId] = useState(null);
  const [loadingHandoverRoles, setLoadingHandoverRoles] = useState(false);
  // Procurement chain state (loaded eagerly for procurement expenses)
  const [procurementChain, setProcurementChain] = useState(null);
  const [loadingChain, setLoadingChain] = useState(false);
  // Payment state (APPROVED / PAID expenses only)
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHandoverModal, setShowPaymentHandoverModal] = useState(false);
  const [paymentHandoverRoles, setPaymentHandoverRoles] = useState([]);
  const [loadingPaymentHandoverRoles, setLoadingPaymentHandoverRoles] = useState(false);
  const [selectedPaymentHandoverRoleId, setSelectedPaymentHandoverRoleId] = useState(null);
  const [paymentHandoverRemarks, setPaymentHandoverRemarks] = useState("");
  const [actingPaymentHandover, setActingPaymentHandover] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'approvals' | 'payments'
  // Procurement fulfilment UI — PO PDF preview/upload, received quantities, invoice
  const [showPoPdf, setShowPoPdf] = useState(false);
  const [poPdfUploading, setPoPdfUploading] = useState(false);
  const [receivedDraft, setReceivedDraft] = useState(null); // { itemId: received_quantity } while editing
  const [savingReceived, setSavingReceived] = useState(false);
  const [invoiceUploading, setInvoiceUploading] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const toast = useToast();

  const loadExpense = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getExpenseById(id);
      const normalized = normalizeExpense(data?.data);
      setExpense(normalized);

      // If this is a procurement expense, eagerly load the chain to show selected quotation
      if (normalized?.isProcurement) {
        setLoadingChain(true);
        try {
          const { data: chainData } = await getExpenseProcurementChain(id);
          setProcurementChain(chainData?.data?.procurement_chain || null);
        } catch (e) {
          console.error("Failed to load procurement chain:", e);
          setProcurementChain(null);
        } finally {
          setLoadingChain(false);
        }
      }

      // Load payment history + summary when the expense is approved, in payment, or
      // settled (COMPLETED) so the settled state can still be reviewed.
      if (["APPROVED", "PAID", "COMPLETED"].includes(normalized?.status)) {
        setLoadingPayments(true);
        try {
          const [payRes, sumRes] = await Promise.all([
            getPayments(id),
            getPaymentSummary(id),
          ]);
          setPayments(payRes?.data?.data ?? []);
          setPaymentSummary(sumRes?.data?.data ?? null);
        } catch (e) {
          console.error("Failed to load payments:", e);
          setPayments([]);
          setPaymentSummary(null);
        } finally {
          setLoadingPayments(false);
        }
      } else {
        setPayments([]);
        setPaymentSummary(null);
      }
    } catch (e) {
      if (e?.response?.status === 404) {
        setExpense(null);
        setError("This expense does not exist.");
      } else {
        setError(e?.response?.data?.message || "Failed to load this expense.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadExpense();
  }, [loadExpense]);

  const loadHandoverRoles = useCallback(async () => {
    setLoadingHandoverRoles(true);
    try {
      const { data } = await getHandoverRoles(id);
      setHandoverRoles(data?.data ?? []);
    } catch (e) {
      console.error("Failed to load handover roles:", e);
      setHandoverRoles([]);
    } finally {
      setLoadingHandoverRoles(false);
    }
  }, [id]);

  // Refresh payment history + summary after recording a payment
  const refreshPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const [payRes, sumRes] = await Promise.all([
        getPayments(id),
        getPaymentSummary(id),
      ]);
      setPayments(payRes?.data?.data ?? []);
      setPaymentSummary(sumRes?.data?.data ?? null);
    } catch (e) {
      console.error("Failed to refresh payments:", e);
    } finally {
      setLoadingPayments(false);
    }
  }, [id]);

  const isFinalApprover = expense?.category?.finalApproverRole?.id &&
    expense?.currentRole?.code === expense.category.finalApproverRole.code;

  const isCurrentHandler = user?.role === expense?.currentRole?.code;

  // ── Procurement fulfillment context ──
  const isProcurement = expense?.isProcurement === true;
  const isProcAdmin =
    isProcurement && (user?.role === "ADMIN_MGR" || user?.role === "SUPER_ADMIN");
  const chainPo = procurementChain?.po || null;
  // The chain's PO node now carries company / vendor_record / requester / items with
  // item_name — enough to render the same A4 sheet the procurement detail uses.
  const poForPdf = chainPo
    ? {
        ...chainPo,
        vendor: chainPo.vendor_record || {},
        items: (chainPo.items || []).map((it) => ({
          ...it,
          item_name: it.item_name ?? it.name,
        })),
      }
    : null;
  const poPdfDocs = (expense?.documents || []).filter((d) => d.module_name === "PO_PDF");
  const invoiceDocs = (expense?.documents || []).filter((d) => d.module_name === "INVOICE");
  // Approval ladder served from the backend (expense_flow_steps) — procurement
  // runs a fixed ordered chain, so the UI never hardcodes the steps.
  const flowSteps = (expense?.category?.flow_steps || []).slice();
  const flowStep = flowSteps.find((s) => s.position === expense?.flow_position);
  const nextFlowStep = isProcurement
    ? flowSteps.find((s) => s.position === (expense?.flow_position || 0) + 1)
    : null;

  const loadPaymentHandoverRoles = useCallback(async () => {
    setLoadingPaymentHandoverRoles(true);
    try {
      const { data } = await getPaymentHandoverRoles(id);
      setPaymentHandoverRoles(data?.data ?? []);
    } catch (e) {
      console.error("Failed to load payment handover roles:", e);
      setPaymentHandoverRoles([]);
    } finally {
      setLoadingPaymentHandoverRoles(false);
    }
  }, [id]);

  const handlePaymentHandover = async () => {
    if (!selectedPaymentHandoverRoleId) return;
    setActingPaymentHandover(true);
    try {
      await handoverForPayment(id, {
        to_role_id: selectedPaymentHandoverRoleId,
        remarks: paymentHandoverRemarks || null,
      });
      toast.success("Expense handed over for payment");
      setShowPaymentHandoverModal(false);
      setSelectedPaymentHandoverRoleId(null);
      setPaymentHandoverRemarks("");
      setPaymentHandoverRoles([]);
      loadExpense();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to handover for payment.");
    } finally {
      setActingPaymentHandover(false);
    }
  };

  const handleApproveClick = useCallback(async () => {
    // Procurement expenses follow a fixed step ladder (no handover dropdown) — see
    // the contextual banner in the confirm modal.
    if (expense?.isProcurement) {
      setHandoverRoles([]);
      setConfirmAction("approve");
      return;
    }
    // If current handler is the final approver, don't load handover roles —
    // the expense will be closed as APPROVED regardless of any selection
    if (!isFinalApprover) {
      await loadHandoverRoles();
    } else {
      setHandoverRoles([]);
    }
    setConfirmAction("approve");
  }, [loadHandoverRoles, isFinalApprover, expense?.isProcurement]);

  const runAction = async (key, actionRemarks) => {
    setActing(true);
    try {
      if (key === "submit") await submitExpense(id, actionRemarks);
      else if (key === "resubmit") await resubmitExpense(id, actionRemarks);
      else if (key === "approve")
        await approveExpense(id, actionRemarks, selectedHandoverRoleId);
      else if (key === "reject") await rejectExpense(id, actionRemarks);
      toast.success(
        key === "submit"
          ? "Expense submitted"
          : key === "resubmit"
            ? "Expense resubmitted for approval"
            : key === "approve"
              ? "Expense approved"
              : "Expense rejected",
      );
      setConfirmAction(null);
      setRemarks("");
      setSelectedHandoverRoleId(null);
      setHandoverRoles([]);
      loadExpense();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed.");
    } finally {
      setActing(false);
    }
  };

  // ── Procurement fulfillment handlers ──

  const startEditReceived = () => {
    const draft = {};
    (chainPo?.items || []).forEach((it) => {
      draft[it.id] = Number(it.received_quantity) || 0;
    });
    setReceivedDraft(draft);
  };

  const saveReceived = async () => {
    setSavingReceived(true);
    try {
      const items = Object.entries(receivedDraft || {}).map(
        ([itemId, qty]) => ({
          procurement_item_id: Number(itemId),
          received_quantity: Number(qty) || 0, // backend clamps to 0..ordered qty
        }),
      );
      await updateItemsReceived(id, items);
      toast.success("Received quantities updated");
      setReceivedDraft(null);
      await loadExpense();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update received quantities.");
    } finally {
      setSavingReceived(false);
    }
  };

  // Upload a signed PO PDF or vendor invoice: POST /uploads first, then register the
  // expense_document row (module_name = PO_PDF / INVOICE, module_record_id null).
  const handleDocumentUpload = async (file, documentType) => {
    if (!file) return;
    if (documentType === "PO_PDF") setPoPdfUploading(true);
    else setInvoiceUploading(true);
    try {
      const { data: up } = await uploadImage(file, "expenses");
      const url = up?.data?.url || up?.url;
      if (!url) throw new Error("Upload failed — no file URL returned");
      await addExpenseDocument(id, {
        document_type: documentType,
        url,
        original_file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });
      toast.success(documentType === "PO_PDF" ? "PO PDF uploaded" : "Invoice uploaded");
      await loadExpense();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to upload document.");
    } finally {
      setPoPdfUploading(false);
      setInvoiceUploading(false);
    }
  };

  const handleDeleteDocument = async (documentUuid) => {
    setDeletingDoc(documentUuid);
    try {
      await deleteExpenseDocument(id, documentUuid);
      toast.success("Document removed");
      await loadExpense();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to remove document.");
    } finally {
      setDeletingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DetailHeader
          icon={Wallet}
          title="Loading expense..."
          onBack={() => navigate("/expenses/my")}
        />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DetailHeader
          icon={Wallet}
          title="Expense not found"
          onBack={() => navigate("/expenses/my")}
        />
        {error && expense === null ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
            <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {error}
            </p>
          </div>
        ) : (
          <ErrorState message={error} onRetry={loadExpense} />
        )}
      </div>
    );
  }

  const travel = expense.travel;

  const submittedBy = expense.requestedByEmployment?.user;
  const submittedByName = submittedBy
    ? [submittedBy.first_name, submittedBy.last_name]
        .filter(Boolean)
        .join(" ") || submittedBy.email
    : null;

  // Top-level tabs — procurement stages (PI → PR → Quotations → PO) appear between
  // Overview and Approvals only for procurement-linked expenses.
  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    ...(expense.isProcurement
      ? [
          { id: "pi", label: "Purchase Intent", icon: Send },
          { id: "pr", label: "Purchase Request", icon: FileText },
          {
            id: "quotes",
            label: "Quotations",
            icon: ReceiptText,
            count: (procurementChain?.quotations || []).length,
          },
          { id: "po", label: "Purchase Order", icon: ShoppingCart },
          { id: "invoice", label: "Invoice", icon: ReceiptText, count: invoiceDocs.length },
        ]
      : []),
    { id: "approvals", label: "Approvals", icon: ArrowRightLeft },
    { id: "payments", label: "Payments", icon: Banknote },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <DetailHeader
        icon={Wallet}
        title={expense.title}
        onBack={() => navigate("/expenses/my")}
        editTo={expense.canEdit || expense.status === "REJECTED" ? `/expenses/${expense.uuid}/edit` : undefined}
        editPermission="expenses:update"
      />

      {/* Amount summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AmountCard
          label="Estimated"
          value={formatCurrency(expense.estimated_amount)}
        />
        <AmountCard
          label="Final"
          value={formatCurrency(expense.final_amount)}
        />
        <AmountCard label="Paid" value={formatCurrency(expense.paid_amount)} />
      </div>

      {/* Meta strip */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 sm:p-5 flex flex-wrap items-center gap-3 sm:gap-4">
        <StatusBadge status={expense.status} />
        <CategoryBadge name={expense.category?.name} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            {expense.expense_number}
          </p>
          <p className="text-[12px] text-slate-400 truncate">
            {expense.company?.name || "—"}
          </p>
        </div>
      </div>

      {/* Tabs — Overview [PI | PR | Quotations | PO] Approvals Payments.
          flex-wrap (not overflow-x-auto) so the tab strip reflows to multiple rows
          on narrow screens instead of forcing a horizontal scrollbar. */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 dark:bg-gray-800 p-1">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${active
                ? "bg-white dark:bg-gray-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count != null && (
                <span className="text-[11px] text-slate-400">({t.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* === Overview tab: expense details, line items, procurement history, documents === */}
      {activeTab === "overview" && (
        <>
      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseContextCard
          expense={expense}
          submittedByName={submittedByName}
          onViewUser={() => setViewUser(expense.requestedByEmployment)}
        />

        {travel ? (
          <InfoCard icon={Plane} title="Travel">
            <InfoRow label="Type" value={formatType(travel.travel_type)} />
            <InfoRow label="Purpose" value={travel.purpose || "—"} />
            <InfoRow
              label="Dates"
              value={`${travel.travel_start_date || "—"} → ${travel.travel_end_date || "—"}`}
            />
            <InfoRow label="Travellers" value={travel.total_travellers} />
            <InfoRow label="Notes" value={travel.notes || "—"} />
          </InfoCard>
        ) : expense.reimbursement ? (
          <InfoCard icon={ReceiptText} title="Reimbursement">
            <InfoRow
              label="Advance received"
              value={formatCurrency(expense.reimbursement.advance_amount)}
            />
            <InfoRow
              label="Advance date"
              value={
                expense.reimbursement.advance_date
                  ? formatDate(expense.reimbursement.advance_date)
                  : "—"
              }
            />
            <InfoRow
              label="Payment method"
              value={expense.reimbursement.payment_method || "—"}
            />
            <InfoRow
              label="Total expense"
              value={formatCurrency(reimbursementTotal(expense.reimbursement))}
            />
            <InfoRow
              label="Balance"
              value={formatCurrency(
                reimbursementBalance(expense.reimbursement),
              )}
            />
            <InfoRow
              label="Attachments"
              value={
                <AttachmentsChips
                  attachments={expense.reimbursement.attachments}
                />
              }
            />
          </InfoCard>
        ) : null}
      </div>

      {/* Travel breakdown */}
      {travel && (
        <>
          {travel.segments.length > 0 && (
          <TravelSection icon={Plane} title="Segments">
            {travel.segments.length === 0 ? (
              <EmptyText label="No segments" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.segments.map((s, i) => (
                    <MobileCard
                      key={i}
                      title={formatType(s.travel_mode)}
                      amount={formatCurrency(s.estimated_amount)}
                      attachments={s.attachments}
                      grid={false}
                    >
                      <RouteText from={s.from_location} to={s.to_location} />
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <CardField
                          label="Departure"
                          value={formatDateTime(s.departure_datetime)}
                        />
                        <CardField
                          label="Arrival"
                          value={formatDateTime(s.arrival_datetime)}
                        />
                      </div>
                    </MobileCard>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">Mode</th>
                        <th className="py-2 pr-3">Route</th>
                        <th className="py-2 pr-3">Departure</th>
                        <th className="py-2 pr-3">Arrival</th>
                        <th className="py-2 text-right">Amount</th>
                        <th className="py-2 pl-3 text-right">Attachments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {travel.segments.map((s, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatType(s.travel_mode)}
                          </td>
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                            {s.from_location} → {s.to_location}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatDateTime(s.departure_datetime)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatDateTime(s.arrival_datetime)}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                            {formatCurrency(s.estimated_amount)}
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="flex justify-end">
                              <AttachmentsChips attachments={s.attachments} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>
          )}

          {travel.accommodations.length > 0 && (
          <TravelSection icon={BedDouble} title="Accommodations">
            {travel.accommodations.length === 0 ? (
              <EmptyText label="No accommodations" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.accommodations.map((a, i) => (
                    <MobileCard
                      key={i}
                      title={a.hotel || a.city || "—"}
                      amount={formatCurrency(a.estimated_amount)}
                      attachments={a.attachments}
                    >
                      <CardField label="City" value={a.city || "—"} />
                      <CardField
                        label="Check-in"
                        value={formatDate(a.check_in)}
                      />
                      <CardField
                        label="Check-out"
                        value={formatDate(a.check_out)}
                      />
                    </MobileCard>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">Property</th>
                        <th className="py-2 pr-3">City</th>
                        <th className="py-2 pr-3">Check-in</th>
                        <th className="py-2 pr-3">Check-out</th>
                        <th className="py-2 text-right">Amount</th>
                        <th className="py-2 pl-3 text-right">Attachments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {travel.accommodations.map((a, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                            {a.hotel || a.city || "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {a.city || "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatDate(a.check_in)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatDate(a.check_out)}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                            {formatCurrency(a.estimated_amount)}
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="flex justify-end">
                              <AttachmentsChips attachments={a.attachments} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>
          )}

          {travel.forex.length > 0 && (
          <TravelSection icon={Coins} title="Forex">
            {travel.forex.length === 0 ? (
              <EmptyText label="No forex" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.forex.map((f, i) => (
                    <MobileCard
                      key={i}
                      title={f.currency || "—"}
                      amount={formatCurrency(f.amount)}
                      attachments={f.attachments}
                    >
                      <CardField
                        label="Rate"
                        value={f.rate != null ? f.rate : "—"}
                      />
                      <CardField
                        label="Foreign amount"
                        value={formatNumber(f.foreignAmount)}
                      />
                    </MobileCard>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">Currency</th>
                        <th className="py-2 pr-3">Exchange rate</th>
                        <th className="py-2 pr-3">Foreign amount</th>
                        <th className="py-2 text-right">Amount</th>
                        <th className="py-2 pl-3 text-right">Attachments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {travel.forex.map((f, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                            {f.currency || "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {f.rate != null ? f.rate : "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatNumber(f.foreignAmount)}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                            {formatCurrency(f.amount)}
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="flex justify-end">
                              <AttachmentsChips attachments={f.attachments} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>
          )}

          {travel.localTransports.length > 0 && (
          <TravelSection icon={Bus} title="Local Transport">
            {travel.localTransports.length === 0 ? (
              <EmptyText label="No local transport" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.localTransports.map((t, i) => (
                    <MobileCard
                      key={i}
                      title={formatType(t.mode)}
                      amount={formatCurrency(t.estimated_amount)}
                      attachments={t.attachments}
                    >
                      <CardField
                        label="Route"
                        value={
                          <RouteText from={t.fromLocation} to={t.toLocation} />
                        }
                      />
                      <CardField
                        label="Time"
                        value={formatDateTime(t.travel_datetime)}
                      />
                    </MobileCard>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">Mode</th>
                        <th className="py-2 pr-3">Route</th>
                        <th className="py-2 pr-3">Travel time</th>
                        <th className="py-2 text-right">Amount</th>
                        <th className="py-2 pl-3 text-right">Attachments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {travel.localTransports.map((t, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                            {formatType(t.mode)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {t.description || "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatDateTime(t.travel_datetime)}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                            {formatCurrency(t.estimated_amount)}
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="flex justify-end">
                              <AttachmentsChips attachments={t.attachments} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>
          )}

          {travel.miscExpenses.length > 0 && (
          <TravelSection icon={MoreHorizontal} title="Miscellaneous">
            {travel.miscExpenses.length === 0 ? (
              <EmptyText label="No miscellaneous expenses" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.miscExpenses.map((m, i) => (
                    <MobileCard
                      key={i}
                      title={m.description || "—"}
                      amount={formatCurrency(m.estimated_amount)}
                      attachments={m.attachments}
                    >
                      <CardField
                        label="Date"
                        value={formatDate(m.expense_date)}
                      />
                      <CardField label="Vendor" value={m.vendor_name || "—"} />
                    </MobileCard>
                  ))}
                </div>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Vendor</th>
                        <th className="py-2 text-right">Amount</th>
                        <th className="py-2 pl-3 text-right">Attachments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                      {travel.miscExpenses.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                            {m.description || "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {formatDate(m.expense_date)}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                            {m.vendor_name || "—"}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                            {formatCurrency(m.estimated_amount)}
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="flex justify-end">
                              <AttachmentsChips attachments={m.attachments} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>
          )}
        </>
      )}

      {/* Reimbursement breakdown */}
      {expense.reimbursement && (
        <TravelSection icon={ReceiptText} title="Reimbursement Items">
          {expense.reimbursement.items.length === 0 ? (
            <EmptyText label="No items" />
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {expense.reimbursement.items.map((it, i) => (
                  <MobileCard
                    key={i}
                    title={it.description}
                    amount={formatCurrency(it.total_amount)}
                    attachments={it.attachments}
                  >
                    <CardField
                      label="Date"
                      value={formatDate(it.expense_date)}
                    />
                    <CardField label="Bill no." value={it.bill_number || "—"} />
                    <CardField label="Type" value={it.expense_type || "—"} />
                  </MobileCard>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Description</th>
                      <th className="py-2 pr-3">Bill No.</th>
                      <th className="py-2 pr-3">Exps. Type</th>
                      <th className="py-2 text-right">Total (₹)</th>
                      <th className="py-2 pl-3 text-right">Attachments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                    {expense.reimbursement.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                          {formatDate(it.expense_date)}
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                          {it.description}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                          {it.bill_number || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">
                          {it.expense_type || "—"}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                          {formatCurrency(it.total_amount)}
                        </td>
                        <td className="py-2.5 pl-3">
                          <div className="flex justify-end">
                            <AttachmentsChips attachments={it.attachments} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TravelSection>
      )}

      {/* Documents */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Documents
            </h3>
            <p className="text-[12px] text-slate-400">
              {expense.documents.length} file
              {expense.documents.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4">
          {expense.documents.length === 0 ? (
            <p className="text-[13px] text-slate-400">No documents attached.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {expense.documents.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[12px] text-slate-600 dark:text-slate-300"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* === Purchase Intent tab (procurement-linked expenses only) === */}
      {activeTab === "pi" && (
        <ProcurementStage loading={loadingChain} available={Boolean(procurementChain)}>
          <ProcurementDocCard title="Purchase Intention" doc={procurementChain?.pi} />
        </ProcurementStage>
      )}

      {/* === Purchase Request tab === */}
      {activeTab === "pr" && (
        <ProcurementStage loading={loadingChain} available={Boolean(procurementChain)}>
          <ProcurementDocCard title="Purchase Request" doc={procurementChain?.pr} />
        </ProcurementStage>
      )}

      {/* === Quotations tab === */}
      {activeTab === "quotes" && (
        <ProcurementStage loading={loadingChain} available={Boolean(procurementChain)}>
          <QuotationsTab chain={procurementChain} />
        </ProcurementStage>
      )}

      {/* === Purchase Order tab: doc card + signed-PO-PDF store + received quantities === */}
      {activeTab === "po" && (
        <ProcurementStage loading={loadingChain} available={Boolean(procurementChain)}>
          <ProcurementDocCard title="Purchase Order" doc={chainPo} />

          {/* PO document — preview the A4 sheet admin generates in procurement, then
              upload the signed copy against the expense (module_name = PO_PDF). */}
          <div className="rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-slate-400" />
                <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                  PO Document
                </h4>
              </div>
              <button
                type="button"
                disabled={!chainPo}
                onClick={() => setShowPoPdf(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                View / Print PO PDF
              </button>
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-3">
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Review the purchase order, save it as a PDF, get it signed by the vendor,
                then upload the signed copy here for the audit trail.
              </p>
              {isProcAdmin && (
                <UploadDocRow
                  label="Upload signed PO PDF"
                  uploading={poPdfUploading}
                  onFile={(f) => handleDocumentUpload(f, "PO_PDF")}
                />
              )}
              {poPdfDocs.length === 0 ? (
                <p className="text-[12px] text-slate-400">No signed PO PDF uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {poPdfDocs.map((d) => (
                    <DocFileRow
                      key={d.uuid}
                      doc={d}
                      deletable={isProcAdmin && expense.status !== "COMPLETED"}
                      deleting={deletingDoc === d.uuid}
                      onDelete={() => handleDeleteDocument(d.uuid)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Received quantities — the procurement admin marks delivered quantities on
              the linked PO items while the expense is SUBMITTED. Payment cannot begin
              until every item is fully received. */}
          {isProcAdmin && expense.status === "SUBMITTED" && chainPo?.items?.length > 0 && (
            <ReceivedItemsEditor
              items={chainPo.items}
              draft={receivedDraft}
              saving={savingReceived}
              onChange={(itemId, qty) =>
                setReceivedDraft((prev) => ({ ...prev, [itemId]: qty }))
              }
              onStartEdit={startEditReceived}
              onSave={saveReceived}
              onCancel={() => setReceivedDraft(null)}
            />
          )}
        </ProcurementStage>
      )}

      {/* === Invoice tab: vendor invoice attached to the expense (module_name = INVOICE) === */}
      {activeTab === "invoice" && (
        <ProcurementStage loading={loadingChain} available={Boolean(procurementChain)}>
          <div className="rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
              <div className="flex items-center gap-2 min-w-0">
                <ReceiptText className="h-4 w-4 text-slate-400" />
                <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                  Invoice
                </h4>
              </div>
              {isProcAdmin && expense.status !== "COMPLETED" && (
                <UploadDocRow
                  label="Upload invoice"
                  uploading={invoiceUploading}
                  onFile={(f) => handleDocumentUpload(f, "INVOICE")}
                />
              )}
            </div>
            <div className="px-4 sm:px-6 py-4 space-y-3">
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Attach the vendor's invoice for this purchase order.
              </p>
              {invoiceDocs.length === 0 ? (
                <p className="text-[12px] text-slate-400">No invoice uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {invoiceDocs.map((d) => (
                    <DocFileRow
                      key={d.uuid}
                      doc={d}
                      deletable={isProcAdmin && expense.status !== "COMPLETED"}
                      deleting={deletingDoc === d.uuid}
                      onDelete={() => handleDeleteDocument(d.uuid)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </ProcurementStage>
      )}

      {/* === Approvals tab: workflow actions + approval trail timeline === */}
      {activeTab === "approvals" && (
        <>
          {expense.status === "DRAFT" && expense.canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton
                icon={Send}
                label="Submit expense"
                tone="primary"
                disabled={acting}
                onClick={() => setConfirmAction("submit")}
              />
              <span className="text-[12px] text-slate-400">
                This expense is still a draft — submit it to send it to the first
                approver.
              </span>
            </div>
          )}

          {expense.status === "REJECTED" && expense.canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton
                icon={Edit}
                label="Edit expense"
                tone="secondary"
                disabled={acting}
                onClick={() => navigate(`/expenses/${expense.uuid}/edit`)}
              />
              <ActionButton
                icon={Loader2}
                label="Resubmit for approval"
                tone="primary"
                disabled={acting}
                onClick={() => setConfirmAction("resubmit")}
              />
              <span className="text-[12px] text-slate-400">
                Expense was rejected — edit if needed, then resubmit to send it through the approval flow again.
              </span>
            </div>
          )}

          {isProcurement && expense.status === "REJECTED" && isProcAdmin && !expense.canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton
                icon={Loader2}
                label="Restart approval flow"
                tone="primary"
                disabled={acting}
                onClick={() => setConfirmAction("resubmit")}
              />
              <span className="text-[12px] text-slate-400">
                Rejected by the procurement chain — as the procurement admin you can restart
                the 7-step approval flow from the CFO.
              </span>
            </div>
          )}

          {expense.status === "SUBMITTED" &&
            (user?.role === "SUPER_ADMIN" ||
              user?.role === expense.currentRole?.code) && (
              <div className="flex flex-wrap items-center gap-2">
                <ActionButton
                  icon={CheckCircle2}
                  label="Approve"
                  tone="success"
                  disabled={acting}
                  onClick={handleApproveClick}
                />
                <ActionButton
                  icon={XCircle}
                  label="Reject"
                  tone="danger"
                  disabled={acting}
                  onClick={() => setConfirmAction("reject")}
                />
                {(expense.currentRole?.name || expense.currentRole?.code) && (
                  <span className="text-[12px] text-slate-400">
                    Current handler:{" "}
                    {expense.currentRole.name || expense.currentRole.code}
                  </span>
                )}
              </div>
            )}

          <ApprovalTrail
            handovers={[
              ...(procurementChain?.handovers || []).map((h) => ({
                action_type: h.action_type,
                remarks: h.remarks,
                from_role: h.from_role,
                to_role: h.to_role,
                action_by: h.action_by,
                at: h.created_at,
                sourceLabel: "Procurement chain",
              })),
              ...(expense.handovers || []).map((h) => ({
                ...h,
                ...(procurementChain ? { sourceLabel: "Expense" } : {}),
              })),
            ]
              .filter((h) => h.at)
              .sort((a, b) => new Date(b.at) - new Date(a.at))}
          />
        </>
      )}

      {/* === Payments tab: payment summary, history, recording + handover === */}
      {activeTab === "payments" && (
        <>
          {expense.status === "APPROVED" || expense.status === "PAID" || expense.status === "COMPLETED" ? (
            <>
              <PaymentSection
                expense={expense}
                canPay={canPay}
                isCurrentHandler={isCurrentHandler}
                payments={payments}
                summary={paymentSummary}
                loading={loadingPayments}
                onRecord={() => setShowPaymentModal(true)}
              />

              {isCurrentHandler &&
                !["SETTLED", "PAID"].includes(expense.payment_status) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {canPay && (
                      <ActionButton
                        icon={Banknote}
                        label="Record Payment"
                        tone="success"
                        disabled={acting}
                        onClick={() => setShowPaymentModal(true)}
                      />
                    )}
                    <ActionButton
                      icon={ArrowRightLeft}
                      label="Handover for Payment"
                      tone="primary"
                      disabled={acting}
                      onClick={() => {
                        setSelectedPaymentHandoverRoleId(null);
                        setPaymentHandoverRemarks("");
                        loadPaymentHandoverRoles();
                        setShowPaymentHandoverModal(true);
                      }}
                    />
                    <span className="text-[12px] text-slate-400">
                      This expense needs payment processing.
                    </span>
                  </div>
                )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Payments
                  </h3>
                  <p className="text-[12px] text-slate-400">
                    No payment information yet
                  </p>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-8 text-center">
                <p className="text-[13px] text-slate-400">
                  Payments only begin after this expense is approved.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Record payment modal — amount + method + date + type + optional proofs */}
      {showPaymentModal && (
        <RecordPaymentModal
          expense={expense}
          summary={paymentSummary}
          onClose={() => setShowPaymentModal(false)}
          onSaved={async () => {
            setShowPaymentModal(false);
            await refreshPayments();
            await loadExpense();
          }}
        />
      )}

      {/* Handover for payment modal — requester forwards to a payment-eligible role */}
      {showPaymentHandoverModal && (
        <PaymentHandoverModal
          expense={expense}
          roles={paymentHandoverRoles}
          loading={loadingPaymentHandoverRoles}
          acting={actingPaymentHandover}
          selectedRoleId={selectedPaymentHandoverRoleId}
          onSelectRole={setSelectedPaymentHandoverRoleId}
          remarks={paymentHandoverRemarks}
          onRemarksChange={setPaymentHandoverRemarks}
          onClose={() => setShowPaymentHandoverModal(false)}
          onSave={handlePaymentHandover}
        />
      )}

      {/* A4 Purchase Order preview — same reusable sheet the procurement detail uses,
          fed from the enriched chain PO node (company / vendor_record / requester). */}
      <PurchaseOrderPdfOverlay
        po={poForPdf}
        open={showPoPdf}
        onClose={() => setShowPoPdf(false)}
      />

      <UserDetailsModal
        employment={viewUser}
        onClose={() => setViewUser(null)}
      />

      {/* Confirm submit/approve/reject with optional remark and handover role selection */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setConfirmAction(null);
            setSelectedHandoverRoleId(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {confirmAction === "submit"
                ? "Submit expense"
                : confirmAction === "approve"
                  ? "Approve expense"
                  : confirmAction === "reject"
                    ? "Reject expense"
                    : "Resubmit expense"}
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {confirmAction === "submit"
                ? "Send this expense to the category's first approver for review."
                : confirmAction === "approve"
                  ? "Forward to the next approver (or close as approved at the final approver)."
                  : confirmAction === "reject"
                    ? "Mark this expense as rejected and clear the current handler."
                    : "Resubmit this expense to restart the approval flow."}
            </p>
            {confirmAction === "approve" && isProcurement && (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                    {flowStep?.final
                      ? "Final approval — the payment manager processes payment once all PO items are received."
                      : nextFlowStep
                        ? `Next step: ${nextFlowStep.label} (${nextFlowStep.role}).`
                        : "This expense will continue routing through the approval chain."}
                  </span>
                </div>
                {flowStep?.role === "ADMIN_MGR" && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Requirement before advancing: every PO item marked as received and the
                    vendor invoice uploaded.
                  </p>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  This expense follows a fixed {flowSteps.length}-step chain —{" "}
                  {flowSteps.map((s) => s.label).join(" → ")}. No handover selection needed.
                </p>
              </div>
            )}
            {confirmAction === "approve" && !isProcurement && isFinalApprover && (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    You are the final approver — this expense will be closed as <strong>APPROVED</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No handover selection needed. Your approval finalizes this expense.
                </p>
              </div>
            )}
            {confirmAction === "approve" && !isFinalApprover && handoverRoles.length > 0 && (
              <div className="space-y-1">
                <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
                  Handover to role <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedHandoverRoleId || ""}
                  onChange={(e) =>
                    setSelectedHandoverRoleId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors"
                  required
                >
                  <option value="">Select handover role</option>
                  {handoverRoles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.roleName} ({role.roleCode})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Choose who to forward this expense to. Valid handovers are
                  configured in Role Handover Rules.
                </p>
              </div>
            )}
            {confirmAction === "approve" && !isProcurement && !isFinalApprover &&
              handoverRoles.length === 0 &&
              !loadingHandoverRoles && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  No valid handover roles configured. Expense will be sent to
                  the final approver.
                </p>
              )}
            {confirmAction === "approve" && loadingHandoverRoles && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                <span className="ml-2 text-[12px] text-slate-400">
                  Loading handover roles...
                </span>
              </div>
            )}
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks (optional)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmAction(null);
                  setSelectedHandoverRoleId(null);
                }}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  acting ||
                  (confirmAction === "approve" &&
                    handoverRoles.length > 0 &&
                    !selectedHandoverRoleId) ||
                  (confirmAction === "submit" && expense.status !== "DRAFT") ||
                  (confirmAction === "reject" && expense.status !== "SUBMITTED") ||
                  (confirmAction === "resubmit" && expense.status !== "REJECTED")
                }
                onClick={() => runAction(confirmAction, remarks)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 transition-colors ${
                  confirmAction === "submit"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : confirmAction === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : confirmAction === "approve"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {acting && <Loader2 className="h-4 w-4 animate-spin" />}
                {acting
                  ? "Working..."
                  : confirmAction === "submit"
                    ? "Submit"
                    : confirmAction === "approve"
                      ? "Approve"
                      : confirmAction === "reject"
                        ? "Reject"
                        : "Resubmit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Presentational helpers ──

function AmountCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

// Color + label for each unified payment status (mirrors the backend ENUM)
const PAYMENT_STATUS_META = {
  UNPAID: { label: "Unpaid", cls: "bg-slate-100 text-slate-600 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20" },
  PARTIAL_PAID: { label: "Partially paid", cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-400/20" },
  PAID: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-400/20" },
  ADVANCE_REFUND_DUE: { label: "Advance refund due", cls: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-400/20" },
  ADDITIONAL_PAYMENT_DUE: { label: "Additional payment due", cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-400/20" },
  SETTLED: { label: "Settled", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-400/20" },
};

// Payment TYPE is direction-aware: tells whether money flowed company→user (a
// disbursement toward the expense) or user→company (a refund of an over-advanced
// amount). Labels make that direction obvious on the payment history.
const PAYMENT_TYPE_META = {
  PARTIAL: { label: "Company → You", cls: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-400/20" },
  FULL: { label: "Company → You", cls: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-400/20" },
  ADDITIONAL: { label: "Company → You", cls: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-400/20" },
  ADVANCE_REFUND: { label: "You → Company", cls: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-400/20" },
  REFUND_RECEIVED: { label: "You → Company", cls: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-400/20" },
};

function PaymentTypeBadge({ type }) {
  const meta = PAYMENT_TYPE_META[type];
  if (!meta) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300">
        {String(type || "").toLowerCase().replace(/_/g, " ")}
      </span>
    );
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

// The unified payment block on an APPROVED (or PAID) expense: summary of final / advance /
// paid / pending, the "Record Payment" action (expenses:pay only), and the payment trail
// with uploaded proofs.
function PaymentSection({ expense, canPay, isCurrentHandler, payments, summary, loading, onRecord }) {
  const status = expense.status;
  // Advances apply only to reimbursement expenses — hide the stat for travel/procurement.
  const hasAdvance = Boolean(expense?.reimbursement);
  const receivable =
    summary?.amount_due != null
      ? Number(summary.amount_due)
      : (Number(expense.final_amount) || 0) - (Number(expense.paid_amount) || 0);
  const settlable = ["SETTLED", "PAID"].includes(expense.payment_status);
  const showRecordPayment = status === "APPROVED" && canPay && isCurrentHandler && !settlable;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Banknote className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Payments
            </h3>
            <p className="text-[12px] text-slate-400 flex items-center gap-2">
              <PaymentStatusBadge status={expense.payment_status || (status === "PAID" ? "PAID" : "UNPAID")} />
            </p>
          </div>
        </div>
        {showRecordPayment && (
          <ActionButton
            icon={Banknote}
            label="Record Payment"
            tone="success"
            onClick={onRecord}
          />
        )}
      </div>

      {/* Computed summary — the pending/refund math comes straight from the backend */}
      <div className="px-4 sm:px-6 py-5">
        {summary ? (
          <div className={`grid grid-cols-2 gap-4 mb-6 ${hasAdvance ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <PaymentStat label="Final amount" value={formatCurrency(Number(summary.final_amount))} />
            {hasAdvance && <PaymentStat label="Advance amount" value={formatCurrency(Number(summary.advance_amount))} />}
            <PaymentStat label="Paid amount" value={formatCurrency(Number(summary.paid_amount))} />
            <PaymentStat
              label={summary.is_over_advance ? "User owes (refund)" : "Pending payment"}
              value={formatCurrency(receivable)}
              emphasis={Number(receivable) > 0}
            />
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-4 mb-6 ${hasAdvance ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <PaymentStat label="Final amount" value={formatCurrency(expense.final_amount)} />
            {hasAdvance && <PaymentStat label="Advance amount" value={formatCurrency(expense.advance_amount)} />}
            <PaymentStat label="Paid amount" value={formatCurrency(expense.paid_amount)} />
            <PaymentStat label="Pending payment" value={formatCurrency(receivable)} emphasis={receivable > 0} />
          </div>
        )}

        {/* Payment history */}
        <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Payment history
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-[13px] text-slate-400">
            No payments recorded yet
            {status === "APPROVED" && canPay ? " — use Record Payment to make an installment." : "."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-gray-800">
            {payments.map((p, i) => (
              <li key={p.uuid ?? i} className="py-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(Number(p.amount))}
                    </span>
                    <PaymentTypeBadge type={p.payment_type} />
                    {p.reference_number && (
                      <span className="text-[12px] text-slate-400 font-mono">
                        Ref: {p.reference_number}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {p.payment_method} · {formatDate(p.payment_date)}
                  </p>
                  {p.remarks && (
                    <p className="text-[12px] text-slate-400 mt-0.5">{p.remarks}</p>
                  )}
                  {(p.proofs || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(p.proofs || []).map((pr, j) => (
                        <a
                          key={j}
                          href={pr.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                          title="Open payment proof"
                        >
                          <Paperclip className="h-3 w-3 text-slate-400" />
                          {pr.file_name || pr.file_path}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(Number(p.amount))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PaymentStat({ label, value, emphasis }) {
  return (
    <div className={`rounded-lg border p-3 ${emphasis ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10" : "border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40"}`}>
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-0.5 text-base font-bold ${emphasis ? "text-amber-700 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

// Modal to record a payment installment (expenses:pay only). Supports partial / full /
// advance-refund / additional payment, plus uploading screenshot/document proofs via /uploads.
function RecordPaymentModal({ expense, summary, onClose, onSaved }) {
  // amount_due from getPaymentSummary tells us how much remains to settle,
  // and whether the company pays the user or the user refunds the company.
  const isUserRefund = !!summary?.is_over_advance;
  const due = Number(summary?.amount_due) > 0 ? Number(summary.amount_due) : 0;
  const userReceives = !isUserRefund;

  const [amount, setAmount] = useState(due > 0 ? String(due) : "");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState(
    isUserRefund ? "ADVANCE_REFUND" : "ADDITIONAL",
  );
  const [refNumber, setRefNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [proofs, setProofs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef(null);

  const addProofFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadImage(file, "expense-payment");
      setProofs((prev) => [
        ...prev,
        {
          file_path: data?.data?.url,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
        },
      ]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to upload proof.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const amt = Number(amount);
    if (!amount || amt <= 0) {
      toast.error(
        isUserRefund
          ? "Please enter the refund amount."
          : "Please enter a valid payment amount.",
      );
      return;
    }
    if (due > 0 && amt > due) {
      toast.error(`Amount cannot exceed the due balance of ${due.toFixed(2)}.`);
      return;
    }
    if (!paymentDate) {
      toast.error("Payment date is required.");
      return;
    }
    setSaving(true);
    try {
      await recordPayment(expense.uuid, {
        amount: String(amount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        payment_type: paymentType,
        reference_number: refNumber || null,
        remarks: remarks || null,
        proofs: proofs.length ? proofs : null,
      });
      toast.success("Payment recorded successfully");
      onSaved?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isUserRefund ? "Record Advance Refund" : "Record Payment"}
      subtitle={`${expense.expense_number} — ${expense.title}`}
      icon={Banknote}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading || due <= 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Recording..." : "Record Payment"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Due balance banner — tells the payer how much remains and in which direction */}
        <div
          className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium border ${
            isUserRefund
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200"
              : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200"
          }`}
        >
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {isUserRefund ? (
              <>
                User was advanced more than spent.{" "}
                <span className="font-bold">Amount due from user: {formatCurrency(due)}</span>{" "}
                (refund back to company).
              </>
            ) : (
              <>
                Final amount is {formatCurrency(Number(summary?.final_amount) || 0)}.{" "}
                <span className="font-bold">Amount to pay the user: {formatCurrency(due)}</span>{" "}
                (company to user).
              </>
            )}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
              {isUserRefund ? "Refund amount" : "Amount"} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max={due > 0 ? String(due) : undefined}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
            {due > 0 && (
              <p className="text-[11px] text-slate-400">
                Max {formatCurrency(due)} — cannot exceed balance due.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
              Payment date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
              Payment method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer"
            >
              {["BANK_TRANSFER", "CASH", "CHEQUE", "CARD", "OTHER"].map((m) => (
                <option key={m} value={m}>{formatType(m)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
              Payment type <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer"
            >
              {(isUserRefund
                ? ["ADVANCE_REFUND", "REFUND_RECEIVED"]
                : ["PARTIAL", "FULL", "ADDITIONAL"]
              ).map((t) => (
                <option key={t} value={t}>{formatType(t).replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
            Reference number
          </label>
          <input
            type="text"
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
            placeholder="e.g. bank transaction ref / cheque no."
            className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder="Optional note"
            className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>
        {/* Proof uploads — screenshots / documents supporting this payment */}
        <div className="space-y-2">
          <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
            Proof of payment
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-600 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 disabled:opacity-60 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload screenshot or document"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              addProofFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {proofs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {proofs.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[12px] text-slate-600 dark:text-slate-300"
                >
                  <Paperclip className="h-3 w-3 text-slate-400" />
                  {p.file_name}
                  <button
                    type="button"
                    onClick={() => setProofs((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-500"
                    aria-label="Remove proof"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Modal to handover an APPROVED/PAID expense for payment — requester selects the
// target payment-eligible role (from role_handover_rules where module='payment').
function PaymentHandoverModal({ expense, roles, loading, acting, selectedRoleId, onSelectRole, remarks, onRemarksChange, onClose, onSave }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Handover for Payment"
      subtitle={`${expense.expense_number} — ${expense.title}`}
      icon={ArrowRightLeft}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={acting || loading || !selectedRoleId}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {acting && <Loader2 className="h-4 w-4 animate-spin" />}
            {acting ? "Handing over..." : "Handover for Payment"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Hand this expense to a finance role to process the payment on your behalf.
            Current handler: <span className="font-bold">{expense.currentRole?.name || expense.currentRole?.code || "—"}</span>.
          </span>
        </div>
        <div className="space-y-1">
          <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
            Handover to role <span className="text-red-500">*</span>
          </label>
          {loading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
              <span className="ml-2 text-[12px] text-slate-400">Loading payment roles...</span>
            </div>
          ) : roles.length === 0 ? (
            <p className="text-[12px] text-amber-600 dark:text-amber-400">
              No payment-eligible handover roles are configured for your role.
            </p>
          ) : (
            <select
              value={selectedRoleId || ""}
              onChange={(e) => onSelectRole(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer transition-colors"
            >
              <option value="">Select payment role</option>
              {roles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.roleName} ({role.roleCode})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-[12px] font-medium text-slate-700 dark:text-slate-300">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            rows={2}
            placeholder="Optional note for the finance team"
            className="w-full px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
        </div>
      </div>
    </Modal>
  );
}

function TravelSection({ icon: Icon, title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </h3>
      </div>
      <div className="px-4 sm:px-6 py-4">{children}</div>
    </div>
  );
}

function EmptyText({ label }) {
  return <p className="text-[13px] text-slate-400">{label}</p>;
}

const ACTION_ICONS = {
  SUBMIT: Send,
  APPROVE: CheckCircle2,
  REJECT: XCircle,
  PAY: Banknote,
  CREATE_PR: Send,
  CREATE_PO: ShoppingCart,
  ADD_QUOTATION: FileText,
  UPDATE_QUOTATION: FileText,
  SUBMIT_QUOTATIONS: Send,
  SELECT_QUOTATION: CheckCircle2,
  CONVERT_TO_EXPENSE: Wallet,
  RECEIVED: Inbox,
  ITEMS_RECEIVED: PackageCheck,
};

function ApprovalTrail({ handovers }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Approval Trail
          </h3>
          <p className="text-[12px] text-slate-400">
            {handovers.some((h) => h.sourceLabel)
            ? "Source procurement chain + expense approvals, newest first"
            : `${handovers.length} step${handovers.length === 1 ? "" : "s"}, newest first`}
          </p>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-5">
        {handovers.length === 0 ? (
          <p className="text-[13px] text-slate-400">
            No approval activity yet.
          </p>
        ) : (
          <ol className="relative border-l border-slate-200 dark:border-gray-700 ml-3 space-y-5">
            {handovers.map((h, i) => {
              const Icon = ACTION_ICONS[h.action_type] ?? ArrowRightLeft;
              return (
                <li key={i} className="ml-6">
                  <span
                    className={`absolute -left-[7px] mt-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                      h.action_type === "REJECT"
                        ? "bg-red-500"
                        : h.action_type === "PAY"
                          ? "bg-emerald-500"
                          : h.action_type === "ITEMS_RECEIVED"
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {formatType(h.action_type)}
                    </p>
                    <span className="text-[12px] text-slate-400">
                      {h.from_role} → {h.to_role}
                    </span>
                    {h.sourceLabel && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {h.sourceLabel}
                      </span>
                    )}
                  </div>
                  {h.remarks && (
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                      {h.remarks}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {h.action_by || "—"} · {formatDateTime(h.at)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

// Wrapper for a procurement stage tab — a loader while the chain loads, an empty
// state when no chain exists, otherwise the tab's content rendered directly.
function ProcurementStage({ loading, available, children }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
        <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
      </div>
    );
  }
  if (!available) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
        <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          No procurement history available.
        </p>
      </div>
    );
  }
  return <div className="space-y-6">{children}</div>;
}

// Read-only line-items table for a procurement document. PI/PR items carry no tax
// (tax is applied only at the quotation stage), so those cells render as "—" and
// the row total falls back to qty × unit price.
function ProcurementItemsTable({ items }) {
  if (!items?.length) return null;
  const hasTax = items.some((it) => it.tax_rate != null);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] table-fixed">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-gray-700">
            <th className="px-4 sm:px-6 py-2.5 font-semibold w-[40%]">Item</th>
            <th className="px-4 py-2.5 font-semibold w-[15%] text-center">Qty</th>
            <th className="px-4 py-2.5 font-semibold w-[22%] text-right">Unit Price</th>
            {hasTax && (
              <th className="px-4 py-2.5 font-semibold w-[10%] text-center">Tax %</th>
            )}
            <th className="px-4 sm:px-6 py-2.5 font-semibold w-[13%] text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
          {items.map((item, i) => (
            <tr key={item.id ?? i} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40">
              <td className="px-4 sm:px-6 py-3 text-slate-800 dark:text-slate-200">
                <p className="font-medium break-words">{item.name}</p>
                {item.description && (
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
                    {item.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">
                {item.quantity}
              </td>
              <td className="px-4 py-3 text-right text-slate-800 dark:text-slate-200 font-mono">
                {formatCurrency(item.unit_price)}
              </td>
              {hasTax && (
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">
                  {item.tax_rate != null ? `${item.tax_rate}%` : "—"}
                </td>
              )}
              <td className="px-4 sm:px-6 py-3 text-right text-slate-800 dark:text-slate-200 font-medium font-mono">
                {formatCurrency(
                  item.total_with_tax != null
                    ? item.total_with_tax
                    : Number(item.quantity) * Number(item.unit_price),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Read-only card for a single chain document (PI / PR / PO) — key info shown
// directly with a link into the procurement detail page.
// Compact expense context card — shows the same expense-level details as the
// Overview tab. Rendered above every procurement stage tab (PI / PR / Quotations)
// so the expense's identity is never lost while comparing chain documents.
function ExpenseContextCard({ expense, submittedByName, onViewUser }) {
  return (
    <InfoCard icon={Wallet} title="Expense">
      <InfoRow label="Expense number" value={expense.expense_number} />
      <InfoRow label="Category" value={<CategoryBadge name={expense.category?.name} />} />
      <InfoRow label="Company" value={expense.company?.name || "—"} />
      <InfoRow
        label="Submitted by"
        value={
          submittedByName ? (
            <button
              type="button"
              onClick={onViewUser}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
              title="View user details"
            >
              {submittedByName}
            </button>
          ) : (
            "—"
          )
        }
      />
      <InfoRow label="Status" value={<StatusBadge status={expense.status} />} />
      <InfoRow
        label="Submitted"
        value={expense.submitted_at ? formatDate(expense.submitted_at) : "-"}
      />
      <InfoRow
        label="Created"
        value={formatDate(expense.createdAt ?? expense.created_at)}
      />
      <InfoRow
        label="Last updated"
        value={formatDate(expense.updatedAt ?? expense.updated_at)}
      />
      <InfoRow label="Remarks" value={expense.remarks || "—"} />
    </InfoCard>
  );
}

// A single procurement stage card — header (stage name + status), title /
// document number / vendor / grand total, and its own stored line items.
function ProcurementDocCard({ title, doc }) {
  if (!doc) {
    return (
      <div className="text-center py-10 bg-slate-50/50 dark:bg-gray-800/40 rounded-xl border border-dashed border-slate-200 dark:border-gray-700">
        <p className="text-[13px] text-slate-400">{title} not created yet.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </h4>
          <StatusBadge status={doc.status} />
        </div>
        {doc.uuid && (
          <Link
            to={`/procurement/${doc.uuid}`}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
        )}
      </div>
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Title</p>
            <p className="mt-0.5 text-[13px] font-medium text-slate-800 dark:text-slate-200 break-words">
              {doc.title || "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Document number</p>
            <p className="mt-0.5 text-[13px] font-medium text-slate-800 dark:text-slate-200 break-words">
              {doc.document_number || "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Vendor</p>
            <p className="mt-0.5 text-[13px] font-medium text-slate-800 dark:text-slate-200 break-words">
              {doc.vendor || "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Grand total</p>
            <p className="mt-0.5 text-[13px] font-bold text-slate-900 dark:text-white">
              {formatCurrency(doc.grand_total)}
            </p>
          </div>
        </div>
      </div>
      {doc.items?.length > 0 && (
        <div className="border-t border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Line items
          </p>
          <ProcurementItemsTable items={doc.items} />
        </div>
      )}
    </div>
  );
}

// Quotations stage — every quotation rendered with its own line items as stored;
// the chosen one is marked with a success-colored SELECTED pill.
function QuotationsTab({ chain }) {
  const quotations = chain.quotations || [];
  const selectedUuid = chain.selectedQuotation?.uuid || quotations.find((q) => q.status === "SELECTED")?.uuid;
  const ordered = [...quotations].sort((a, b) => {
    if (a.uuid === selectedUuid) return -1;
    if (b.uuid === selectedUuid) return 1;
    return 0;
  });

  if (quotations.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50/50 dark:bg-gray-800/40 rounded-xl border border-dashed border-slate-200 dark:border-gray-700">
        <p className="text-[13px] text-slate-400">No quotations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ordered.map((q, i) => (
        <QuotationCard key={q.uuid ?? i} quotation={q} selected={q.uuid === selectedUuid} />
      ))}
    </div>
  );
}

// Quotation card — vendor (masked for the requester), validity, the header
// totals (subtotal / tax / grand total), and its own stored line items.
function QuotationCard({ quotation, selected = false }) {
  const hasItems = (quotation.items || []).length > 0;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
            {quotation.vendor || "—"}
          </p>
          {selected && <StatusBadge status="SELECTED" />}
        </div>
        <p className="text-[13px] font-bold text-amber-700 dark:text-amber-300">
          {formatCurrency(quotation.grand_total)}
        </p>
      </div>
      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Valid until</p>
          <p className="mt-0.5 text-[13px] font-medium text-slate-800 dark:text-slate-200">
            {quotation.valid_until ? formatDate(quotation.valid_until) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Subtotal</p>
          <p className="mt-0.5 text-[13px] font-medium text-slate-800 dark:text-slate-200">
            {formatCurrency(quotation.total_amount)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Tax</p>
          <p className="mt-0.5 text-[13px] font-medium text-slate-800 dark:text-slate-200">
            {formatCurrency(quotation.tax_amount)}
          </p>
        </div>
      </div>
      {quotation.notes ? (
        <div className="border-t border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Notes</p>
          <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
            {quotation.notes}
          </p>
        </div>
      ) : null}
      {hasItems && (
        <div className="border-t border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Line items
          </p>
          <ProcurementItemsTable items={quotation.items} />
        </div>
      )}
      {(quotation.documents || []).length > 0 && (
        <div className="border-t border-slate-200 dark:border-gray-700 px-4 sm:px-6 py-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Attached documents</p>
          {quotation.documents.map((d) => (
            <a
              key={d.uuid}
              href={d.file_path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline min-w-0"
            >
              <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{d.original_file_name || d.file_path}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const reimbursementTotal = (re) =>
  (re.items || []).reduce((s, it) => s + (Number(it.total_amount) || 0), 0);
const reimbursementBalance = (re) =>
  reimbursementTotal(re) - (Number(re.advance_amount) || 0);

// Upload button with a hidden file input — the parent decides what happens with the
// file via `onFile` (upload to /uploads + register the expense_document row).
function UploadDocRow({ label, uploading, onFile }) {
  const inputRef = useRef(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-60 transition-colors dark:text-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-800/40"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {uploading ? "Uploading..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// A stored header-level document (signed PO PDF / invoice) with a delete button.
function DocFileRow({ doc, deletable, deleting, onDelete }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2">
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline min-w-0"
      >
        <Paperclip className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <span className="truncate">{doc.name || doc.url}</span>
      </a>
      {deletable && (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          title="Remove document"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-700 disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </li>
  );
}

// Received-quantities editor — read-only table of ordered vs received, switching to
// number inputs while `draft` is set. The backend clamps each entry to 0..ordered qty.
function ReceivedItemsEditor({ items, draft, saving, onChange, onStartEdit, onSave, onCancel }) {
  const editing = draft != null;
  const allReceived =
    items.length > 0 &&
    items.every(
      (it) => (Number(it.received_quantity) || 0) >= (Number(it.quantity) || 0),
    );

  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="flex items-center gap-2 min-w-0">
          <PackageCheck className="h-4 w-4 text-slate-400" />
          <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
            Received quantities
          </h4>
          {!editing && allReceived && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              All items received
            </span>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Saving..." : "Save quantities"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors dark:text-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-800/40"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit received
          </button>
        )}
      </div>
      <div className="px-4 sm:px-6 py-4">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] table-fixed">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-gray-700">
                <th className="px-3 py-2 font-semibold w-[45%]">Item</th>
                <th className="px-3 py-2 font-semibold w-[20%] text-center">Ordered</th>
                <th className="px-3 py-2 font-semibold w-[20%] text-center">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 break-words">
                    {item.name || item.item_name}
                    {item.description && (
                      <span className="block text-[11px] font-normal text-slate-400 truncate">
                        {item.description}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400 font-mono">
                    {Number(item.quantity) || 0}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        max={Number(item.quantity) || 0}
                        step="1"
                        value={draft[item.id] ?? 0}
                        onChange={(e) =>
                          onChange(item.id, Math.max(Number(e.target.value) || 0, 0))
                        }
                        className="w-20 px-2 py-1 rounded-lg text-[13px] text-center text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                      />
                    ) : (
                      <span
                        className={`font-mono ${
                          (Number(item.received_quantity) || 0) >= (Number(item.quantity) || 0)
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : Number(item.received_quantity) > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-400"
                        }`}
                      >
                        {Number(item.received_quantity) || 0}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!editing && (
          <p className="text-[11px] text-slate-400 mt-3">
            Payments cannot begin until every PO item is fully received.
          </p>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled,
}) {
  const tones = {
    primary:
      "text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20",
    success:
      "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800/40",
    danger:
      "text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/20 dark:border-red-800/40",
    warning:
      "text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800/40",
    default:
      "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:text-slate-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60 ${tones[tone] || tones.default}`}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}

function MobileCard({ title, amount, grid = true, attachments, children }) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 min-w-0 text-[13px] font-semibold text-slate-800 dark:text-slate-200 break-words">
          {title}
        </p>
        {amount != null && (
          <p className="text-[13px] font-bold text-slate-900 dark:text-white whitespace-nowrap">
            {amount}
          </p>
        )}
      </div>
      {grid ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">{children}</div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
      {attachments?.length > 0 && (
        <AttachmentsChips attachments={attachments} />
      )}
    </div>
  );
}

// Route shown on two lines — From on top, "→ To" below (handles long location names).
function RouteText({ from, to }) {
  return (
    <span className="block">
      <span className="block">{from || "—"}</span>
      <span className="block">→ {to || "—"}</span>
    </span>
  );
}

function CardField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-[12px] font-medium text-slate-700 dark:text-slate-200 break-words">
        {value}
      </p>
    </div>
  );
}

function CategoryBadge({ name }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-600/20 dark:text-indigo-300 dark:bg-indigo-900/20 dark:ring-indigo-400/20">
      {name}
    </span>
  );
}

function AttachmentsChips({ attachments }) {
  const list = attachments || [];
  if (list.length === 0)
    return <span className="text-[11px] text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {list.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
          title="Open attachment"
        >
          <Paperclip className="h-3 w-3 text-slate-400" />
          {a.name || a.url}
        </a>
      ))}
    </div>
  );
}
