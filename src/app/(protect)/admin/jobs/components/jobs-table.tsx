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
  Search,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { JobDetailDialog } from "./job-detail-dialog";

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
  submittedAt?: string;
  createdAt: string;
  applicationCount: number;
  viewCount: number;
  rejectionReason?: string;
};

const globalJobFilter: FilterFn<JobRow> = (row, _columnId, filterValue) => {
  const search = String(filterValue).toLowerCase().trim();
  if (!search) return true;
  const { title, company, location } = row.original;
  return [title, company, location].some((value) =>
    value.toLowerCase().includes(search),
  );
};

const createColumns = (
  onViewJob: (job: JobRow) => void,
): ColumnDef<JobRow>[] => [
  {
    id: "job",
    header: "Job",
    accessorFn: (row) => row.title,
    cell: ({ row }) => (
      <div className="flex flex-col min-w-[200px]">
        <span className="font-medium">{row.original.title}</span>
        <span className="text-muted-foreground text-xs">
          {row.original.company}
        </span>
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
          {type}
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
      );
    },
  },
  {
    accessorKey: "applicationCount",
    header: "Applications",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.applicationCount}</span>
    ),
  },
  {
    accessorKey: "viewCount",
    header: "Views",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.viewCount}</span>
    ),
  },
  {
    id: "submittedAt",
    header: "Submitted",
    accessorFn: (row) =>
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
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewJob(row.original)}
        >
          <Eye className="mr-1 size-3" />
          Review
        </Button>
      </div>
    ),
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
  const [selectedJob, setSelectedJob] = React.useState<JobRow | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleViewJob = (job: JobRow) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const columns = React.useMemo(() => createColumns(handleViewJob), []);

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
      <JobDetailDialog
        job={selectedJob}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search jobs by title, company, or location..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
            <div className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2">
              <Search className="size-4 opacity-50" />
            </div>
          </div>
          <Select
            value={statusValue || "all-status"}
            onValueChange={(value) => {
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
              <SelectItem value="Draft">Draft</SelectItem>
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
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
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
                      ) : header.column.id === "applicationCount" ? (
                        <SortableHeader
                          column={header.column}
                          label="Applications"
                        />
                      ) : header.column.id === "viewCount" ? (
                        <SortableHeader column={header.column} label="Views" />
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
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
