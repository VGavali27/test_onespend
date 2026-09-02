import { useEffect, useState } from 'react';
import { formatDate, formatType } from '@/utils/format';
import { getFullName, getInitials } from '@/utils/user';
import {
  UserRound,
  Briefcase,
  Building2,
  Shield,
  RotateCw,
  UserX,
  Inbox,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { getMyProfile, getMyPermissions } from '@/services/masterService';
import { resolveAssetUrl } from '@/utils/assets';
import StatusBadge from '@/components/ui/StatusBadge';
import { InfoCard, InfoRow } from '@/components/ui/detail';

const STATUS_DOT_COLOR = {
  ACTIVE: 'bg-emerald-500',
  INACTIVE: 'bg-slate-400',
  RESIGNED: 'bg-amber-500',
  TERMINATED: 'bg-red-500',
};

const STATUS_DOT_TEXT = {
  ACTIVE: 'text-emerald-700 dark:text-emerald-400',
  INACTIVE: 'text-slate-500 dark:text-slate-400',
  RESIGNED: 'text-amber-700 dark:text-amber-400',
  TERMINATED: 'text-red-700 dark:text-red-400',
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [permGranted, setPermGranted] = useState(0);
  const [permTotal, setPermTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [error, setError] = useState(null);
  const [empFilter, setEmpFilter] = useState('ALL');
  const [activeModule, setActiveModule] = useState(null);

  const loadProfile = async () => {
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

  const loadPermissions = async () => {
    setPermLoading(true);
    try {
      const { data } = await getMyPermissions();
      const permData = data?.data;
      setPermGranted(permData?.totalGranted ?? 0);
      setPermTotal(permData?.totalAvailable ?? 0);
      setGroupedPermissions(permData?.grouped ?? {});
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setPermLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadPermissions();
  }, []);

  const photo = profile?.profile_image ? resolveAssetUrl(profile.profile_image) : null;
  const employments = profile?.employments ?? [];
  const [groupedPermissions, setGroupedPermissions] = useState({});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Your personal details, employments & permissions</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6">
          <div className="skeleton h-20 w-20 rounded-full mx-auto" />
          <div className="skeleton h-4 w-40 mx-auto mt-4" />
          <div className="skeleton h-3 w-56 mx-auto mt-2" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadProfile} />
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
                <StatusBadge status={profile.status} />
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
              <InfoRow label="Member since" value={formatDate(profile.createdAt ?? profile.created_at)} />
              <InfoRow label="Last updated" value={formatDate(profile.updatedAt ?? profile.updated_at)} />
            </InfoCard>

            <InfoCard icon={Building2} title="Role & Department">
              <InfoRow label="Role" value={profile.role?.name || '—'} />
              <InfoRow label="Department" value={profile.department?.name || '—'} />
              <InfoRow label="Status" value={<StatusBadge status={profile.status} />} />
            </InfoCard>
          </div>

          {/* Employments - Dense table + status filter tabs */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
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
                <p className="text-sm text-slate-400 mt-0.5">No company links have been assigned to this account.</p>
              </div>
            ) : (
              <>
                {/* Status filter tabs */}
                <div className="flex flex-wrap items-center gap-1 px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-gray-800">
                  <FilterTab active={empFilter === 'ALL'} onClick={() => setEmpFilter('ALL')} label="All" count={employments.length} />
                  {['ACTIVE', 'INACTIVE', 'RESIGNED', 'TERMINATED'].map(
                    (s) =>
                      employments.some((e) => e.status === s) && (
                        <FilterTab
                          key={s}
                          active={empFilter === s}
                          onClick={() => setEmpFilter(s)}
                          label={s.charAt(0) + s.slice(1).toLowerCase()}
                          count={employments.filter((e) => e.status === s).length}
                          dot={STATUS_DOT_COLOR[s]}
                        />
                      )
                  )}
                </div>

                {/* Dense table */}
                {employments.filter((e) => empFilter === 'ALL' || e.status === empFilter).length === 0 ? (
                  <div className="py-10 px-6 text-center text-sm text-slate-400">
                    No <span className="capitalize">{empFilter.toLowerCase()}</span> employments found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-700">
                          <th className="px-4 sm:px-6 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-48">Company</th>
                          <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Designation</th>
                          <th className="hidden md:table-cell px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Code</th>
                          <th className="hidden sm:table-cell px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                          <th className="hidden lg:table-cell px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Joining</th>
                          <th className="px-4 sm:px-6 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                        {employments
                          .filter((e) => empFilter === 'ALL' || e.status === empFilter)
                          .map((emp) => (
                            <tr key={emp.uuid} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/40 transition-colors">
                              <td className="px-4 sm:px-6 py-2">
                                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">{emp.company?.name || '—'}</p>
                                {emp.company?.code && <p className="text-[12px] text-slate-400 truncate">{emp.company.code}</p>}
                              </td>
                              <td className="px-4 py-2 text-[13px] text-slate-600 dark:text-slate-300 truncate max-w-40">{emp.designation || '—'}</td>
                              <td className="hidden md:table-cell px-4 py-2 text-[13px] text-slate-600 dark:text-slate-300">{emp.employee_code || '—'}</td>
                              <td className="hidden sm:table-cell px-4 py-2 text-[13px] text-slate-600 dark:text-slate-300">{formatType(emp.employment_type)}</td>
                              <td className="hidden lg:table-cell px-4 py-2 text-[13px] text-slate-600 dark:text-slate-300">{formatDate(emp.joining_date)}</td>
                              <td className="px-4 sm:px-6 py-2 text-right">
                                <StatusDot status={emp.status} />
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Permissions - Two-pane module explorer */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <KeyRound className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Permissions</h3>
                <p className="text-[12px] text-slate-400">
                  {permLoading ? 'Loading...' : `${permGranted} of ${permTotal} permissions granted`}
                </p>
              </div>
            </div>

            {permLoading ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400">Loading permissions...</div>
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No permissions found</p>
                <p className="text-sm text-slate-400 mt-0.5">No permissions have been assigned to your role yet.</p>
              </div>
            ) : (
              (() => {
                const moduleKeys = Object.keys(groupedPermissions);
                const effectiveModule =
                  activeModule && moduleKeys.includes(activeModule) ? activeModule : moduleKeys[0];
                const modulePerms = groupedPermissions[effectiveModule];
                const mGranted = modulePerms?.filter((p) => p.granted).length ?? 0;
                const mTotal = modulePerms?.length ?? 0;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
                    {/* Module list */}
                    <div className="relative border-b md:border-b-0 md:border-r border-slate-100 dark:border-gray-800">
                      <div className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-gray-800">
                        Modules ({moduleKeys.length})
                      </div>
                      <div>
                        {moduleKeys.map((resource) => {
                          const perms = groupedPermissions[resource];
                          const granted = perms.filter((p) => p.granted).length;
                          const total = perms.length;
                          const complete = granted === total;
                          const active = resource === effectiveModule;
                          return (
                            <button
                              key={resource}
                              type="button"
                              onClick={() => setActiveModule(resource)}
                              className={`relative w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                                active ? 'bg-indigo-50/70 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-gray-800/40'
                              }`}
                            >
                              {active && (
                                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-600 dark:bg-indigo-400" />
                              )}
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                                  active
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                }`}
                              >
                                {resource.charAt(0).toUpperCase()}
                              </span>
                              <span
                                className={`flex-1 text-[13px] font-medium truncate ${
                                  active
                                    ? 'text-indigo-700 dark:text-indigo-300'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {resource}
                              </span>
                              <span className={`flex items-center gap-1 text-[12px] flex-shrink-0 ${
                                active ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'
                              }`}>
                                {granted}/{total}
                                {complete && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Permission panel */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-gray-700">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                            <KeyRound className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold capitalize text-slate-800 dark:text-slate-200 truncate">
                              {effectiveModule}
                            </p>
                            <p className="text-[12px] text-slate-400 truncate">
                              Manage {effectiveModule.toLowerCase()} related permissions
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span
                            className={`text-[13px] font-bold ${
                              mGranted === mTotal
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {mGranted} / {mTotal}
                          </span>
                          <span className="block text-[11px] text-slate-400">Permissions granted</span>
                        </div>
                      </div>

                      <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] items-center px-4 sm:px-5 py-2 bg-slate-50/50 dark:bg-gray-800/30 border-b border-slate-100 dark:border-gray-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <span>Permission</span>
                        <span>Description</span>
                        <span className="w-24 text-center">Status</span>
                      </div>

                      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-gray-800">
                        {(modulePerms || []).map((p) => (
                          <div
                            key={p.uuid}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-center gap-1 px-4 sm:px-5 py-2.5 hover:bg-slate-50/60 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate">
                                {p.permission_key}
                              </span>
                            </div>
                            <div className="hidden sm:block text-[12px] text-slate-400 truncate">
                              {p.description || '—'}
                            </div>
                            <div className="flex items-center gap-2 justify-self-start sm:justify-self-center sm:w-24">
                              <span
                                className={`relative inline-block w-8 h-[18px] rounded-full transition-colors ${
                                  p.granted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-gray-700'
                                }`}
                              >
                                <span
                                  className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${
                                    p.granted ? 'left-[18px]' : 'left-[2px]'
                                  }`}
                                />
                              </span>
                              <span
                                className={`text-[12px] font-medium ${
                                  p.granted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {p.granted ? 'Granted' : 'Not granted'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ── Presentational helpers ──

function FilterTab({ active, onClick, label, count, dot }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
      }`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {label}
      <span className={active ? 'text-indigo-500 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}>{count}</span>
    </button>
  );
}

function StatusDot({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLOR[status] || 'bg-slate-400'}`} />
      <span className={`text-[12px] font-medium capitalize ${STATUS_DOT_TEXT[status] || 'text-slate-500 dark:text-slate-400'}`}>
        {status ? status.charAt(0) + status.slice(1).toLowerCase() : '—'}
      </span>
    </span>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700">
      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 flex items-center justify-center mb-4">
        <UserX className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Couldn't load your profile</p>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">{message}</p>
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