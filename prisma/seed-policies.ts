/**
 * Seed script to create sample HR policy documents for AI search
 * Run: pnpm tsx prisma/seed-policies.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create connection pool for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const policies = [
  {
    title: "Leave Policy",
    category: "LEAVE",
    description: "Company leave entitlements and procedures",
    content: `# ShreeHR Leave Policy

## 1. Leave Types and Entitlements

### 1.1 Casual Leave (CL)
- **Entitlement**: 12 days per calendar year
- **Carry Forward**: Not allowed
- **Notice**: 1 day advance notice required
- **Max Consecutive**: 3 days without special approval
- **Half-Day**: Allowed

### 1.2 Sick Leave (SL)
- **Entitlement**: 12 days per calendar year
- **Carry Forward**: Not allowed
- **Medical Certificate**: Required for 3 or more consecutive days
- **Notice**: Inform manager on first day of absence
- **Max Consecutive**: No limit with valid medical documentation

### 1.3 Earned Leave (EL) / Privilege Leave
- **Entitlement**: 15 days per calendar year
- **Carry Forward**: Up to 30 days
- **Notice**: 7 days advance notice required
- **Max Consecutive**: 10 days per instance
- **Encashment**: Up to 5 days can be encashed annually

### 1.4 Loss of Pay (LOP)
- Applied when leave balance exhausted
- Affects salary proportionally
- Deducted from gross salary

## 2. Leave Application Process

1. Apply through ShreeHR system or AI Assistant
2. Manager approval required for all leaves
3. Emergency leaves can be regularised within 2 days
4. Cancelled leaves restore balance immediately

## 3. Public Holidays

ShreeHR follows Karnataka state government holidays plus:
- 3 optional holidays (choose from list)
- Office closed on national holidays

## 4. Special Leaves

### Maternity Leave
- 26 weeks (6 months) paid leave
- Can start up to 8 weeks before expected delivery

### Paternity Leave
- 5 days paid leave
- Within 3 months of child's birth

### Bereavement Leave
- Immediate family: 5 days
- Extended family: 3 days

## 5. Contact

For leave policy queries, contact HR at hr@shreehr.local or ask the AI Assistant.
`,
    visible_to_roles: ["EMPLOYEE", "HR_MANAGER", "ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER"],
  },
  {
    title: "Attendance Policy",
    category: "ATTENDANCE",
    description: "Working hours, check-in/out, and attendance rules",
    content: `# ShreeHR Attendance Policy

## 1. Working Hours

### Standard Hours
- **Start Time**: 9:30 AM
- **End Time**: 6:30 PM
- **Break**: 1 hour (1:00 PM - 2:00 PM)
- **Total**: 8 hours per day, 5 days a week

### Flexible Timing (if applicable)
- Core hours: 10:30 AM - 5:00 PM (mandatory presence)
- Flexibility: ±1 hour on start/end time
- Weekly minimum: 40 hours

## 2. Attendance Marking

### Check-In
- Mark attendance via ShreeHR app or biometric
- Late arrival (after 9:45 AM): Requires reason
- Very late (after 10:30 AM): Half-day marked

### Check-Out
- Minimum 8 hours required for full day
- Early leave requires manager approval

## 3. Regularisation

If you forget to check-in/out:
1. Apply for attendance correction within 2 days
2. Provide reason
3. Manager approval required

## 4. Work From Home

- Prior approval required (except emergencies)
- Must be reachable during work hours
- Attendance marking via app mandatory

## 5. Absenteeism

- Unplanned absence without leave: Loss of Pay
- 3+ consecutive unplanned absences: Disciplinary action
- Pattern of absenteeism: Performance review

## 6. Monthly Lock

- Attendance locked on 1st of following month
- Corrections not allowed after lock
- Affects payroll processing
`,
    visible_to_roles: ["EMPLOYEE", "HR_MANAGER", "ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER"],
  },
  {
    title: "Payroll Policy",
    category: "PAYROLL",
    description: "Salary structure, deductions, and payment schedule",
    content: `# ShreeHR Payroll Policy

## 1. Salary Structure

### Components
- **Basic**: Minimum 50% of gross (statutory requirement)
- **HRA**: House Rent Allowance (40% of basic)
- **Special Allowance**: Variable component
- **LTA**: Leave Travel Allowance (annual)
- **Medical**: Medical allowance

### Statutory Deductions
- **PF**: 12% of basic (employee) + 12% (employer)
- **ESI**: 0.75% of gross (if gross < ₹21,000/month)
- **Professional Tax**: As per Karnataka slabs
- **TDS**: Based on tax regime and declarations

## 2. Payment Schedule

- **Pay Date**: Last working day of the month
- **Mode**: Bank transfer (NEFT/IMPS)
- **Payslip**: Available on portal by 2nd of next month

## 3. Tax Declaration

### Investment Declaration Window
- **Q1**: April 1-15 (for full year projections)
- **Proof Submission**: January 15 deadline
- **Final Assessment**: March

### Tax Regimes
- **Old Regime**: Allows deductions (80C, 80D, HRA, etc.)
- **New Regime**: Lower rates, no deductions
- Choose at start of financial year

## 4. Reimbursements

- **Mobile**: Actuals up to ₹1,500/month
- **Internet**: Actuals up to ₹1,000/month
- **Travel**: As per travel policy

## 5. Loans & Advances

- Salary advance: Up to 1 month salary, interest-free
- Emergency loan: Up to 3 months salary, 10% p.a.
- Deducted via EMI from monthly salary

## 6. Form 16

- Issued by June 15 for previous financial year
- Available in ShreeHR portal
`,
    visible_to_roles: ["EMPLOYEE", "HR_MANAGER", "ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER"],
  },
  {
    title: "Expense Reimbursement Policy",
    category: "EXPENSE",
    description: "Guidelines for expense claims and reimbursements",
    content: `# ShreeHR Expense Policy

## 1. Eligible Expenses

### Travel
- Local travel: Actuals (public transport/taxi)
- Outstation: Prior approval required
- Mileage: ₹8/km for personal vehicle

### Meals
- Working late (after 8 PM): Up to ₹300
- Client meetings: Actuals with approval
- Team outings: As per event budget

### Equipment
- Work-from-home setup: One-time ₹10,000 (pro-rated)
- Books/Learning: Up to ₹5,000/year with manager approval

## 2. Non-Eligible Expenses

- Personal entertainment
- Alcohol (unless approved client entertainment)
- Traffic fines
- Family member expenses

## 3. Claim Process

1. Submit within 7 days of expense
2. Attach original receipts (photo/scan acceptable)
3. Manager approval required
4. Finance verification
5. Reimbursed in next payroll

## 4. Approval Limits

| Amount | Approver |
|--------|----------|
| Up to ₹2,000 | Manager |
| ₹2,001 - ₹10,000 | HR Manager |
| Above ₹10,000 | Admin |

## 5. Corporate Card

- For senior roles (L6+)
- Statement reconciliation monthly
- Personal use prohibited
`,
    visible_to_roles: ["EMPLOYEE", "HR_MANAGER", "ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER"],
  },
  {
    title: "Code of Conduct",
    category: "GENERAL",
    description: "Professional behaviour and workplace guidelines",
    content: `# ShreeHR Code of Conduct

## 1. Professional Behaviour

- Treat colleagues with respect and dignity
- No discrimination based on gender, religion, caste, etc.
- Maintain confidentiality of company and employee data
- Dress appropriately for your role

## 2. Workplace Safety

- Report safety hazards immediately
- Keep workspaces clean and organised
- Emergency exits must remain accessible
- No smoking inside office premises

## 3. IT and Data Security

- Use strong passwords, change every 90 days
- Lock computer when away
- No pirated software
- Report suspicious emails/activities
- Company data stays on company devices

## 4. Communication

- Professional language in all official communication
- Respond to work messages within 24 hours
- No personal social media during work hours
- Respect meeting times and agendas

## 5. Conflict of Interest

- Declare any external employment
- No business dealings with family-owned vendors
- Gift acceptance limited to ₹2,000 value

## 6. Grievance Redressal

- Speak to manager first
- Escalate to HR if unresolved
- Anonymous complaints via hr@shreehr.local
- No retaliation against whistleblowers

## 7. Disciplinary Action

Violations may result in:
- Verbal warning
- Written warning
- Suspension
- Termination (for serious offences)
`,
    visible_to_roles: ["EMPLOYEE", "HR_MANAGER", "ADMIN", "SUPER_ADMIN", "PAYROLL_MANAGER"],
  },
];

async function seedPolicies() {
  console.log("🌱 Seeding policy documents...\n");

  for (const policy of policies) {
    const existing = await prisma.policyDocument.findFirst({
      where: { title: policy.title },
    });

    if (existing) {
      console.log(`⏭️  Skipping ${policy.title} (already exists)`);
      continue;
    }

    await prisma.policyDocument.create({
      data: {
        title: policy.title,
        category: policy.category,
        description: policy.description,
        content: policy.content,
        visible_to_roles: policy.visible_to_roles,
        is_active: true,
        embedding_status: "PENDING",
      },
    });

    console.log(`✅ Created: ${policy.title}`);
  }

  console.log("\n✅ Policy documents seeded successfully!");
}

seedPolicies()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
