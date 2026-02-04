"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Upload, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ExpensePolicy {
  id: string;
  category: string;
  limit_paise: number | null;
  receipt_required: boolean;
}

const formSchema = z.object({
  policy_id: z.string().min(1, "Select a category"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  expense_date: z.string().min(1, "Select expense date"),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

type FormData = z.infer<typeof formSchema>;

export function ExpenseForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<ExpensePolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policy_id: "",
      amount: 0,
      expense_date: "",
      description: "",
    },
  });

  const selectedPolicyId = watch("policy_id");
  const amount = watch("amount");
  const expenseDate = watch("expense_date");

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const response = await fetch("/api/expense-policies");
        if (response.ok) {
          const data = await response.json();
          setPolicies(data);
        }
      } catch (error) {
        toast({
          title: "Failed to load policies",
          description: "Could not fetch expense categories",
          variant: "destructive",
        });
      } finally {
        setLoadingPolicies(false);
      }
    }

    loadPolicies();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Receipt must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images (JPG, PNG) and PDFs are allowed",
        variant: "destructive",
      });
      return;
    }

    setReceipt(file);
  };

  const onSaveDraft = async (data: FormData) => {
    setSubmitting(true);

    try {
      // Validate expense date is not in future
      const expDate = new Date(data.expense_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expDate > today) {
        toast({
          title: "Invalid expense date",
          description: "Expense date cannot be in the future",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Validate against policy limit
      if (selectedPolicy?.limit_paise && data.amount * 100 > selectedPolicy.limit_paise) {
        toast({
          title: "Amount exceeds policy limit",
          description: `Maximum allowed: ₹${(selectedPolicy.limit_paise / 100).toLocaleString("en-IN")}`,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const payload = {
        policy_id: data.policy_id,
        amount_paise: Math.round(data.amount * 100),
        expense_date: data.expense_date,
        description: data.description,
      };

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save expense");
      }

      const result = await response.json();
      setDraftId(result.id);

      // Upload receipt if selected
      if (receipt) {
        await uploadReceipt(result.id);
      }

      toast({
        title: "Draft saved",
        description: "Your expense has been saved as draft",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const uploadReceipt = async (expenseId: string) => {
    if (!receipt) return;

    const formData = new FormData();
    formData.append("receipt", receipt);

    try {
      const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload receipt");
      }

      toast({
        title: "Receipt uploaded",
        description: "Receipt has been attached to your expense",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Receipt could not be uploaded",
        variant: "destructive",
      });
    }
  };

  const onSubmitForApproval = async () => {
    if (!draftId) {
      toast({
        title: "Save draft first",
        description: "Please save as draft before submitting",
        variant: "destructive",
      });
      return;
    }

    // Check if receipt is required
    if (selectedPolicy?.receipt_required && !receipt) {
      toast({
        title: "Receipt required",
        description: "This expense category requires a receipt",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/expenses/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }

      toast({
        title: "Submitted for approval",
        description: "Your expense claim has been submitted",
      });

      router.push("/employee/expenses");
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const exceedsLimit =
    selectedPolicy?.limit_paise && amount > 0 ? amount * 100 > selectedPolicy.limit_paise : false;

  return (
    <form className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policy_id">Expense Category *</Label>
              <Select {...register("policy_id")} disabled={loadingPolicies}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingPolicies ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.policy_id && (
                <p className="text-sm text-red-600 mt-1">{errors.policy_id.message}</p>
              )}
              {selectedPolicy && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedPolicy.limit_paise
                    ? `Max limit: ₹${(selectedPolicy.limit_paise / 100).toLocaleString("en-IN")}`
                    : "No limit"}
                  {selectedPolicy.receipt_required && " • Receipt required"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Amount (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  id="amount"
                  type="number"
                  className="pl-8"
                  {...register("amount", { valueAsNumber: true })}
                  placeholder="500"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
              )}
              {exceedsLimit && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Exceeds policy limit!
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="expense_date">Expense Date *</Label>
              <Input
                id="expense_date"
                type="date"
                {...register("expense_date")}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.expense_date && (
                <p className="text-sm text-red-600 mt-1">{errors.expense_date.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the expense purpose and details"
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Receipt Upload</CardTitle>
        </CardHeader>
        <CardContent>
          {receipt ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{receipt.name}</p>
                  <p className="text-sm text-gray-500">{(receipt.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setReceipt(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <Label htmlFor="receipt" className="cursor-pointer">
                <span className="text-blue-600 hover:underline">Click to upload</span> or drag and
                drop
              </Label>
              <p className="text-sm text-gray-500 mt-1">Images or PDF (max 5MB)</p>
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-white p-4 border-t shadow-lg">
        <Button
          type="button"
          variant="outline"
          onClick={handleSubmit(onSaveDraft)}
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save as Draft"
          )}
        </Button>
        <Button
          type="button"
          onClick={onSubmitForApproval}
          disabled={!draftId || submitting || exceedsLimit}
          className="flex-1"
        >
          Submit for Approval
        </Button>
      </div>
    </form>
  );
}
