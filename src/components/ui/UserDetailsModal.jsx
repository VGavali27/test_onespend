import { UserRound } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { formatDate } from '@/utils/format';

/**
 * Modal showing an employee's details. `employment` is a UserEmployment object
 * with `user` and `company` included (as returned by the expense list — see
 * expense.repository listInclude).
 */
export default function UserDetailsModal({ employment, onClose }) {
  const user = employment?.user;
  if (!employment || !user) return null;

  const name =
    [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ') || user.email || 'User';

  const rows = [
    ['Email', user.email || '—'],
    ['Mobile', user.mobile || '—'],
    ['Company', employment.company?.name || '—'],
    ['Employee code', employment.employee_code || '—'],
    ['Designation', employment.designation || '—'],
    ['Employment type', employment.employment_type || '—'],
    ['Joining date', employment.joining_date ? formatDate(employment.joining_date) : '—'],
  ];

  return (
    <Modal open onClose={onClose} title={name} subtitle="Submitted by" icon={UserRound} size="sm">
      <div className="space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
            <span className="text-[13px] text-slate-400">{label}</span>
            <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200 text-right">{value}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
