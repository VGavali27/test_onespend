import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Loader2, Save, ArrowRight } from 'lucide-react';
import { roleHandoverRuleApi, getRoleOptions, syncRoleHandoverRules } from '@/services/accessService';
import { inputClass } from '@/components/ui/form';

export default function RoleHandoverRuleEdit() {
  const [searchParams] = useSearchParams();
  const [rules, setRules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [module, setModule] = useState(searchParams.get('module') || '');
  const [fromRoleUuid, setFromRoleUuid] = useState(searchParams.get('from') || '');
  const [checked, setChecked] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Load module list + all roles once
  useEffect(() => {
    const load = async () => {
      try {
        const [r, o] = await Promise.all([roleHandoverRuleApi.list(), getRoleOptions()]);
        setRules(r.data?.data ?? []);
        setRoles(o.data?.data ?? []);
        // Default the module to the first available if none was preselected
        setModule((prev) => prev || r.data?.data?.[0]?.module || '');
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Unique modules for the selector, sorted alphabetically
  const modules = useMemo(() => [...new Set(rules.map((r) => r.module).filter(Boolean))].sort(), [rules]);

  // Candidate "to" roles — every role except the currently selected from role (a self-rule is meaningless)
  const toRoleOptions = useMemo(
    () => roles.filter((r) => r.uuid !== fromRoleUuid) ?? [],
    [roles, fromRoleUuid],
  );

  // Load the selected from-role's current to-roles — checked = ACTIVE rules only
  useEffect(() => {
    const uuids = rules
      .filter((r) => r.module === module && r.fromRole?.uuid === fromRoleUuid && r.status === 'ACTIVE')
      .map((r) => r.toRole?.uuid)
      .filter(Boolean);
    setChecked(new Set(uuids));
    setError(null);
    setNotice(null);
  }, [module, fromRoleUuid, rules]);

  // Roles that carry an INACTIVE rule for the current selection (kept, not deleted)
  const inactiveUuids = useMemo(
    () =>
      new Set(
        rules
          .filter((r) => r.module === module && r.fromRole?.uuid === fromRoleUuid && r.status === 'INACTIVE')
          .map((r) => r.toRole?.uuid),
      ),
    [rules, module, fromRoleUuid],
  );

  const toggle = (uuid) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
    setNotice(null);
  };

  const handleSave = async () => {
    if (!module || !fromRoleUuid) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { data } = await syncRoleHandoverRules({
        module,
        from_role_uuid: fromRoleUuid,
        to_role_uuids: [...checked],
      });
      setNotice(data?.data?.message || 'Rules saved.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save rules.');
    } finally {
      setSaving(false);
    }
  };

  const selectedFromName = roles.find((r) => r.uuid === fromRoleUuid)?.name || 'a from role';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header — mirrors the Role Permissions page */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <ArrowRightLeft className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Role Handover Rules</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Set which roles each from role can hand over to</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 text-[13px] text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      )}

      {/* Selector card — mirrors the Role Permissions selector */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 flex flex-col sm:flex-row items-end gap-4">
        <label className="block flex-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Module</span>
          <select className={inputClass} value={module} onChange={(e) => setModule(e.target.value)}>
            <option value="">Select a module...</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">From role</span>
          <select className={inputClass} value={fromRoleUuid} onChange={(e) => setFromRoleUuid(e.target.value)}>
            <option value="">Select a from role...</option>
            {roles.map((r) => (
              <option key={r.uuid} value={r.uuid}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !module || !fromRoleUuid}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/20 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>

      {/* To-roles checklist — mirrors the Role Permissions checklist */}
      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">To Roles</h3>
              <p className="text-[12px] text-slate-400">
                {fromRoleUuid && module
                  ? `Which roles ${selectedFromName} may hand over to · ${checked.size} active${inactiveUuids.size ? ` · ${inactiveUuids.size} inactive` : ''}`
                  : 'Select a module and from role above to set its handover rules'}
              </p>
            </div>
          </div>

          {!module || !fromRoleUuid ? (
            <div className="px-6 py-12 text-center text-[13px] text-slate-400">
              Select a module and a from role above.
            </div>
          ) : toRoleOptions.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px] text-slate-400">No roles available.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 px-6 py-4">
              {toRoleOptions.map((role) => (
                <label
                  key={role.uuid}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(role.uuid)}
                    onChange={() => toggle(role.uuid)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">
                      <ArrowRight className="h-3 w-3 text-slate-300 dark:text-gray-600 flex-shrink-0" />
                      {role.name}
                    </span>
                    <span className="block text-[11px] text-slate-400 truncate">
                      {role.code}
                      {inactiveUuids.has(role.uuid) && !checked.has(role.uuid) && (
                        <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-500">· Inactive</span>
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}