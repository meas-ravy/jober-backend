"use client";

import * as React from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Search,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import Link from "next/link";

export type TipRow = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: string;
  isPublished: boolean;
  authorName: string;
  createdAt: string;
};

const TIP_CATEGORIES = [
  "Career",
  "Interview",
  "Resume",
  "Networking",
  "WorkLife",
  "Skills",
  "JobSearch",
  "Other",
];

const categoryColors: Record<string, string> = {
  Career:
    "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Interview:
    "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  Resume:
    "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Networking:
    "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  WorkLife:
    "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  Skills:
    "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  JobSearch:
    "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  Other:
    "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
};

const globalTipFilter: FilterFn<TipRow> = (row, _columnId, filterValue) => {
  const search = String(filterValue).toLowerCase().trim();
  if (!search) return true;
  const { title, category, authorName } = row.original;
  return [title, category, authorName].some(value =>
    value.toLowerCase().includes(search),
  );
};

type TipsTableProps = {
  data: TipRow[];
  onDelete: (tip: TipRow) => void;
  onTogglePublish: (tip: TipRow) => Promise<void>;
};

function SortableHeader({
  column,
  label,
}: {
  column: Column<TipRow, unknown>;
  label: string;
}) {
  if (!column.getCanSort()) {
    return <span>{label}</span>;
  }

  const sortState = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      {sortState === "asc" ? (
        <ChevronUp className="ml-1 size-3" />
      ) : sortState === "desc" ? (
        <ChevronDown className="ml-1 size-3" />
      ) : (
        <ChevronsUpDown className="ml-1 size-3 text-muted-foreground" />
      )}
    </Button>
  );
}

function PublishCell({
  tip,
  onTogglePublish,
}: {
  tip: TipRow;
  onTogglePublish: (tip: TipRow) => Promise<void>;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onTogglePublish(tip);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={tip.isPublished}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
    </div>
  );
}

export function TipsTable({ data, onDelete, onTogglePublish }: TipsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 8,
  });

  const columns: ColumnDef<TipRow>[] = React.useMemo(
    () => [
      {
        id: "title",
        header: "Title",
        accessorFn: row => row.title,
        cell: ({ row }) => (
          <div className="flex flex-col max-w-xs">
            <span className="font-medium truncate">{row.original.title}</span>
            <span className="text-muted-foreground text-xs truncate">
              {row.original.content.substring(0, 80)}
              {row.original.content.length > 80 ? "..." : ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        filterFn: "equalsString",
        cell: ({ row }) => {
          const cat = row.original.category;
          return (
            <Badge
              variant="outline"
              className={categoryColors[cat] || categoryColors.Other}
            >
              {cat}
            </Badge>
          );
        },
      },
      {
        id: "author",
        header: "Author",
        accessorFn: row => row.authorName,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.authorName}
          </span>
        ),
      },
      {
        id: "published",
        header: () => <div className="text-center">Published</div>,
        cell: ({ row }) => (
          <PublishCell tip={row.original} onTogglePublish={onTogglePublish} />
        ),
      },
      {
        id: "createdAt",
        header: "Created",
        accessorFn: row => new Date(row.createdAt).getTime(),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.createdAt}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              asChild
            >
              <Link href={`/admin/tips/${row.original.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onTogglePublish],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: globalTipFilter,
  });

  const categoryValue =
    (table.getColumn("category")?.getFilterValue() as string) ?? "";
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search tips..."
            value={globalFilter ?? ""}
            onChange={event => setGlobalFilter(event.target.value)}
            className="pl-9"
          />
          <div className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2">
            <Search className="size-4 opacity-50" />
          </div>
        </div>
        <Select
          value={categoryValue || "all-categories"}
          onValueChange={value => {
            table
              .getColumn("category")
              ?.setFilterValue(value === "all-categories" ? "" : value);
          }}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All categories</SelectItem>
            {TIP_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild className="md:ml-auto">
          <Link href="/admin/tips/new">
            <Plus className="mr-2 size-4" />
            Create Tip
          </Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.id ===
                      "title" ? (
                      <SortableHeader column={header.column} label="Title" />
                    ) : header.column.id === "category" ? (
                      <SortableHeader column={header.column} label="Category" />
                    ) : header.column.id === "author" ? (
                      <SortableHeader column={header.column} label="Author" />
                    ) : header.column.id === "published" ? (
                      <SortableHeader
                        column={header.column}
                        label="Published"
                      />
                    ) : header.column.id === "createdAt" ? (
                      <SortableHeader column={header.column} label="Created" />
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-6 text-center"
                >
                  No tips found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">
          Showing {startRow} to {endRow} of {totalRows} entries
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground mr-2">
            Page {pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
