import { useNavigate, useParams } from 'react-router-dom';
import {
  Wallet, Plane, BedDouble, Coins, Bus, MoreHorizontal, FileText,
  ReceiptText, Paperclip, CheckCircle2, XCircle, Send, Banknote, ArrowRightLeft, Inbox,
} from 'lucide-react';
import { useMockExpenses } from '@/hooks/useMockExpenses';
import StatusBadge from '@/components/ui/StatusBadge';
import { InfoCard, InfoRow, Detail, DetailHeader } from '@/components/ui/detail';
import { formatDate, formatCurrency, formatType } from '@/utils/format';

export default function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { expenses } = useMockExpenses();
  const expense = expenses.find((e) => e.id === id);

  if (!expense) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DetailHeader icon={Wallet} title="Expense not found" onBack={() => navigate('/expenses/my')} />
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
          <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">This expense doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const travel = expense.travel;

  return (
    <div className="space-y-6 animate-fade-in">
      <DetailHeader icon={Wallet} title={expense.title} onBack={() => navigate('/expenses/my')} />

      {/* Amount summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AmountCard label="Estimated" value={formatCurrency(expense.estimated_amount)} />
        <AmountCard label="Final" value={formatCurrency(expense.final_amount)} />
        <AmountCard label="Paid" value={formatCurrency(expense.paid_amount)} />
      </div>

      {/* Meta strip */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 flex flex-wrap items-center gap-4">
        <StatusBadge status={expense.status} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{expense.expense_number}</p>
          <p className="text-[12px] text-slate-400 truncate">
            {expense.category?.name || '—'} · {expense.company?.name || '—'}
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard icon={Wallet} title="Expense">
          <InfoRow label="Expense number" value={expense.expense_number} />
          <InfoRow label="Category" value={expense.category?.name || '—'} />
          <InfoRow label="Company" value={expense.company?.name || '—'} />
          <InfoRow label="Status" value={<StatusBadge status={expense.status} />} />
          <InfoRow label="Submitted" value={expense.submitted_at ? formatDate(expense.submitted_at) : 'Draft'} />
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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
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
                        <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-200">
                          {formatType(s.travel_mode)} · {s.from_location} → {s.to_location}
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
            )}
          </TravelSection>

          <TravelSection icon={BedDouble} title="Accommodations">
            {travel.accommodations.length === 0 ? (
              <EmptyText label="No accommodations" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {travel.accommodations.map((a, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{a.hotel || a.city || 'Stay'}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Detail label="City" value={a.city || '—'} />
                      <Detail label="Nights" value={`${a.check_in || '—'} → ${a.check_out || '—'}`} />
                      <Detail label="Nightly" value={formatCurrency(a.nightly_rate)} />
                      <Detail label="Estimated" value={formatCurrency(a.estimated_amount)} />
                    </div>
                    <div className="mt-2 flex justify-end"><AttachmentsChips attachments={a.attachments} /></div>
                  </div>
                ))}
              </div>
            )}
          </TravelSection>

          <TravelSection icon={Coins} title="Forex">
            {travel.forex.length === 0 ? (
              <EmptyText label="No forex" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {travel.forex.map((f, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{f.currency || '—'}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Detail label="Amount" value={formatCurrency(f.amount)} />
                      <Detail label="Rate" value={f.rate != null ? f.rate : '—'} />
                    </div>
                    <div className="mt-2 flex justify-end"><AttachmentsChips attachments={f.attachments} /></div>
                  </div>
                ))}
              </div>
            )}
          </TravelSection>

          <TravelSection icon={Bus} title="Local Transport">
            {travel.localTransports.length === 0 ? (
              <EmptyText label="No local transport" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {travel.localTransports.map((t, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{formatType(t.mode)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Detail label="Description" value={t.description || '—'} />
                      <Detail label="Amount" value={formatCurrency(t.estimated_amount)} />
                    </div>
                    <div className="mt-2 flex justify-end"><AttachmentsChips attachments={t.attachments} /></div>
                  </div>
                ))}
              </div>
            )}
          </TravelSection>

          <TravelSection icon={MoreHorizontal} title="Miscellaneous">
            {travel.miscExpenses.length === 0 ? (
              <EmptyText label="No miscellaneous expenses" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {travel.miscExpenses.map((m, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{m.description || 'Item'}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Detail label="Amount" value={formatCurrency(m.estimated_amount)} />
                    </div>
                    <div className="mt-2 flex justify-end"><AttachmentsChips attachments={m.attachments} /></div>
                  </div>
                ))}
              </div>
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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
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
            )}
          </TravelSection>
      )}

      {/* Approval trail */}
      <ApprovalTrail handovers={expense.handovers} />

      {/* Documents */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Documents</h3>
            <p className="text-[12px] text-slate-400">{expense.documents.length} file{expense.documents.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="px-6 py-4">
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
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-6 py-4">{children}</div>
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
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Approval Trail</h3>
          <p className="text-[12px] text-slate-400">{handovers.length} step{handovers.length === 1 ? '' : 's'}</p>
        </div>
      </div>
      <div className="px-6 py-5">
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
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const reimbursementTotal = (re) => (re.items || []).reduce((s, it) => s + (Number(it.total_amount) || 0), 0);
const reimbursementBalance = (re) => reimbursementTotal(re) - (Number(re.advance_amount) || 0);

function AttachmentsChips({ attachments }) {
  const list = attachments || [];
  if (list.length === 0) return <span className="text-[11px] text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {list.map((a, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[11px] text-slate-600 dark:text-slate-300">
          <Paperclip className="h-3 w-3 text-slate-400" />
          {a.name}
        </span>
      ))}
    </div>
  );
}
