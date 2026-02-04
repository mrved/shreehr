/**
 * Seed Script: Historical Payroll Data
 * Plan 07-01: Test Data Seeding - Task 3
 * Creates 3 months of payroll history (Nov 2025, Dec 2025, Jan 2026)
 */

import { prisma } from "../src/lib/db";

// Professional Tax slabs by state (monthly, in paise)
const PT_RATES: Record<string, (grossPaise: number) => number> = {
  Karnataka: (gross) => {
    if (gross <= 1500000) return 0;
    if (gross <= 2500000) return 20000;
    return 20000; // ₹200 for > ₹25,000
  },
  Maharashtra: (gross) => {
    if (gross <= 750000) return 0;
    if (gross <= 1000000) return 17500;
    return 20000 + 30000; // ₹200 + ₹300 for higher slabs
  },
  Gujarat: (gross) => {
    if (gross <= 1200000) return 0;
    return 20000; // ₹200
  },
  "Tamil Nadu": (gross) => {
    if (gross <= 2100000) return 0;
    return 20833; // ~₹208
  },
};

// Statutory calculation helpers
function calculatePF(basicPaise: number) {
  const pfBasePaise = Math.min(basicPaise, 1500000); // Cap at ₹15,000
  const employeePF = Math.round(pfBasePaise * 0.12); // 12%
  const employerEPF = Math.round(pfBasePaise * 0.0367); // 3.67%
  const employerEPS = Math.round(Math.min(pfBasePaise, 1500000) * 0.0833); // 8.33%
  const edli = Math.round(pfBasePaise * 0.005); // 0.5%
  const adminCharges = Math.round(pfBasePaise * 0.0051); // ~0.51%

  return {
    employeePF,
    employerEPF,
    employerEPS,
    edli,
    adminCharges,
    totalEmployer: employerEPF + employerEPS + edli + adminCharges,
    pfBase: pfBasePaise,
  };
}

function calculateESI(grossPaise: number) {
  // ESI applicable if gross <= ₹21,000
  if (grossPaise > 2100000) {
    return { employee: 0, employer: 0, applicable: false };
  }
  return {
    employee: Math.round(grossPaise * 0.0075), // 0.75%
    employer: Math.round(grossPaise * 0.0325), // 3.25%
    applicable: true,
  };
}

async function seedPayroll() {
  console.log("🌱 Starting payroll seed...\n");

  // Get all employees with salary structures
  const employees = await prisma.employee.findMany({
    include: {
      salary_structures: {
        orderBy: { effective_from: "desc" },
        take: 1,
      },
    },
    where: {
      employment_status: "ACTIVE",
    },
  });

  if (employees.length === 0) {
    console.log("❌ No employees found. Run seed-employees.ts first!");
    return;
  }

  console.log(`Found ${employees.length} employees\n`);

  // Payroll periods: Nov 2025, Dec 2025, Jan 2026
  const periods = [
    { month: 11, year: 2025 },
    { month: 12, year: 2025 },
    { month: 1, year: 2026 },
  ];

  for (const period of periods) {
    console.log(`\n📅 Processing ${period.month}/${period.year}...\n`);

    // Check if payroll run exists
    let payrollRun = await prisma.payrollRun.findUnique({
      where: {
        month_year: {
          month: period.month,
          year: period.year,
        },
      },
    });

    if (payrollRun) {
      console.log(`⚠️  Payroll run for ${period.month}/${period.year} already exists`);
      continue;
    }

    // Create payroll run
    payrollRun = await prisma.payrollRun.create({
      data: {
        month: period.month,
        year: period.year,
        status: "COMPLETED",
        current_stage: "FINALIZATION",
        total_employees: employees.length,
        processed_count: employees.length,
        success_count: employees.length,
        error_count: 0,
        started_at: new Date(),
        completed_at: new Date(),
      },
    });

    console.log(`✅ Created PayrollRun: ${payrollRun.id}`);

    // Create payroll records for each employee
    for (const emp of employees) {
      const salaryStructure = emp.salary_structures[0];
      if (!salaryStructure) {
        console.log(`⚠️  No salary structure for ${emp.employee_code}`);
        continue;
      }

      // Calculate components
      const basicPaise = salaryStructure.basic_paise;
      const hraPaise = salaryStructure.hra_paise;
      const specialAllowancePaise = salaryStructure.special_allowance_paise;
      const grossBeforeLop = salaryStructure.gross_monthly_paise;

      // Random LOP days (0-2 for some employees)
      const lopDays = emp.employee_code === "SHR004" && period.month === 12 ? 2 : 0;
      const workingDays = 22; // Assume 22 working days
      const paidDays = workingDays - lopDays;
      const lopDeduction = lopDays > 0 ? Math.round((grossBeforeLop / 30) * lopDays) : 0;

      const grossSalary = grossBeforeLop - lopDeduction;

      // Statutory deductions
      const pf = calculatePF(basicPaise);
      const esi = calculateESI(grossSalary);
      const ptRate = PT_RATES[emp.state];
      const ptPaise = ptRate ? ptRate(grossSalary) : 0;

      const totalDeductions =
        pf.employeePF + esi.employee + ptPaise;
      const netSalary = grossSalary - totalDeductions;

      const employerCost = grossSalary + pf.totalEmployer + esi.employer;

      // Check if record exists
      const existingRecord = await prisma.payrollRecord.findUnique({
        where: {
          payroll_run_id_employee_id: {
            payroll_run_id: payrollRun.id,
            employee_id: emp.id,
          },
        },
      });

      if (existingRecord) {
        console.log(`⚠️  Record for ${emp.employee_code} already exists`);
        continue;
      }

      await prisma.payrollRecord.create({
        data: {
          payroll_run_id: payrollRun.id,
          employee_id: emp.id,
          month: period.month,
          year: period.year,
          working_days: workingDays,
          paid_days: paidDays,
          lop_days: lopDays,

          // Earnings
          basic_paise: basicPaise,
          hra_paise: hraPaise,
          special_allowance_paise: specialAllowancePaise,

          gross_before_lop_paise: grossBeforeLop,
          lop_deduction_paise: lopDeduction,
          gross_salary_paise: grossSalary,

          // PF
          pf_employee_paise: pf.employeePF,
          pf_employer_epf_paise: pf.employerEPF,
          pf_employer_eps_paise: pf.employerEPS,
          pf_employer_edli_paise: pf.edli,
          pf_admin_charges_paise: pf.adminCharges,
          pf_total_employer_paise: pf.totalEmployer,
          pf_base_paise: pf.pfBase,

          // ESI
          esi_employee_paise: esi.employee,
          esi_employer_paise: esi.employer,
          esi_applicable: esi.applicable,

          // PT
          pt_paise: ptPaise,

          // TDS (simplified - would need proper calculation in real scenario)
          tds_paise: 0,
          tax_regime: "NEW",

          // Totals
          total_deductions_paise: totalDeductions,
          net_salary_paise: netSalary,
          employer_cost_paise: employerCost,

          status: "PAID",
          processed_at: new Date(),
        },
      });

      const esiNote = esi.applicable ? " (ESI applicable)" : "";
      const lopNote = lopDays > 0 ? ` [${lopDays} LOP days]` : "";
      console.log(
        `   ✅ ${emp.employee_code}: Gross ₹${(grossSalary / 100).toLocaleString()}, Net ₹${(netSalary / 100).toLocaleString()}${esiNote}${lopNote}`
      );
    }
  }

  // Create a loan for one employee (Vikram Singh - SHR004)
  console.log("\n💰 Creating employee loan...\n");

  const vikram = await prisma.employee.findFirst({
    where: { employee_code: "SHR004" },
  });

  if (vikram) {
    const existingLoan = await prisma.employeeLoan.findFirst({
      where: { employee_id: vikram.id },
    });

    if (!existingLoan) {
      const principalPaise = 5000000; // ₹50,000
      const interestRate = 10; // 10% per annum
      const tenureMonths = 12;
      const monthlyRate = interestRate / 12 / 100;
      const emiPaise = Math.round(
        (principalPaise * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      );
      const totalRepayment = emiPaise * tenureMonths;
      const totalInterest = totalRepayment - principalPaise;

      const loan = await prisma.employeeLoan.create({
        data: {
          employee_id: vikram.id,
          loan_type: "SALARY_ADVANCE",
          principal_paise: principalPaise,
          annual_interest_rate: interestRate,
          tenure_months: tenureMonths,
          emi_paise: emiPaise,
          total_interest_paise: totalInterest,
          total_repayment_paise: totalRepayment,
          disbursed_paise: principalPaise,
          disbursement_date: new Date("2025-11-01"),
          remaining_balance_paise: totalRepayment - emiPaise * 3, // 3 EMIs paid
          start_date: new Date("2025-11-01"),
          end_date: new Date("2026-10-31"),
          status: "ACTIVE",
        },
      });

      console.log(
        `✅ Created loan for ${vikram.employee_code}: ₹${principalPaise / 100} @ ${interestRate}% for ${tenureMonths} months`
      );
      console.log(`   EMI: ₹${(emiPaise / 100).toFixed(2)}/month`);

      // Create deduction records for Nov, Dec, Jan
      for (const period of periods) {
        let balance = principalPaise;
        if (period.month === 12 && period.year === 2025) {
          balance = totalRepayment - emiPaise;
        } else if (period.month === 1 && period.year === 2026) {
          balance = totalRepayment - emiPaise * 2;
        }

        await prisma.loanDeduction.create({
          data: {
            loan_id: loan.id,
            month: period.month,
            year: period.year,
            emi_amount_paise: emiPaise,
            principal_paise: Math.round(emiPaise * 0.85), // Simplified
            interest_paise: Math.round(emiPaise * 0.15),
            balance_after_paise: balance - emiPaise,
            status: "DEDUCTED",
          },
        });
      }
      console.log(`   ✅ Created 3 loan deduction records`);
    } else {
      console.log(`⚠️  Loan for ${vikram.employee_code} already exists`);
    }
  }

  console.log("\n✨ Payroll seeding complete!\n");

  // Summary
  const payrollRunCount = await prisma.payrollRun.count();
  const payrollRecordCount = await prisma.payrollRecord.count();
  const loanCount = await prisma.employeeLoan.count();

  console.log("📊 Summary:");
  console.log(`   Payroll Runs: ${payrollRunCount}`);
  console.log(`   Payroll Records: ${payrollRecordCount}`);
  console.log(`   Employee Loans: ${loanCount}`);
}

seedPayroll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
