import { useState } from 'react';
import { formatDate } from '@/utils/format';
import { sortRows } from '@/utils/table';
import { Link } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { Tag, Plus, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import DataTablePage from '@/components/ui/DataTablePage';
import { vendorCategoryApi } from '@/services/vendorService';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

const columnHelper = createColumnHelper();

export default function VendorCategories() {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const columns = [
    columnHelper.accessor('name', {
      header: 'Category',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">{row.original.name}</p>
          <p className="text-[12px] text-slate-400 truncate">{row.original.code || '—'}</p>
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => {
        const v = info.getValue();
        return v ? <p className="text-[13px] text-slate-600 dark:text-slate-300 truncate max-w-[280px]">{v}</p> : <span className="text-[13px] text-slate-400">—</span>;
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
          <Link to={`/master/vendor-categories/${row.original.uuid}`} title="View category" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link to={`/master/vendor-categories/${row.original.uuid}/edit`} title="Edit category" className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            title="Delete category"
            onClick={() => setDeleteTarget(row.original)}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const fetchVendorCategories = async ({ page, limit, sortBy, sortOrder, search }, { signal }) => {
    const { data } = await vendorCategoryApi.list({}, { signal });
    let rows = data?.data ?? [];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.code, r.name, r.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
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
      await vendorCategoryApi.remove(deleteTarget.uuid);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DataTablePage
        title="Vendor Categories"
        subtitle="Define the business types a vendor can serve"
        icon={Tag}
        columns={columns}
        fetchFn={fetchVendorCategories}
        countLabel="category"
        emptyMessage="No vendor categories yet"
        searchPlaceholder="Search categories..."
        reloadKey={reloadKey}
        actions={
          <Link
            to="/master/vendor-categories/new"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Link>
        }
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete category"
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
          <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteTarget?.name || 'this category'}</span>?
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
