"use client";

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  personal_email: string | null;
  employment_status: string;
  department?: { id: string; name: string } | null;
  designation?: { id: string; title: string } | null;
}

export function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, [search, page]);

  async function fetchEmployees() {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...(search && { search }),
    });

    const res = await fetch(`/api/employees?${params}`);
    const data = await res.json();

    setEmployees(data.employees || []);
    setTotalPages(data.pagination?.totalPages || 1);
    setIsLoading(false);
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    ON_LEAVE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    TERMINATED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    RESIGNED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    RETIRED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/employees/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/employees/${emp.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {emp.employee_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {emp.first_name} {emp.last_name}
                  </TableCell>
                  <TableCell>{emp.personal_email || "-"}</TableCell>
                  <TableCell>{emp.department?.name || "-"}</TableCell>
                  <TableCell>{emp.designation?.title || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[emp.employment_status] || ""}>
                      {emp.employment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">Loading...</CardContent>
          </Card>
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No employees found
            </CardContent>
          </Card>
        ) : (
          employees.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/employees/${emp.id}`}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {emp.first_name} {emp.last_name}
                      </Link>
                      <p className="text-sm text-gray-500">{emp.employee_code}</p>
                    </div>
                    <Badge variant="outline" className={statusColors[emp.employment_status] || ""}>
                      {emp.employment_status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Dept:</span>
                      <p>{emp.department?.name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <p>{emp.designation?.title || "-"}</p>
                    </div>
                  </div>
                  {emp.personal_email && (
                    <p className="text-sm text-gray-600 truncate">{emp.personal_email}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
