"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  title: string;
}

interface OnboardingFormProps {
  departments: Department[];
  designations: Designation[];
}

const checklistItemSchema = z.object({
  category: z.enum(["IT", "Admin", "Manager", "HR"]),
  title: z.string().min(1, "Title required"),
  assignee: z.string().min(1, "Assignee required"),
  due_days: z.number().min(0, "Must be 0 or positive"),
  required: z.boolean(),
});

const formSchema = z.object({
  candidate_name: z.string().min(2, "Name must be at least 2 characters"),
  candidate_email: z.string().email("Invalid email address"),
  candidate_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number (10 digits, starting with 6-9)"),
  designation_id: z.string().min(1, "Select a designation"),
  department_id: z.string().min(1, "Select a department"),
  offered_salary: z.number().min(1, "Salary must be greater than 0"),
  joining_date: z.string().min(1, "Select joining date"),
  checklist: z.array(checklistItemSchema).min(1, "Add at least one checklist item"),
});

type FormData = z.infer<typeof formSchema>;

const defaultChecklistItems = [
  {
    category: "IT" as const,
    title: "Create email account",
    assignee: "IT Team",
    due_days: -2,
    required: true,
  },
  {
    category: "IT" as const,
    title: "Setup laptop/workstation",
    assignee: "IT Team",
    due_days: 0,
    required: true,
  },
  {
    category: "Admin" as const,
    title: "Prepare ID card",
    assignee: "Admin",
    due_days: 0,
    required: true,
  },
  {
    category: "HR" as const,
    title: "Collect documents (PAN, Aadhaar, Bank details)",
    assignee: "HR Manager",
    due_days: 0,
    required: true,
  },
  {
    category: "Manager" as const,
    title: "Introduce to team",
    assignee: "Reporting Manager",
    due_days: 0,
    required: false,
  },
  {
    category: "HR" as const,
    title: "Complete compliance training",
    assignee: "HR Manager",
    due_days: 7,
    required: true,
  },
];

export function OnboardingForm({ departments, designations }: OnboardingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      candidate_name: "",
      candidate_email: "",
      candidate_phone: "",
      designation_id: "",
      department_id: "",
      offered_salary: 0,
      joining_date: "",
      checklist: defaultChecklistItems,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "checklist",
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);

    try {
      // Validate joining date is in the future
      const joiningDate = new Date(data.joining_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (joiningDate < today) {
        toast({
          title: "Invalid joining date",
          description: "Joining date must be in the future",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Convert salary from rupees to paise
      const payload = {
        ...data,
        offered_salary_paise: Math.round(data.offered_salary * 100),
      };

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create onboarding record");
      }

      const result = await response.json();

      toast({
        title: "Onboarding record created",
        description: `Offer letter will be sent to ${data.candidate_email}`,
      });

      router.push(`/onboarding/${result.id}`);
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create record",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Candidate Details */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="candidate_name">Full Name *</Label>
              <Input
                id="candidate_name"
                {...register("candidate_name")}
                placeholder="John Doe"
              />
              {errors.candidate_name && (
                <p className="text-sm text-red-600 mt-1">{errors.candidate_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="candidate_email">Email *</Label>
              <Input
                id="candidate_email"
                type="email"
                {...register("candidate_email")}
                placeholder="john@example.com"
              />
              {errors.candidate_email && (
                <p className="text-sm text-red-600 mt-1">{errors.candidate_email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="candidate_phone">Phone Number *</Label>
              <Input
                id="candidate_phone"
                {...register("candidate_phone")}
                placeholder="9876543210"
                maxLength={10}
              />
              {errors.candidate_phone && (
                <p className="text-sm text-red-600 mt-1">{errors.candidate_phone.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Details */}
      <Card>
        <CardHeader>
          <CardTitle>Position Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designation_id">Designation *</Label>
              <Select {...register("designation_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((designation) => (
                    <SelectItem key={designation.id} value={designation.id}>
                      {designation.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.designation_id && (
                <p className="text-sm text-red-600 mt-1">{errors.designation_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department_id">Department *</Label>
              <Select {...register("department_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department_id && (
                <p className="text-sm text-red-600 mt-1">{errors.department_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="offered_salary">Offered Salary (₹/year) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  id="offered_salary"
                  type="number"
                  className="pl-8"
                  {...register("offered_salary", { valueAsNumber: true })}
                  placeholder="600000"
                />
              </div>
              {errors.offered_salary && (
                <p className="text-sm text-red-600 mt-1">{errors.offered_salary.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="joining_date">Joining Date *</Label>
              <Input id="joining_date" type="date" {...register("joining_date")} />
              {errors.joining_date && (
                <p className="text-sm text-red-600 mt-1">{errors.joining_date.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Onboarding Checklist</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  category: "HR",
                  title: "",
                  assignee: "",
                  due_days: 0,
                  required: false,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                  <div>
                    <Label htmlFor={`checklist.${index}.category`}>Category</Label>
                    <Select {...register(`checklist.${index}.category`)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`checklist.${index}.title`}>Task Title</Label>
                    <Input {...register(`checklist.${index}.title`)} placeholder="Task name" />
                    {errors.checklist?.[index]?.title && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.checklist[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`checklist.${index}.assignee`}>Assignee</Label>
                    <Input
                      {...register(`checklist.${index}.assignee`)}
                      placeholder="Role or name"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`checklist.${index}.due_days`}>Due Days</Label>
                    <Input
                      {...register(`checklist.${index}.due_days`, { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Days from joining (- for before)</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id={`checklist.${index}.required`} {...register(`checklist.${index}.required`)} />
                <Label htmlFor={`checklist.${index}.required`} className="font-normal">
                  Required for completion
                </Label>
              </div>
            </div>
          ))}

          {errors.checklist && typeof errors.checklist.message === "string" && (
            <p className="text-sm text-red-600">{errors.checklist.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Onboarding & Send Offer"
          )}
        </Button>
      </div>
    </form>
  );
}
