"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { investmentCreateSchema } from "@/lib/validations/investment";
import { DocumentUpload } from "./document-upload";

interface InvestmentDeclarationFormProps {
  declarationId?: string | null;
  initialData?: Partial<InvestmentFormData>;
  financialYear: string;
}

// Form schema (amounts in rupees, will convert to paise on submit)
const formSchema = z.object({
  // Section 80C (all in rupees)
  section_80c_ppf: z.number().min(0),
  section_80c_elss: z.number().min(0),
  section_80c_life_insurance: z.number().min(0),
  section_80c_tuition_fees: z.number().min(0),
  section_80c_nps: z.number().min(0),
  section_80c_home_loan_principal: z.number().min(0),
  section_80c_sukanya: z.number().min(0),
  section_80c_other: z.number().min(0),

  // Section 80D
  section_80d_self: z.number().min(0),
  section_80d_parents: z.number().min(0),
  section_80d_checkup: z.number().min(0),

  // HRA
  hra_monthly_rent: z.number().min(0),
  hra_landlord_name: z.string().optional(),
  hra_landlord_pan: z.string().optional(),
  hra_rental_address: z.string().optional(),

  // Other
  section_80e_education_loan: z.number().min(0),
  section_80g_donations: z.number().min(0),
  section_24_home_loan_interest: z.number().min(0),
});

type InvestmentFormData = z.infer<typeof formSchema>;

export function InvestmentDeclarationForm({
  declarationId,
  initialData,
  financialYear,
}: InvestmentDeclarationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [currentDeclarationId, setCurrentDeclarationId] = useState<string | null>(
    declarationId || null,
  );

  // Section collapse state
  const [collapsed, setCollapsed] = useState({
    "80c": false,
    "80d": true,
    hra: true,
    other: true,
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          // Convert from paise to rupees for display
          section_80c_ppf: (initialData.section_80c_ppf || 0) / 100,
          section_80c_elss: (initialData.section_80c_elss || 0) / 100,
          section_80c_life_insurance: (initialData.section_80c_life_insurance || 0) / 100,
          section_80c_tuition_fees: (initialData.section_80c_tuition_fees || 0) / 100,
          section_80c_nps: (initialData.section_80c_nps || 0) / 100,
          section_80c_home_loan_principal: (initialData.section_80c_home_loan_principal || 0) / 100,
          section_80c_sukanya: (initialData.section_80c_sukanya || 0) / 100,
          section_80c_other: (initialData.section_80c_other || 0) / 100,
          section_80d_self: (initialData.section_80d_self || 0) / 100,
          section_80d_parents: (initialData.section_80d_parents || 0) / 100,
          section_80d_checkup: (initialData.section_80d_checkup || 0) / 100,
          hra_monthly_rent: (initialData.hra_monthly_rent || 0) / 100,
          hra_landlord_name: initialData.hra_landlord_name || "",
          hra_landlord_pan: initialData.hra_landlord_pan || "",
          hra_rental_address: initialData.hra_rental_address || "",
          section_80e_education_loan: (initialData.section_80e_education_loan || 0) / 100,
          section_80g_donations: (initialData.section_80g_donations || 0) / 100,
          section_24_home_loan_interest: (initialData.section_24_home_loan_interest || 0) / 100,
        }
      : {
          section_80c_ppf: 0,
          section_80c_elss: 0,
          section_80c_life_insurance: 0,
          section_80c_tuition_fees: 0,
          section_80c_nps: 0,
          section_80c_home_loan_principal: 0,
          section_80c_sukanya: 0,
          section_80c_other: 0,
          section_80d_self: 0,
          section_80d_parents: 0,
          section_80d_checkup: 0,
          hra_monthly_rent: 0,
          hra_landlord_name: "",
          hra_landlord_pan: "",
          hra_rental_address: "",
          section_80e_education_loan: 0,
          section_80g_donations: 0,
          section_24_home_loan_interest: 0,
        },
  });

  // Real-time 80C total calculation
  const section80CFields = useWatch({
    control,
    name: [
      "section_80c_ppf",
      "section_80c_elss",
      "section_80c_life_insurance",
      "section_80c_tuition_fees",
      "section_80c_nps",
      "section_80c_home_loan_principal",
      "section_80c_sukanya",
      "section_80c_other",
    ],
  });

  const total80C = section80CFields.reduce((sum, val) => sum + (val || 0), 0);
  const remaining80C = 150000 - total80C;
  const exceeds80C = total80C > 150000;

  // HRA annual rent for PAN requirement check
  const hraMonthlyRent = watch("hra_monthly_rent") || 0;
  const annualRent = hraMonthlyRent * 12;
  const requiresPAN = annualRent > 100000;

  const toggleSection = (section: keyof typeof collapsed) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onSubmit = async (data: InvestmentFormData, isSubmit = false) => {
    setSubmitting(true);

    try {
      // Convert rupees to paise
      const payload = {
        financial_year: financialYear,
        section_80c_ppf: Math.round(data.section_80c_ppf * 100),
        section_80c_elss: Math.round(data.section_80c_elss * 100),
        section_80c_life_insurance: Math.round(data.section_80c_life_insurance * 100),
        section_80c_tuition_fees: Math.round(data.section_80c_tuition_fees * 100),
        section_80c_nps: Math.round(data.section_80c_nps * 100),
        section_80c_home_loan_principal: Math.round(data.section_80c_home_loan_principal * 100),
        section_80c_sukanya: Math.round(data.section_80c_sukanya * 100),
        section_80c_other: Math.round(data.section_80c_other * 100),
        section_80d_self: Math.round(data.section_80d_self * 100),
        section_80d_parents: Math.round(data.section_80d_parents * 100),
        section_80d_checkup: Math.round(data.section_80d_checkup * 100),
        hra_monthly_rent: Math.round(data.hra_monthly_rent * 100),
        hra_landlord_name: data.hra_landlord_name || null,
        hra_landlord_pan: data.hra_landlord_pan || null,
        hra_rental_address: data.hra_rental_address || null,
        section_80e_education_loan: Math.round(data.section_80e_education_loan * 100),
        section_80g_donations: Math.round(data.section_80g_donations * 100),
        section_24_home_loan_interest: Math.round(data.section_24_home_loan_interest * 100),
      };

      // Create or update declaration
      let response;
      if (currentDeclarationId) {
        response = await fetch(`/api/investments/${currentDeclarationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/investments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save declaration");
      }

      const savedDeclaration = await response.json();
      setCurrentDeclarationId(savedDeclaration.id);

      toast({
        title: "Declaration saved",
        description: "Your investment declaration has been saved as draft.",
      });

      // If submitting for verification
      if (isSubmit) {
        await submitForVerification(savedDeclaration.id);
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save declaration",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitForVerification = async (declId: string) => {
    try {
      const response = await fetch(`/api/investments/${declId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit for verification");
      }

      toast({
        title: "Submitted for verification",
        description: "Your declaration has been submitted to HR for verification.",
      });

      router.push("/employee/investments");
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit",
        variant: "destructive",
      });
    }
  };

  const handleSubmitForVerification = async () => {
    if (!currentDeclarationId) {
      toast({
        title: "Please save as draft first",
        description: "Save your declaration before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Check if documents are uploaded
    const confirmSubmit = confirm(
      "Have you uploaded all supporting documents? Submit for verification?",
    );

    if (confirmSubmit) {
      await submitForVerification(currentDeclarationId);
    }
  };

  return (
    <form className="space-y-6">
      {/* Section 80C */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection("80c")}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Section 80C</CardTitle>
              <p className="text-sm text-gray-500">
                Max deduction: ₹1,50,000 | Total: ₹{total80C.toLocaleString("en-IN")}
                {exceeds80C && <span className="text-red-600 ml-2">Exceeds limit!</span>}
              </p>
            </div>
            {collapsed["80c"] ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {!collapsed["80c"] && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ppf">PPF Contribution</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="ppf"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_ppf", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="elss">ELSS Mutual Funds</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="elss"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_elss", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="life_insurance">Life Insurance Premium</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="life_insurance"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_life_insurance", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tuition">Children Tuition Fees</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="tuition"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_tuition_fees", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max 2 children</p>
              </div>

              <div>
                <Label htmlFor="nps">NPS Contribution</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="nps"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_nps", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="home_loan_principal">Home Loan Principal</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="home_loan_principal"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_home_loan_principal", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sukanya">Sukanya Samriddhi</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="sukanya"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_sukanya", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="other_80c">Other 80C Investments</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="other_80c"
                    type="number"
                    className="pl-8"
                    {...register("section_80c_other", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* Real-time total */}
            <div
              className={`p-3 rounded-lg ${exceeds80C ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Section 80C:</span>
                <span
                  className={`text-lg font-bold ${exceeds80C ? "text-red-700" : "text-blue-700"}`}
                >
                  ₹{total80C.toLocaleString("en-IN")}
                </span>
              </div>
              {!exceeds80C && remaining80C > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Remaining: ₹{remaining80C.toLocaleString("en-IN")}
                </p>
              )}
              {exceeds80C && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Exceeds maximum limit by ₹{(total80C - 150000).toLocaleString("en-IN")}
                </p>
              )}
            </div>

            {/* Document upload for 80C */}
            {currentDeclarationId && (
              <div className="mt-4 pt-4 border-t">
                <DocumentUpload declarationId={currentDeclarationId} section="80C" />
              </div>
            )}
            {!currentDeclarationId && (
              <p className="text-sm text-gray-500 italic">Save as draft to upload documents</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 80D */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection("80d")}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Section 80D - Health Insurance</CardTitle>
              <p className="text-sm text-gray-500">Self: ₹25K, Parents: ₹50K (senior)</p>
            </div>
            {collapsed["80d"] ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {!collapsed["80d"] && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="health_self">Self & Family Premium</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="health_self"
                    type="number"
                    className="pl-8"
                    {...register("section_80d_self", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max ₹25,000</p>
              </div>

              <div>
                <Label htmlFor="health_parents">Parents Premium</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="health_parents"
                    type="number"
                    className="pl-8"
                    {...register("section_80d_parents", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max ₹50,000 if senior citizen</p>
              </div>

              <div>
                <Label htmlFor="preventive_checkup">Preventive Health Checkup</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="preventive_checkup"
                    type="number"
                    className="pl-8"
                    {...register("section_80d_checkup", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max ₹5,000</p>
              </div>
            </div>

            {/* Document upload for 80D */}
            {currentDeclarationId && (
              <div className="mt-4 pt-4 border-t">
                <DocumentUpload declarationId={currentDeclarationId} section="80D" />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* HRA Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection("hra")}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">HRA - House Rent Allowance</CardTitle>
              <p className="text-sm text-gray-500">Rent paid during the year</p>
            </div>
            {collapsed.hra ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {!collapsed.hra && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_rent">Monthly Rent</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="monthly_rent"
                    type="number"
                    className="pl-8"
                    {...register("hra_monthly_rent", { valueAsNumber: true })}
                  />
                </div>
                {annualRent > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Annual: ₹{annualRent.toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="landlord_name">Landlord Name</Label>
                <Input id="landlord_name" type="text" {...register("hra_landlord_name")} />
              </div>

              <div>
                <Label htmlFor="landlord_pan">
                  Landlord PAN {requiresPAN && <span className="text-red-600">*</span>}
                </Label>
                <Input
                  id="landlord_pan"
                  type="text"
                  placeholder="ABCDE1234F"
                  {...register("hra_landlord_pan")}
                />
                {requiresPAN && (
                  <p className="text-xs text-red-600 mt-1">
                    Required when annual rent exceeds ₹1,00,000
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="rental_address">Rental Address</Label>
                <Textarea id="rental_address" rows={2} {...register("hra_rental_address")} />
              </div>
            </div>

            {/* Document upload for HRA */}
            {currentDeclarationId && (
              <div className="mt-4 pt-4 border-t">
                <DocumentUpload declarationId={currentDeclarationId} section="HRA" />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Other Deductions */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection("other")}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Other Deductions</CardTitle>
              <p className="text-sm text-gray-500">80E, 80G, Section 24</p>
            </div>
            {collapsed.other ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </div>
        </CardHeader>
        {!collapsed.other && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="education_loan">80E - Education Loan Interest</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="education_loan"
                    type="number"
                    className="pl-8"
                    {...register("section_80e_education_loan", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">No limit</p>
              </div>

              <div>
                <Label htmlFor="donations">80G - Donations</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="donations"
                    type="number"
                    className="pl-8"
                    {...register("section_80g_donations", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">50% or 100% deductible</p>
              </div>

              <div>
                <Label htmlFor="home_loan_interest">Section 24 - Home Loan Interest</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="home_loan_interest"
                    type="number"
                    className="pl-8"
                    {...register("section_24_home_loan_interest", { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Max ₹2,00,000</p>
              </div>
            </div>

            {/* Document upload for Other */}
            {currentDeclarationId && (
              <div className="mt-4 pt-4 border-t">
                <DocumentUpload declarationId={currentDeclarationId} section="OTHER" />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-white p-4 border-t shadow-lg">
        <Button
          type="button"
          variant="outline"
          onClick={handleSubmit((data) => onSubmit(data, false))}
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
          onClick={handleSubmitForVerification}
          disabled={!currentDeclarationId || submitting}
          className="flex-1"
        >
          Submit for Verification
        </Button>
      </div>
    </form>
  );
}
