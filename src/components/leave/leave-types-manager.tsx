"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  annual_quota: number;
  max_carry_forward: number;
  is_paid: boolean;
  requires_approval: boolean;
  min_days_notice: number;
  is_active: boolean;
}

export function LeaveTypesManager() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    annualQuota: 0,
    maxCarryForward: 0,
    isPaid: true,
    requiresApproval: true,
    minDaysNotice: 0,
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  async function fetchLeaveTypes() {
    try {
      const res = await fetch("/api/leave-types");
      const data = await res.json();
      setLeaveTypes(data);
    } catch (error) {
      console.error("Failed to fetch leave types:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      code: "",
      description: "",
      annualQuota: 0,
      maxCarryForward: 0,
      isPaid: true,
      requiresApproval: true,
      minDaysNotice: 0,
    });
    setEditingType(null);
  }

  function openEdit(lt: LeaveType) {
    setEditingType(lt);
    setFormData({
      name: lt.name,
      code: lt.code,
      description: lt.description || "",
      annualQuota: lt.annual_quota,
      maxCarryForward: lt.max_carry_forward,
      isPaid: lt.is_paid,
      requiresApproval: lt.requires_approval,
      minDaysNotice: lt.min_days_notice,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = editingType ? `/api/leave-types/${editingType.id}` : "/api/leave-types";
      const method = editingType ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: `Leave type ${editingType ? "updated" : "created"}` });
        setIsDialogOpen(false);
        resetForm();
        fetchLeaveTypes();
      } else {
        const data = await res.json();
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to save leave type", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this leave type?")) return;

    try {
      const res = await fetch(`/api/leave-types/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Leave type deleted" });
        fetchLeaveTypes();
      } else {
        const data = await res.json();
        toast({ title: "Failed to delete", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to delete leave type", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leave Types</CardTitle>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit" : "Add"} Leave Type</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Quota</Label>
                  <Input
                    type="number"
                    value={formData.annualQuota}
                    onChange={(e) =>
                      setFormData({ ...formData, annualQuota: parseFloat(e.target.value) })
                    }
                    min={0}
                    step={0.5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Carry Forward</Label>
                  <Input
                    type="number"
                    value={formData.maxCarryForward}
                    onChange={(e) =>
                      setFormData({ ...formData, maxCarryForward: parseFloat(e.target.value) })
                    }
                    min={0}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Min Days Notice</Label>
                <Input
                  type="number"
                  value={formData.minDaysNotice}
                  onChange={(e) =>
                    setFormData({ ...formData, minDaysNotice: parseInt(e.target.value) })
                  }
                  min={0}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isPaid}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                  />
                  <Label>Paid Leave</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.requiresApproval}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresApproval: checked })
                    }
                  />
                  <Label>Requires Approval</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingType ? "Update" : "Create"} Leave Type
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Annual Quota</TableHead>
                <TableHead>Carry Forward</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.map((lt) => (
                <TableRow key={lt.id} className={!lt.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell>{lt.code}</TableCell>
                  <TableCell>{lt.annual_quota}</TableCell>
                  <TableCell>{lt.max_carry_forward}</TableCell>
                  <TableCell>{lt.is_paid ? "Yes" : "No"}</TableCell>
                  <TableCell>{lt.requires_approval ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(lt)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(lt.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {leaveTypes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No leave types found</p>
          ) : (
            leaveTypes.map((lt) => (
              <div
                key={lt.id}
                className={`border rounded-lg p-4 bg-white ${!lt.is_active ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{lt.name}</h3>
                    <p className="text-sm text-muted-foreground">{lt.code}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(lt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(lt.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Annual Quota:</span>
                    <p className="font-medium">{lt.annual_quota}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carry Forward:</span>
                    <p className="font-medium">{lt.max_carry_forward}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Paid:</span>
                    <p className="font-medium">{lt.is_paid ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Approval:</span>
                    <p className="font-medium">{lt.requires_approval ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
