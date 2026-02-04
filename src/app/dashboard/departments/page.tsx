"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  _count: { employees: number };
}

interface Designation {
  id: string;
  title: string;
  level: number;
  description: string | null;
  is_active: boolean;
  _count: { employees: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [desigDialogOpen, setDesigDialogOpen] = useState(false);

  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [desigForm, setDesigForm] = useState({ title: "", level: 1, description: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    const [deptRes, desigRes] = await Promise.all([
      fetch("/api/departments"),
      fetch("/api/designations"),
    ]);
    setDepartments(await deptRes.json());
    setDesignations(await desigRes.json());
    setIsLoading(false);
  }

  async function createDepartment(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deptForm),
    });
    setDeptForm({ name: "", description: "" });
    setDeptDialogOpen(false);
    fetchData();
  }

  async function createDesignation(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/designations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(desigForm),
    });
    setDesigForm({ title: "", level: 1, description: "" });
    setDesigDialogOpen(false);
    fetchData();
  }

  async function deleteDepartment(id: string) {
    if (!confirm("Delete this department?")) return;
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function deleteDesignation(id: string) {
    if (!confirm("Delete this designation?")) return;
    await fetch(`/api/designations/${id}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Organization Structure
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Manage departments and designations</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Departments</CardTitle>
            <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Department</DialogTitle>
                </DialogHeader>
                <form onSubmit={createDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deptName">Name *</Label>
                    <Input
                      id="deptName"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deptDesc">Description</Label>
                    <Textarea
                      id="deptDesc"
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Department
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{dept._count.employees}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDepartment(dept.id)}
                        disabled={dept._count.employees > 0}
                        title={
                          dept._count.employees > 0
                            ? "Cannot delete department with employees"
                            : "Delete department"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500">
                      No departments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Designations</CardTitle>
            <Dialog open={desigDialogOpen} onOpenChange={setDesigDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Designation</DialogTitle>
                </DialogHeader>
                <form onSubmit={createDesignation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="desigTitle">Title *</Label>
                    <Input
                      id="desigTitle"
                      value={desigForm.title}
                      onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desigLevel">Level (1-10) *</Label>
                    <Input
                      id="desigLevel"
                      type="number"
                      min="1"
                      max="10"
                      value={desigForm.level}
                      onChange={(e) =>
                        setDesigForm({ ...desigForm, level: parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desigDesc">Description</Label>
                    <Textarea
                      id="desigDesc"
                      value={desigForm.description}
                      onChange={(e) => setDesigForm({ ...desigForm, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Designation
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designations.map((desig) => (
                  <TableRow key={desig.id}>
                    <TableCell className="font-medium">{desig.title}</TableCell>
                    <TableCell>{desig.level}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{desig._count.employees}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDesignation(desig.id)}
                        disabled={desig._count.employees > 0}
                        title={
                          desig._count.employees > 0
                            ? "Cannot delete designation with employees"
                            : "Delete designation"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {designations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No designations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
