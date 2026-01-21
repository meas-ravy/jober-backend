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

export type CompanyRow = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  recruiters: number;
  jobsActive: number;
  status: "Pending" | "Verified" | "Rejected";
  submitted: string;
};

const globalCompanyFilter: FilterFn<CompanyRow> = (
  row,
  _columnId,
  filterValue,
) => {
  const search = String(filterValue).toLowerCase().trim();
  if (!search) return true;
  const { name, contactEmail, contactPhone } = row.original;
  return [name, contactEmail, contactPhone].some(value =>
    value.toLowerCase().includes(search),
  );
};

const columns: ColumnDef<CompanyRow>[] = [
  {
    id: "company",
    header: "Company",
    accessorFn: row => row.name,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-muted-foreground text-xs">
          {row.original.contactEmail}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "contactPhone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.contactPhone}</span>
    ),
  },
  {
    accessorKey: "recruiters",
    header: "Recruiters",
  },
  {
    accessorKey: "jobsActive",
    header: "Active Jobs",
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === "Rejected"
            ? "destructive"
            : row.original.status === "Pending"
              ? "outline"
              : "secondary"
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "submitted",
    header: "Submitted",
    accessorFn: row => new Date(row.submitted).getTime(),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.submitted}</span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Action</div>,
    enableSorting: false,
    cell: () => (
      <div className="flex justify-end">
        <Button variant="ghost" size="sm">
          Review
        </Button>
      </div>
    ),
  },
];

type CompaniesTableProps = {
  data: CompanyRow[];
};

function SortableHeader({
  column,
  label,
}: {
  column: Column<CompanyRow, unknown>;
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

export function CompaniesTable({ data }: CompaniesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 8,
  });

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
    globalFilterFn: globalCompanyFilter,
  });

  const statusValue =
    (table.getColumn("status")?.getFilterValue() as string) ?? "";
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min(totalRows, (pageIndex + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Search companies"
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
            <SelectItem value="all-status">All status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
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
                      "company" ? (
                      <SortableHeader column={header.column} label="Company" />
                    ) : header.column.id === "contactPhone" ? (
                      <SortableHeader column={header.column} label="Phone" />
                    ) : header.column.id === "recruiters" ? (
                      <SortableHeader
                        column={header.column}
                        label="Recruiters"
                      />
                    ) : header.column.id === "jobsActive" ? (
                      <SortableHeader
                        column={header.column}
                        label="Active Jobs"
                      />
                    ) : header.column.id === "status" ? (
                      <SortableHeader column={header.column} label="Status" />
                    ) : header.column.id === "submitted" ? (
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
                  No companies found.
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
            Page {pageIndex + 1} of {table.getPageCount()}
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
