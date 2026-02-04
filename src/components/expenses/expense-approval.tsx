"use client";

import { Check, Download, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ApprovalLevel {
  level: number;
  role: string;
  approved_by_name?: string;
  approved_at?: string;
  status: string;
}

interface ExpenseApprovalProps {
  expenseId: string;
  employeeName: string;
  expenseDate: string;
  category: string;
  amount: number;
  description: string;
  receiptPath: string | null;
  receiptOriginalName: string | null;
  policyLimit: number | null;
  receiptRequired: boolean;
  currentLevel: number;
  approvalChain: ApprovalLevel[];
}

export function ExpenseApproval({
  expenseId,
  employeeName,
  expenseDate,
  category,
  amount,
  description,
  receiptPath,
  receiptOriginalName,
  policyLimit,
  receiptRequired,
  currentLevel,
  approvalChain,
}: ExpenseApprovalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [rejectionComments, setRejectionComments] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }

      toast({
        title: "Expense approved",
        description: "The expense claim has been approved",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Approval failed",
        description: error instanceof Error ? error.message : "Failed to approve",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionComments.trim()) {
      toast({
        title: "Comments required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectionComments,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject");
      }

      toast({
        title: "Expense rejected",
        description: "The expense claim has been rejected",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Rejection failed",
        description: error instanceof Error ? error.message : "Failed to reject",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const isImage = receiptOriginalName?.match(/\.(jpg|jpeg|png|gif)$/i);

  return (
    <div className="space-y-6">
      {/* Expense Details */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Employee</h3>
              <p className="mt-1 text-sm text-gray-900">{employeeName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1 text-sm text-gray-900">{category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Expense Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(expenseDate).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Amount</h3>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                ₹{amount.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm text-gray-900">{description}</p>
            </div>
          </div>

          {/* Policy Info */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Policy Information</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {policyLimit ? `Limit: ₹${policyLimit.toLocaleString("en-IN")}` : "No limit"}
              </Badge>
              <Badge variant="outline">
                {receiptRequired ? "Receipt required" : "Receipt optional"}
              </Badge>
              {policyLimit && amount > policyLimit && (
                <Badge className="bg-red-100 text-red-800">Exceeds limit!</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Viewer */}
      {receiptPath && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Receipt</CardTitle>
              <a
                href={receiptPath}
                download={receiptOriginalName || "receipt"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {isImage ? (
              <div className="border rounded-lg p-4">
                <img
                  src={receiptPath}
                  alt="Receipt"
                  className="max-w-full h-auto max-h-96 mx-auto"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium">{receiptOriginalName || "Receipt"}</p>
                  <p className="text-sm text-gray-500">PDF Document</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!receiptPath && receiptRequired && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ImageIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">No receipt attached</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This expense category requires a receipt, but none was uploaded.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Chain */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Chain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {approvalChain.map((approval) => (
              <div
                key={approval.level}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  approval.level === currentLevel
                    ? "bg-yellow-50 border border-yellow-200"
                    : approval.status === "APPROVED"
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-1 ${
                      approval.status === "APPROVED"
                        ? "bg-green-600"
                        : approval.level === currentLevel
                          ? "bg-yellow-600"
                          : "bg-gray-400"
                    }`}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Level {approval.level} - {approval.role}
                    </p>
                    {approval.approved_by_name && approval.approved_at && (
                      <p className="text-sm text-gray-600">
                        Approved by {approval.approved_by_name} on{" "}
                        {new Date(approval.approved_at).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
                {approval.level === currentLevel && (
                  <Badge className="bg-yellow-100 text-yellow-800">Current</Badge>
                )}
                {approval.status === "APPROVED" && (
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {!showRejectForm ? (
        <div className="flex gap-4">
          <Button
            variant="destructive"
            onClick={() => setShowRejectForm(true)}
            disabled={processing}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={processing} className="flex-1">
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
        </div>
      ) : (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Reject Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rejection_comments">Reason for Rejection *</Label>
              <Textarea
                id="rejection_comments"
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                placeholder="Please provide a reason for rejecting this expense claim"
                rows={4}
              />
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={processing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
