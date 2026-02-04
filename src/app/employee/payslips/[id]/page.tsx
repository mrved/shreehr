import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PDFViewer } from "@/components/employee/pdf-viewer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PayslipDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PayslipDetailPage({ params }: PayslipDetailPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.employeeId) {
    redirect("/login");
  }

  const employeeId = session.user.employeeId;

  // Verify the payslip belongs to the employee
  const payslip = await prisma.payrollRecord.findFirst({
    where: {
      id,
      employee_id: employeeId,
    },
    select: {
      id: true,
      month: true,
      year: true,
      status: true,
    },
  });

  if (!payslip) {
    notFound();
  }

  const pdfUrl = `/api/payroll/payslips/${id}/download`;

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/employee/payslips"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Payslips
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">
              Payslip -{" "}
              {new Date(payslip.year, payslip.month - 1).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h1>
          </div>
          <a
            href={pdfUrl}
            download
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PDFViewer pdfUrl={pdfUrl} />
      </div>
    </div>
  );
}
