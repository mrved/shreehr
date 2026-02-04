"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
  id: string;
  employee: { first_name: string; last_name: string; employee_code: string };
  leave_type: { name: string; code: string };
  start_date: string;
  end_date: string;
  days_count: number;
  is_half_day: boolean;
  reason: string;
  status: string;
  approver?: { name: string };
  approved_at?: string;
  rejection_reason?: string;
}

interface LeaveRequestsListProps {
  showApproval?: boolean;
}

export function LeaveRequestsList({ showApproval = false }: LeaveRequestsListProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [showApproval]);

  async function fetchRequests() {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (showApproval) {
        params.set("status", "PENDING");
      }

      const res = await fetch(`/api/leave-requests?${params}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Failed to fetch leave requests:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    id: string,
    action: "approve" | "reject" | "cancel",
    reason?: string,
  ) {
    try {
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      if (res.ok) {
        toast({ title: `Leave request ${action}d` });
        fetchRequests();
      } else {
        const data = await res.json();
        toast({ title: `Failed to ${action}`, description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: `Failed to ${action} leave request`, variant: "destructive" });
    }
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      APPROVED: "default",
      REJECTED: "destructive",
      CANCELLED: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

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
      <CardHeader>
        <CardTitle>{showApproval ? "Pending Approvals" : "My Leave Requests"}</CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No leave requests found</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showApproval && <TableHead>Employee</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      {showApproval && (
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {req.employee.first_name} {req.employee.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {req.employee.employee_code}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">{req.leave_type.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(req.start_date)}
                        {req.start_date !== req.end_date && ` - ${formatDate(req.end_date)}`}
                      </TableCell>
                      <TableCell>
                        {req.days_count}
                        {req.is_half_day && " (half)"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={req.reason}>
                        {req.reason}
                      </TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell>
                        {showApproval && req.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction(req.id, "approve")}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const reason = prompt("Rejection reason:");
                                if (reason) handleAction(req.id, "reject", reason);
                              }}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                        {!showApproval && req.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(req.id, "cancel")}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {requests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {showApproval && (
                            <>
                              <p className="font-medium">
                                {req.employee.first_name} {req.employee.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {req.employee.employee_code}
                              </p>
                            </>
                          )}
                          <Badge variant="outline" className="mt-1">
                            {req.leave_type.code}
                          </Badge>
                        </div>
                        {statusBadge(req.status)}
                      </div>

                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dates:</span>
                          <span>
                            {formatDate(req.start_date)}
                            {req.start_date !== req.end_date && ` - ${formatDate(req.end_date)}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Days:</span>
                          <span>
                            {req.days_count}
                            {req.is_half_day && " (half)"}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">{req.reason}</p>

                      {showApproval && req.status === "PENDING" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleAction(req.id, "approve")}
                          >
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason) handleAction(req.id, "reject", reason);
                            }}
                          >
                            <X className="h-4 w-4 mr-1 text-red-500" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {!showApproval && req.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleAction(req.id, "cancel")}
                        >
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
