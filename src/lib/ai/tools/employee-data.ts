import { prisma } from '@/lib/db';

/**
 * Context for AI tool execution - injected from session
 * This ensures RBAC is enforced in function body, not in AI prompts
 */
export interface ToolContext {
  userId: string;
  employeeId: string | null;
  role: string;
}

/**
 * RBAC validation helper - enforces role-based access control
 * CRITICAL: This is the security boundary - all tools must use this
 */
async function validateAccess(
  context: ToolContext,
  targetEmployeeId: string | undefined
): Promise<{ allowed: boolean; employeeId: string; error?: string }> {
  // If no target specified, use caller's employee
  const requestedId = targetEmployeeId || context.employeeId;

  if (!requestedId) {
    return {
      allowed: false,
      employeeId: '',
      error: 'No employee profile linked to your account',
    };
  }

  // Employees can only see their own data
  if (context.role === 'EMPLOYEE') {
    if (requestedId !== context.employeeId) {
      return {
        allowed: false,
        employeeId: '',
        error: 'You can only view your own data',
      };
    }
    return { allowed: true, employeeId: requestedId };
  }

  // Managers can see their subordinates
  if (context.role === 'HR_MANAGER' || context.role === 'MANAGER') {
    // Check if target is a subordinate
    const subordinate = await prisma.employee.findFirst({
      where: {
        id: requestedId,
        reporting_manager_id: context.employeeId,
      },
    });

    if (subordinate || requestedId === context.employeeId) {
      return { allowed: true, employeeId: requestedId };
    }
    return {
      allowed: false,
      employeeId: '',
      error: 'You can only view your own or subordinates data',
    };
  }

  // Admins can see everyone
  if (
    ['ADMIN', 'SUPER_ADMIN', 'PAYROLL_MANAGER'].includes(context.role)
  ) {
    return { allowed: true, employeeId: requestedId };
  }

  return { allowed: false, employeeId: '', error: 'Access denied' };
}

/**
 * Get employee leave balance for current year or specified year
 * Includes pending leave requests that will affect future balance
 */
export async function getEmployeeLeaveBalance(
  context: ToolContext,
  targetEmployeeId?: string,
  year?: number
) {
  const access = await validateAccess(context, targetEmployeeId);
  if (!access.allowed) return { error: access.error };

  const currentYear = year || new Date().getFullYear();

  const balances = await prisma.leaveBalance.findMany({
    where: {
      employee_id: access.employeeId,
      year: currentYear,
    },
    select: {
      leave_type: true,
      opening: true,
      accrued: true,
      used: true,
      balance: true,
    },
  });

  // Also get pending requests
  const pendingRequests = await prisma.leaveRequest.findMany({
    where: {
      employee_id: access.employeeId,
      status: 'PENDING',
    },
    select: {
      leave_type: { select: { name: true } },
      start_date: true,
      end_date: true,
      days_count: true,
    },
  });

  return {
    year: currentYear,
    balances: balances.map((b) => ({
      type: b.leave_type,
      available: b.balance,
      used: b.used,
      accrued: b.accrued,
    })),
    pendingRequests: pendingRequests.map((r) => ({
      type: r.leave_type.name,
      days: r.days_count,
      from: r.start_date.toISOString().split('T')[0],
      to: r.end_date.toISOString().split('T')[0],
    })),
  };
}

/**
 * Get employee attendance summary for specified month
 * Returns summary stats and recent check-in/out times
 */
export async function getEmployeeAttendance(
  context: ToolContext,
  targetEmployeeId?: string,
  month?: number,
  year?: number
) {
  const access = await validateAccess(context, targetEmployeeId);
  if (!access.allowed) return { error: access.error };

  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();

  // Get attendance records for the month
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0);

  const records = await prisma.attendance.findMany({
    where: {
      employee_id: access.employeeId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      status: true,
      work_minutes: true,
      check_in: true,
      check_out: true,
    },
    orderBy: { date: 'asc' },
  });

  // Calculate summary
  const summary = {
    present: records.filter((r) => r.status === 'PRESENT').length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
    onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
    totalWorkHours: Math.round(
      records.reduce((sum, r) => sum + r.work_minutes, 0) / 60
    ),
  };

  return {
    month: targetMonth,
    year: targetYear,
    summary,
    // Only include last 5 days detail to avoid token explosion
    recentDays: records.slice(-5).map((r) => ({
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      checkIn: r.check_in?.toISOString().split('T')[1]?.substring(0, 5),
      checkOut: r.check_out?.toISOString().split('T')[1]?.substring(0, 5),
    })),
  };
}

/**
 * Get employee salary details for specified month
 * Returns earnings, deductions, and net salary in rupees
 */
export async function getEmployeeSalary(
  context: ToolContext,
  targetEmployeeId?: string,
  month?: number,
  year?: number
) {
  const access = await validateAccess(context, targetEmployeeId);
  if (!access.allowed) return { error: access.error };

  const now = new Date();
  const targetMonth = month || now.getMonth(); // Previous month by default
  const targetYear =
    year || (targetMonth === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const actualMonth = targetMonth === 0 ? 12 : targetMonth;

  const record = await prisma.payrollRecord.findFirst({
    where: {
      employee_id: access.employeeId,
      month: actualMonth,
      year: targetYear,
      status: { in: ['CALCULATED', 'VERIFIED', 'PAID'] },
    },
    select: {
      month: true,
      year: true,
      gross_salary_paise: true,
      net_salary_paise: true,
      basic_paise: true,
      hra_paise: true,
      pf_employee_paise: true,
      pt_paise: true,
      tds_paise: true,
      lop_days: true,
      lop_deduction_paise: true,
      reimbursements_paise: true,
      loan_deductions_paise: true,
      status: true,
    },
  });

  if (!record) {
    return { error: `No salary record found for ${actualMonth}/${targetYear}` };
  }

  // Convert paise to rupees for readability
  const toRupees = (paise: number) => (paise / 100).toFixed(2);

  return {
    month: record.month,
    year: record.year,
    status: record.status,
    earnings: {
      basic: toRupees(record.basic_paise),
      hra: toRupees(record.hra_paise),
      gross: toRupees(record.gross_salary_paise),
      reimbursements: toRupees(record.reimbursements_paise),
    },
    deductions: {
      pf: toRupees(record.pf_employee_paise),
      pt: toRupees(record.pt_paise),
      tds: toRupees(record.tds_paise),
      lop: toRupees(record.lop_deduction_paise),
      loans: toRupees(record.loan_deductions_paise),
    },
    netSalary: toRupees(record.net_salary_paise),
    lopDays: record.lop_days,
  };
}

/**
 * Get employee active loan information
 * Returns outstanding balance and upcoming EMI deductions
 */
export async function getEmployeeLoans(
  context: ToolContext,
  targetEmployeeId?: string
) {
  const access = await validateAccess(context, targetEmployeeId);
  if (!access.allowed) return { error: access.error };

  const loans = await prisma.employeeLoan.findMany({
    where: {
      employee_id: access.employeeId,
      status: { in: ['ACTIVE', 'PENDING'] },
    },
    select: {
      id: true,
      loan_type: true,
      principal_paise: true,
      remaining_balance_paise: true,
      emi_paise: true,
      tenure_months: true,
      start_date: true,
      end_date: true,
      status: true,
      deductions: {
        where: { status: 'SCHEDULED' },
        select: { month: true, year: true },
        take: 3,
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      },
    },
  });

  const toRupees = (paise: number) => (paise / 100).toFixed(2);

  return {
    activeLoans: loans.map((l) => ({
      type: l.loan_type,
      principal: toRupees(l.principal_paise),
      remaining: toRupees(l.remaining_balance_paise),
      emi: toRupees(l.emi_paise),
      status: l.status,
      nextDeductions: l.deductions.map((d) => `${d.month}/${d.year}`),
    })),
    totalOutstanding: toRupees(
      loans.reduce((sum, l) => sum + l.remaining_balance_paise, 0)
    ),
  };
}

/**
 * Get team summary for managers
 * Shows today's attendance and pending approvals
 */
export async function getTeamSummary(context: ToolContext) {
  // Only managers and above can see team data
  if (
    !['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'PAYROLL_MANAGER'].includes(
      context.role
    )
  ) {
    // For regular managers, check if they have subordinates
    const hasSubordinates = await prisma.employee.count({
      where: { reporting_manager_id: context.employeeId },
    });

    if (hasSubordinates === 0) {
      return { error: 'You do not have any team members' };
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day

  // Get subordinates
  const subordinates = await prisma.employee.findMany({
    where:
      context.role === 'EMPLOYEE'
        ? { reporting_manager_id: context.employeeId }
        : {}, // Admins see all
    select: {
      id: true,
      first_name: true,
      last_name: true,
      attendances: {
        where: { date: today },
        select: { status: true },
      },
      leave_requests: {
        where: { status: 'PENDING' },
        select: { id: true },
      },
    },
  });

  return {
    teamSize: subordinates.length,
    todayAttendance: {
      present: subordinates.filter(
        (s) => s.attendances[0]?.status === 'PRESENT'
      ).length,
      absent: subordinates.filter(
        (s) => s.attendances[0]?.status === 'ABSENT'
      ).length,
      onLeave: subordinates.filter(
        (s) => s.attendances[0]?.status === 'ON_LEAVE'
      ).length,
      notMarked: subordinates.filter((s) => !s.attendances[0]).length,
    },
    pendingLeaveRequests: subordinates.reduce(
      (sum, s) => sum + s.leave_requests.length,
      0
    ),
  };
}
