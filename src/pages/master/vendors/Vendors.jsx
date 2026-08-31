import { useState } from 'react';
import { formatDate } from '@/utils/format';
import { sortRows } from '@/utils/table';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Truck, Plus, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import { vendorApi } from '@/services/vendorService';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { resolveAssetUrl } from '@/utils/assets';
import { useAuth } from '@/context/AuthContext';

const columnHelper = createColumnHelper();

export default function Vendors() {
  const { hasPermission } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const canCreate = hasPermission('vendors:create');
  const canUpdate = hasPermission('vendors:update');
  const canDelete = hasPermission('vendors:delete');

  const columns = [
    columnHelper.display({
      id: 'logo',
      header: 'Logo',
      enableSorting: false,
      cell: ({ row }) => {
        const src = row.original.logo_img ? resolveAssetUrl(row.original.logo_img) : null;
        return src ? (
          <img src={src} alt={row.original.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-gray-700" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-400 flex items-center justify-center">
            <Truck className="h-4 w-4" />
          </div>
        );
      },
    }),
    columnHelper.accessor('name', {
      header: 'Vendor',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{row.original.name}</p>
          <p className="text-[12px] text-slate-400 truncate">{row.original.code || '—'}</p>
        </div>
      ),
    }),
    columnHelper.accessor('vendor_type', {
      header: 'Type',
      enableSorting: false,
      cell: (info) => info.getValue() || '—',
    }),
    columnHelper.display({
      id: 'categories',
      header: 'Categories',
      enableSorting: false,
      cell: ({ row }) => {
        const cats = row.original.categories || [];
        return cats.length === 0 ? (
          <span className="text-[13px] text-slate-400">—</span>
        ) : (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {cats.slice(0, 3).map((c) => (
              <span
                key={c.uuid}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate"
              >
                {c.name}
              </span>
            ))}
            {cats.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] text-slate-400">+{cats.length - 3}</span>
            )}
          </div>
        );
      },
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
          <Link to={`/master/vendors/${row.original.uuid}`} title="View vendor" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          {canUpdate && (
            <Link to={`/master/vendors/${row.original.uuid}/edit`} title="Edit vendor" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              title="Delete vendor"
              onClick={() => setDeleteTarget(row.original)}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    }),
  ];

  const fetchVendors = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await vendorApi.list({}, { signal });
    let rows = data?.data ?? [];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.name, r.code, r.vendor_type, r.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
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
      await vendorApi.remove(deleteTarget.uuid);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete vendor.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DataTablePage
        title="Vendors"
        subtitle="Manage vendors, contacts, addresses and bank accounts"
        icon={Truck}
        columns={columns}
        fetchFn={fetchVendors}
        countLabel="vendor"
        emptyMessage="No vendors yet"
        searchPlaceholder="Search by name, code or type..."
        reloadKey={reloadKey}
        actions={
          canCreate && (
            <Link
              to="/master/vendors/new"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Vendor
            </Link>
          )
        }
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete vendor"
        subtitle="This cannot be undone"
        icon={Trash2}
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors">
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
