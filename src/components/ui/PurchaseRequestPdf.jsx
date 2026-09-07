import { useEffect, useState } from 'react';
import { FileText, Printer, X, Loader2, ChevronLeft } from 'lucide-react';
import { formatCurrency, formatDate, formatAmountInWords } from '@/utils/format';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { getVendorOptions, vendorApi } from '@/services/vendorService';

/**
 * Purchase Request PDF preview & print overlay (with vendor selection).
 *
 * A PR predates vendor selection (the supplier only enters at the quotation
 * stage), so before the A4 sheet is shown the user picks a vendor from the
 * vendor master. That vendor's details (name/code/GST/platform/website) are
 * baked into the sheet so the team can generate the PDF, download/save it
 * (window.print()) and send it straight to that vendor.
 *
 * Props:
 *   pr      — the PR object (same shape as the procurement chain's `pr`):
 *             { document_number, title, status, created_at/createdAt,
 *               expected_delivery_date, notes, company,
 *               requestedByEmployment.user, items[], total_amount, tax_amount,
 *               grand_total }
 *   open     — boolean controlling visibility
 *   onClose   — called when the user closes the overlay
 */
export default function PurchaseRequestPdfOverlay({ pr, open, onClose }) {
  const [vendorOptions, setVendorOptions] = useState([]);
  const [vendorUuid, setVendorUuid] = useState('');
  const [vendor, setVendor] = useState(null); // full vendor record ({name, code, gst_number, payment_terms, website})
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [preview, setPreview] = useState(false); // false = vendor picker, true = A4 sheet

  useEffect(() => {
    if (!open) return;
    setVendorUuid('');
    setVendor(null);
    setPreview(false);
    setLoadingVendors(true);
    getVendorOptions()
      .then((res) => setVendorOptions(res?.data?.data ?? []))
      .catch(() => setVendorOptions([]))
      .finally(() => setLoadingVendors(false));
  }, [open]);

  // Full vendor record (code / GST / platform / payment terms) for the sheet.
  // /vendors/options only returns { uuid, name }, so we fetch the detail by uuid.
  useEffect(() => {
    if (!vendorUuid) {
      setVendor(null);
      return;
    }
    setLoadingVendor(true);
    vendorApi
      .get(vendorUuid)
      .then((res) => setVendor(res?.data?.data ?? null))
      .catch(() => setVendor(null))
      .finally(() => setLoadingVendor(false));
  }, [vendorUuid]);

  if (!open || !pr) return null;

  const company = pr.company || {};
  const requester = pr.requestedByEmployment?.user;
  const requesterName = requester ? [requester.first_name, requester.last_name].filter(Boolean).join(' ') || requester.email : '—';
  const address = [company.address_line_1, company.address_line_2].filter(Boolean).join(', ');
  const cityLine = [company.city, company.state, company.pincode].filter(Boolean).join(', ');

  const items = pr.items || [];
  const subtotal = pr.total_amount;
  const tax = pr.tax_amount;
  const grandTotal = pr.grand_total;

  const print = () => {
    const before = document.title;
    document.title = `${pr.document_number || 'Purchase Request'}`;
    window.print();
    document.title = before;
  };

  const vendorLabel = vendor ? (vendor.name || 'Vendor') : 'Vendor';

  return (
    <div className="po-pdf-overlay fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-y-auto">
      {!preview ? (
        /* ── Step 1: vendor selection ── */
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Purchase Request PDF
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pick the vendor this request is for — their details will be printed on the PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400">Vendor</label>
              <div className="mt-1.5">
                <SearchableSelect
                  value={vendorUuid}
                  onChange={setVendorUuid}
                  options={vendorOptions.map((v) => ({ value: v.uuid, label: v.name }))}
                  placeholder="Search & select a vendor..."
                  loading={loadingVendors}
                  emptyText="No vendors available"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                disabled={!vendorUuid}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingVendor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Preview PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Step 2: A4 sheet + print toolbar ── */
        <>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-slate-200 dark:border-gray-700">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Purchase Request {pr.document_number || ''}
                {vendor && <span className="text-[11px] font-medium text-slate-500">for {vendor.name}</span>}
              </p>
              <p className="text-[11px] text-slate-400">Review, then save as PDF to send to the vendor</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Change vendor
              </button>
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
            <div id="pr-print-sheet" className="w-full max-w-[820px] bg-white text-slate-800 shadow-2xl print:shadow-none">
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
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600">Purchase Request</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">{pr.document_number || '—'}</p>
                    <p className="text-[12px] text-slate-500 mt-1">Request date: {formatDate(pr.created_at ?? pr.createdAt)}</p>
                    <p className="text-[12px] text-slate-500">Status: {pr.status || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Vendor + requester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-8 pt-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Vendor</p>
                  <p className="text-[14px] font-bold text-slate-900 break-words">{vendor?.name || '—'}</p>
                  <div className="text-[12px] text-slate-600 mt-1 space-y-0.5">
                    <p>Code: {vendor?.code || '—'}</p>
                    {vendor?.gst_number && <p>GSTIN: {vendor.gst_number}</p>}
                    {vendor?.payment_terms && <p>Payment terms: {vendor.payment_terms}</p>}
                    {vendor?.website && <p>{vendor.website}</p>}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Requested By</p>
                  <p className="text-[14px] font-bold text-slate-900">{company.name || '—'}</p>
                  <div className="text-[12px] text-slate-600 mt-1 space-y-0.5">
                    <p>{requesterName}</p>
                    {requester?.email && <p>{requester.email}</p>}
                    {pr.expected_delivery_date && <p>Requested delivery by: {formatDate(pr.expected_delivery_date)}</p>}
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
              {(pr.notes || pr.title) && (
                <div className="px-8 pt-6">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Notes / Terms</p>
                    {pr.title && <p className="text-[12px] text-slate-600 break-words">{pr.title}</p>}
                    {pr.notes && <p className="text-[12px] text-slate-600 break-words whitespace-pre-wrap mt-1">{pr.notes}</p>}
                    {vendor?.payment_terms && (
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
                  <p className="text-[12px] font-semibold text-slate-800">{vendorLabel}</p>
                  <p className="text-[11px] text-slate-400">Vendor Acceptance</p>
                  <div className="mt-8 border-t border-slate-300 pt-1" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}