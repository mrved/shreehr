"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { calculateLeaveDays } from "@/lib/validations/leave";

interface LeaveType {
  id: string;
  name: string;
  code: string;
  is_paid: boolean;
  requires_approval: boolean;
  min_days_notice: number;
  annual_quota: number;
}

interface LeaveBalance {
  leaveTypeId: string;
  available: number;
}

interface LeaveRequestFormProps {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
}

const leaveFormSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Please select a leave type"),
    startDate: z.string().min(1, "Please select a start date"),
    endDate: z.string().min(1, "Please select an end date"),
    isHalfDay: z.boolean(),
    halfDayPeriod: z.enum(["FIRST_HALF", "SECOND_HALF"]).optional(),
    reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      if (data.isHalfDay) {
        const start = new Date(data.startDate).setHours(0, 0, 0, 0);
        const end = new Date(data.endDate).setHours(0, 0, 0, 0);
        return start === end;
      }
      return true;
    },
    {
      message: "Half-day leave must be for a single day",
      path: ["endDate"],
    },
  );

type LeaveFormData = z.infer<typeof leaveFormSchema>;

export function LeaveRequestForm({ leaveTypes, balances }: LeaveRequestFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      isHalfDay: false,
      halfDayPeriod: "FIRST_HALF",
      reason: "",
    },
  });

  const watchLeaveTypeId = watch("leaveTypeId");
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");
  const watchIsHalfDay = watch("isHalfDay");

  const selectedLeaveType = leaveTypes.find((lt) => lt.id === watchLeaveTypeId);
  const selectedBalance = balances.find((b) => b.leaveTypeId === watchLeaveTypeId);

  // Calculate leave days in real-time
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate);
      const end = new Date(watchEndDate);
      const days = calculateLeaveDays(start, end, watchIsHalfDay);
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [watchStartDate, watchEndDate, watchIsHalfDay]);

  // Auto-set end date to start date for half-day
  useEffect(() => {
    if (watchIsHalfDay && watchStartDate) {
      setValue("endDate", watchStartDate);
    }
  }, [watchIsHalfDay, watchStartDate, setValue]);

  const onSubmit = async (data: LeaveFormData) => {
    setSubmitting(true);

    try {
      const payload = {
        leaveTypeId: data.leaveTypeId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        isHalfDay: data.isHalfDay,
        halfDayPeriod: data.halfDayPeriod,
        reason: data.reason,
      };

      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Leave request submitted successfully" });
        router.push("/employee/leave");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast({
          title: "Failed to submit leave request",
          description: errorData.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to submit leave request",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasInsufficientBalance =
    calculatedDays > 0 && selectedBalance && calculatedDays > selectedBalance.available;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for Leave</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leaveTypeId">Leave Type</Label>
            <Select
              value={watchLeaveTypeId}
              onValueChange={(value) => setValue("leaveTypeId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code}){!lt.is_paid && " - Unpaid"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveTypeId && (
              <p className="text-sm text-red-600">{errors.leaveTypeId.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input type="date" id="startDate" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input type="date" id="endDate" {...register("endDate")} disabled={watchIsHalfDay} />
              {errors.endDate && <p className="text-sm text-red-600">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Half Day Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="halfDay"
              checked={watchIsHalfDay}
              onCheckedChange={(checked) => setValue("isHalfDay", checked)}
            />
            <Label htmlFor="halfDay">Half Day Leave</Label>
          </div>

          {/* Half Day Period */}
          {watchIsHalfDay && (
            <div className="space-y-2">
              <Label>Half Day Period</Label>
              <Select
                value={watch("halfDayPeriod")}
                onValueChange={(value) =>
                  setValue("halfDayPeriod", value as "FIRST_HALF" | "SECOND_HALF")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRST_HALF">First Half (Morning)</SelectItem>
                  <SelectItem value="SECOND_HALF">Second Half (Afternoon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              {...register("reason")}
              placeholder="Enter reason for leave"
              rows={4}
            />
            {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
          </div>

          {/* Real-time Balance Validation */}
          {watchLeaveTypeId && calculatedDays > 0 && (
            <Card
              className={
                hasInsufficientBalance ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"
              }
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {hasInsufficientBalance ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    <span
                      className={`font-medium ${hasInsufficientBalance ? "text-red-700" : "text-green-700"}`}
                    >
                      {hasInsufficientBalance ? "Insufficient Balance" : "Balance Available"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Requested Days</p>
                      <p className="font-semibold">{calculatedDays}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available Balance</p>
                      <p className="font-semibold">{selectedBalance?.available || 0}</p>
                    </div>
                  </div>
                  {selectedLeaveType && selectedLeaveType.min_days_notice > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: This leave type requires {selectedLeaveType.min_days_notice} days
                      advance notice
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={submitting || hasInsufficientBalance}
              className="flex-1 md:flex-initial"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Request
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
