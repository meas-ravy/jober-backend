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
  Eye,
  Loader2,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import Link from "next/link";

export type JobRow = {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  category: string;
  employmentType: string;
  status:
    | "Draft"
    | "Pending"
    | "Active"
    | "Rejected"
    | "Paused"
    | "Closed"
    | "Filled";
  jobImageUrl?: string;
  salaryType: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryFixed?: number;
  salaryCurrency: string;
  salaryPeriod: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  skills?: string;
  experienceLevel?: string;
  workArrangement?: string;
  applicationDeadline?: string;
  positionsAvailable?: number;
  submittedAt?: string;
  createdAt: string;
  applicationCount: number;
  viewCount: number;
  rejectionReason?: string;
  isRecommended: boolean;
};

// Format employment type for display: FullTime -> Full Time
function formatEmploymentType(type: string): string {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

const globalJobFilter: FilterFn<JobRow> = (row, _columnId, filterValue) => {
  const search = String(filterValue).toLowerCase().trim();
  if (!search) return true;
  const { title, company, location } = row.original;
  return [title, company, location].some(value =>
    value.toLowerCase().includes(search),
  );
};

const createColumns = (): ColumnDef<JobRow>[] => [
  {
    id: "job",
    header: "Job",
    accessorFn: row => row.title,
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-[220px]">
        {row.original.companyLogo ? (
          <img
            src={row.original.companyLogo}
            alt={row.original.company}
            className="h-9 w-9 shrink-0 rounded-lg border bg-white object-contain p-0.5"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs font-bold text-muted-foreground">
            {row.original.company.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-muted-foreground text-xs">
            {row.original.company}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.location}</span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge variant="outline" className="whitespace-nowrap">
        {row.original.category}
      </Badge>
    ),
  },
  {
    accessorKey: "employmentType",
    header: "Type",
    filterFn: "equalsString",
    cell: ({ row }) => {
      const type = row.original.employmentType;
      return (
        <Badge
          variant="outline"
          className="whitespace-nowrap border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        >
          {formatEmploymentType(type)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="flex items-center gap-2">
          {status === "Pending" && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500" />
            </span>
          )}
          <Badge
            variant="outline"
            className={
              status === "Active"
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : status === "Pending"
                  ? "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                  : status === "Rejected"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : status === "Filled"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "border-gray-500 bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
            }
          >
            {status}
          </Badge>
        </div>
      );
    },
  },

  {
    id: "submittedAt",
    header: "Submitted",
    accessorFn: row =>
      row.submittedAt ? new Date(row.submittedAt).getTime() : 0,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        {row.original.submittedAt || "N/A"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    enableSorting: false,
    cell: ({ row }) => {
      const [isLoading, setIsLoading] = React.useState(false);
      const isRecommended = row.original.isRecommended;
      const router = useRouter();

      const toggleRecommendation = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(
            `/api/admin/jobs/${row.original.id}/recommend`,
            {
              method: "PATCH",
            },
          );

          if (!res.ok) throw new Error("Failed to toggle recommendation");

          const data = await res.json();
          toast.success(data.message);
          router.refresh();
        } catch (error) {
          toast.error("Failed to update recommendation status");
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="flex justify-end gap-2">
          {row.original.status === "Active" && (
            <Button
              variant="outline"
              size="sm"
              className={`h-8 w-8 p-0 ${isRecommended ? "text-yellow-500 border-yellow-200 bg-yellow-50" : "text-muted-foreground"}`}
              onClick={toggleRecommendation}
              disabled={isLoading}
              title={
                isRecommended
                  ? "Remove from recommended"
                  : "Mark as recommended"
              }
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isRecommended ? (
                <Star className="size-3.5 fill-current" />
              ) : (
                <StarOff className="size-3.5" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
            <Link href={`/admin/jobs/${row.original.id}`}>
              <Eye className="size-3.5" />
            </Link>
          </Button>
        </div>
      );
    },
  },
];

type JobsTableProps = {
  data: JobRow[];
};

function SortableHeader({
  column,
  label,
}: {
  column: Column<JobRow, unknown>;
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

export function JobsTable({ data }: JobsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const columns = React.useMemo(() => createColumns(), []);

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
    globalFilterFn: globalJobFilter,
  });

  const statusValue =
    (table.getColumn("status")?.getFilterValue() as string) ?? "";
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Input
              placeholder="Search jobs by title, company, or location..."
              value={globalFilter ?? ""}
              onChange={event => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
            <div className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2">
              <Search className="size-4 opacity-50" />
            </div>
          </div>
          <Select
            value={statusValue || "all-status"}
            onValueChange={value => {
              table
                .getColumn("status")
                ?.setFilterValue(value === "all-status" ? "" : value);
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Filled">Filled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="md:ml-auto"
            onClick={() => {
              setGlobalFilter("");
              table.resetColumnFilters();
            }}
          >
            Reset filters
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
                        "job" ? (
                        <SortableHeader column={header.column} label="Job" />
                      ) : header.column.id === "location" ? (
                        <SortableHeader
                          column={header.column}
                          label="Location"
                        />
                      ) : header.column.id === "category" ? (
                        <SortableHeader
                          column={header.column}
                          label="Category"
                        />
                      ) : header.column.id === "employmentType" ? (
                        <SortableHeader column={header.column} label="Type" />
                      ) : header.column.id === "status" ? (
                        <SortableHeader column={header.column} label="Status" />
                      ) : header.column.id === "submittedAt" ? (
                        <SortableHeader
                          column={header.column}
                          label="Submitted"
                        />
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
                  <TableRow
                    key={row.id}
                    className={
                      row.original.status === "Pending"
                        ? "border-l-2 border-l-yellow-500 bg-yellow-500/5"
                        : ""
                    }
                  >
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
                    No jobs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
          <span className="text-muted-foreground">
            Showing {startRow} to {endRow} of {totalRows} jobs
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
    </>
  );
}
