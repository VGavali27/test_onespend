import { useEffect, useState } from 'react';
import { formatDate } from '@/utils/format';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Mail, MapPin, FileText, Clock } from 'lucide-react';
import { companyApi } from '@/services/masterService';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { InfoCard, InfoRow, DetailHeader } from '@/components/ui/detail';
import { resolveAssetUrl } from '@/utils/assets';


export default function ViewCompany() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await companyApi.get(uuid);
      setCompany(data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load company.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [uuid]);

  const logo = company?.logo_img ? resolveAssetUrl(company.logo_img) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <DetailHeader
        icon={Building2}
        title={company?.name || 'Company'}
        onBack={() => navigate('/master/companies')}
        editTo={`/master/companies/${uuid}/edit`}
      />

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-24 w-24 rounded-xl" />
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-4 w-64" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : company ? (
        <>
          {/* Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {logo ? (
                <img src={logo} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{company.code}</h2>
                <StatusBadge status={company.status} />
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{company.name} · {company.group?.name || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard icon={Building2} title="Identification">
              <InfoRow label="Name" value={company.name || '—'} />
              <InfoRow label="Code" value={company.code || '—'} />
              <InfoRow label="Group" value={company.group?.name || '—'} />
              <InfoRow label="Status" value={<StatusBadge status={company.status} />} />
            </InfoCard>

            <InfoCard icon={Mail} title="Contact">
              <InfoRow label="Email" value={company.email || '—'} />
              <InfoRow label="Phone" value={company.phone || '—'} />
              <InfoRow label="Website" value={company.website || '—'} />
            </InfoCard>

            <InfoCard icon={MapPin} title="Address">
              <InfoRow label="Address line 1" value={company.address_line_1 || '—'} />
              <InfoRow label="Address line 2" value={company.address_line_2 || '—'} />
              <InfoRow label="City" value={company.city || '—'} />
              <InfoRow label="State" value={company.state || '—'} />
              <InfoRow label="Country" value={company.country || '—'} />
              <InfoRow label="Pincode" value={company.pincode || '—'} />
            </InfoCard>

            <InfoCard icon={FileText} title="Tax & Registration">
              <InfoRow label="GST number" value={company.gst_number || '—'} />
              <InfoRow label="PAN number" value={company.pan_number || '—'} />
              <InfoRow label="CIN number" value={company.cin_number || '—'} />
            </InfoCard>

            <div className="lg:col-span-2">
              <InfoCard icon={Clock} title="Meta">
                <InfoRow label="Created" value={formatDate(company.createdAt ?? company.created_at)} />
                <InfoRow label="Last updated" value={formatDate(company.updatedAt ?? company.updated_at)} />
              </InfoCard>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}