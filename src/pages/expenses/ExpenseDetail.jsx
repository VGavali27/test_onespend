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
  History,
  Eye,
  ChevronDown,
  Edit,
  Upload,
  Info,
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
} from "@/services/expenseService";
import { uploadImage } from "@/services/uploadService";
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

      // Load payment history + summary when the expense is approved (or already paid)
      if (normalized?.status === "APPROVED" || normalized?.status === "PAID") {
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
    // If current handler is the final approver, don't load handover roles —
    // the expense will be closed as APPROVED regardless of any selection
    if (!isFinalApprover) {
      await loadHandoverRoles();
    } else {
      setHandoverRoles([]);
    }
    setConfirmAction("approve");
  }, [loadHandoverRoles, isFinalApprover]);

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

      {/* Role-aware actions — Submit for DRAFT (creator only), Edit+Resubmit for REJECTED (creator only), or Approve/Reject for SUBMITTED (current handler or SUPER_ADMIN). */}
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

      {/* Payments — shown once the expense is APPROVED (final approver closed it). Only
          roles with the expenses:pay permission can record new payments. */}
      {(expense.status === "APPROVED" || expense.status === "PAID") && (
        <PaymentSection
          expense={expense}
          canPay={canPay}
          isCurrentHandler={isCurrentHandler}
          payments={payments}
          summary={paymentSummary}
          loading={loadingPayments}
          onRecord={() => setShowPaymentModal(true)}
        />
      )}

      {/* Payment handover — shown to the requester (current holder) when the expense is
          APPROVED/PAID and not yet settled, regardless of expenses:pay. Both buttons show. */}
      {(expense.status === "APPROVED" || expense.status === "PAID") &&
        isCurrentHandler &&
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

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard icon={Wallet} title="Expense">
          <InfoRow label="Expense number" value={expense.expense_number} />
          <InfoRow
            label="Category"
            value={<CategoryBadge name={expense.category?.name} />}
          />
          <InfoRow label="Company" value={expense.company?.name || "—"} />
          <InfoRow
            label="Submitted by"
            value={
              submittedBy ? (
                <button
                  type="button"
                  onClick={() => setViewUser(expense.requestedByEmployment)}
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
          <InfoRow
            label="Status"
            value={<StatusBadge status={expense.status} />}
          />
          <InfoRow
            label="Submitted"
            value={
              expense.submitted_at ? formatDate(expense.submitted_at) : "-"
            }
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

      {/* Selected Quotation — always visible above procurement history for procurement expenses */}
      {expense.isProcurement && procurementChain?.selectedQuotation && (
        <SelectedQuotationDisplay quotation={procurementChain.selectedQuotation} />
      )}

      {/* Procurement history — collapsible; chain is pre-loaded */}
      {expense.isProcurement && (
        <ProcurementHistorySection expense={expense} chain={procurementChain} loading={loadingChain} />
      )}

      {/* Approval trail */}
      <ApprovalTrail handovers={expense.handovers} />

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
            {confirmAction === "approve" && isFinalApprover && (
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
            {confirmAction === "approve" && !isFinalApprover &&
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <PaymentStat label="Final amount" value={formatCurrency(Number(summary.final_amount))} />
            <PaymentStat label="Advance amount" value={formatCurrency(Number(summary.advance_amount))} />
            <PaymentStat label="Paid amount" value={formatCurrency(Number(summary.paid_amount))} />
            <PaymentStat
              label={summary.is_over_advance ? "User owes (refund)" : "Pending payment"}
              value={formatCurrency(receivable)}
              emphasis={Number(receivable) > 0}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <PaymentStat label="Final amount" value={formatCurrency(expense.final_amount)} />
            <PaymentStat label="Advance amount" value={formatCurrency(expense.advance_amount)} />
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
            {handovers.length} step{handovers.length === 1 ? "" : "s"}
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

// Selected Quotation Display — always visible above procurement history
// Shows the selected quotation's items with qty, unit price, tax rate, and totals
function SelectedQuotationDisplay({ quotation }) {
  if (!quotation?.items?.length) return null;
  const items = quotation.items;

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 sm:p-6 mb-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Selected Quotation</h4>
            <p className="text-[12px] text-emerald-600 dark:text-emerald-400">
              Vendor: {quotation.vendor || "—"} • Grand Total: {formatCurrency(quotation.grand_total)}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
          SELECTED
        </span>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] table-fixed">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800">
              <th className="px-4 sm:px-6 py-2.5 font-semibold w-[30%]">Item</th>
              <th className="px-4 py-2.5 font-semibold w-[20%] text-center">Qty</th>
              <th className="px-4 sm:px-6 py-2.5 font-semibold w-[20%] text-right">Unit Price</th>
              <th className="px-4 py-2.5 font-semibold w-[15%] text-center">Tax %</th>
              <th className="px-4 sm:px-6 py-2.5 font-semibold w-[15%] text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100 dark:divide-emerald-800">
            {items.map((item, i) => (
              <tr key={item.id ?? i} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
                <td className="px-4 sm:px-6 py-3 text-slate-800 dark:text-slate-200">
                  <p className="font-medium break-words">{item.name}</p>
                  {item.description && (
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">{item.quantity}</td>
                <td className="px-4 sm:px-6 py-3 text-right text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono">{item.tax_rate}%</td>
                <td className="px-4 sm:px-6 py-3 text-right text-slate-800 dark:text-slate-200 font-medium font-mono">{formatCurrency(item.total_with_tax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-emerald-50 dark:bg-emerald-900/20">
              <td colSpan={4} className="px-4 sm:px-6 py-3 text-right font-semibold text-emerald-800 dark:text-emerald-200">Grand Total</td>
              <td className="px-4 sm:px-6 py-3 text-right font-bold text-emerald-800 dark:text-emerald-200 font-mono">{formatCurrency(quotation.grand_total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// Source procurement chain behind a PO-created / converted expense: the PI → PR →
// quotations → PO documents (as a stage table like the PR price-history card) plus
// the chain's approval logs.
// Collapsible "Procurement history" card for a procurement-linked expense. Chain is pre-loaded.
function ProcurementHistorySection({ expense, chain: preloadedChain, loading: loadingChain }) {
  const [open, setOpen] = useState(false);
  const chain = preloadedChain;
  const loading = loadingChain;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-gray-800/40 hover:bg-slate-100 dark:hover:bg-gray-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Procurement history
            </h3>
            <p className="text-[12px] text-slate-400">
              Source chain PI → PR → Quotations → PO with approval logs
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[12px] font-semibold transition-colors">
          {open ? "Hide" : "Show"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {/* Smooth height reveal via grid-template-rows — big payloads open gently instead of jumping in */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            ) : chain ? (
              <ProcurementHistory chain={chain} />
            ) : (
              <p className="text-[13px] text-slate-400">
                No procurement history available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Content of the Procurement history section — the source chain as a responsive stage
// table (Stage | Document | Grand total | View) plus the chain's approval logs.
function ProcurementHistory({ chain }) {
  if (!chain) return null;
  const stages = [
    ...(chain.pi
      ? [
          {
            label: "Purchase Intention",
            num: chain.pi.document_number,
            total: chain.pi.grand_total,
            uuid: chain.pi.uuid,
          },
        ]
      : []),
    {
      label: "Purchase Request",
      num: chain.pr?.document_number,
      total: chain.pr?.grand_total,
      uuid: chain.pr?.uuid,
    },
    ...(chain.quotations || []).map((q, i) => ({
      label: `Quotation ${i + 1}`,
      num: q.vendor || "—",
      total: q.grand_total,
      uuid: null, // quotations live on the PR page, no standalone route
    })),
    ...(chain.po
      ? [
          {
            label: "Purchase Order",
            num: chain.po.document_number,
            total: chain.po.grand_total,
            uuid: chain.po.uuid,
          },
        ]
      : []),
  ].filter((s) => s.total != null);

  // Format selected quotation items for display
  const selectedQuotationItems = chain.selectedQuotation?.items || [];

  return (
    <div className="space-y-6">
      {/* Documents in the chain — stage / document / grand total / view */}
      {stages.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden md:block w-full">
            <table className="w-full text-[13px] table-fixed">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                  <th className="px-4 sm:px-6 py-2.5 font-semibold w-[34%]">
                    Stage
                  </th>
                  <th className="px-4 py-2.5 font-semibold w-[38%]">
                    Document
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 font-semibold text-right w-[17%]">
                    Grand total
                  </th>
                  <th className="px-4 sm:px-6 py-2.5 font-semibold text-right w-[11%]">
                    View
                  </th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-800 dark:text-slate-200 break-words">
                      {s.label}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 break-words">
                      {s.num || "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(s.total)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right">
                      {s.uuid ? (
                        <Link
                          to={`/procurement/${s.uuid}`}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      ) : (
                        <span className="text-slate-300 dark:text-gray-600">
                          —
                        </span>
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
              <div
                key={i}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 break-words">
                    {s.label}
                  </p>
                  <p className="text-[12px] text-slate-400 truncate">
                    {s.num || "—"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(s.total)}
                  </p>
                  {s.uuid && (
                    <Link
                      to={`/procurement/${s.uuid}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Approval logs across the chain */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Approval logs
        </p>
        {(chain.handovers || []).length === 0 ? (
          <p className="text-[13px] text-slate-400">No approval logs.</p>
        ) : (
          <ol className="relative border-l border-slate-200 dark:border-gray-700 ml-3 space-y-5">
            {chain.handovers.map((h, i) => {
              const Icon = ACTION_ICONS[h.action_type] ?? History;
              return (
                <li key={i} className="ml-6">
                  <span
                    className={`absolute -left-[7px] mt-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                      h.action_type === "REJECT"
                        ? "bg-red-500"
                        : "bg-indigo-500"
                    }`}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {formatType(h.action_type)}
                    </p>
                    {(h.from_role || h.to_role) && (
                      <span className="text-[12px] text-slate-400">
                        {h.from_role || "—"} → {h.to_role || "—"}
                      </span>
                    )}
                  </div>
                  {h.remarks && (
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                      {h.remarks}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {h.action_by || "—"} · {formatDateTime(h.created_at)}
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
