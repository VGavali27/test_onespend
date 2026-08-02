import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  UserRound,
  KeyRound,
  Briefcase,
  Plus,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { userApi, getCompanyOptions, getDepartmentOptions } from '@/services/masterService';
import { getRoleOptions } from '@/services/accessService';
import ImageUpload from '@/components/ui/ImageUpload';
import { resolveAssetUrl } from '@/utils/assets';

const EMPLOYMENT_TYPES = ['PERMANENT', 'CONTRACT', 'INTERN', 'CONSULTANT'];

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-sm';

const emptyForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile: '',
  password: '',
  profile_image: '',
  role_uuid: '',
  department_uuid: '',
};

const emptyEmployment = {
  company_uuid: '',
  employee_code: '',
  email: '',
  designation: '',
  employment_type: 'PERMANENT',
  joining_date: '',
};

export default function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [employments, setEmployments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);

  // Load lightweight dropdown options on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [r, d, c] = await Promise.all([getRoleOptions(), getDepartmentOptions(), getCompanyOptions()]);
        setRoles(r.data?.data ?? []);
        setDepartments(d.data?.data ?? []);
        setCompanies(c.data?.data ?? []);
      } catch {
        // dropdown load failure is non-fatal — user can still fill the form
      }
    };
    load();
  }, []);

  const goBack = () => navigate('/master/users');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setProfileImage = (value) => setForm((f) => ({ ...f, profile_image: value }));

  const updateEmployment = (i, field, value) =>
    setEmployments((list) => list.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));

  const removeEmployment = (i) => setEmployments((list) => list.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        mobile: form.mobile.trim() || null,
        password: form.password,
        profile_image: form.profile_image.trim() || null,
        role_uuid: form.role_uuid,
        department_uuid: form.department_uuid || null,
        employments: employments.length
          ? employments.map((emp) => ({
              company_uuid: emp.company_uuid,
              employee_code: emp.employee_code,
              email: emp.email || null,
              designation: emp.designation || null,
              employment_type: emp.employment_type,
              joining_date: emp.joining_date || null,
            }))
          : null,
      };
      await userApi.create(payload);
      navigate('/master/users');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Live preview values
  const previewName = [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ').trim() || 'New user';
  const previewInitials = ((form.first_name?.[0] ?? '') + (form.last_name?.[0] ?? '')).toUpperCase() || '?';
  const previewPhoto = form.profile_image ? resolveAssetUrl(form.profile_image) : null;
  const previewRole = roles.find((r) => r.uuid === form.role_uuid);
  const previewDept = departments.find((d) => d.uuid === form.department_uuid);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          title="Back to users"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Add User</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Create a new user account</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 text-[13px] text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* ── Form sections ── */}
        <form id="create-user-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <SectionCard icon={UserRound} title="Personal Information" subtitle="Basic identity and contact details">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0 sm:w-36 flex justify-center sm:block">
                <ImageUpload value={form.profile_image} onChange={setProfileImage} onRemove={() => setProfileImage('')} label="Profile photo" />
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First name" required>
                  <input className={inputClass} value={form.first_name} onChange={set('first_name')} placeholder="e.g. Rajesh" required />
                </Field>
                <Field label="Middle name">
                  <input className={inputClass} value={form.middle_name} onChange={set('middle_name')} />
                </Field>
                <Field label="Last name">
                  <input className={inputClass} value={form.last_name} onChange={set('last_name')} />
                </Field>
                <Field label="Email address">
                  <input type="email" className={inputClass} value={form.email} onChange={set('email')} placeholder="name@company.com" />
                </Field>
                <Field label="Mobile number">
                  <input className={inputClass} value={form.mobile} onChange={set('mobile')} placeholder="+91 90000 00000" />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* Account & Access */}
          <SectionCard icon={KeyRound} title="Account & Access" subtitle="Credentials and organizational placement">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Password" required>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`${inputClass} pr-11`}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    title={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && (
                  <p className={`text-[12px] mt-1 ${form.password.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {form.password.length >= 6 ? '✓ Meets minimum length' : 'Password must be at least 6 characters'}
                  </p>
                )}
              </Field>
              <Field label="Role" required>
                <select className={inputClass} value={form.role_uuid} onChange={set('role_uuid')} required>
                  <option value="">Select role...</option>
                  {roles.map((r) => (
                    <option key={r.uuid} value={r.uuid}>{r.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Department">
                <select className={inputClass} value={form.department_uuid} onChange={set('department_uuid')}>
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.uuid} value={d.uuid}>{d.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </SectionCard>

          {/* Employments */}
          <SectionCard icon={Briefcase} title="Employments" subtitle="Optional — one row per company the user belongs to">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] text-slate-400">
                {employments.length === 0 ? 'No employments added yet.' : `${employments.length} employment${employments.length === 1 ? '' : 's'} added.`}
              </p>
              <button
                type="button"
                onClick={() => setEmployments((l) => [...l, { ...emptyEmployment }])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add employment
              </button>
            </div>

            {employments.length === 0 ? (
              <div className="flex items-center gap-2.5 p-4 rounded-lg border border-dashed border-slate-200 dark:border-gray-700 text-[13px] text-slate-400">
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                Add a company link to assign employee code, employment email and designation.
              </div>
            ) : (
              <div className="space-y-3">
                {employments.map((emp, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                        <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </span>
                        Employment
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEmployment(i)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Remove employment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      <Field label="Company" required>
                        <select
                          className={inputClass}
                          value={emp.company_uuid}
                          onChange={(e) => updateEmployment(i, 'company_uuid', e.target.value)}
                          required
                        >
                          <option value="">Select company...</option>
                          {companies.map((c) => (
                            <option key={c.uuid} value={c.uuid}>{c.name}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Employee code" required>
                        <input
                          className={inputClass}
                          value={emp.employee_code}
                          onChange={(e) => updateEmployment(i, 'employee_code', e.target.value)}
                          placeholder="e.g. EMP-001"
                          required
                        />
                      </Field>
                      <Field label="Employment email">
                        <input
                          type="email"
                          className={inputClass}
                          value={emp.email}
                          onChange={(e) => updateEmployment(i, 'email', e.target.value)}
                          placeholder="name@company.com"
                        />
                      </Field>
                      <Field label="Employment type" required>
                        <select
                          className={inputClass}
                          value={emp.employment_type}
                          onChange={(e) => updateEmployment(i, 'employment_type', e.target.value)}
                        >
                          {EMPLOYMENT_TYPES.map((t) => (
                            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Designation">
                        <input
                          className={inputClass}
                          value={emp.designation}
                          onChange={(e) => updateEmployment(i, 'designation', e.target.value)}
                          placeholder="e.g. Senior Analyst"
                        />
                      </Field>
                      <Field label="Joining date">
                        <input
                          type="date"
                          className={inputClass}
                          value={emp.joining_date}
                          onChange={(e) => updateEmployment(i, 'joining_date', e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </form>

        {/* ── Sticky side panel: live preview + actions ── */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* Live preview */}
          <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-4">User preview</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  previewInitials
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{previewName}</p>
                <p className="text-[12px] text-slate-400 truncate">{form.email || 'No email yet'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800 space-y-2">
              <PreviewRow label="Role" value={previewRole?.name || '—'} />
              <PreviewRow label="Department" value={previewDept?.name || '—'} />
              <PreviewRow label="Employments" value={employments.length ? `${employments.length} company(ies)` : '—'} />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 space-y-2.5">
            <button
              type="submit"
              form="create-user-form"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/20 transition-colors"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={goBack}
              className="w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Presentational helpers ──

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          {subtitle && <p className="text-[12px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="px-4 sm:px-6 py-5">{children}</div>
    </section>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-slate-400">{label}</span>
      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-300 text-right">{value}</span>
    </div>
  );
}
