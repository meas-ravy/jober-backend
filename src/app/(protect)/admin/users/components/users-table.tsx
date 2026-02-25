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
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Search,
  Eye,
  Pencil,
  Trash2,
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
import { UserAvatar } from "@/src/components/ui/user-avatar";
import Link from "next/link";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";

export type UserRow = {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
  phone: string;
  role: "Job Seeker" | "Recruiter" | "Admin";
  status: "Active" | "Pending" | "Suspended";
  joined: string;
  applicationsCount: number;
  jobsCount: number;
};

const globalUserFilter: FilterFn<UserRow> = (row, _columnId, filterValue) => {
  const search = String(filterValue).toLowerCase().trim();
  if (!search) return true;
  const { name, email, phone } = row.original;
  return [name, email, phone].some(value =>
    value.toLowerCase().includes(search),
  );
};

const columns = (onDelete: (user: UserRow) => void): ColumnDef<UserRow>[] => [
  {
    id: "user",
    header: "User",
    accessorFn: row => row.name,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <UserAvatar
          name={row.original.name}
          src={row.original.avatar ?? undefined}
          className="h-10 w-10"
        />
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-muted-foreground text-xs">
            {row.original.email}
          </span>
        </div>
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
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            : "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
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
                : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: "applicationsCount",
    header: "Applications",
    accessorFn: row => row.applicationsCount,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-center">
        {row.original.applicationsCount}
      </span>
    ),
  },
  {
    id: "jobsCount",
    header: "Jobs Posted",
    accessorFn: row => row.jobsCount,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-center">
        {row.original.jobsCount}
      </span>
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
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          asChild
        >
          <Link href={`/admin/users/${row.original.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        {/* <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50"
          onClick={() => onEdit(row.original)}
        >
          <Pencil className="h-4 w-4" />
        </Button> */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50"
          onClick={() => onDelete(row.original)}
        >
          <Trash2 className="h-4 w-4" />
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
  const [tableData, setTableData] = React.useState<UserRow[]>(data);

  const [userToEdit, setUserToEdit] = React.useState<UserRow | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<UserRow | null>(null);

  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  const handleEdit = React.useCallback((user: UserRow) => {
    setUserToEdit(user);
  }, []);

  const handleDelete = React.useCallback((user: UserRow) => {
    setUserToDelete(user);
  }, []);

  const tableColumns = React.useMemo(
    () => columns(handleDelete),
    [handleDelete],
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
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
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.id ===
                      "user" ? (
                      <SortableHeader column={header.column} label="User" />
                    ) : header.column.id === "phone" ? (
                      <SortableHeader column={header.column} label="Phone" />
                    ) : header.column.id === "role" ? (
                      <SortableHeader column={header.column} label="Role" />
                    ) : header.column.id === "status" ? (
                      <SortableHeader column={header.column} label="Status" />
                    ) : header.column.id === "applicationsCount" ? (
                      <SortableHeader
                        column={header.column}
                        label="Applications"
                      />
                    ) : header.column.id === "jobsCount" ? (
                      <SortableHeader
                        column={header.column}
                        label="Jobs Posted"
                      />
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
                  colSpan={tableColumns.length}
                  className="py-6 text-center"
                >
                  No users found.
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

      <EditUserDialog
        user={userToEdit}
        open={!!userToEdit}
        onOpenChange={open => !open && setUserToEdit(null)}
        onSuccess={updatedUser => {
          setTableData(prev =>
            prev.map(user => (user.id === updatedUser.id ? updatedUser : user)),
          );
        }}
      />

      <DeleteUserDialog
        user={userToDelete}
        open={!!userToDelete}
        onOpenChange={open => !open && setUserToDelete(null)}
        onSuccess={deletedUserId => {
          setTableData(prev => prev.filter(user => user.id !== deletedUserId));
        }}
      />
    </div>
  );
}
