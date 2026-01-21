"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type Column,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";

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

export type UserRow = {
  name: string;
  email: string;
  phone: string;
  role: "Job Seeker" | "Recruiter";
  status: "Active" | "Pending" | "Suspended";
  joined: string;
};

const globalUserFilter: FilterFn<UserRow> = (row, _columnId, filterValue) => {
  const search = String(filterValue).toLowerCase().trim();
  if (!search) return true;
  const { name, email, phone } = row.original;
  return [name, email, phone].some(value =>
    value.toLowerCase().includes(search),
  );
};

const columns: ColumnDef<UserRow>[] = [
  {
    id: "user",
    header: "User",
    accessorFn: row => row.name,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-muted-foreground text-xs">
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.phone}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.role === "Recruiter"
            ? "border-blue-200 text-blue-600"
            : "border-primary/20 text-primary"
        }
      >
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === "Suspended"
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
    id: "joined",
    header: "Joined",
    accessorFn: row => new Date(row.joined).getTime(),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.joined}</span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Action</div>,
    enableSorting: false,
    cell: () => (
      <div className="flex justify-end">
        <Button variant="ghost" size="sm">
          View
        </Button>
      </div>
    ),
  },
];

type UsersTableProps = {
  data: UserRow[];
};

function SortableHeader({
  column,
  label,
}: {
  column: Column<UserRow, unknown>;
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

export function UsersTable({ data }: UsersTableProps) {
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
    globalFilterFn: globalUserFilter,
  });

  const roleValue = (table.getColumn("role")?.getFilterValue() as string) ?? "";
  const statusValue =
    (table.getColumn("status")?.getFilterValue() as string) ?? "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Search users"
            value={globalFilter ?? ""}
            onChange={event => setGlobalFilter(event.target.value)}
            className="pl-9"
          />
          <div className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2">
            <Search className="size-4 opacity-50" />
          </div>
        </div>
        <Select
          value={roleValue || "all-roles"}
          onValueChange={value => {
            table
              .getColumn("role")
              ?.setFilterValue(value === "all-roles" ? "" : value);
          }}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-roles">All roles</SelectItem>
            <SelectItem value="Job Seeker">Job Seeker</SelectItem>
            <SelectItem value="Recruiter">Recruiter</SelectItem>
          </SelectContent>
        </Select>
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
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
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

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.id === "user" ? (
                    <SortableHeader column={header.column} label="User" />
                  ) : header.column.id === "phone" ? (
                    <SortableHeader column={header.column} label="Phone" />
                  ) : header.column.id === "role" ? (
                    <SortableHeader column={header.column} label="Role" />
                  ) : header.column.id === "status" ? (
                    <SortableHeader column={header.column} label="Status" />
                  ) : header.column.id === "joined" ? (
                    <SortableHeader column={header.column} label="Joined" />
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-6 text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} results
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={value => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {[5, 8, 10, 20].map(size => (
                <SelectItem key={size} value={`${size}`}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
