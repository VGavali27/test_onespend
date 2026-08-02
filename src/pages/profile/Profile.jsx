import { useEffect, useState } from 'react';
import {
  UserRound,
  Briefcase,
  Building2,
  Shield,
  RotateCw,
  UserX,
  Inbox,
} from 'lucide-react';
import { getMyProfile } from '@/services/masterService';
import { resolveAssetUrl } from '@/utils/assets';

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  INACTIVE: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  BLOCKED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

const EMPLOYMENT_STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-400/20',
  INACTIVE: 'bg-slate-50 text-slate-600 ring-slate-600/20 dark:bg-gray-800 dark:text-slate-300 dark:ring-slate-400/20',
  RESIGNED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-400/20',
  TERMINATED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20',
};

const getFullName = (u) => [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || '—';

const getInitials = (u) =>
  ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() || '?';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getMyProfile();
      setProfile(data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const photo = profile?.profile_image ? resolveAssetUrl(profile.profile_image) : null;
  const employments = profile?.employments ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Your personal and employment details</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6">
          <div className="skeleton h-20 w-20 rounded-full mx-auto" />
          <div className="skeleton h-4 w-40 mx-auto mt-4" />
          <div className="skeleton h-3 w-56 mx-auto mt-2" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : profile ? (
        <>
          {/* Summary card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(profile)
              )}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{getFullName(profile)}</h2>
                <StatusBadge status={profile.status} styles={STATUS_STYLES} />
              </div>
              <p className="text-sm text-slate-400 mt-0.5 truncate">{profile.email}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20">
                <Shield className="h-3.5 w-3.5" />
                {profile.role?.name || '—'}
              </p>
            </div>
          </div>

          {/* Information grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard icon={UserRound} title="Personal Information">
              <InfoRow label="Full name" value={getFullName(profile)} />
              <InfoRow label="First name" value={profile.first_name} />
              <InfoRow label="Middle name" value={profile.middle_name || '—'} />
              <InfoRow label="Last name" value={profile.last_name || '—'} />
              <InfoRow label="Email" value={profile.email} />
              <InfoRow label="Mobile" value={profile.mobile || '—'} />
              <InfoRow label="Member since" value={formatDate(profile.created_at)} />
            </InfoCard>

            <InfoCard icon={Building2} title="Role & Department">
              <InfoRow label="Role" value={profile.role?.name || '—'} />
              <InfoRow label="Department" value={profile.department?.name || '—'} />
              <InfoRow label="Status" value={<StatusBadge status={profile.status} styles={STATUS_STYLES} />} />
            </InfoCard>
          </div>

          {/* Employments */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Employments</h3>
                <p className="text-[12px] text-slate-400">{employments.length} company link{employments.length === 1 ? '' : 's'}</p>
              </div>
            </div>

            {employments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No employments</p>
                <p className="text-[13px] text-slate-400 mt-0.5">No company links have been assigned to this account.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-gray-800">
                {employments.map((emp) => (
                  <div key={emp.uuid} className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{emp.company?.name || '—'}</p>
                          {emp.company?.code && <p className="text-[11px] text-slate-400">{emp.company.code}</p>}
                        </div>
                      </div>
                      <StatusBadge status={emp.status} styles={EMPLOYMENT_STATUS_STYLES} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pl-11">
                      <Detail label="Employee code" value={emp.employee_code || '—'} />
                      <Detail label="Email" value={emp.email || '—'} />
                      <Detail label="Designation" value={emp.designation || '—'} />
                      <Detail label="Type" value={formatType(emp.employment_type)} />
                      <Detail label="Joining date" value={formatDate(emp.joining_date)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ── Presentational helpers ──

const formatType = (t) => (t ? t.charAt(0) + t.slice(1).toLowerCase() : '—');

function StatusBadge({ status, styles }) {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset';
  const style = (styles ?? STATUS_STYLES)[status] ?? 'bg-slate-50 text-slate-600 ring-slate-600/20 dark:bg-gray-800 dark:text-slate-300 dark:ring-slate-400/20';
  return (
    <span className={`${base} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {(status || '—').charAt(0) + (status || '').slice(1).toLowerCase()}
    </span>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-6 py-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-slate-400">{label}</span>
      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 text-right">{value}</span>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate">{value}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center mb-4">
        <UserX className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Couldn't load your profile</p>
      <p className="text-[13px] text-slate-400 mt-1 max-w-sm">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
      >
        <RotateCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
