import { useState } from 'react';
import { formatDate } from '@/utils/format';
import { sortRows } from '@/utils/table';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { KeyRound, Plus, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import { permissionApi } from '@/services/accessService';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

const columnHelper = createColumnHelper();



export default function Permissions() {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const columns = [
    columnHelper.accessor('permission_key', {
      header: 'Permission',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{row.original.permission_key}</p>
          <p className="text-[12px] text-slate-400 truncate">
            {[row.original.resource, row.original.action].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      ),
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
    columnHelper.accessor('updatedAt', {
      header: 'Updated',
      enableSorting: false,
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <Link to={`/access/permissions/${row.original.uuid}`} title="View permission" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link to={`/access/permissions/${row.original.uuid}/edit`} title="Edit permission" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            title="Delete permission"
            onClick={() => setDeleteTarget(row.original)}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const fetchPermissions = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await permissionApi.list({}, { signal });
    let rows = data?.data ?? [];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.permission_key, r.resource, r.action, r.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
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
      await permissionApi.remove(deleteTarget.uuid);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete permission.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DataTablePage
        title="Permissions"
        subtitle="Manage permissions"
        icon={KeyRound}
        columns={columns}
        fetchFn={fetchPermissions}
        countLabel="permission"
        emptyMessage="No permissions yet"
        searchPlaceholder="Search permissions..."
        reloadKey={reloadKey}
        actions={
          <Link to="/access/permissions/new" className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors">
            <Plus className="h-4 w-4" />
            Add Permission
          </Link>
        }
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete permission"
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTarget?.permission_key}</span>? This
          action cannot be undone.
        </p>
      </Modal>
    </>
  );
}