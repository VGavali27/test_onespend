import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Settings2, Plus, ArrowRight, Pencil } from 'lucide-react';
import { roleHandoverRuleApi, getRoleOptions } from '@/services/accessService';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/ui/PageHeader';
import { inputClass } from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';

export default function RoleHandoverRules() {
  const { hasPermission } = useAuth();

  if (!hasPermission('role_handover_rules:read_all')) {
    return <div className="min-h-[60vh] flex items-center justify-center">Access Denied</div>;
  }

  const canCreate = hasPermission('role_handover_rules:create');
  const canUpdate = hasPermission('role_handover_rules:update');
  const canDelete = hasPermission('role_handover_rules:delete');

  const [roles, setRoles] = useState([]);
  const [rules, setRules] = useState([]);
  const [module, setModule] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, o] = await Promise.all([roleHandoverRuleApi.list(), getRoleOptions()]);
      const mods = [...new Set((r.data?.data ?? []).map((x) => x.module).filter(Boolean))].sort();
      setRules(r.data?.data ?? []);
      setRoles(o.data?.data ?? []);
      setModule((prev) => (prev ? prev : mods[0] ?? ''));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Unique modules for the selector, sorted alphabetically
  const modules = useMemo(() => [...new Set(rules.map((r) => r.module).filter(Boolean))].sort(), [rules]);

  // One row per role from the roles table. To roles only where a rule exists
  // in the selected module; roles with no rule show blank.
  const rows = useMemo(() => {
    return roles
      .map((role) => ({
        uuid: role.uuid,
        name: role.name,
        links: rules
          .filter((r) => r.fromRole?.uuid === role.uuid && r.module === module)
          .sort((a, b) => (a.toRole?.name || '').localeCompare(b.toRole?.name || '')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roles, rules, module]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        icon={ArrowRightLeft}
        title="Role Handover Rules"
        subtitle="Which roles can hand over approvals to which roles"
        actions={
          <>
            {canUpdate && (
              <Link
                to={`/access/role-handover-rules/edit?module=${encodeURIComponent(module)}`}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings2 className="h-4 w-4" />
                Configure Rules
              </Link>
            )}
            {canCreate && (
              <Link
                to="/access/role-handover-rules/edit"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </Link>
            )}
          </>
        }
      />

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Module filter */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Module</label>
        <select className={`${inputClass} max-w-xs`} value={module} onChange={(e) => setModule(e.target.value)}>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[12px] text-slate-400">
          {module} · {rules.filter((r) => r.module === module).length} rule
          {rules.filter((r) => r.module === module).length === 1 ? '' : 's'} across {roles.length} roles
        </span>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-6 space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-gray-700">
                  <th className="px-6 py-3 font-medium min-w-[12rem]">From role</th>
                  <th className="px-6 py-3 font-medium">Hands over to</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {rows.map((row) => (
                  <tr key={row.uuid} className="group hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-200">{row.name}</td>
                    <td className="px-6 py-3">
                      {row.links.length === 0 ? (
                        <span className="text-[13px] text-slate-300 dark:text-gray-600">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.links.map((link, i) => {
                            const inactive = link.status === 'INACTIVE';
                            return (
                              <span
                                key={`${row.uuid}-${link.toRole?.uuid || i}`}
                                title={inactive ? 'Inactive rule' : 'Active rule'}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                                  inactive
                                    ? 'border-slate-200 dark:border-gray-800 bg-slate-100/70 dark:bg-gray-800/40 opacity-70'
                                    : 'border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800'
                                }`}
                              >
                                <ArrowRight className={`h-3 w-3 ${inactive ? 'text-slate-300 dark:text-gray-500' : 'text-slate-300 dark:text-gray-600'}`} />
                                <span
                                  className={`text-[12px] font-medium ${inactive ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}
                                >
                                  {link.toRole?.name || '—'}
                                </span>
                                <StatusBadge status={link.status} />
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          to={`/access/role-handover-rules/edit?module=${encodeURIComponent(module)}&from=${row.uuid}`}
                          title="Edit rules for this role"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}