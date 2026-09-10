import { FileText, Printer, X } from 'lucide-react';
import { formatCurrency, formatDate, formatAmountInWords } from '@/utils/format';

/**
 * Reusable Purchase Order PDF preview & print overlay.
 *
 * Renders a real-world PO layout (company letterhead, vendor, ship-to, line
 * items, tax totals, amount in words, signatures) and prints via window.print().
 * Print CSS in index.css hides everything except #po-print-sheet.
 *
 * Props:
 *   po     — the PO object (same shape as the procurement chain's `po`):
 *            { document_number, title, status, created_at/createdAt,
 *              expected_delivery_date, notes, company, vendor,
 *              requestedByEmployment.user, items[], total_amount, tax_amount,
 *              grand_total }
 *   open   — boolean controlling visibility
 *   onClose — called when the user closes the overlay
 */
export default function PurchaseOrderPdfOverlay({ po, open, onClose }) {
  if (!open || !po) return null;

  const company = po.company || {};
  const vendor = po.vendor || {};
  const requester = po.requestedByEmployment?.user;
  const requesterName = requester ? [requester.first_name, requester.last_name].filter(Boolean).join(' ') || requester.email : '—';
  const address = [company.address_line_1, company.address_line_2].filter(Boolean).join(', ');
  const cityLine = [company.city, company.state, company.pincode].filter(Boolean).join(', ');

  const items = po.items || [];
  const subtotal = po.total_amount;
  const tax = po.tax_amount;
  const grandTotal = po.grand_total;

  const print = () => {
    const before = document.title;
    document.title = `${po.document_number || 'Purchase Order'}`;
    window.print();
    document.title = before;
  };

  return (
    <div className="po-pdf-overlay fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-slate-200 dark:border-gray-700">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Purchase Order <span className="text-indigo-600 dark:text-indigo-400">{po.document_number || ''}</span>
          </p>
          <p className="text-[11px] text-slate-400">Review, then save as PDF to send to the vendor</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={print}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* A4 sheet */}
      <div className="px-4 sm:px-8 py-6 flex justify-center">
        <div id="po-print-sheet" className="w-full max-w-[820px] bg-white text-slate-800 shadow-2xl print:shadow-none">
          {/* Letterhead */}
          <div className="border-b-2 border-indigo-600 px-8 pt-8 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900">{company.name || 'Company'}</h1>
                {company.code && <p className="text-[11px] text-slate-400 mt-0.5">Code: {company.code}</p>}
                {(address || cityLine) && (
                  <p className="text-[12px] text-slate-500 mt-1.5 break-words">{[address, cityLine].filter(Boolean).join(', ')}</p>
                )}
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {[company.phone, company.email, company.website].filter(Boolean).join(' · ')}
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {company.gst_number && <>GSTIN: {company.gst_number}{company.pan_number ? '  ·  ' : ''}</>}
                  {company.pan_number && <>PAN: {company.pan_number}</>}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600">Purchase Order</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{po.document_number || '—'}</p>
                <p className="text-[12px] text-slate-500 mt-1">Order date: {formatDate(po.created_at ?? po.createdAt)}</p>
                <p className="text-[12px] text-slate-500">Status: {po.status || '—'}</p>
              </div>
            </div>
          </div>

          {/* Vendor + ship-to */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-8 pt-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Bill To / Vendor</p>
              <p className="text-[14px] font-bold text-slate-900 break-words">{vendor.name || '—'}</p>
              <div className="text-[12px] text-slate-600 mt-1 space-y-0.5">
                <p>Code: {vendor.code || '—'}</p>
                {vendor.gst_number && <p>GSTIN: {vendor.gst_number}</p>}
                {vendor.payment_terms && <p>Payment terms: {vendor.payment_terms}</p>}
                {vendor.website && <p>{vendor.website}</p>}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Ordered By / Ship To</p>
              <p className="text-[14px] font-bold text-slate-900">{company.name || '—'}</p>
              <div className="text-[12px] text-slate-600 mt-1 space-y-0.5">
                <p>{requesterName}</p>
                {requester?.email && <p>{requester.email}</p>}
                <p>Delivery by: {formatDate(po.expected_delivery_date)}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="px-8 pt-6">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 text-left">
                    <th className="px-3 py-2 w-[5%]">#</th>
                    <th className="px-3 py-2 w-[40%]">Item</th>
                    <th className="px-3 py-2 text-right w-[12%]">Qty</th>
                    <th className="px-3 py-2 text-right w-[15%]">Unit price</th>
                    <th className="px-3 py-2 text-right w-[10%]">Tax</th>
                    <th className="px-3 py-2 text-right w-[18%]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-slate-400 text-center">No line items.</td>
                    </tr>
                  )}
                  {items.map((it, i) => (
                    <tr key={it.uuid ?? i}>
                      <td className="px-3 py-2.5 text-slate-500">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-800 break-words">{it.item_name}</p>
                        {it.description && <p className="text-[11px] text-slate-400 break-words">{it.description}</p>}
                        {it.category && <p className="text-[11px] text-slate-400">{it.category}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{it.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{formatCurrency(it.unit_price)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{it.tax_rate != null ? `${it.tax_rate}%` : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{formatCurrency(it.total_with_tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals + amount in words */}
          <div className="flex flex-wrap justify-end gap-6 px-8 pt-6">
            <div className="w-full sm:w-72 space-y-1.5 text-[13px]">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-800">{formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t-2 border-slate-300">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
              </div>
              {grandTotal != null && (
                <p className="text-[11px] text-slate-500 italic pt-1">
                  Amount in words: {formatAmountInWords(grandTotal)}.
                </p>
              )}
            </div>
          </div>

          {/* Notes / terms */}
          {(po.notes || po.title || vendor.payment_terms) && (
            <div className="px-8 pt-6">
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Notes / Terms</p>
                {po.title && <p className="text-[12px] text-slate-600 break-words">{po.title}</p>}
                {po.notes && <p className="text-[12px] text-slate-600 break-words whitespace-pre-wrap mt-1">{po.notes}</p>}
                {vendor.payment_terms && (
                  <p className="text-[12px] text-slate-600 mt-1">Payment terms: {vendor.payment_terms}</p>
                )}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 px-8 pt-10 pb-8 mt-4">
            <div>
              <p className="text-[12px] font-semibold text-slate-800">{requesterName || 'Authorized Signatory'}</p>
              <p className="text-[11px] text-slate-400">Authorized Signatory · Requested by</p>
              <div className="mt-8 border-t border-slate-300 pt-1" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-800">{vendor.name || 'Vendor'}</p>
              <p className="text-[11px] text-slate-400">Vendor Acceptance</p>
              <div className="mt-8 border-t border-slate-300 pt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}