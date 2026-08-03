import { useEffect, useMemo, useState } from 'react';
import { Shield, Loader2, Save, KeyRound } from 'lucide-react';
import { roleApi, permissionApi, getPermissionsByRole, syncRolePermissions } from '@/services/accessService';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm';

export default function RolePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleUuid, setSelectedRoleUuid] = useState('');
  const [checked, setChecked] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Load roles + all permissions once
  useEffect(() => {
    const load = async () => {
      try {
        const [r, p] = await Promise.all([roleApi.list(), permissionApi.list()]);
        setRoles(r.data?.data ?? []);
        setPermissions(p.data?.data ?? []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch a role's current permissions
  const loadRolePermissions = async (roleUuid) => {
    setPermLoading(true);
    setError(null);
    setNotice(null);
    try {
      const { data } = await getPermissionsByRole(roleUuid);
      setChecked(new Set((data?.data ?? []).map((p) => p.uuid)));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load role permissions.');
      setChecked(new Set());
    } finally {
      setPermLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const v = e.target.value;
    setSelectedRoleUuid(v);
    if (v) loadRolePermissions(v);
    else setChecked(new Set());
  };

  const toggle = (uuid) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
    setNotice(null);
  };

  const toggleGroup = (groupPerms, currentAllChecked) => {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const p of groupPerms) {
        if (currentAllChecked) next.delete(p.uuid);
        else next.add(p.uuid);
      }
      return next;
    });
    setNotice(null);
  };

  const handleSave = async () => {
    if (!selectedRoleUuid) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const { data } = await syncRolePermissions(selectedRoleUuid, [...checked]);
      setNotice(data?.data?.message || 'Permissions saved.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save permissions.');
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const p of permissions) {
      (map[p.resource] ??= []).push(p);
    }
    return Object.entries(map);
  }, [permissions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Role Permissions</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Assign which permissions each role can use</p>
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

      {/* Role selector */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 flex flex-col sm:flex-row items-end gap-4">
        <label className="block flex-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Role</span>
          <select className={inputClass} value={selectedRoleUuid} onChange={handleRoleChange}>
            <option value="">Select a role...</option>
            {roles.map((r) => (
              <option key={r.uuid} value={r.uuid}>{r.name} ({r.code})</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedRoleUuid}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/20 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>

      {/* Checklist */}
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
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Permissions</h3>
              <p className="text-[12px] text-slate-400">
                {selectedRoleUuid
                  ? permLoading
                    ? 'Loading...'
                    : `${checked.size} selected`
                  : 'Select a role above to edit its permissions'}
              </p>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px] text-slate-400">No permissions found.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-gray-800">
              {grouped.map(([resource, perms]) => {
                const allChecked = perms.every((p) => checked.has(p.uuid));
                const someChecked = perms.some((p) => checked.has(p.uuid));
                return (
                  <div key={resource} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {resource}
                      </span>
                      <label className="flex items-center gap-1.5 text-[12px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={() => toggleGroup(perms, allChecked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        {someChecked && !allChecked ? 'Select all' : allChecked ? 'Unselect all' : 'Select all'}
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {perms.map((p) => (
                        <label
                          key={p.uuid}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked.has(p.uuid)}
                            onChange={() => toggle(p.uuid)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">
                              {p.permission_key}
                            </span>
                            {p.description && (
                              <span className="block text-[11px] text-slate-400 truncate">{p.description}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}