import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { prisma } from './db';

// Cache verification logging - set CACHE_DEBUG=true to see cache misses (DB fetches)
// When a function is called and you DON'T see a log, it was a cache HIT
const CACHE_DEBUG = process.env.CACHE_DEBUG === 'true';

function logCacheMiss(key: string) {
  if (CACHE_DEBUG) {
    console.log(`[CACHE MISS] ${key} - fetching from database`);
  }
}

// Reference data - cache for 1 hour (simple lists for dropdowns)
export const getCachedDepartments = unstable_cache(
  async () => {
    logCacheMiss('departments-active');
    return prisma.department.findMany({ 
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });
  },
  ['departments-active'],
  { revalidate: 3600, tags: ['departments'] }
);

export const getCachedDesignations = unstable_cache(
  async () => {
    logCacheMiss('designations-active');
    return prisma.designation.findMany({
      where: { is_active: true },
      orderBy: { title: 'asc' }
    });
  },
  ['designations-active'],
  { revalidate: 3600, tags: ['designations'] }
);

export const getCachedLeaveTypes = unstable_cache(
  async () => {
    logCacheMiss('leave-types-active');
    return prisma.leaveType.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });
  },
  ['leave-types-active'],
  { revalidate: 900, tags: ['leave-types'] }
);

// All leave types (including inactive) - for admin management
export const getCachedAllLeaveTypes = unstable_cache(
  async () => {
    logCacheMiss('leave-types-all');
    return prisma.leaveType.findMany({
      orderBy: { name: 'asc' }
    });
  },
  ['leave-types-all'],
  { revalidate: 900, tags: ['leave-types'] }
);

// Reference data with counts - for admin list pages (15 min TTL - counts change more often)
export const getCachedDepartmentsWithCounts = unstable_cache(
  async () => {
    logCacheMiss('departments-with-counts');
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { employees: true } },
      },
    });
  },
  ['departments-with-counts'],
  { revalidate: 900, tags: ['departments'] }
);

export const getCachedDesignationsWithCounts = unstable_cache(
  async () => {
    logCacheMiss('designations-with-counts');
    return prisma.designation.findMany({
      orderBy: [{ level: 'asc' }, { title: 'asc' }],
      include: {
        _count: { select: { employees: true } },
      },
    });
  },
  ['designations-with-counts'],
  { revalidate: 900, tags: ['designations'] }
);

// Dashboard counts - cache for 5 minutes
export const getCachedDashboardCounts = unstable_cache(
  async () => {
    logCacheMiss('dashboard-counts');
    const [employees, departments, documents] = await Promise.all([
      prisma.employee.count({ where: { employment_status: 'ACTIVE' }}),
      prisma.department.count({ where: { is_active: true }}),
      prisma.document.count({ where: { is_deleted: false }}),
    ]);
    return { employees, departments, documents };
  },
  ['dashboard-counts'],
  { revalidate: 300, tags: ['dashboard'] }
);

// Cache invalidation helpers
// Next.js 16+ requires a profile/expire config as second argument
const INVALIDATE_NOW = { expire: 0 };

export function invalidateDepartments() {
  revalidateTag('departments', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidateDesignations() {
  revalidateTag('designations', INVALIDATE_NOW);
}

export function invalidateLeaveTypes() {
  revalidateTag('leave-types', INVALIDATE_NOW);
}

export function invalidateDashboard() {
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidateEmployees() {
  revalidateTag('employees', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidateDocuments() {
  revalidateTag('documents', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidatePTSlabs() {
  revalidateTag('pt-slabs', INVALIDATE_NOW);
}

export function invalidateExpensePolicies() {
  revalidateTag('expense-policies', INVALIDATE_NOW);
}

// ============================================================================
// ADMIN DASHBOARD — ANNOUNCEMENTS, POLLS, AND PENDING ACTIONS
// ============================================================================

// Active announcements — cache for 5 minutes (TTL: 300s)
export const getCachedActiveAnnouncements = unstable_cache(
  async () => {
    logCacheMiss('announcements-active');
    return prisma.announcement.findMany({
      where: { is_archived: false },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        created_at: true,
        author: { select: { name: true } },
      },
    });
  },
  ['announcements-active'],
  { revalidate: 300, tags: ['announcements'] }
);

// Active polls with options and response counts — cache for 1 minute (TTL: 60s, votes change frequently)
export const getCachedActivePolls = unstable_cache(
  async () => {
    logCacheMiss('polls-active');
    return prisma.poll.findMany({
      where: { is_closed: false },
      orderBy: { created_at: 'desc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { responses: true } },
          },
        },
        _count: { select: { responses: true } },
      },
    });
  },
  ['polls-active'],
  { revalidate: 60, tags: ['polls'] }
);

// Pending action counts for admin dashboard inbox — cache for 2 minutes (TTL: 120s)
export const getCachedPendingActionCounts = unstable_cache(
  async () => {
    logCacheMiss('pending-action-counts');
    const [leave, expense, profile, correction] = await Promise.all([
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.expenseClaim.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.profileUpdateRequest.count({ where: { status: 'PENDING' } }),
      prisma.attendanceCorrection.count({ where: { status: 'PENDING' } }),
    ]);
    return {
      leave,
      expense,
      profile,
      correction,
      total: leave + expense + profile + correction,
    };
  },
  ['pending-action-counts'],
  { revalidate: 120, tags: ['pending-actions'] }
);

export function invalidateAnnouncements() {
  revalidateTag('announcements', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidatePolls() {
  revalidateTag('polls', INVALIDATE_NOW);
}

export function invalidatePendingActions() {
  revalidateTag('pending-actions', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}
