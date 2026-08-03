import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Building2, Plus, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import { companyApi } from '@/services/masterService';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { resolveAssetUrl } from '@/utils/assets';

const columnHelper = createColumnHelper();

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

// Client-side sort (the backend list returns all rows unsorted)
const sortRows = (rows, sortBy, sortOrder) => {
  if (!sortBy) return rows;
  const dir = sortOrder === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1 * dir;
    if (bv == null) return -1 * dir;
    if (typeof av === 'string') return av.localeCompare(String(bv)) * dir;
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });
};

export default function Companies() {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const columns = [
    columnHelper.display({
      id: 'logo',
      header: 'Logo',
      enableSorting: false,
      cell: ({ row }) => {
        const src = row.original.logo_img ? resolveAssetUrl(row.original.logo_img) : null;
        return src ? (
          <img
            src={src}
            alt={row.original.name}
            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-400 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
        );
      },
    }),
    columnHelper.accessor('name', {
      header: 'Company',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{row.original.name}</p>
          <p className="text-[12px] text-slate-400 truncate">{row.original.code || '—'}</p>
        </div>
      ),
    }),
    columnHelper.accessor('group', {
      header: 'Group',
      enableSorting: false,
      cell: (info) => info.getValue()?.name || '—',
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue() || '—',
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      enableSorting: false,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <Link
            to={`/master/companies/${row.original.uuid}`}
            title="View company"
            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            to={`/master/companies/${row.original.uuid}/edit`}
            title="Edit company"
            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            title="Delete company"
            onClick={() => setDeleteTarget(row.original)}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const fetchCompanies = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await companyApi.list({}, { signal });
    let rows = data?.data ?? [];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.name, r.code, r.email, r.group?.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    rows = sortRows(rows, sortBy, sortOrder);
    const start = (page - 1) * limit;
    return { data: rows.slice(start, start + limit), total: rows.length };
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await companyApi.remove(deleteTarget.uuid);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete company.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DataTablePage
        title="Companies"
        subtitle="Manage companies under the group"
        icon={Building2}
        columns={columns}
        fetchFn={fetchCompanies}
        countLabel="company"
        emptyMessage="No companies yet"
        searchPlaceholder="Search by name, code or email..."
        reloadKey={reloadKey}
        actions={
          <Link
            to="/master/companies/new"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Company
          </Link>
        }
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete company"
        subtitle="This cannot be undone"
        icon={Trash2}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTarget?.name}</span>? This action
          cannot be undone.
        </p>
      </Modal>
    </>
  );
}