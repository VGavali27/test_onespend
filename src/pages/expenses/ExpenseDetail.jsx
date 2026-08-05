import { useEffect, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Wallet, Plane, BedDouble, Coins, Bus, MoreHorizontal, FileText,
  ReceiptText, Paperclip, CheckCircle2, XCircle, Send, Banknote, ArrowRightLeft, Inbox, Loader2,
} from 'lucide-react';
import { getExpenseById, normalizeExpense } from '@/services/expenseService';
import ErrorState from '@/components/ui/ErrorState';
import StatusBadge from '@/components/ui/StatusBadge';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';
import UserDetailsModal from '@/components/ui/UserDetailsModal';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatCurrency, formatNumber, formatType } from '@/utils/format';

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const toast = useToast();

  // Approve/handover/payment endpoints aren't built yet — show a notice until they are.
  const placeholderAction = () => toast.error('This action is not implemented yet.');

  const loadExpense = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getExpenseById(id);
      setExpense(normalizeExpense(data?.data));
    } catch (e) {
      if (e?.response?.status === 404) {
        setExpense(null);
        setError('This expense does not exist.');
      } else {
        setError(e?.response?.data?.message || 'Failed to load this expense.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadExpense();
  }, [loadExpense]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DetailHeader icon={Wallet} title="Loading expense..." onBack={() => navigate('/expenses/my')} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DetailHeader icon={Wallet} title="Expense not found" onBack={() => navigate('/expenses/my')} />
        {error && expense === null ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
            <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{error}</p>
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
    ? [submittedBy.first_name, submittedBy.last_name].filter(Boolean).join(' ') || submittedBy.email
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <DetailHeader
        icon={Wallet}
        title={expense.title}
        onBack={() => navigate('/expenses/my')}
        editTo={expense.canEdit ? `/expenses/${expense.uuid}/edit` : undefined}
      />

      {/* Amount summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AmountCard label="Estimated" value={formatCurrency(expense.estimated_amount)} />
        <AmountCard label="Final" value={formatCurrency(expense.final_amount)} />
        <AmountCard label="Paid" value={formatCurrency(expense.paid_amount)} />
      </div>

      {/* Meta strip */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 sm:p-5 flex flex-wrap items-center gap-3 sm:gap-4">
        <StatusBadge status={expense.status} />
        <CategoryBadge name={expense.category?.name} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{expense.expense_number}</p>
          <p className="text-[12px] text-slate-400 truncate">{expense.company?.name || '—'}</p>
        </div>
      </div>

      {/* Role-aware actions — creator submits/edits; approvers approve/handover/pay */}
      <div className="flex flex-wrap items-center gap-2">
        {expense.canEdit ? (
          <ActionButton icon={Send} label="Submit" onClick={placeholderAction} tone="primary" />
        ) : (
          <>
            <ActionButton icon={CheckCircle2} label="Approve" onClick={placeholderAction} tone="success" />
            <ActionButton icon={XCircle} label="Reject" onClick={placeholderAction} tone="danger" />
            <ActionButton icon={ArrowRightLeft} label="Handover" onClick={placeholderAction} />
            <ActionButton icon={Banknote} label="Process Payment" onClick={placeholderAction} tone="warning" />
          </>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard icon={Wallet} title="Expense">
          <InfoRow label="Expense number" value={expense.expense_number} />
          <InfoRow label="Category" value={<CategoryBadge name={expense.category?.name} />} />
          <InfoRow label="Company" value={expense.company?.name || '—'} />
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
              ) : '—'
            }
          />
          <InfoRow label="Status" value={<StatusBadge status={expense.status} />} />
          <InfoRow label="Submitted" value={expense.submitted_at ? formatDate(expense.submitted_at) : '-'} />
          <InfoRow label="Remarks" value={expense.remarks || '—'} />
        </InfoCard>

        {travel ? (
          <InfoCard icon={Plane} title="Travel">
            <InfoRow label="Type" value={formatType(travel.travel_type)} />
            <InfoRow label="Purpose" value={travel.purpose || '—'} />
            <InfoRow label="Dates" value={`${travel.travel_start_date || '—'} → ${travel.travel_end_date || '—'}`} />
            <InfoRow label="Travellers" value={travel.total_travellers} />
            <InfoRow label="Notes" value={travel.notes || '—'} />
          </InfoCard>
        ) : expense.reimbursement ? (
          <InfoCard icon={ReceiptText} title="Reimbursement">
            <InfoRow label="Advance received" value={formatCurrency(expense.reimbursement.advance_amount)} />
            <InfoRow label="Advance date" value={expense.reimbursement.advance_date ? formatDate(expense.reimbursement.advance_date) : '—'} />
            <InfoRow label="Payment method" value={expense.reimbursement.payment_method || '—'} />
            <InfoRow label="Total expense" value={formatCurrency(reimbursementTotal(expense.reimbursement))} />
            <InfoRow label="Balance" value={formatCurrency(reimbursementBalance(expense.reimbursement))} />
            <InfoRow label="Attachments" value={<AttachmentsChips attachments={expense.reimbursement.attachments} />} />
          </InfoCard>
        ) : null}
      </div>

      {/* Travel breakdown */}
      {travel && (
        <>
          <TravelSection icon={Plane} title="Segments">
            {travel.segments.length === 0 ? (
              <EmptyText label="No segments" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.segments.map((s, i) => (
                    <MobileCard key={i} title={formatType(s.travel_mode)} amount={formatCurrency(s.estimated_amount)} attachments={s.attachments} grid={false}>
                      <RouteText from={s.from_location} to={s.to_location} />
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <CardField label="Departure" value={formatDateTime(s.departure_datetime)} />
                        <CardField label="Arrival" value={formatDateTime(s.arrival_datetime)} />
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
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatType(s.travel_mode)}</td>
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                            {s.from_location} → {s.to_location}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatDateTime(s.departure_datetime)}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatDateTime(s.arrival_datetime)}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(s.estimated_amount)}</td>
                          <td className="py-2.5 pl-3"><div className="flex justify-end"><AttachmentsChips attachments={s.attachments} /></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>

          <TravelSection icon={BedDouble} title="Accommodations">
            {travel.accommodations.length === 0 ? (
              <EmptyText label="No accommodations" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.accommodations.map((a, i) => (
                    <MobileCard key={i} title={a.hotel || a.city || '—'} amount={formatCurrency(a.estimated_amount)} attachments={a.attachments}>
                      <CardField label="City" value={a.city || '—'} />
                      <CardField label="Check-in" value={formatDate(a.check_in)} />
                      <CardField label="Check-out" value={formatDate(a.check_out)} />
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
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">{a.hotel || a.city || '—'}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{a.city || '—'}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatDate(a.check_in)}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatDate(a.check_out)}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(a.estimated_amount)}</td>
                          <td className="py-2.5 pl-3"><div className="flex justify-end"><AttachmentsChips attachments={a.attachments} /></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>

          <TravelSection icon={Coins} title="Forex">
            {travel.forex.length === 0 ? (
              <EmptyText label="No forex" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.forex.map((f, i) => (
                    <MobileCard key={i} title={f.currency || '—'} amount={formatCurrency(f.amount)} attachments={f.attachments}>
                      <CardField label="Rate" value={f.rate != null ? f.rate : '—'} />
                      <CardField label="Foreign amount" value={formatNumber(f.foreignAmount)} />
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
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">{f.currency || '—'}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{f.rate != null ? f.rate : '—'}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatNumber(f.foreignAmount)}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(f.amount)}</td>
                          <td className="py-2.5 pl-3"><div className="flex justify-end"><AttachmentsChips attachments={f.attachments} /></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>

          <TravelSection icon={Bus} title="Local Transport">
            {travel.localTransports.length === 0 ? (
              <EmptyText label="No local transport" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.localTransports.map((t, i) => (
                    <MobileCard key={i} title={formatType(t.mode)} amount={formatCurrency(t.estimated_amount)} attachments={t.attachments}>
                      <CardField label="Route" value={<RouteText from={t.fromLocation} to={t.toLocation} />} />
                      <CardField label="Time" value={formatDateTime(t.travel_datetime)} />
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
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">{formatType(t.mode)}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{t.description || '—'}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatDateTime(t.travel_datetime)}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(t.estimated_amount)}</td>
                          <td className="py-2.5 pl-3"><div className="flex justify-end"><AttachmentsChips attachments={t.attachments} /></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>

          <TravelSection icon={MoreHorizontal} title="Miscellaneous">
            {travel.miscExpenses.length === 0 ? (
              <EmptyText label="No miscellaneous expenses" />
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {travel.miscExpenses.map((m, i) => (
                    <MobileCard key={i} title={m.description || '—'} amount={formatCurrency(m.estimated_amount)} attachments={m.attachments}>
                      <CardField label="Date" value={formatDate(m.expense_date)} />
                      <CardField label="Vendor" value={m.vendor_name || '—'} />
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
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">{m.description || '—'}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatDate(m.expense_date)}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{m.vendor_name || '—'}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(m.estimated_amount)}</td>
                          <td className="py-2.5 pl-3"><div className="flex justify-end"><AttachmentsChips attachments={m.attachments} /></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>
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
                    <MobileCard key={i} title={it.description} amount={formatCurrency(it.total_amount)} attachments={it.attachments}>
                      <CardField label="Date" value={formatDate(it.expense_date)} />
                      <CardField label="Bill no." value={it.bill_number || '—'} />
                      <CardField label="Type" value={it.expense_type || '—'} />
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
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{formatDate(it.expense_date)}</td>
                          <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">{it.description}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{it.bill_number || '—'}</td>
                          <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{it.expense_type || '—'}</td>
                          <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(it.total_amount)}</td>
                          <td className="py-2.5 pl-3"><div className="flex justify-end"><AttachmentsChips attachments={it.attachments} /></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TravelSection>
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
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Documents</h3>
            <p className="text-[12px] text-slate-400">{expense.documents.length} file{expense.documents.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4">
          {expense.documents.length === 0 ? (
            <p className="text-[13px] text-slate-400">No documents attached.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {expense.documents.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[12px] text-slate-600 dark:text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <UserDetailsModal employment={viewUser} onClose={() => setViewUser(null)} />
    </div>
  );
}

// ── Presentational helpers ──

function AmountCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function TravelSection({ icon: Icon, title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
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
};

function ApprovalTrail({ handovers }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Approval Trail</h3>
          <p className="text-[12px] text-slate-400">{handovers.length} step{handovers.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-5">
        {handovers.length === 0 ? (
          <p className="text-[13px] text-slate-400">No approval activity yet.</p>
        ) : (
          <ol className="relative border-l border-slate-200 dark:border-gray-700 ml-3 space-y-5">
            {handovers.map((h, i) => {
              const Icon = ACTION_ICONS[h.action_type] ?? ArrowRightLeft;
              return (
                <li key={i} className="ml-6">
                  <span className={`absolute -left-[7px] mt-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                    h.action_type === 'REJECT' ? 'bg-red-500' : h.action_type === 'PAY' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`} />
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{formatType(h.action_type)}</p>
                    <span className="text-[12px] text-slate-400">
                      {h.from_role} → {h.to_role}
                    </span>
                  </div>
                  {h.remarks && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{h.remarks}</p>}
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {h.action_by || '—'} · {formatDateTime(h.at)}
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
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const reimbursementTotal = (re) => (re.items || []).reduce((s, it) => s + (Number(it.total_amount) || 0), 0);
const reimbursementBalance = (re) => reimbursementTotal(re) - (Number(re.advance_amount) || 0);

function ActionButton({ icon: Icon, label, onClick, tone = 'default' }) {
  const tones = {
    primary: 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20',
    success: 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800/40',
    danger: 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/20 dark:border-red-800/40',
    warning: 'text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800/40',
    default: 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:text-slate-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${tones[tone] || tones.default}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MobileCard({ title, amount, grid = true, attachments, children }) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 min-w-0 text-[13px] font-semibold text-slate-800 dark:text-slate-200 break-words">{title}</p>
        {amount != null && <p className="text-[13px] font-bold text-slate-900 dark:text-white whitespace-nowrap">{amount}</p>}
      </div>
      {grid ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">{children}</div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
      {attachments?.length > 0 && <AttachmentsChips attachments={attachments} />}
    </div>
  );
}

// Route shown on two lines — From on top, "→ To" below (handles long location names).
function RouteText({ from, to }) {
  return (
    <span className="block">
      <span className="block">{from || '—'}</span>
      <span className="block">→ {to || '—'}</span>
    </span>
  );
}

function CardField({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[12px] font-medium text-slate-700 dark:text-slate-200 break-words">{value}</p>
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
  if (list.length === 0) return <span className="text-[11px] text-slate-400">—</span>;
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
