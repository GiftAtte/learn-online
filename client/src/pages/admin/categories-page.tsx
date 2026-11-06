import type { ColumnDef } from '@tanstack/react-table';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  DataTable,
  NumberCell,
  RowActions,
  TableSkeleton,
  TableToolbar,
  TitleCell,
  ToolbarSelect,
} from '@/components/data-display';
import { EmptyState, QueryBoundary, useConfirm } from '@/components/feedback';
import { Page } from '@/components/layout';
import { Button } from '@/components/ui';
import { useGetAllCategories, useDeleteCategory } from '@/core/hooks/queries/use-categories';
import { CategoryFormModal } from '@/components/categories/category-form-modal';
import { useEditTarget } from '@/core/hooks/ui/use-edit-target';
import { pluralize } from '@/core/lib/format';
import { MESSAGES } from '@/core/lib/messages';
import type { Category } from '@/core/types/category.types';
import { NoResultsState } from '@/components/feedback/no-results-state';

const USAGE_OPTIONS = [
  { value: 'used', label: 'Has courses' },
  { value: 'empty', label: 'No courses' },
];

/** The folder tile that anchors each category row. */
const CategoryIcon = () => (
  <span
    className="flex size-11 shrink-0 items-center justify-center rounded-[0.7rem] bg-spruce-50 text-spruce-600"
    aria-hidden
  >
    <FolderTree className="size-5" strokeWidth={1.7} />
  </span>
);

/**
 * Admin categories: route "/admin/categories" (administrators only).
 * A data table of the categories that group courses. The list is short, so search, the usage filter
 * and column sorting all happen in the browser. A category that still has courses can't be deleted.
 */
export default function AdminCategoriesPage() {
  const confirm = useConfirm();
  const categories = useGetAllCategories();
  const deleteCategory = useDeleteCategory();
  const editor = useEditTarget<Category>();

  const [search, setSearch] = useState('');
  const [usage, setUsage] = useState('');
  const hasFilters = !!(search || usage);
  const clearFilters = () => {
    setSearch('');
    setUsage('');
  };

  /** Applies the search box and the usage filter to the loaded categories. */
  const filterRows = (items: Category[]) =>
    items.filter((category) => {
      const matchesSearch = category.name.toLowerCase().includes(search.trim().toLowerCase());
      const count = category.courseCount ?? 0;
      const matchesUsage = usage === '' || (usage === 'used' ? count > 0 : count === 0);
      return matchesSearch && matchesUsage;
    });

  const columns: ColumnDef<Category>[] = [
    {
      id: 'name',
      header: 'Category',
      accessorFn: (category) => category.name,
      cell: ({ row }) => (
        <TitleCell
          leading={<CategoryIcon />}
          title={row.original.name}
          subtitle={pluralize(row.original.courseCount ?? 0, 'published course')}
        />
      ),
    },
    {
      id: 'courses',
      header: 'Published courses',
      accessorFn: (category) => category.courseCount ?? 0,
      sortDescFirst: true,
      cell: ({ row }) => <NumberCell value={row.original.courseCount ?? 0} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <RowActions
            label={`Actions for ${category.name}`}
            actions={[
              { label: 'Rename', icon: Pencil, onSelect: () => editor.openEdit(category) },
              {
                label: 'Delete category',
                icon: Trash2,
                tone: 'danger',
                separated: true,
                onSelect: async () => {
                  if (await confirm({ ...MESSAGES.confirm.deleteCategory })) {
                    deleteCategory.mutate(category.id);
                  }
                },
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <Page
      title="Categories"
      description="Group courses so learners can browse by topic."
      actions={
        <Button onClick={editor.openNew}>
          <Plus className="size-4" aria-hidden />
          New category
        </Button>
      }
    >
      <QueryBoundary query={categories} loading={<TableSkeleton />}>
        {(items) => {
          const rows = filterRows(items);
          return (
            <DataTable
              caption="Categories"
              columns={columns}
              data={rows}
              getRowId={(row) => row.id}
              numericColumns={['courses']}
              toolbar={
                <TableToolbar
                  search={{ value: search, onChange: setSearch, label: 'Search categories' }}
                  filters={
                    <ToolbarSelect
                      label="Filter by usage"
                      value={usage}
                      onChange={setUsage}
                      allLabel="All categories"
                      options={USAGE_OPTIONS}
                    />
                  }
                  summary={pluralize(rows.length, 'category', 'categories')}
                  onClear={hasFilters ? clearFilters : undefined}
                />
              }
              empty={
                hasFilters ? (
                  <NoResultsState onClear={clearFilters} />
                ) : (
                  <EmptyState
                    icon={FolderTree}
                    title="No categories yet"
                    description="Create a category, then add courses to it."
                    action={<Button onClick={editor.openNew}>New category</Button>}
                  />
                )
              }
            />
          );
        }}
      </QueryBoundary>

      {editor.isOpen && <CategoryFormModal existing={editor.item} onClose={editor.close} />}
    </Page>
  );
}
