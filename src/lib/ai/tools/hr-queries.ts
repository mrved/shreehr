/**
 * Additional HR query tools for the AI Assistant
 * Birthday/Anniversary reminders, Pending Approvals, Holidays
 */

import { prisma } from '@/lib/db';
import type { ToolContext } from './employee-data';

/**
 * Get employees with birthdays this week
 * Available to managers and above
 */
export async function getBirthdaysThisWeek(context: ToolContext) {
  // Only managers and above can see team birthdays
  if (context.role === 'EMPLOYEE') {
    // Employees can only see their own birthday (not super useful, but consistent)
    const employee = context.employeeId
      ? await prisma.employee.findUnique({
          where: { id: context.employeeId },
          select: {
            first_name: true,
            last_name: true,
            date_of_birth: true,
          },
        })
      : null;

    if (!employee) {
      return { error: 'Employee profile not found' };
    }

    const dob = employee.date_of_birth;
    const today = new Date();
    const thisYearBday = new Date(
      today.getFullYear(),
      dob.getMonth(),
      dob.getDate()
    );
    
    const daysUntil = Math.ceil(
      (thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      yourBirthday: {
        date: dob.toISOString().split('T')[0],
        daysUntil: daysUntil < 0 ? daysUntil + 365 : daysUntil,
      },
    };
  }

  // For managers: get birthdays for this week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: {
      employment_status: 'ACTIVE',
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      date_of_birth: true,
      department: { select: { name: true } },
    },
  });

  // Filter employees with birthdays this week
  const birthdaysThisWeek = employees
    .map((emp) => {
      const dob = emp.date_of_birth;
      const thisYearBday = new Date(
        today.getFullYear(),
        dob.getMonth(),
        dob.getDate()
      );
      
      // Handle year rollover
      if (thisYearBday < today) {
        thisYearBday.setFullYear(thisYearBday.getFullYear() + 1);
      }

      return {
        name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department.name,
        birthday: `${dob.getDate()}/${dob.getMonth() + 1}`,
        daysUntil: Math.ceil(
          (thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    })
    .filter((emp) => emp.daysUntil >= 0 && emp.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    weekOf: today.toISOString().split('T')[0],
    birthdays: birthdaysThisWeek,
    count: birthdaysThisWeek.length,
  };
}

/**
 * Get work anniversaries this month
 * Available to managers and above
 */
export async function getAnniversariesThisMonth(context: ToolContext) {
  if (context.role === 'EMPLOYEE') {
    return { error: 'Only managers can view team anniversaries' };
  }

  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  const employees = await prisma.employee.findMany({
    where: {
      employment_status: 'ACTIVE',
    },
    select: {
      first_name: true,
      last_name: true,
      date_of_joining: true,
      department: { select: { name: true } },
    },
  });

  const anniversaries = employees
    .filter((emp) => emp.date_of_joining.getMonth() + 1 === currentMonth)
    .map((emp) => {
      const years = today.getFullYear() - emp.date_of_joining.getFullYear();
      return {
        name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department.name,
        joiningDate: emp.date_of_joining.toISOString().split('T')[0],
        yearsCompleted: years,
      };
    })
    .filter((emp) => emp.yearsCompleted > 0)
    .sort((a, b) => b.yearsCompleted - a.yearsCompleted);

  return {
    month: currentMonth,
    anniversaries,
    count: anniversaries.length,
  };
}

/**
 * Get pending approvals for current user (managers)
 */
export async function getPendingApprovals(context: ToolContext) {
  // Only managers can have pending approvals
  if (!['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'PAYROLL_MANAGER'].includes(context.role)) {
    return { error: 'You do not have approval permissions' };
  }

  // Get pending leave requests
  const pendingLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: 'PENDING',
      ...(context.role === 'HR_MANAGER'
        ? {
            employee: {
              reporting_manager_id: context.employeeId,
            },
          }
        : {}),
    },
    select: {
      id: true,
      employee: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
      leave_type: { select: { name: true } },
      start_date: true,
      end_date: true,
      days_count: true,
      reason: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' },
    take: 10,
  });

  // Get pending attendance corrections
  const pendingCorrections = await prisma.attendanceCorrection.findMany({
    where: {
      status: 'PENDING',
    },
    select: {
      id: true,
      attendance: {
        select: {
          employee: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          date: true,
        },
      },
      reason: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' },
    take: 10,
  });

  // Get pending expense claims (for admins)
  const pendingExpenses = ['ADMIN', 'SUPER_ADMIN'].includes(context.role)
    ? await prisma.expenseClaim.findMany({
        where: {
          status: 'PENDING_APPROVAL',
        },
        select: {
          id: true,
          employee: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          amount_paise: true,
          description: true,
          expense_date: true,
        },
        orderBy: { created_at: 'asc' },
        take: 10,
      })
    : [];

  const toRupees = (paise: number) => (paise / 100).toFixed(2);

  return {
    leaveRequests: pendingLeaves.map((lr) => ({
      id: lr.id,
      employee: `${lr.employee.first_name} ${lr.employee.last_name}`,
      type: lr.leave_type.name,
      dates: `${lr.start_date.toISOString().split('T')[0]} to ${lr.end_date.toISOString().split('T')[0]}`,
      days: lr.days_count,
      reason: lr.reason.substring(0, 50) + (lr.reason.length > 50 ? '...' : ''),
      pendingSince: lr.created_at.toISOString().split('T')[0],
    })),
    attendanceCorrections: pendingCorrections.map((ac) => ({
      id: ac.id,
      employee: `${ac.attendance.employee.first_name} ${ac.attendance.employee.last_name}`,
      date: ac.attendance.date.toISOString().split('T')[0],
      reason: ac.reason.substring(0, 50) + (ac.reason.length > 50 ? '...' : ''),
    })),
    expenseClaims: pendingExpenses.map((ec) => ({
      id: ec.id,
      employee: `${ec.employee.first_name} ${ec.employee.last_name}`,
      amount: `₹${toRupees(ec.amount_paise)}`,
      description: ec.description.substring(0, 50) + (ec.description.length > 50 ? '...' : ''),
    })),
    summary: {
      leaveRequests: pendingLeaves.length,
      corrections: pendingCorrections.length,
      expenses: pendingExpenses.length,
      total:
        pendingLeaves.length +
        pendingCorrections.length +
        pendingExpenses.length,
    },
  };
}

/**
 * Get employee count by department
 */
export async function getEmployeeStats(context: ToolContext) {
  // Only managers and above
  if (context.role === 'EMPLOYEE') {
    return { error: 'Only managers can view organisation stats' };
  }

  const departments = await prisma.department.findMany({
    where: { is_active: true },
    select: {
      name: true,
      employees: {
        where: { employment_status: 'ACTIVE' },
        select: { id: true },
      },
    },
  });

  const totalActive = await prisma.employee.count({
    where: { employment_status: 'ACTIVE' },
  });

  const recentJoiners = await prisma.employee.count({
    where: {
      employment_status: 'ACTIVE',
      date_of_joining: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      },
    },
  });

  return {
    totalActiveEmployees: totalActive,
    recentJoiners: {
      last3Months: recentJoiners,
    },
    byDepartment: departments.map((d) => ({
      department: d.name,
      count: d.employees.length,
    })),
  };
}
