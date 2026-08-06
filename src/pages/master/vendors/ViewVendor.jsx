import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Truck, Users, MapPin, Landmark, FileText, Plus, Trash2, Loader2, Paperclip, Tag, Clock } from 'lucide-react';
import { vendorApi, vendorDocumentApi } from '@/services/vendorService';
import { uploadImage } from '@/services/uploadService';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';
import { useToast } from '@/components/ui/Toast';
import { resolveAssetUrl } from '@/utils/assets';
import { formatDate } from '@/utils/format';

const DOC_TYPES = ['GST_CERT', 'PAN_CERT', 'AGREEMENT', 'REGISTRATION', 'OTHER'];

export default function ViewVendor() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [docType, setDocType] = useState('GST_CERT');
  const [docNumber, setDocNumber] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [addingDoc, setAddingDoc] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await vendorApi.get(uuid);
      setVendor(data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load vendor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  const addDocument = async () => {
    if (!docFile) {
      toast.error('Choose a file first.');
      return;
    }
    setAddingDoc(true);
    try {
      const { data } = await uploadImage(docFile, 'vendor');
      const url = data?.data?.url;
      await vendorDocumentApi.add({
        vendor_uuid: uuid,
        document_type: docType,
        document_number: docNumber || null,
        original_file_name: docFile.name,
        stored_file_name: url.split('/').pop(),
        file_path: url,
        mime_type: docFile.type,
        file_size: docFile.size,
      });
      toast.success('Document added');
      setDocNumber('');
      setDocFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to add document.');
    } finally {
      setAddingDoc(false);
    }
  };

  const deleteDocument = async (docUuid) => {
    try {
      await vendorDocumentApi.remove(docUuid);
      toast.success('Document removed');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to remove document.');
    }
  };

  const logo = vendor?.logo_img ? resolveAssetUrl(vendor.logo_img) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <DetailHeader
        icon={Truck}
        title={vendor?.name || 'Vendor'}
        onBack={() => navigate('/master/vendors')}
        editTo={`/master/vendors/${uuid}/edit`}
      />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-24 w-24 rounded-xl" />
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : vendor ? (
        <>
          {/* Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {logo ? <img src={logo} alt={vendor.name} className="w-full h-full object-cover" /> : <Truck className="h-8 w-8 text-slate-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{vendor.code}</h2>
                <StatusBadge status={vendor.status} />
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{vendor.name} · {vendor.vendor_type || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard icon={Truck} title="Identification">
              <InfoRow label="Name" value={vendor.name || '—'} />
              <InfoRow label="Code" value={vendor.code || '—'} />
              <InfoRow label="Type" value={vendor.vendor_type || '—'} />
              <InfoRow label="Status" value={<StatusBadge status={vendor.status} />} />
              <InfoRow label="Rating" value={vendor.rating != null ? vendor.rating : '—'} />
            </InfoCard>

            <InfoCard icon={Tag} title="Categories">
              {(vendor.categories || []).length === 0 ? (
                <p className="text-[13px] text-slate-400">No categories assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {vendor.categories.map((c) => (
                    <span
                      key={c.uuid}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-[12px] font-medium text-indigo-600 dark:text-indigo-400"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </InfoCard>

            <InfoCard icon={FileText} title="Tax & Payment">
              <InfoRow label="GST number" value={vendor.gst_number || '—'} />
              <InfoRow label="PAN number" value={vendor.pan_number || '—'} />
              <InfoRow label="CIN number" value={vendor.cin_number || '—'} />
              <InfoRow label="Payment terms" value={vendor.payment_terms || '—'} />
              <InfoRow label="Website" value={vendor.website || '—'} />
            </InfoCard>

            <InfoCard icon={Users} title="Contacts">
              {(vendor.contacts || []).length === 0 ? (
                <p className="text-[13px] text-slate-400">No contacts.</p>
              ) : (
                vendor.contacts.map((c, i) => (
                  <div key={i} className="border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {c.first_name} {c.last_name} {c.is_primary && <span className="text-[11px] text-indigo-500">· primary</span>}
                    </p>
                    <p className="text-[12px] text-slate-400">{c.designation || '—'} · {c.email || '—'} · {c.phone || c.mobile || '—'}</p>
                  </div>
                ))
              )}
            </InfoCard>

            <InfoCard icon={MapPin} title="Addresses">
              {(vendor.addresses || []).length === 0 ? (
                <p className="text-[13px] text-slate-400">No addresses.</p>
              ) : (
                vendor.addresses.map((a, i) => (
                  <div key={i} className="border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {a.address_type} {a.is_primary && <span className="text-[11px] text-indigo-500">· primary</span>}
                    </p>
                    <p className="text-[12px] text-slate-400">
                      {[a.address_line_1, a.address_line_2, a.city, a.state, a.country, a.pincode].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                ))
              )}
            </InfoCard>

            <InfoCard icon={Landmark} title="Bank Accounts">
              {(vendor.bankAccounts || []).length === 0 ? (
                <p className="text-[13px] text-slate-400">No bank accounts.</p>
              ) : (
                vendor.bankAccounts.map((b, i) => (
                  <div key={i} className="border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                    <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      {b.bank_name || '—'} {b.is_primary && <span className="text-[11px] text-indigo-500">· primary</span>}
                    </p>
                    <p className="text-[12px] text-slate-400">
                      A/C {b.account_number || '—'} · {b.bank_branch || ''} {b.ifsc || ''} {b.currency_code || ''}
                    </p>
                  </div>
                ))
              )}
            </InfoCard>

            <InfoCard icon={Clock} title="Meta">
              <InfoRow label="Created" value={formatDate(vendor.createdAt ?? vendor.created_at)} />
              <InfoRow label="Last updated" value={formatDate(vendor.updatedAt ?? vendor.updated_at)} />
            </InfoCard>

            <InfoCard icon={FileText} title="Documents">
              <div className="space-y-2">
                {(vendor.documents || []).length === 0 ? (
                  <p className="text-[13px] text-slate-400">No documents.</p>
                ) : (
                  vendor.documents.map((d) => (
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

                {/* Add document */}
                <div className="pt-2 border-t border-slate-100 dark:border-gray-800 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select value={docType} onChange={(e) => setDocType(e.target.value)} className="px-3 py-2 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700">
                      {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                    <input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Doc number (optional)" className="px-3 py-2 rounded-lg text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700" />
                    <input ref={fileRef} type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="px-3 py-2 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 file:mr-2 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-[12px] file:font-semibold file:text-indigo-600" />
                  </div>
                  <button
                    type="button"
                    onClick={addDocument}
                    disabled={addingDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-60 transition-colors"
                  >
                    {addingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Add document
                  </button>
                </div>
              </div>
            </InfoCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
